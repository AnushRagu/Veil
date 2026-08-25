import {
  ClientPayload,
  ServerPlan,
  ServerAction,
  ValidatedAction,
  ActionPolicy,
  ActionType,
  ALLOWED_SERVER_ORIGINS,
  isAllowedOrigin,
  REQUEST_TIMEOUT_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from "@privatesight/shared";

interface ServerConfig {
  url: string;
  enabled: boolean;
}

interface RateLimitEntry {
  timestamps: number[];
}

const state = {
  serverConfig: { url: "http://localhost:3001", enabled: true } as ServerConfig,
  rateLimits: new Map<string, RateLimitEntry>(),
  pendingRequests: new Map<string, AbortController>(),
  activeTabId: -1,
};

const ACTION_POLICY: Record<string, ActionPolicy> = {
  highlight: "auto",
  scroll: "auto",
  focus: "auto",
  wait: "auto",
  click: "confirm",
  type: "confirm",
};

const HIGH_CONFIDENCE_AUTO_ACTIONS: ActionType[] = ["highlight", "scroll", "focus", "wait"];
const CONFIRMATION_REQUIRED_ACTIONS: ActionType[] = ["click", "type"];

function isHighConfidenceAuto(type: ActionType): boolean {
  return HIGH_CONFIDENCE_AUTO_ACTIONS.includes(type);
}

function isConfirmationRequired(type: ActionType): boolean {
  return CONFIRMATION_REQUIRED_ACTIONS.includes(type);
}

function checkRateLimit(origin: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let entry = state.rateLimits.get(origin);
  if (!entry) {
    entry = { timestamps: [] };
    state.rateLimits.set(origin, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

function getBasePolicy(type: ActionType): ActionPolicy {
  return ACTION_POLICY[type] ?? "confirm";
}

function validateAction(action: ServerAction, pageMapElements: any[]): ValidatedAction {
  const basePolicy = getBasePolicy(action.type);
  let policy: ActionPolicy = basePolicy;
  let reason = "";
  let mappedElement: any = undefined;

  if (action.target?.elementId) {
    mappedElement = pageMapElements.find((el) => el.id === action.target?.elementId);
    if (!mappedElement) {
      return { action, policy: "reject", reason: "Target element not found in current page map", mappedElement: undefined };
    }
    if (mappedElement.sensitive) {
      return { action, policy: "reject", reason: "Action targets a sensitive/redacted element", mappedElement };
    }
    if (!mappedElement.visible || !mappedElement.enabled) {
      return { action, policy: "reject", reason: "Target element is not visible or enabled", mappedElement };
    }
  } else if (action.target?.bounds) {
    const bounds = action.target.bounds;
    if (bounds) {
      mappedElement = pageMapElements.find(
        (el) =>
          bounds &&
          el.bounds &&
          el.bounds.x < (bounds.x ?? 0) + (bounds.width ?? 0) &&
          (el.bounds.x ?? 0) + (el.bounds.width ?? 0) > (bounds.x ?? 0) &&
          el.bounds.y < (bounds.y ?? 0) + (bounds.height ?? 0) &&
          (el.bounds.y ?? 0) + (el.bounds.height ?? 0) > (bounds.y ?? 0)
      );
    }
    if (!mappedElement) {
      return { action, policy: "reject", reason: "No element found at target bounds", mappedElement: undefined };
    }
    if (mappedElement.sensitive) {
      return { action, policy: "reject", reason: "Action targets a sensitive/redacted region", mappedElement };
    }
  } else if (action.type !== "scroll" && action.type !== "wait") {
    return { action, policy: "reject", reason: "Action missing valid target", mappedElement: undefined };
  }

  if (action.type === "click" && mappedElement) {
    const destructiveRoles = ["button", "link"];
    const destructiveLabels = ["delete", "remove", "submit", "purchase", "buy", "pay", "confirm", "send", "transfer"];
    if (destructiveRoles.includes(mappedElement.role) && destructiveLabels.some((l) => mappedElement.label.toLowerCase().includes(l))) {
      policy = "confirm";
      reason = "Potentially destructive action requires confirmation";
    }
  }

  if (action.type === "type") {
    policy = "confirm";
    reason = "Typing text requires explicit user confirmation";
  }

  const confidence = action.confidence ?? 0;
  if (confidence < 0.85 && isConfirmationRequired(action.type)) {
    policy = "confirm";
    reason = `Low confidence (${Math.round(confidence * 100)}%) requires confirmation`;
  }

  if (isHighConfidenceAuto(action.type) && confidence >= 0.85) {
    policy = "auto";
    reason = "High-confidence safe action";
  }

  if (action.type === "click" && mappedElement?.role === "link") {
    const href = (mappedElement as any).href;
    if (href && !isSameOrigin(href, window.location.origin)) {
      policy = "confirm";
      reason = "Cross-origin navigation requires confirmation";
    }
  }

  return { action, policy, reason, mappedElement };
}

function isSameOrigin(url1: string, url2: string): boolean {
  try {
    return new URL(url1).origin === new URL(url2).origin;
  } catch {
    return false;
  }
}

async function sendToServer(payload: ClientPayload): Promise<ServerPlan | null> {
  if (!state.serverConfig.enabled) {
    throw new Error("Server communication disabled");
  }

  const origin = new URL(state.serverConfig.url).origin;
  if (!isAllowedOrigin(origin)) {
    throw new Error(`Server origin not in allowlist: ${origin}`);
  }

  if (!checkRateLimit(origin)) {
    throw new Error("Rate limit exceeded");
  }

  const controller = new AbortController();
  const requestId = `${payload.sessionId}-${Date.now()}`;
  state.pendingRequests.set(requestId, controller);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Session-ID": payload.sessionId!,
    };
    const response = await fetch(`${state.serverConfig.url}/api/agent/plan`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const plan = (await response.json()) as ServerPlan;
    return plan;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request cancelled");
    }
    throw error;
  } finally {
    state.pendingRequests.delete(requestId);
  }
}

function validatePlan(plan: ServerPlan, pageMapElements: any[]): ValidatedAction[] {
  return (plan.actions ?? []).map((action) => validateAction(action, pageMapElements));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "SEND_TO_SERVER": {
          const payload = message.payload as ClientPayload;
          const plan = await sendToServer(payload);
          const validated = plan ? validatePlan(plan, message.pageMapElements ?? []) : [];
          sendResponse({ success: true, plan, validatedActions: validated });
          break;
        }
        case "UPDATE_SERVER_CONFIG": {
          const { url, enabled } = message.config ?? {};
          if (url) {
            try {
              new URL(url);
              state.serverConfig.url = url;
            } catch {
              sendResponse({ success: false, error: "Invalid server URL" });
              return;
            }
          }
          if (typeof enabled === "boolean") state.serverConfig.enabled = enabled;
          sendResponse({ success: true, config: state.serverConfig });
          break;
        }
        case "GET_SERVER_CONFIG": {
          sendResponse({ success: true, config: state.serverConfig });
          break;
        }
        case "CANCEL_REQUESTS": {
          for (const controller of state.pendingRequests.values()) {
            controller.abort();
          }
          state.pendingRequests.clear();
          sendResponse({ success: true });
          break;
        }
        case "SET_ACTIVE_TAB": {
          state.activeTabId = message.tabId;
          sendResponse({ success: true });
          break;
        }
        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  })();
  return true;
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  state.activeTabId = activeInfo.tabId;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[PrivateSight] Extension installed");
});

console.log("[PrivateSight] Background service worker started");
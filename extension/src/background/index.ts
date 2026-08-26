import {
  ClientPayload,
  ServerPlan,
  ServerAction,
  ValidatedAction,
  ActionPolicy,
  ActionType,
  RiskLevel,
  ALLOWED_SERVER_ORIGINS,
  isAllowedOrigin,
  REQUEST_TIMEOUT_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SanitizedElement,
} from "@veil/shared";

interface ServerConfig {
  url: string;
  enabled: boolean;
}

interface RateLimitEntry {
  timestamps: number[];
}

export const state = {
  serverConfig: { url: "http://localhost:3001", enabled: true } as ServerConfig,
  rateLimits: new Map<string, RateLimitEntry>(),
  pendingRequests: new Map<string, AbortController>(),
  activeTabId: -1,
};

export const ACTION_POLICY: Record<string, ActionPolicy> = {
  highlight: "auto",
  scroll: "auto",
  focus: "auto",
  wait: "auto",
  inspect: "auto",
  select: "confirm",
  click: "confirm",
  type: "confirm",
};

export const HIGH_CONFIDENCE_AUTO_ACTIONS: ActionType[] = ["highlight", "scroll", "focus", "wait", "inspect"];
export const CONFIRMATION_REQUIRED_ACTIONS: ActionType[] = ["click", "type", "select"];

export function isHighConfidenceAuto(type: ActionType): boolean {
  return HIGH_CONFIDENCE_AUTO_ACTIONS.includes(type);
}

export function isConfirmationRequired(type: ActionType): boolean {
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

/**
 * Phase 4: Structural Risk Band Evaluation
 *
 * Risk Bands:
 * Level 0 (Observation): scroll, focus, inspect, highlight -> AUTO
 * Level 1 (Reversible): menu toggle, tab change -> AUTO
 * Level 2 (Data Entry): typing, selection changes -> CONFIRM/EVALUATE
 * Level 3 (Consequential): click submit, delete, purchase -> STRICT USER CONFIRMATION
 * Level 4 (High Risk): cryptographic fields, password fields, payment transfers -> SECURE EXPLICIT LOCKOUT
 */
export function evaluateRiskLevel(action: ServerAction, mappedElement?: SanitizedElement): RiskLevel {
  const type = action.type;
  const label = (mappedElement?.label || "").toLowerCase();
  const role = (mappedElement?.role || "").toLowerCase();

  // Level 4: High Risk / Explicit Lockout
  if (
    mappedElement?.sensitive ||
    ["password", "private key", "seed phrase", "crypto", "credit card", "cvv", "aadhaar", "pan", "wire transfer"].some((s) => label.includes(s))
  ) {
    return "level_4_high_risk";
  }

  // Level 3: Consequential (Purchases, submissions, deletions, account modifications)
  const consequentialKeywords = [
    "buy", "purchase", "pay", "order", "checkout", "subscribe",
    "delete", "remove", "destroy", "erase", "terminate",
    "submit", "confirm", "send", "transfer", "apply"
  ];
  if (type === "click" && (consequentialKeywords.some((k) => label.includes(k)) || role === "button")) {
    if (consequentialKeywords.some((k) => label.includes(k))) {
      return "level_3_consequential";
    }
  }

  // Level 2: Data Entry (Typing, changing form values)
  if (type === "type" || type === "select") {
    return "level_2_data_entry";
  }

  // Level 1: Reversible (Tab navigation, menu items, toggles, generic non-destructive clicks)
  if (type === "click") {
    if (role === "tab" || role === "menuitem" || role === "switch" || label.includes("tab") || label.includes("menu") || label.includes("expand") || label.includes("collapse")) {
      return "level_1_reversible";
    }
    // Default click without destructive keywords
    return "level_2_data_entry";
  }

  // Level 0: Pure Observation
  if (["scroll", "focus", "highlight", "wait", "inspect"].includes(type)) {
    return "level_0_observation";
  }

  return "level_2_data_entry";
}

/**
 * Generates transparent natural language explanation for why VEIL is requesting confirmation
 */
export function generateActionExplanation(action: ServerAction, riskLevel: RiskLevel, mappedElement?: SanitizedElement): string {
  const label = mappedElement?.label ? `"${mappedElement.label}"` : `element ${action.target?.elementId || "on page"}`;

  switch (riskLevel) {
    case "level_0_observation":
      return `VEIL is performing an observation action (${action.type}) to inspect the page safely.`;
    case "level_1_reversible":
      return `VEIL wants to interact with ${label}. This is a reversible UI toggle action.`;
    case "level_2_data_entry":
      if (action.type === "type") {
        return `VEIL wants to enter data "${action.value ?? ""}" into ${label}.`;
      }
      return `VEIL wants to interact with ${label}. User confirmation is required before proceeding.`;
    case "level_3_consequential":
      return `VEIL wants to click ${label}. This will initiate a consequential state change or external transaction.`;
    case "level_4_high_risk":
      return `VEIL has blocked this action. Targeting sensitive cryptographic, authentication, or payment credentials violates privacy boundary policies.`;
  }
}

export function validateAction(action: ServerAction, pageMapElements: SanitizedElement[]): ValidatedAction {
  let mappedElement: SanitizedElement | undefined = undefined;

  // Grounding lookup by elementId / dataVeilId
  const targetId = action.target?.dataVeilId || action.target?.elementId;
  if (targetId) {
    mappedElement = pageMapElements.find((el) => el.id === targetId || el.dataVeilId === targetId);
    if (!mappedElement) {
      return {
        action,
        policy: "reject",
        riskLevel: "level_4_high_risk",
        reason: "Target element not found in current page map",
        explanation: "Action rejected: Target element does not exist or has been removed from the page.",
        mappedElement: undefined,
        validationPassed: false,
      };
    }
    if (mappedElement.sensitive) {
      return {
        action,
        policy: "reject",
        riskLevel: "level_4_high_risk",
        reason: "Action targets a sensitive/redacted element",
        explanation: generateActionExplanation(action, "level_4_high_risk", mappedElement),
        mappedElement,
        validationPassed: false,
      };
    }
    if (!mappedElement.visible || !mappedElement.enabled) {
      return {
        action,
        policy: "reject",
        riskLevel: "level_4_high_risk",
        reason: "Target element is not visible or enabled",
        explanation: "Action rejected: Target element is currently invisible or disabled in the DOM.",
        mappedElement,
        validationPassed: false,
      };
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
      return {
        action,
        policy: "reject",
        riskLevel: "level_4_high_risk",
        reason: "No element found at target bounds",
        explanation: "Action rejected: No UI element matched the requested coordinate bounds.",
        mappedElement: undefined,
        validationPassed: false,
      };
    }
    if (mappedElement.sensitive) {
      return {
        action,
        policy: "reject",
        riskLevel: "level_4_high_risk",
        reason: "Action targets a sensitive/redacted region",
        explanation: generateActionExplanation(action, "level_4_high_risk", mappedElement),
        mappedElement,
        validationPassed: false,
      };
    }
  } else if (action.type !== "scroll" && action.type !== "wait") {
    return {
      action,
      policy: "reject",
      riskLevel: "level_4_high_risk",
      reason: "Action missing valid target",
      explanation: "Action rejected: Non-observation action did not provide a target element or bounds.",
      mappedElement: undefined,
      validationPassed: false,
    };
  }

  // Determine structural risk level
  const riskLevel = evaluateRiskLevel(action, mappedElement);
  const explanation = generateActionExplanation(action, riskLevel, mappedElement);

  let policy: ActionPolicy = "confirm";
  let reason = "";

  switch (riskLevel) {
    case "level_0_observation":
      policy = "auto";
      reason = "Observation action (auto-allowed)";
      break;
    case "level_1_reversible":
      policy = "auto";
      reason = "Reversible UI action (auto-allowed)";
      break;
    case "level_2_data_entry":
      policy = "confirm";
      reason = action.type === "type" ? "Typing text requires explicit user confirmation" : "Data entry action requires confirmation";
      break;
    case "level_3_consequential":
      policy = "confirm";
      reason = "Consequential/destructive action requires strict user confirmation";
      break;
    case "level_4_high_risk":
      policy = "reject";
      reason = "Action targets a sensitive or cryptographic field (lockout)";
      break;
  }

  // Cross-origin link navigation check
  if (action.type === "click" && mappedElement?.role === "link") {
    const href = (mappedElement as any).href;
    if (href && typeof window !== "undefined" && !isSameOrigin(href, window.location.origin)) {
      policy = "confirm";
      reason = "Cross-origin navigation requires confirmation";
    }
  }

  // Confidence check
  const confidence = action.confidence ?? 0;
  if (confidence < 0.85 && policy === "auto" && action.type !== "scroll" && action.type !== "wait") {
    policy = "confirm";
    reason = `Low confidence (${Math.round(confidence * 100)}%) requires confirmation`;
  }

  return {
    action,
    policy,
    riskLevel,
    reason,
    explanation,
    mappedElement,
    validationPassed: (policy as ActionPolicy) !== "reject" && (policy as ActionPolicy) !== "lockout",
  };
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
      "X-Session-ID": payload.sessionId,
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

export function validatePlan(plan: ServerPlan, pageMapElements: SanitizedElement[]): ValidatedAction[] {
  return (plan.actions ?? []).map((action) => validateAction(action, pageMapElements));
}

// Runtime message listener for Chrome extension environment
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      try {
        // Messages that must be relayed to the content script on the active tab
        const CONTENT_SCRIPT_RELAYS = [
          "CAPTURE_AND_SEND",
          "EXECUTE_ACTIONS",
          "GET_PAGE_MAP",
          "GET_PRIVACY_STATUS",
          "CLEAR_SESSION",
        ];

        // Messages handled directly by the background
        switch (message.type) {
          case "CAPTURE_VISIBLE_TAB": {
            if (chrome.tabs?.captureVisibleTab) {
              chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                  sendResponse({ success: false, error: chrome.runtime.lastError?.message || "Failed to capture tab" });
                } else {
                  sendResponse({ success: true, dataUrl });
                }
              });
            } else {
              sendResponse({ success: false, error: "tabs.captureVisibleTab API not available" });
            }
            return; // async response handled above
          }
          case "SEND_TO_SERVER": {
            const payload = message.payload as ClientPayload & { privacyMetrics?: any };
            const plan = await sendToServer(payload);
            const validated = plan ? validatePlan(plan, message.pageMapElements ?? []) : [];
            sendResponse({
              success: true,
              plan,
              validatedActions: validated,
              privacyMetrics: payload?.privacyMetrics ?? null,
            });
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
          default: {
            // Relay all other messages to the active tab's content script
            if (CONTENT_SCRIPT_RELAYS.includes(message.type)) {
              // Always resolve the active tab first
              if (state.activeTabId === -1) {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0]?.id) {
                  state.activeTabId = tabs[0].id;
                } else {
                  sendResponse({ success: false, error: "No active tab found" });
                  break;
                }
              }
              // Ensure we don't target chrome:// or extension pages
              const tab = await chrome.tabs.get(state.activeTabId);
              if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
                sendResponse({ success: false, error: "Cannot run on this page" });
                break;
              }
              const targetTabId = state.activeTabId!;

              // Try sending first; if content script is missing, inject it and retry
              try {
                const response = await chrome.tabs.sendMessage(targetTabId, message);
                sendResponse(response);
              } catch {
                // Content script not loaded yet — inject it
                try {
                  await chrome.scripting.executeScript({
                    target: { tabId: targetTabId, allFrames: true },
                    files: ["content.js"],
                  });
                  // Small delay for script to initialise
                  await new Promise((r) => setTimeout(r, 150));
                  const response = await chrome.tabs.sendMessage(targetTabId, message);
                  sendResponse(response);
                } catch (injectErr) {
                  sendResponse({
                    success: false,
                    error: `Content script could not be injected: ${injectErr instanceof Error ? injectErr.message : "Unknown error"}`,
                  });
                }
              }
              break;
            }
            sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
          }
        }
      } catch (error) {
        sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    })();
    return true;
  });

  if (chrome.tabs?.onActivated) {
    chrome.tabs.onActivated.addListener((activeInfo) => {
      state.activeTabId = activeInfo.tabId;
    });
  }

  if (chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      console.log("[VEIL] Extension installed");
    });
  }
}

console.log("[VEIL] Background service worker initialized with 5-level risk policy engine");
import React, { useState, useEffect, useCallback } from "react";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ValidatedAction,
  ActionPolicy,
  TelemetryEntry,
  GoalClassification,
  AgentState,
  AgentStep,
  AgentExecutionContext,
} from "@privatesight/shared";
import {
  ShieldIcon,
  ServerIcon,
  TargetIcon,
  SparkleIcon,
  ChevronIcon,
  AlertIcon,
  TrashIcon,
  CheckIcon,
  InfoIcon,
  GaugeIcon,
  EyeOffIcon,
  CrosshairIcon,
  PulseIcon,
  SettingsIcon,
  SearchIcon,
  MessageSquareIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  RefreshCwIcon,
} from "./icons";

interface PopupProps {}

type StatusTone = "ok" | "warn" | "danger" | "off";

const StatusPill: React.FC<{
  tone: StatusTone;
  children: React.ReactNode;
}> = ({ tone, children }) => (
  <span className={`status status--${tone}`}>
    <span className="status__dot" />
    {children}
  </span>
);

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}> = ({ label, value, unit, accent }) => (
  <div className={`metric ${accent ? "metric--accent" : ""}`}>
    <div className="metric__label">{label}</div>
    <div className="metric__value">
      {value}
      {unit && <span className="metric__unit">{unit}</span>}
    </div>
  </div>
);

const ToggleCard: React.FC<{
  active: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
  disabled?: boolean;
}> = ({ active, onToggle, icon, title, hint, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={() => !disabled && onToggle()}
    className={`toggle ${active ? "toggle--on" : ""}`}
    disabled={disabled}
  >
    <span className="toggle__icon">{icon}</span>
    <span className="toggle__label">
      <span className="toggle__title">{title}</span>
      <span className="toggle__hint">{hint}</span>
    </span>
  </button>
);

const policyMeta: Record<
  ActionPolicy,
  { label: string; tone: StatusTone }
> = {
  auto: { label: "Auto", tone: "ok" },
  confirm: { label: "Confirm", tone: "warn" },
  reject: { label: "Blocked", tone: "danger" },
};

const agentStateMeta: Record<
  AgentState,
  { label: string; tone: StatusTone; icon: React.ReactNode }
> = {
  idle: { label: "Idle", tone: "off", icon: <PauseIcon size={12} /> },
  observing: { label: "Observing page", tone: "warn", icon: <SearchIcon size={12} /> },
  interpreting: { label: "Understanding goal", tone: "warn", icon: <MessageSquareIcon size={12} /> },
  planning: { label: "Planning actions", tone: "warn", icon: <SparkleIcon size={12} strokeWidth={2} /> },
  validating: { label: "Validating actions", tone: "warn", icon: <CrosshairIcon size={12} /> },
  waiting_for_confirmation: { label: "Waiting for confirmation", tone: "warn", icon: <AlertIcon size={12} strokeWidth={2} /> },
  needs_clarification: { label: "Needs clarification", tone: "warn", icon: <AlertIcon size={12} strokeWidth={2} /> },
  ready: { label: "Ready to execute", tone: "ok", icon: <PlayIcon size={12} /> },
  executing: { label: "Executing", tone: "warn", icon: <PlayIcon size={12} /> },
  verifying: { label: "Verifying result", tone: "warn", icon: <RefreshCwIcon size={12} /> },
  completed: { label: "Completed", tone: "ok", icon: <CheckIcon size={12} strokeWidth={2.4} /> },
  blocked: { label: "Blocked", tone: "danger", icon: <AlertIcon size={12} strokeWidth={2} /> },
  failed: { label: "Failed", tone: "danger", icon: <AlertIcon size={12} strokeWidth={2} /> },
  stopped: { label: "Stopped", tone: "off", icon: <StopIcon size={12} /> },
};

const modeMeta: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  information: { label: "Information", description: "Answering based on safe page content", icon: <MessageSquareIcon size={12} /> },
  informational: { label: "Informational", description: "Answering based on safe page content", icon: <MessageSquareIcon size={12} /> },
  find: { label: "Find", description: "Locating element without modifying", icon: <SearchIcon size={12} /> },
  highlight: { label: "Highlight", description: "Highlighting element without modifying", icon: <SearchIcon size={12} /> },
  click: { label: "Click", description: "Clicking target element", icon: <CrosshairIcon size={12} /> },
  select: { label: "Select", description: "Selecting option", icon: <CrosshairIcon size={12} /> },
  fill: { label: "Fill", description: "Filling form field", icon: <SettingsIcon size={12} /> },
  type: { label: "Type", description: "Entering text into input", icon: <SettingsIcon size={12} /> },
  search: { label: "Search", description: "Performing search query", icon: <SearchIcon size={12} /> },
  navigate: { label: "Navigation", description: "Navigating to section or page", icon: <SearchIcon size={12} /> },
  submit: { label: "Submit", description: "Submitting form", icon: <CheckIcon size={12} strokeWidth={2.4} /> },
  delete: { label: "Delete (High Risk)", description: "Destructive deletion action", icon: <AlertIcon size={12} strokeWidth={2} /> },
  browser_action: { label: "Browser Action", description: "Performing browser action", icon: <CrosshairIcon size={12} /> },
  form_task: { label: "Form Task", description: "Form interaction", icon: <SettingsIcon size={12} /> },
  navigation_task: { label: "Navigation", description: "Page navigation", icon: <SearchIcon size={12} /> },
  ambiguous: { label: "Ambiguous", description: "Request needs clarification", icon: <AlertIcon size={12} strokeWidth={2} /> },
  unsupported: { label: "Unsupported", description: "Cannot fulfill this request", icon: <AlertIcon size={12} strokeWidth={2} /> },
};

const ServerActionItem: React.FC<{
  action: ValidatedAction;
  index: number;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isExecuting?: boolean;
  stepNumber?: number;
  step?: AgentStep;
}> = ({ action, index, onConfirm, onReject, isExecuting, stepNumber, step }) => {
  const a = action.action;
  const policy: ActionPolicy = action.policy ?? "confirm";
  const reason = action.reason ?? "";
  const mappedElement = action.mappedElement;
  const isPending = policy === "confirm" && !step;
  const meta = policyMeta[policy];
  const confidence = a.confidence ?? 0;
  const confidencePct = Math.round(confidence * 100);

  let statusBadge: React.ReactNode = null;
  if (step) {
    if (step.result === "success" && step.verified) {
      statusBadge = <span className="action__state action__state--auto">Verified ✓</span>;
    } else if (step.result === "success" && !step.verified) {
      statusBadge = <span className="action__state action__state--pending">Dispatched (Unverified)</span>;
    } else if (step.result === "failed") {
      statusBadge = <span className="action__state action__state--reject">Failed: {step.error || "Execution error"}</span>;
    } else {
      statusBadge = <span className="action__state action__state--executing">In progress…</span>;
    }
  } else if (isExecuting && stepNumber === index + 1) {
    statusBadge = <span className="action__state action__state--executing">Executing…</span>;
  } else if (isPending) {
    statusBadge = (
      <div className="action__buttons">
        <button
          onClick={() => onConfirm(a.id ?? "")}
          className="btn btn--sm btn--success"
          title="Allow this action"
        >
          <CheckIcon size={12} strokeWidth={2.4} />
          Allow
        </button>
        <button
          onClick={() => onReject(a.id ?? "")}
          className="btn btn--sm btn--secondary"
          title="Block this action"
        >
          Block
        </button>
      </div>
    );
  } else if (policy === "reject") {
    statusBadge = <span className="action__state action__state--reject">Blocked</span>;
  } else {
    statusBadge = <span className="action__state action__state--pending">Ready</span>;
  }

  return (
    <div className={`action action--${policy}`}>
      <span className="action__index">
        {stepNumber ? `Step ${stepNumber}` : `#${String(index + 1).padStart(2, "0")}`}
      </span>
      <div className="action__body">
        <div className="action__top">
          <span className="action__type">{a.type}</span>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          <span className="action__confidence" title={`Confidence ${confidencePct}%`}>
            <span
              className="action__confidence-bar"
              style={{ ["--confidence" as any]: confidence }}
            />
            {confidencePct}%
          </span>
        </div>
        <div className="action__reason">{a.reason ?? ""}</div>
        {mappedElement ? (
          <div className="action__target">
            <CrosshairIcon size={11} />
            <span className="action__target-label">
              {mappedElement.label || "(unlabeled)"}
            </span>
            <span>·</span>
            <span>{mappedElement.role}</span>
            <span style={{ color: "#00d4aa", marginLeft: "4px", fontSize: "10.5px", fontWeight: 500 }}>Target resolved ✓</span>
          </div>
        ) : a.target?.elementId ? (
          <div className="action__target" style={{ color: "#f87171" }}>
            <span>Target: {a.target.elementId} (Unresolved ✗)</span>
          </div>
        ) : null}
        {reason && <div className="action__reason-note">{reason}</div>}
      </div>
      {statusBadge}
    </div>
  );
};

const HighRiskConfirmationCard: React.FC<{
  plan: ServerPlan;
  pendingAction?: ValidatedAction;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}> = ({ plan, pendingAction, onConfirm, onCancel, isExecuting }) => {
  const action = pendingAction?.action;
  const mappedElement = pendingAction?.mappedElement;
  const targetDesc = mappedElement?.label || action?.target?.label || action?.target?.elementId || "Target Element";
  const actionType = action?.type ? action.type.toUpperCase() : "ACTION";

  return (
    <div className="confirmation-card">
      <div className="confirmation-card__header">
        <div className="confirmation-card__badge">
          <AlertIcon size={13} strokeWidth={2.4} />
          <span>HIGH RISK</span>
        </div>
        <span className="confirmation-card__title">⚠️ Confirmation required</span>
      </div>

      <div className="confirmation-card__body">
        <div className="confirmation-card__intent">
          <strong>Veil wants to:</strong>
          <div className="confirmation-card__action-text">
            {actionType} &ldquo;{targetDesc}&rdquo;
          </div>
        </div>

        <p className="confirmation-card__warning">
          This action may be destructive and cannot be automatically executed.
        </p>

        {pendingAction?.reason && (
          <div className="confirmation-card__reason">
            <strong>Reason:</strong> {pendingAction.reason}
          </div>
        )}
      </div>

      <div className="confirmation-card__actions">
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="btn btn--secondary btn--md"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className="btn btn--danger btn--md"
          style={{
            flex: 1.5,
            background: "#dc2626",
            color: "#ffffff",
            borderColor: "#b91c1c",
            fontWeight: 600,
          }}
        >
          <CheckIcon size={14} strokeWidth={2.4} />
          {isExecuting ? "Executing…" : "Confirm & Execute"}
        </button>
      </div>
    </div>
  );
};

const AgentStateIndicator: React.FC<{
  status: AgentState;
  classification?: GoalClassification;
  currentStep?: number;
  totalSteps?: number;
}> = ({ status, classification, currentStep, totalSteps }) => {
  const meta = agentStateMeta[status];
  const modeInfo = classification ? modeMeta[classification.mode] : null;

  return (
    <div className="agent-state">
      <div className="agent-state__header">
        <span className="agent-state__icon">{meta.icon}</span>
        <div className="agent-state__main">
          <span className="agent-state__status">
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </span>
          {modeInfo && (
            <div className="agent-state__mode">
              <span className="agent-state__mode-icon">{modeInfo.icon}</span>
              <span className="agent-state__mode-label">{modeInfo.label}</span>
              <span className="agent-state__mode-desc">{modeInfo.description}</span>
            </div>
          )}
        </div>
      </div>
      {classification && classification.interpretation && (
        <div className="agent-state__interpretation">
          <strong>Goal interpretation:</strong> {classification.interpretation}
        </div>
      )}
      {classification?.requiresClarification && classification.clarificationQuestion && (
        <div className="agent-state__clarification">
          <AlertIcon size={12} strokeWidth={2} />
          <span>{classification.clarificationQuestion}</span>
        </div>
      )}
      {classification?.mode === "informational" && (
        <div className="agent-state__info-response">
          <strong>Response:</strong> I can inspect this page, identify interactive elements, protect/redact sensitive data, and perform browser actions that you explicitly request. Just tell me what you'd like to do (e.g., "click the submit button", "fill the name field as John", "scroll down", "find the search box").
        </div>
      )}
      {totalSteps && totalSteps > 0 && (
        <div className="agent-state__progress">
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${Math.min((currentStep / totalSteps) * 100, 100)}%` }}
            />
          </div>
          <span className="progress-text">Step {currentStep} of {totalSteps}</span>
        </div>
      )}
    </div>
  );
};

const ExecutionSteps: React.FC<{
  steps: AgentStep[];
  planActions: ServerPlan["actions"];
  currentStep: number;
}> = ({ steps, planActions, currentStep }) => {
  return (
    <div className="execution-steps">
      <div className="execution-steps__header">Execution History</div>
      {planActions.map((action, index) => {
        const step = steps.find((s) => s.stepNumber === index + 1);
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;

        return (
          <div
            key={action.id}
            className={`execution-step ${isCurrent ? "execution-step--current" : ""} ${isPast ? "execution-step--past" : ""}`}
          >
            <div className="execution-step__header">
              <span className="execution-step__number">Step {index + 1}</span>
              <span className={`execution-step__type execution-step__type--${action.type}`}>
                {action.type}
              </span>
              {step && (
                <StatusPill
                  tone={step.result === "success" ? "ok" : step.result === "failed" ? "danger" : "warn"}
                >
                  {step.result === "success" ? "✓" : step.result === "failed" ? "✗" : "⟳"}
                </StatusPill>
              )}
              {step && step.verified !== undefined && (
                <span className={`execution-step__verified ${step.verified ? "verified" : "unverified"}`}>
                  {step.verified ? "✓ Verified" : "✗ Not Verified"}
                </span>
              )}
            </div>
            <div className="execution-step__reason">{action.reason}</div>
            {action.target?.elementId && (
              <div className="execution-step__target">Target: {action.target.elementId}</div>
            )}
            {step?.error && (
              <div className="execution-step__error">Error: {step.error}</div>
            )}
            {step?.details && Object.keys(step.details).length > 0 && (
              <details className="execution-step__details">
                <summary>Details</summary>
                <pre>{JSON.stringify(step.details, null, 2)}</pre>
              </details>
            )}
            {step?.pageChanged && <div className="execution-step__changed">Page changed</div>}
          </div>
        );
      })}
      {planActions.length === 0 && (
        <div className="execution-step execution-step--empty">No actions to execute</div>
      )}
    </div>
  );
};

const Popup: React.FC<PopupProps> = () => {
  const [active, setActive] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://localhost:3001");
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus | null>(null);
  const [userGoal, setUserGoal] = useState("");
  const [lastPayload, setLastPayload] = useState<ClientPayload | null>(null);
  const [serverPlan, setServerPlan] = useState<ServerPlan | null>(null);
  const [validatedActions, setValidatedActions] = useState<ValidatedAction[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManifest, setShowManifest] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [agentExecution, setAgentExecution] = useState<AgentExecutionContext | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const sendBackgroundMessage = useCallback(
    (type: string, data?: any): Promise<any> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response ?? { success: true });
          }
        });
      });
    },
    []
  );

  const sendContentMessage = useCallback(
    (type: string, data?: any, _tabId?: number): Promise<any> => {
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (!tab || !tab.id) {
            chrome.tabs.query({ active: true }, (allTabs) => {
              const anyTab = allTabs[0];
              if (!anyTab || !anyTab.id) {
                resolve({ success: false, error: "No active tab found" });
                return;
              }
              chrome.tabs.sendMessage(anyTab.id, { type, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  resolve(response ?? { success: true });
                }
              });
            });
            return;
          }
          chrome.tabs.sendMessage(tab.id, { type, ...data }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response ?? { success: true });
            }
          });
        });
      });
    },
    []
  );

  const refreshStatus = useCallback(async () => {
    try {
      const statusRes = await sendBackgroundMessage("GET_PRIVACY_STATUS");
      if (statusRes?.success && statusRes.status) {
        setPrivacyStatus(statusRes.status);
      }
      const config = await sendBackgroundMessage("GET_SERVER_CONFIG");
      if (config?.success && config.config) {
        setServerConnected(config.config.enabled);
        setServerUrl(config.config.url);
      }
    } catch (e) {
      console.warn("[VEIL][POPUP] refreshStatus error:", e);
    }
  }, [sendBackgroundMessage]);

  const pollAgentState = useCallback(async () => {
    if (!agentExecution?.sessionId) return;

    const response = await sendBackgroundMessage("GET_AGENT_STATE");
    if (response.success && response.agentExecution) {
      setAgentExecution(response.agentExecution);
      if (!response.agentExecution.isExecuting) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    }
  }, [agentExecution, sendBackgroundMessage, pollingInterval]);

  const handleCapture = useCallback(async () => {
    if (!userGoal.trim()) {
      setError("Please enter a goal before analyzing the page.");
      return;
    }
    setLoading(true);
    setError(null);
    setServerPlan(null);
    setValidatedActions([]);
    setAgentExecution(null);

    try {
      console.log(`[VEIL][POPUP] sending ANALYZE: "${userGoal}"`);
      const response = await sendBackgroundMessage("ANALYZE_AND_PLAN", { userGoal });
      if (!response.success) {
        throw new Error(response.error || "Failed to analyze and plan");
      }

      console.log(`[VEIL][POPUP] received ANALYZE response: ${response.plan?.summary}`);

      const payload = response.payload;
      if (payload) {
        setLastPayload(payload);
        setPrivacyStatus({
          backend: "mock" as const,
          redactedCount: payload.redactionManifest?.length ?? 0,
          lastCapture: payload.timestamp,
          sessionActive: true,
        });

        const telemetryEntry = {
          timestamp: new Date().toISOString(),
          metric: "total_latency_ms" as const,
          value: Date.now() - new Date(payload.timestamp).getTime(),
          sessionId: payload.sessionId,
        };
        setTelemetry((prev) => [...prev, telemetryEntry].slice(-50));
      }

      if (response.plan) {
        setServerPlan(response.plan);
      }
      if (response.validatedActions) {
        setValidatedActions(response.validatedActions);
      }
      if (response.agentExecution) {
        setAgentExecution(response.agentExecution);
        if (response.agentExecution.isExecuting) {
          const interval = setInterval(pollAgentState, 1000);
          setPollingInterval(interval);
        }
      }
    } catch (err) {
      console.error("[VEIL][POPUP] Capture error:", err);
      setError(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setLoading(false);
    }
  }, [userGoal, sendBackgroundMessage, pollAgentState]);

  const handleConfirmAction = async (actionId?: string) => {
    const targetActionId =
      actionId ||
      validatedActions.find((a) => a.policy === "confirm")?.action.id ||
      serverPlan?.actions[currentStep]?.id ||
      validatedActions[0]?.action.id;
    if (!targetActionId) return;

    try {
      setLoading(true);
      setError(null);
      console.log(`[VEIL][POPUP] confirming action: ${targetActionId}`);
      const response = await sendBackgroundMessage("CONFIRM_ACTION", {
        actionId: targetActionId,
        userGoal,
        payload: lastPayload,
      });

      if (response.success && response.agentExecution) {
        setAgentExecution(response.agentExecution);
        setValidatedActions((prev) =>
          prev.map((a) => {
            const currentAction = a.action;
            const actionIdMatch = currentAction.id === targetActionId;
            return actionIdMatch
              ? { ...a, policy: "auto" as ActionPolicy, reason: "User confirmed" }
              : a;
          })
        );
      } else if (!response.success) {
        setError(response.error || "Action confirmation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = async () => {
    console.log("[VEIL][POPUP] user cancelled confirmation");
    try {
      setLoading(true);
      const response = await sendBackgroundMessage("CANCEL_CONFIRMATION");
      if (response.success && response.agentExecution) {
        setAgentExecution(response.agentExecution);
      } else {
        setAgentExecution((prev) => (prev ? { ...prev, isExecuting: false, status: "idle", plan: null } : null));
      }
      setValidatedActions((prev) =>
        prev.map((a) => ({ ...a, policy: "reject" as ActionPolicy, reason: "Cancelled by user" }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAction = (actionId: string) => {
    setValidatedActions((prev) =>
      prev.map((a) => {
        const currentAction = a.action;
        const actionIdMatch = currentAction.id === actionId;
        return actionIdMatch
          ? { ...a, policy: "reject" as ActionPolicy, reason: "User rejected" }
          : a;
      })
    );
  };

  const handleStepAgent = async () => {
    if (!lastPayload || !serverPlan || !agentExecution?.classification) return;

    const response = await sendBackgroundMessage("STEP_AGENT", {
      payload: lastPayload,
      plan: serverPlan,
      classification: agentExecution.classification,
      pageMapElements: lastPayload.pageMap.elements,
    });

    if (response.success) {
      setAgentExecution(response.agentExecution);
      if (response.agentExecution.isExecuting) {
        const interval = setInterval(pollAgentState, 1000);
        setPollingInterval(interval);
      }
    }
  };

  const handleCancelAgent = async () => {
    console.log("[VEIL][POPUP] cancelling agent execution");
    await sendBackgroundMessage("CANCEL_AGENT");
    setAgentExecution((prev: AgentExecutionContext | null) => prev ? { ...prev, isExecuting: false, status: "stopped" } : null);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleClearSession = async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    console.log("[VEIL][POPUP] clearing session");
    await sendBackgroundMessage("CANCEL_AGENT");
    await sendContentMessage("CLEAR_SESSION");
    setLastPayload(null);
    setServerPlan(null);
    setValidatedActions([]);
    setAgentExecution(null);
    setPrivacyStatus(null);
    setError(null);
  };

  const handleServerUrlChange = async (url: string) => {
    setServerUrl(url);
    try {
      new URL(url);
      await sendBackgroundMessage("UPDATE_SERVER_CONFIG", { config: { url, enabled: true } });
      setServerConnected(true);
    } catch {
      setServerConnected(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const redactedCount = lastPayload?.redactionManifest?.length ?? 0;
  const payloadSize = lastPayload?.sanitizedScreenshot?.length ?? 0;
  const payloadKb = Math.round(payloadSize / 1024);
  const backend = privacyStatus?.backend ?? "mock";
  const sessionActive = !!privacyStatus?.sessionActive;
  const pendingActionCount = validatedActions.filter((a) => a.policy === "confirm").length;

  const currentStep = agentExecution?.currentStep ?? 0;
  const totalSteps = serverPlan?.actions.length ?? 0;
  const isExecuting = agentExecution?.isExecuting ?? false;
  const agentStatus = agentExecution?.status ?? "idle";

  const overallTone: StatusTone = !active
    ? "off"
    : !serverConnected
    ? "warn"
    : loading
    ? "warn"
    : error
    ? "danger"
    : "ok";

  const overallLabel = !active
    ? "Idle"
    : !serverConnected
    ? "Server offline"
    : loading
    ? "Analyzing…"
    : error
    ? "Error"
    : sessionActive
    ? "Secured"
    : "Ready";

  const showAgentSection = !!serverPlan || !!agentExecution;

  return (
    <div className="popup">
      {/* Header */}
      <header className="popup__header">
        <div className="popup__brand">
          <span className="popup__logo" aria-hidden>
            <ShieldIcon size={18} strokeWidth={2.2} />
          </span>
          <div>
            <div className="popup__title">Veil</div>
            <div className="popup__subtitle">Private vision for AI agents</div>
          </div>
        </div>
        <StatusPill tone={overallTone}>{overallLabel}</StatusPill>
      </header>

      <div className="popup__body">
        {/* Toggles */}
        <div className="toggle-row">
          <ToggleCard
            active={active}
            onToggle={() => setActive((v) => !v)}
            icon={<EyeOffIcon size={15} />}
            title="Agent"
            hint={active ? "Privacy redaction on" : "Paused"}
          />
          <ToggleCard
            active={serverConnected}
            onToggle={() =>
              handleServerUrlChange(serverConnected ? "" : serverUrl)
            }
            icon={<ServerIcon size={15} />}
            title="Server"
            hint={serverConnected ? "Connected" : "Offline"}
            disabled={loading}
          />
        </div>

        {/* Server URL */}
        {serverConnected && (
          <div className="server-row">
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onBlur={(e) => handleServerUrlChange(e.target.value)}
              placeholder="Server URL"
              className="input"
              disabled={loading}
              spellCheck={false}
              autoComplete="off"
            />
            <span className="status status--ok" title="Connected">
              <span className="status__dot" />
              Live
            </span>
          </div>
        )}

        {/* Metrics */}
        <div className="metrics">
          <MetricCard label="Backend" value={backend} accent />
          <MetricCard
            label="Redacted"
            value={redactedCount}
            unit={redactedCount === 1 ? "item" : "items"}
          />
          <MetricCard
            label="Payload"
            value={payloadSize > 0 ? payloadKb : 0}
            unit="KB"
          />
        </div>

        {/* Goal */}
        <div className="field">
          <label className="field__label" htmlFor="user-goal">
            <TargetIcon size={13} strokeWidth={2} />
            User goal
          </label>
          <textarea
            id="user-goal"
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="Tell Veil what you want to do on this page…"
            rows={2}
            className="textarea"
            disabled={loading}
          />
          <span className="field__helper">
            Describe a task in plain language. Veil will inspect the page and act only on your request.
          </span>
          <span className="field__hint">
            Stays on-device. Only sanitized output reaches the server.
          </span>
        </div>

        {/* Action */}
        <button
          onClick={handleCapture}
          disabled={loading || !active || !userGoal.trim() || !serverConnected}
          className="btn btn--primary btn--block"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Analyzing page…
            </>
          ) : (
            <>
              <SparkleIcon size={14} strokeWidth={2.2} />
              Analyze & plan
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="alert alert--error" role="alert">
            <span className="alert__icon">
              <AlertIcon size={14} strokeWidth={2} />
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Agent State & Plan */}
        {showAgentSection && (
          <div className="popup__section">
            <div className="popup__divider" />
            <AgentStateIndicator
              status={agentStatus}
              classification={agentExecution?.classification ?? undefined}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />
            
            {serverPlan && (
              <div className="plan-section">
                <div className="plan-header">
                  <div className="plan-header__title">
                    <SparkleIcon size={13} strokeWidth={2} />
                    {agentExecution?.classification?.mode === "informational" ? "Response" : "Action Plan"}
                  </div>
                  <StatusPill
                    tone={serverPlan.requiresUserConfirmation ? "warn" : "ok"}
                  >
                    {agentExecution?.classification?.mode === "informational"
                      ? "Informational"
                      : serverPlan.requiresUserConfirmation
                      ? `${pendingActionCount} to confirm`
                      : "Auto-executable"}
                  </StatusPill>
                </div>
                <div className="plan-summary">{serverPlan.summary}</div>

                {agentExecution?.classification?.mode !== "informational" && (
                  <>
                    {agentExecution?.classification?.requiresClarification && (
                      <div className="alert alert--warn">
                        <AlertIcon size={13} strokeWidth={2} />
                        <span>{agentExecution.classification.clarificationQuestion}</span>
                      </div>
                    )}

                    {validatedActions.length > 0 && (
                      <div className="actions">
                        {validatedActions.map((action, index) => {
                          const step = agentExecution?.steps.find((s) => s.stepNumber === index + 1);
                          return (
                            <ServerActionItem
                              key={action.action.id}
                              action={action}
                              index={index}
                              onConfirm={handleConfirmAction}
                              onReject={handleRejectAction}
                              isExecuting={isExecuting}
                              stepNumber={currentStep + 1}
                              step={step}
                            />
                          );
                        })}
                      </div>
                    )}

                    {(agentStatus === "waiting_for_confirmation" || (serverPlan.requiresUserConfirmation && !agentExecution?.steps.some((s) => s.result === "success"))) && (
                      <div style={{ marginTop: "12px" }}>
                        <HighRiskConfirmationCard
                          plan={serverPlan}
                          pendingAction={validatedActions.find((a) => a.policy === "confirm") || validatedActions[0]}
                          onConfirm={() => handleConfirmAction()}
                          onCancel={handleCancelConfirmation}
                          isExecuting={isExecuting}
                        />
                      </div>
                    )}

                    {agentExecution && agentExecution.steps.length > 0 && (
                      <ExecutionSteps
                        steps={agentExecution.steps}
                        planActions={serverPlan.actions}
                        currentStep={currentStep}
                      />
                    )}

                    {!isExecuting && agentStatus === "ready" && serverPlan.actions.length > 0 && (
                      <button
                        onClick={handleStepAgent}
                        className="btn btn--primary btn--block"
                        style={{ marginTop: "12px" }}
                      >
                        <PlayIcon size={14} strokeWidth={2.2} />
                        Execute Step {currentStep + 1} of {totalSteps}
                      </button>
                    )}

                    {isExecuting && (
                      <button
                        onClick={handleCancelAgent}
                        className="btn btn--danger btn--block"
                        style={{ marginTop: "12px" }}
                      >
                        <StopIcon size={14} strokeWidth={2.2} />
                        Stop Execution
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manifest */}
        {lastPayload && lastPayload.redactionManifest && lastPayload.redactionManifest.length > 0 && (
          <details
            className="disclosure"
            open={showManifest}
            onToggle={(e) => setShowManifest((e.target as HTMLDetailsElement).open)}
          >
            <summary className="disclosure__summary">
              <span className="disclosure__summary-left">
                <EyeOffIcon size={13} />
                Redaction manifest
                <span className="disclosure__count">{redactedCount}</span>
              </span>
              <span className="disclosure__chevron">
                <ChevronIcon size={14} />
              </span>
            </summary>
            <div className="disclosure__content">
              {lastPayload.redactionManifest.map((entry, i) => {
                if (!entry.bounds) return null;
                return (
                  <div key={i} className="manifest-row">
                    <span className="manifest-row__category">{entry.category}</span>
                    <span className="manifest-row__bounds">
                      ({Math.round(entry.bounds.x)},{Math.round(entry.bounds.y)})
                    </span>
                    <span className="manifest-row__confidence">
                      {Math.round((entry.confidence ?? 0) * 100)}%
                    </span>
                    <span className="manifest-row__arrow">→</span>
                    <span className="manifest-row__replacement">
                      {entry.replacement}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Telemetry */}
        {telemetry.length > 0 && (
          <details
            className="disclosure"
            open={showTelemetry}
            onToggle={(e) => setShowTelemetry((e.target as HTMLDetailsElement).open)}
          >
            <summary className="disclosure__summary">
              <span className="disclosure__summary-left">
                <PulseIcon size={13} />
                Telemetry
                <span className="disclosure__count">{telemetry.length}</span>
              </span>
              <span className="disclosure__chevron">
                <ChevronIcon size={14} />
              </span>
            </summary>
            <div className="disclosure__content">
              {telemetry
                .slice()
                .reverse()
                .map((entry, i) => (
                  <div key={i} className="telemetry-row">
                    <span className="telemetry-row__metric">{entry.metric}</span>
                    <span className="telemetry-row__value">{entry.value} ms</span>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Settings */}
        <details
          className="disclosure"
          open={showSettings}
          onToggle={(e) => setShowSettings((e.target as HTMLDetailsElement).open)}
        >
          <summary className="disclosure__summary">
            <span className="disclosure__summary-left">
              <SettingsIcon size={13} />
              Settings & safety
            </span>
            <span className="disclosure__chevron">
              <ChevronIcon size={14} />
            </span>
          </summary>
          <div className="disclosure__content" style={{ padding: "10px 12px" }}>
            <div
              className="alert alert--info"
              style={{ marginBottom: 0 }}
              role="note"
            >
              <span className="alert__icon">
                <InfoIcon size={13} strokeWidth={2} />
              </span>
              <span>
                Raw screenshots, form values, and URLs never leave this device.
                Only the redacted page map, redaction manifest, and goal text
                are sent to the configured server.
              </span>
            </div>
          </div>
        </details>

        {/* Footer */}
        <div className="popup__footer">
          <span className="popup__footer-meta">
            <GaugeIcon size={11} />
            {active ? "Privacy redaction active" : "Agent disabled"}
          </span>
          <button
            onClick={handleClearSession}
            className="btn btn--danger"
            title="Clear session and redaction state"
          >
            <TrashIcon size={12} />
            Emergency stop
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
export { Popup };
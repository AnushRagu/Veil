import React, { useState, useEffect, useCallback } from "react";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ValidatedAction,
  ActionPolicy,
  GoalClassification,
  AgentState,
  AgentStep,
  AgentExecutionContext,
  PageSuggestion,
} from "@privatesight/shared";
import {
  ShieldIcon,
  ServerIcon,
  TargetIcon,
  SparkleIcon,
  ChevronIcon,
  AlertIcon,
  CheckIcon,
  SettingsIcon,
  SearchIcon,
  MessageSquareIcon,
  PlayIcon,
  StopIcon,
  RefreshCwIcon,
} from "./icons";

type StatusTone = "ok" | "warn" | "danger" | "off";

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
  idle: { label: "Ready", tone: "ok", icon: <CheckIcon size={12} strokeWidth={2} /> },
  observing: { label: "Observing page…", tone: "warn", icon: <SearchIcon size={12} /> },
  interpreting: { label: "Understanding goal…", tone: "warn", icon: <MessageSquareIcon size={12} /> },
  planning: { label: "Planning actions…", tone: "warn", icon: <SparkleIcon size={12} strokeWidth={2} /> },
  validating: { label: "Validating safety…", tone: "warn", icon: <ShieldIcon size={12} /> },
  waiting_for_confirmation: { label: "Confirmation required", tone: "warn", icon: <AlertIcon size={12} strokeWidth={2} /> },
  needs_clarification: { label: "Needs clarification", tone: "warn", icon: <AlertIcon size={12} strokeWidth={2} /> },
  ready: { label: "Ready to execute", tone: "ok", icon: <PlayIcon size={12} /> },
  executing: { label: "Executing…", tone: "warn", icon: <PlayIcon size={12} /> },
  verifying: { label: "Verifying result…", tone: "warn", icon: <RefreshCwIcon size={12} /> },
  completed: { label: "Completed", tone: "ok", icon: <CheckIcon size={12} strokeWidth={2.4} /> },
  blocked: { label: "Blocked", tone: "danger", icon: <AlertIcon size={12} strokeWidth={2} /> },
  failed: { label: "Failed", tone: "danger", icon: <AlertIcon size={12} strokeWidth={2} /> },
  stopped: { label: "Stopped", tone: "off", icon: <StopIcon size={12} /> },
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
  const policyInfo = policyMeta[action.policy];
  const { action: act, reason } = action;
  const isCurrentStep = stepNumber === index + 1;

  let statusBadge = (
    <span className={`status-pill status-pill--${policyInfo.tone}`}>
      {policyInfo.label}
    </span>
  );

  if (step) {
    if (step.result === "success") {
      statusBadge = (
        <span className="status-pill status-pill--ok">
          {step.verified ? "Verified ✓" : "Executed"}
        </span>
      );
    } else if (step.result === "failed") {
      statusBadge = (
        <span className="status-pill status-pill--danger">
          Failed
        </span>
      );
    } else if (step.result === "pending") {
      statusBadge = (
        <span className="status-pill status-pill--warn">
          Running…
        </span>
      );
    }
  }

  const targetLabel =
    action.mappedElement?.label ||
    act.target?.label ||
    act.target?.elementId ||
    act.target?.selector ||
    act.value ||
    "page";

  return (
    <div className={`action-card ${isCurrentStep && isExecuting ? "action-card--active" : ""}`}>
      <div className="action-card__content">
        <div className="action-card__header">
          <span className="action-card__type">{act.type}</span>
          <span className="action-card__target">&ldquo;{targetLabel}&rdquo;</span>
        </div>
        {reason && <div className="action-card__reason">{reason}</div>}
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
          <AlertIcon size={12} strokeWidth={2.4} />
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
  const meta = agentStateMeta[status] || agentStateMeta.idle;

  return (
    <div className="task-tracker">
      <div className="task-tracker__header">
        <div className="task-tracker__status">
          <span className={`status-dot status-dot--${meta.tone}`} />
          <span className="task-tracker__label">{meta.label}</span>
        </div>
        {totalSteps && totalSteps > 0 ? (
          <span className="task-tracker__steps">
            Step {currentStep} of {totalSteps}
          </span>
        ) : null}
      </div>

      {classification && classification.interpretation && (
        <div className="task-tracker__interpretation">
          <strong>Goal:</strong> {classification.interpretation}
        </div>
      )}

      {classification?.requiresClarification && classification.clarificationQuestion && (
        <div className="alert alert--warn" style={{ marginTop: "6px" }}>
          <AlertIcon size={12} strokeWidth={2} />
          <span>{classification.clarificationQuestion}</span>
        </div>
      )}

      {classification?.mode === "informational" && (
        <div className="task-tracker__info">
          I can inspect this page, identify elements, protect sensitive data, and perform browser actions you request (e.g., &ldquo;click submit&rdquo;, &ldquo;fill name&rdquo;, &ldquo;scroll down&rdquo;).
        </div>
      )}
    </div>
  );
};

export const Popup: React.FC = () => {
  const [active, setActive] = useState(true);
  const [serverUrl, setServerUrl] = useState("http://localhost:3001");
  const [serverConnected, setServerConnected] = useState(true);
  const [userGoal, setUserGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus | null>(null);
  const [lastPayload, setLastPayload] = useState<ClientPayload | null>(null);
  const [serverPlan, setServerPlan] = useState<ServerPlan | null>(null);
  const [validatedActions, setValidatedActions] = useState<ValidatedAction[]>([]);
  const [agentExecution, setAgentExecution] = useState<AgentExecutionContext | null>(null);
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [privacyExpanded, setPrivacyExpanded] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<any>(null);

  const sendBackgroundMessage = useCallback(
    (type: string, data?: any): Promise<any> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response ?? { success: false });
        });
      });
    },
    []
  );

  const sendContentMessage = useCallback(
    (type: string, data?: any): Promise<any> => {
      return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tab = tabs[0];
          if (!tab?.id) {
            resolve({ success: false, error: "No active tab" });
            return;
          }
          chrome.tabs.sendMessage(tab.id, { type, ...data }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(response ?? { success: false });
          });
        });
      });
    },
    []
  );

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await sendBackgroundMessage("GET_PAGE_SUGGESTIONS");
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch {}
  }, [sendBackgroundMessage]);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await sendBackgroundMessage("GET_PRIVACY_STATUS");
      if (response.success && response.status) {
        setPrivacyStatus(response.status);
      }
    } catch {}
  }, [sendBackgroundMessage]);

  const pollAgentState = useCallback(async () => {
    try {
      const response = await sendBackgroundMessage("GET_AGENT_STATE");
      if (response.success && response.agentExecution) {
        setAgentExecution(response.agentExecution);
        if (!response.agentExecution.isExecuting && pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch {}
  }, [sendBackgroundMessage, pollingInterval]);

  useEffect(() => {
    refreshStatus();
    fetchSuggestions();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus, fetchSuggestions]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const handleCapture = async () => {
    if (!userGoal.trim()) {
      setError("Please describe a task or goal.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuickFeedback(null);

    try {
      const response = await sendBackgroundMessage("ANALYZE_AND_PLAN", {
        userGoal: userGoal.trim(),
      });

      if (!response.success) {
        setError(response.error || "Failed to analyze page. Refresh the tab and try again.");
        return;
      }

      setLastPayload(response.payload);
      setServerPlan(response.plan);
      setValidatedActions(response.validatedActions || []);
      setAgentExecution(response.agentExecution);

      if (response.agentExecution?.isExecuting) {
        const interval = setInterval(pollAgentState, 800);
        setPollingInterval(interval);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuickAction = async (suggestion: PageSuggestion) => {
    try {
      setLoading(true);
      setError(null);
      setQuickFeedback(`Executing: ${suggestion.label}…`);

      const response = await sendBackgroundMessage("EXECUTE_QUICK_ACTION", {
        action: suggestion.action,
        pageMap: lastPayload?.pageMap,
      });

      if (response.success) {
        if (response.agentExecution) {
          setAgentExecution(response.agentExecution);
        }
        setQuickFeedback(
          response.verified
            ? `${suggestion.label} ✓`
            : `${suggestion.label} dispatched`
        );
      } else {
        setError(response.error || "Action failed to execute");
        setQuickFeedback(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quick action failed");
      setQuickFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId?: string) => {
    const targetActionId =
      actionId ||
      validatedActions.find((a) => a.policy === "confirm")?.action.id ||
      serverPlan?.actions[agentExecution?.currentStep ?? 0]?.id ||
      validatedActions[0]?.action.id;
    if (!targetActionId) return;

    try {
      setLoading(true);
      setError(null);
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

  const handleCancelAgent = async () => {
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
    await sendBackgroundMessage("CANCEL_AGENT");
    await sendContentMessage("CLEAR_SESSION");
    setLastPayload(null);
    setServerPlan(null);
    setValidatedActions([]);
    setAgentExecution(null);
    setPrivacyStatus(null);
    setError(null);
    setQuickFeedback(null);
    fetchSuggestions();
  };

  const redactedCount = lastPayload?.redactionManifest?.length ?? privacyStatus?.redactedCount ?? 0;
  const payloadSize = lastPayload?.sanitizedScreenshot?.length ?? 0;
  const payloadKb = Math.round(payloadSize / 1024);
  const currentStep = agentExecution?.currentStep ?? 0;
  const totalSteps = serverPlan?.actions.length ?? 0;
  const isExecuting = agentExecution?.isExecuting ?? false;
  const agentStatus = agentExecution?.status ?? "idle";

  const showActiveTask = !!serverPlan || (!!agentExecution && agentStatus !== "idle");

  return (
    <div className="popup">
      {/* Header */}
      <header className="popup__header">
        <div className="popup__brand">
          <span className="popup__logo" aria-hidden>
            <ShieldIcon size={16} strokeWidth={2.4} />
          </span>
          <div className="popup__titles">
            <h1 className="popup__title">Veil</h1>
            <span className="popup__subtitle">Private browsing agent</span>
          </div>
        </div>

        <div className="popup__status-badge">
          <span className="status-dot status-dot--ok" />
          <span>Protected on device</span>
        </div>
      </header>

      <div className="popup__body">
        {/* Suggested Actions (Zero Typing) */}
        {suggestions.length > 0 && !isExecuting && (
          <div className="popup__section popup__suggestions">
            <div className="section-label">
              <SparkleIcon size={11} strokeWidth={2} />
              <span>Suggested actions</span>
            </div>
            <div className="suggestion-chips">
              {suggestions.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => handleExecuteQuickAction(sug)}
                  disabled={loading || isExecuting}
                  title={sug.description || sug.label}
                >
                  {sug.category === "scroll" && <span className="chip-icon">↓</span>}
                  {sug.category === "search" && <SearchIcon size={11} strokeWidth={2} />}
                  {sug.category === "find" && <TargetIcon size={11} strokeWidth={2} />}
                  {sug.category === "form" && <SettingsIcon size={11} strokeWidth={2} />}
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Feedback Banner */}
        {quickFeedback && (
          <div className="alert alert--info">
            <CheckIcon size={12} strokeWidth={2} />
            <span>{quickFeedback}</span>
          </div>
        )}

        {/* Goal Input */}
        <div className="popup__section">
          <div className="goal-box">
            <textarea
              id="user-goal"
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="Tell Veil what you want to do on this page…"
              rows={2}
              className="goal-textarea"
              disabled={loading || isExecuting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && userGoal.trim()) {
                  e.preventDefault();
                  handleCapture();
                }
              }}
            />
            <div className="goal-box__footer">
              <span className="goal-box__help">
                Describe a task in plain language. Veil acts only on your request.
              </span>
              <button
                onClick={handleCapture}
                disabled={loading || !active || !userGoal.trim() || !serverConnected || isExecuting}
                className="btn btn--primary"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <SparkleIcon size={12} strokeWidth={2} />
                    <span>Analyze & act</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert--error" role="alert">
            <AlertIcon size={13} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Active Task Tracking */}
        {showActiveTask && (
          <div className="popup__section">
            <AgentStateIndicator
              status={agentStatus}
              classification={agentExecution?.classification ?? undefined}
              currentStep={currentStep}
              totalSteps={totalSteps}
            />

            {serverPlan && (
              <div className="plan-container">
                <div className="plan-summary">{serverPlan.summary}</div>

                {/* High Risk Confirmation Card */}
                {(agentStatus === "waiting_for_confirmation" ||
                  (serverPlan.requiresUserConfirmation &&
                    !agentExecution?.steps.some((s) => s.result === "success"))) && (
                  <HighRiskConfirmationCard
                    plan={serverPlan}
                    pendingAction={
                      validatedActions.find((a) => a.policy === "confirm") ||
                      validatedActions[0]
                    }
                    onConfirm={() => handleConfirmAction()}
                    onCancel={handleCancelConfirmation}
                    isExecuting={isExecuting}
                  />
                )}

                {/* Validated Actions List */}
                {validatedActions.length > 0 && (
                  <div className="actions-list">
                    {validatedActions.map((action, index) => {
                      const step = agentExecution?.steps.find(
                        (s) => s.stepNumber === index + 1
                      );
                      return (
                        <ServerActionItem
                          key={action.action.id}
                          action={action}
                          index={index}
                          onConfirm={handleConfirmAction}
                          onReject={() => {}}
                          isExecuting={isExecuting}
                          stepNumber={currentStep + 1}
                          step={step}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Execution controls */}
                <div className="plan-controls">
                  {isExecuting && (
                    <button
                      onClick={handleCancelAgent}
                      className="btn btn--secondary btn--block"
                    >
                      <StopIcon size={12} />
                      Stop Execution
                    </button>
                  )}
                  {!isExecuting && (
                    <button
                      onClick={handleClearSession}
                      className="btn btn--secondary btn--block"
                    >
                      Clear & Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust & Expandable Privacy Footer */}
      <footer className="popup__footer">
        <button
          type="button"
          className="privacy-bar"
          onClick={() => setPrivacyExpanded((v) => !v)}
          aria-expanded={privacyExpanded}
        >
          <div className="privacy-bar__left">
            <ShieldIcon size={12} strokeWidth={2.4} />
            <span>Sensitive data protected on-device</span>
          </div>
          <ChevronIcon
            size={11}
            className={`chevron ${privacyExpanded ? "chevron--expanded" : ""}`}
          />
        </button>

        {privacyExpanded && (
          <div className="tech-drawer">
            <div className="tech-drawer__row">
              <span className="tech-drawer__label">Redacted items:</span>
              <span className="tech-drawer__val">{redactedCount} elements protected</span>
            </div>
            <div className="tech-drawer__row">
              <span className="tech-drawer__label">Sanitized payload:</span>
              <span className="tech-drawer__val">{payloadKb} KB</span>
            </div>
            <div className="tech-drawer__row">
              <span className="tech-drawer__label">Perception boundary:</span>
              <span className="tech-drawer__val">Client-side only</span>
            </div>
            <div className="tech-drawer__row">
              <span className="tech-drawer__label">Planner server:</span>
              <span className="tech-drawer__val">{serverUrl} ({serverConnected ? "Live" : "Offline"})</span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  RedactionManifest,
  summarizeRedactionManifest,
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
  confirm: { label: "Approval required", tone: "warn" },
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
  waiting_for_confirmation: {
    label: "Confirmation required",
    tone: "warn",
    icon: <AlertIcon size={12} strokeWidth={2} />,
  },
  needs_clarification: {
    label: "Needs clarification",
    tone: "warn",
    icon: <AlertIcon size={12} strokeWidth={2} />,
  },
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
}> = ({ action, index, isExecuting, stepNumber, step }) => {
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
          Executing…
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
  isExecuting: boolean;
}> = ({ plan, pendingAction, onConfirm, onCancel, isExecuting }) => {
  const targetLabel =
    pendingAction?.mappedElement?.label ||
    pendingAction?.action.target?.label ||
    pendingAction?.action.target?.elementId ||
    "Submit";

  const isDestructive =
    pendingAction?.action.risk === "high" ||
    plan.summary.toLowerCase().includes("delete") ||
    targetLabel.toLowerCase().includes("delete") ||
    targetLabel.toLowerCase().includes("erase");

  const isSubmit =
    targetLabel.toLowerCase().includes("submit") ||
    targetLabel.toLowerCase().includes("send") ||
    plan.summary.toLowerCase().includes("submit");

  const buttonLabel = isDestructive
    ? "Confirm & Delete"
    : isSubmit
    ? "Confirm & Submit"
    : "Confirm & Execute";

  return (
    <div className="confirmation-card">
      <div className="confirmation-card__header">
        <div className="confirmation-card__title">
          <AlertIcon size={14} strokeWidth={2.4} />
          <span>{isDestructive ? "⚠️ High-risk confirmation" : "⚡ Confirm action"}</span>
        </div>
        <span className={`badge ${isDestructive ? "badge--danger" : "badge--warn"}`}>
          {isDestructive ? "Destructive" : "Authorization required"}
        </span>
      </div>

      <p className="confirmation-card__body">
        {isDestructive ? (
          <>
            Veil will click <strong>&ldquo;{targetLabel}&rdquo;</strong> on this page. This action may modify or delete account data and cannot be undone.
          </>
        ) : isSubmit ? (
          <>
            Veil will click <strong>&ldquo;{targetLabel}&rdquo;</strong> to submit the form on this page. Sensitive values remain protected on-device.
          </>
        ) : (
          <>
            Veil will click <strong>&ldquo;{targetLabel}&rdquo;</strong> on this page upon your confirmation.
          </>
        )}
      </p>

      <div className="confirmation-card__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isExecuting}
          className="btn btn--secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isExecuting}
          className={`btn ${isDestructive ? "btn--danger" : "btn--primary"}`}
        >
          {isExecuting ? (
            <>
              <span className="spinner" />
              <span>Executing…</span>
            </>
          ) : (
            <>
              <CheckIcon size={12} strokeWidth={2} />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AgentStateIndicator: React.FC<{
  status: AgentState;
  classification?: GoalClassification;
  currentStep: number;
  totalSteps: number;
  error?: string | null;
}> = ({ status, classification, currentStep, totalSteps, error }) => {
  const meta = agentStateMeta[status] || agentStateMeta.idle;

  return (
    <div className={`agent-indicator agent-indicator--${meta.tone}`}>
      <div className="agent-indicator__header">
        <div className="agent-indicator__status">
          <span className={`status-dot status-dot--${meta.tone}`} />
          <span className="agent-indicator__label">{meta.label}</span>
        </div>
        {totalSteps > 0 && (
          <span className="agent-indicator__steps">
            Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
          </span>
        )}
      </div>

      {classification?.interpretation && status !== "failed" && (
        <div className="agent-indicator__detail">
          <strong>Goal:</strong> {classification.interpretation}
        </div>
      )}

      {status === "failed" && error && (
        <div className="agent-indicator__error">
          <AlertIcon size={12} strokeWidth={2} />
          <span>{error}</span>
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
  const [redactionManifest, setRedactionManifest] = useState<RedactionManifest>([]);
  const [serverPlan, setServerPlan] = useState<ServerPlan | null>(null);
  const [validatedActions, setValidatedActions] = useState<ValidatedAction[]>([]);
  const [agentExecution, setAgentExecution] = useState<AgentExecutionContext | null>(null);
  const [suggestions, setSuggestions] = useState<PageSuggestion[]>([]);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);
  const [privacyExpanded, setPrivacyExpanded] = useState<boolean>(false);
  const [redactionExpanded, setRedactionExpanded] = useState<boolean>(false);
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
      const response = await sendBackgroundMessage("GET_PAGE_SUGGESTIONS", {
        userGoal,
      });
      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
        if (response.redactionManifest) {
          setRedactionManifest(response.redactionManifest);
        }
        if (typeof response.serverConnected === "boolean") {
          setServerConnected(response.serverConnected);
        }
      }
    } catch {}
  }, [sendBackgroundMessage, userGoal]);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await sendBackgroundMessage("GET_PRIVACY_STATUS");
      if (response.success) {
        if (response.status) setPrivacyStatus(response.status);
        if (response.redactionManifest) setRedactionManifest(response.redactionManifest);
        if (typeof response.serverConnected === "boolean") {
          setServerConnected(response.serverConnected);
        }
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

    // Reset previous task state immediately to ensure NO stale completed card is shown
    setLoading(true);
    setError(null);
    setQuickFeedback(null);
    setServerPlan(null);
    setValidatedActions([]);

    const newTaskId = `task-${Date.now()}`;
    setAgentExecution({
      taskId: newTaskId,
      sessionId: `sess-${Date.now()}`,
      goal: userGoal.trim(),
      userGoal: userGoal.trim(),
      classification: {
        mode: "click",
        confidence: 0.9,
        interpretation: userGoal.trim(),
        requiresClarification: false,
        riskLevel: "low",
      },
      plan: { summary: "Analyzing page...", confidence: 0.9, requiresUserConfirmation: false, actions: [] },
      currentStep: 0,
      maxSteps: 10,
      steps: [],
      status: "observing",
      isExecuting: true,
      error: null,
    });

    try {
      const response = await sendBackgroundMessage("ANALYZE_AND_PLAN", {
        userGoal: userGoal.trim(),
      });

      if (!response.success) {
        const errorMsg = response.error || "Couldn't complete that action. Please check the page and try again.";
        setError(errorMsg);
        setAgentExecution({
          taskId: newTaskId,
          sessionId: `sess-${Date.now()}`,
          goal: userGoal.trim(),
          userGoal: userGoal.trim(),
          classification: {
            mode: "click",
            confidence: 0.5,
            interpretation: userGoal.trim(),
            requiresClarification: false,
            riskLevel: "low",
          },
          plan: { summary: "Task failed", confidence: 0, requiresUserConfirmation: false, actions: [] },
          currentStep: 0,
          maxSteps: 1,
          steps: [],
          status: "failed",
          isExecuting: false,
          error: errorMsg,
        });
        return;
      }

      setLastPayload(response.payload);
      if (response.payload?.redactionManifest) {
        setRedactionManifest(response.payload.redactionManifest);
      }
      setServerPlan(response.plan);
      setValidatedActions(response.validatedActions || []);
      setAgentExecution(response.agentExecution);

      if (response.agentExecution?.isExecuting) {
        const interval = setInterval(pollAgentState, 600);
        setPollingInterval(interval);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Analysis failed";
      setError(errorMsg);
      setAgentExecution((prev) =>
        prev ? { ...prev, status: "failed", isExecuting: false, error: errorMsg } : null
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuickAction = async (suggestion: PageSuggestion) => {
    try {
      setLoading(true);
      setError(null);
      setServerPlan(null);
      setValidatedActions([]);
      setQuickFeedback(`Executing: ${suggestion.label}…`);

      const newTaskId = `task-quick-${Date.now()}`;
      setAgentExecution({
        taskId: newTaskId,
        sessionId: `sess-quick-${Date.now()}`,
        goal: suggestion.label,
        userGoal: suggestion.label,
        classification: {
          mode: suggestion.category === "scroll" ? "scroll" : "click",
          confidence: 0.95,
          interpretation: suggestion.label,
          requiresClarification: false,
          riskLevel: "low",
        },
        plan: {
          summary: suggestion.action.reason || suggestion.label,
          confidence: 0.95,
          requiresUserConfirmation: false,
          actions: [suggestion.action],
        },
        currentStep: 0,
        maxSteps: 1,
        steps: [],
        status: "executing",
        isExecuting: true,
        error: null,
      });

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
            : `${suggestion.label} executed`
        );
      } else {
        const errorMsg = response.error || "Action failed to execute";
        setError(errorMsg);
        setQuickFeedback(null);
        setAgentExecution({
          taskId: newTaskId,
          sessionId: `sess-quick-${Date.now()}`,
          goal: suggestion.label,
          userGoal: suggestion.label,
          classification: {
            mode: "click",
            confidence: 0.5,
            interpretation: suggestion.label,
            requiresClarification: false,
            riskLevel: "low",
          },
          plan: { summary: "Action failed", confidence: 0, requiresUserConfirmation: false, actions: [] },
          currentStep: 0,
          maxSteps: 1,
          steps: [],
          status: "failed",
          isExecuting: false,
          error: errorMsg,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Quick action failed";
      setError(errorMsg);
      setQuickFeedback(null);
      setAgentExecution((prev) =>
        prev ? { ...prev, status: "failed", isExecuting: false, error: errorMsg } : null
      );
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
        const errorMsg = response.error || "Action confirmation failed";
        setError(errorMsg);
        setAgentExecution((prev) =>
          prev ? { ...prev, status: "failed", isExecuting: false, error: errorMsg } : null
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Action confirmation failed";
      setError(errorMsg);
      setAgentExecution((prev) =>
        prev ? { ...prev, status: "failed", isExecuting: false, error: errorMsg } : null
      );
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
        setAgentExecution((prev) =>
          prev ? { ...prev, isExecuting: false, status: "idle", plan: null } : null
        );
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
    setAgentExecution((prev: AgentExecutionContext | null) =>
      prev ? { ...prev, isExecuting: false, status: "stopped" } : null
    );
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
    setRedactionManifest([]);
    setError(null);
    setQuickFeedback(null);
    fetchSuggestions();
  };

  // Summarize redactions into clean privacy manifest
  const redactionSummary = useMemo(() => {
    const manifest = lastPayload?.redactionManifest || redactionManifest;
    return summarizeRedactionManifest(manifest);
  }, [lastPayload, redactionManifest]);

  const payloadSize = lastPayload?.sanitizedScreenshot?.length ?? 0;
  const payloadKb = Math.round(payloadSize / 1024);
  const currentStep = agentExecution?.currentStep ?? 0;
  const totalSteps = serverPlan?.actions.length ?? 0;
  const isExecuting = agentExecution?.isExecuting ?? false;
  const agentStatus = agentExecution?.status ?? "idle";

  const showActiveTask = !!agentExecution && agentStatus !== "idle";

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
            <span className="popup__subtitle">Privacy-first browser agent</span>
          </div>
        </div>

        <div className="popup__status-badge">
          <span className={`status-dot ${serverConnected ? "status-dot--ok" : "status-dot--warn"}`} />
          <span>{serverConnected ? "Protected on device" : "Local agent active"}</span>
        </div>
      </header>

      <div className="popup__body">
        {/* Quick Actions (Zero Typing) */}
        {suggestions.length > 0 && !isExecuting && (
          <div className="popup__section popup__suggestions">
            <div className="section-label">
              <SparkleIcon size={11} strokeWidth={2} />
              <span>Quick actions</span>
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
                  {(sug.icon === "navigate" || sug.label.startsWith("Open ")) && <span className="chip-icon">↗</span>}
                  {sug.label.startsWith("Submit") && <span className="chip-icon">✓</span>}
                  {sug.category === "form" && <SettingsIcon size={11} strokeWidth={2} />}
                  {sug.category === "action" && !sug.label.startsWith("Open ") && !sug.label.startsWith("Submit") && (
                    <PlayIcon size={11} strokeWidth={2} />
                  )}
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
              placeholder="Ask Veil to do something on this page…"
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
                Veil acts only on your request.
              </span>
              <button
                onClick={handleCapture}
                disabled={loading || !userGoal.trim() || isExecuting}
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

        {/* Active Task Tracking (Authoritative Single State) */}
        {showActiveTask && (
          <div className="popup__section">
            <AgentStateIndicator
              status={agentStatus}
              classification={agentExecution?.classification ?? undefined}
              currentStep={currentStep}
              totalSteps={totalSteps}
              error={agentExecution?.error || error}
            />

            {serverPlan && agentStatus !== "failed" && (
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

            {agentStatus === "failed" && (
              <div className="plan-controls" style={{ marginTop: "10px" }}>
                <button
                  onClick={handleClearSession}
                  className="btn btn--secondary btn--block"
                >
                  Clear & Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dedicated Privacy Protection & Redaction Box */}
        <div className="popup__section">
          <div className="privacy-card">
            <button
              type="button"
              className="privacy-card__header"
              onClick={() => setRedactionExpanded((v) => !v)}
              aria-expanded={redactionExpanded}
            >
              <div className="privacy-card__title">
                <ShieldIcon size={13} strokeWidth={2.4} />
                <span>Privacy protection</span>
              </div>
              <div className="privacy-card__status">
                {redactionSummary.totalCount > 0 ? (
                  <span className="privacy-badge privacy-badge--active">
                    {redactionSummary.totalCount} item{redactionSummary.totalCount > 1 ? "s" : ""} protected
                  </span>
                ) : (
                  <span className="privacy-badge privacy-badge--neutral">
                    No sensitive data
                  </span>
                )}
                <ChevronIcon
                  size={11}
                  className={`chevron ${redactionExpanded ? "chevron--expanded" : ""}`}
                />
              </div>
            </button>

            {redactionExpanded && (
              <div className="privacy-card__drawer">
                {redactionSummary.groups.length > 0 ? (
                  <>
                    <div className="privacy-card__intro">
                      Protected on-device before any network transmission:
                    </div>
                    <div className="redaction-list">
                      {redactionSummary.groups.map((group) => (
                        <div key={group.category} className="redaction-item">
                          <div className="redaction-item__cat">
                            <CheckIcon size={10} strokeWidth={2.4} />
                            <span>{group.label}</span>
                          </div>
                          <span className="redaction-item__count">
                            {group.count}
                          </span>
                          <span className="redaction-item__token">
                            {group.replacementToken}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="privacy-card__empty">
                    No sensitive data detected on this page.
                  </div>
                )}
                <div className="privacy-card__notice">
                  🔒 Raw personal data never leaves your device.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Technical Details Footer */}
      <footer className="popup__footer">
        <button
          type="button"
          className="privacy-bar"
          onClick={() => setPrivacyExpanded((v) => !v)}
          aria-expanded={privacyExpanded}
        >
          <div className="privacy-bar__left">
            <ServerIcon size={11} strokeWidth={2} />
            <span>Technical details</span>
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
              <span className="tech-drawer__val">{redactionSummary.totalCount} elements</span>
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
              <span className="tech-drawer__label">Planner backend:</span>
              <span className="tech-drawer__val">
                {serverUrl} ({serverConnected ? "Connected" : "Offline / Local fallback"})
              </span>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

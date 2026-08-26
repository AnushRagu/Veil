import React, { useState, useEffect, useCallback } from "react";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ValidatedAction,
  ActionPolicy,
  TelemetryEntry,
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

const ServerActionItem: React.FC<{
  action: ValidatedAction;
  index: number;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
}> = ({ action, index, onConfirm, onReject }) => {
  const a = action.action;
  const policy: ActionPolicy = action.policy ?? "confirm";
  const reason = action.reason ?? "";
  const mappedElement = action.mappedElement;
  const isPending = policy === "confirm";
  const meta = policyMeta[policy];
  const confidence = a.confidence ?? 0;
  const confidencePct = Math.round(confidence * 100);

  return (
    <div className={`action action--${policy}`}>
      <span className="action__index">#{String(index + 1).padStart(2, "0")}</span>
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
        {mappedElement && (
          <div className="action__target">
            <CrosshairIcon size={11} />
            <span className="action__target-label">
              {mappedElement.label || "(unlabeled)"}
            </span>
            <span>·</span>
            <span>{mappedElement.role}</span>
          </div>
        )}
        {reason && <div className="action__reason-note">{reason}</div>}
      </div>
      {isPending && (
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
      )}
      {policy === "auto" && (
        <span className="action__state action__state--auto">Executed</span>
      )}
      {policy === "reject" && (
        <span className="action__state action__state--reject">Blocked</span>
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

  const sendBackgroundMessage = useCallback(
    (type: string, data?: any): Promise<any> => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response);
          }
        });
      });
    },
    []
  );

  const sendContentMessage = useCallback(
    (type: string, data?: any, tabId?: number): Promise<any> => {
      return new Promise((resolve) => {
        const targetTabId = tabId || (() => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id!, { type, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  resolve(response);
                }
              });
            } else {
              resolve({ success: false, error: "No active tab found" });
            }
          });
        })();
      });
    },
    []
  );

  const refreshStatus = useCallback(async () => {
    const response = await sendContentMessage("GET_PRIVACY_STATUS");
    if (response.success) {
      setPrivacyStatus(response.status);
    }
    const config = await sendBackgroundMessage("GET_SERVER_CONFIG");
    if (config.success) {
      setServerConnected(config.config.enabled);
      setServerUrl(config.config.url);
    }
  }, [sendContentMessage, sendBackgroundMessage]);

  const handleCapture = async () => {
    if (!userGoal.trim()) {
      setError("Please enter a goal before analyzing the page.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const captureResponse = await sendContentMessage("CAPTURE_AND_SEND", { userGoal });
      if (!captureResponse.success) throw new Error(captureResponse.error);

      const payload = captureResponse.payload;
      setLastPayload(payload);

      const serverResponse = await sendBackgroundMessage("SEND_TO_SERVER", {
        payload,
        pageMapElements: payload.pageMap.elements,
      });

      if (!serverResponse.success) throw new Error(serverResponse.error);

      setServerPlan(serverResponse.plan);
      setValidatedActions(serverResponse.validatedActions ?? []);

      const telemetryEntry = {
        timestamp: new Date().toISOString(),
        metric: "total_latency_ms" as const,
        value: Date.now() - new Date(payload.timestamp).getTime(),
        sessionId: payload.sessionId,
      };
      setTelemetry((prev) => [...prev, telemetryEntry].slice(-50));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    const action = validatedActions.find((a) => a.action.id === actionId);
    if (!action || !action.action.id) return;

    const executeResponse = await sendContentMessage("EXECUTE_ACTIONS", { actions: [action.action] });
    if (executeResponse.success) {
      setValidatedActions((prev) =>
        prev.map((a) => {
          const currentAction = a.action;
          const actionIdMatch = currentAction.id === actionId;
          return actionIdMatch
            ? { ...a, policy: "auto" as ActionPolicy, reason: "User confirmed" }
            : a;
        })
      );
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

  const handleClearSession = async () => {
    await sendContentMessage("CLEAR_SESSION");
    setLastPayload(null);
    setServerPlan(null);
    setValidatedActions([]);
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

  const redactedCount = lastPayload?.redactionManifest?.length ?? 0;
  const payloadSize = lastPayload?.sanitizedScreenshot?.length ?? 0;
  const payloadKb = Math.round(payloadSize / 1024);
  const backend = privacyStatus?.backend ?? "mock";
  const sessionActive = !!privacyStatus?.sessionActive;
  const pendingActionCount = validatedActions.filter((a) => a.policy === "confirm").length;

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
            placeholder="e.g. Find the submit button and prepare the form"
            rows={2}
            className="textarea"
            disabled={loading}
          />
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
              Analyze &amp; plan
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

        {/* Server plan */}
        {serverPlan && (
          <div className="popup__section">
            <div className="popup__divider" />
            <div className="plan-header">
              <div className="plan-header__title">
                <SparkleIcon size={13} strokeWidth={2} />
                AI action plan
              </div>
              <StatusPill
                tone={serverPlan.requiresUserConfirmation ? "warn" : "ok"}
              >
                {serverPlan.requiresUserConfirmation
                  ? `${pendingActionCount} to confirm`
                  : "Auto-executable"}
              </StatusPill>
            </div>
            <div className="plan-summary">{serverPlan.summary}</div>
            <div className="actions">
              {validatedActions.length === 0 ? (
                <div className="empty">No actions proposed.</div>
              ) : (
                validatedActions.map((action, index) => (
                  <ServerActionItem
                    key={action.action.id}
                    action={action}
                    index={index}
                    onConfirm={handleConfirmAction}
                    onReject={handleRejectAction}
                  />
                ))
              )}
            </div>
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
              Settings &amp; safety
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

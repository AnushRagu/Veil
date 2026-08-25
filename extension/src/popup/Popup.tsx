import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ValidatedAction,
  ActionPolicy,
  TelemetryEntry,
} from "@privatesight/shared";

interface PopupProps {}

const ActionBadge: React.FC<{ policy: ActionPolicy; label: string }> = ({ policy, label }) => {
  const colors: Record<ActionPolicy, string> = {
    auto: "bg-green-500",
    confirm: "bg-yellow-500",
    reject: "bg-red-500",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[policy]} text-white`}>
      {label}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; unit?: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-lg font-mono font-semibold text-gray-900">
      {value}{unit && <span className="text-xs font-normal text-gray-500 ml-1">{unit}</span>}
    </div>
  </div>
);

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

  return (
    <div className={`border-l-4 p-3 rounded-r-lg ${isPending ? "border-yellow-400 bg-yellow-50" : policy === "auto" ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">#{index + 1}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 rounded">{a.type}</span>
            <ActionBadge policy={policy} label={policy} />
            <span className="text-xs text-gray-500">conf: {Math.round((a.confidence ?? 0) * 100)}%</span>
          </div>
          <div className="mt-1 text-sm text-gray-700">{a.reason ?? ""}</div>
          {mappedElement && (
            <div className="mt-1 text-xs text-gray-500 font-mono">
              Target: {mappedElement.label ?? ""} ({mappedElement.role ?? ""})
            </div>
          )}
          <div className="mt-1 text-xs text-gray-500">{reason}</div>
        </div>
        {isPending && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onConfirm(a.id ?? "")}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Allow
            </button>
            <button
              onClick={() => onReject(a.id ?? "")}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Block
            </button>
          </div>
        )}
        {policy === "auto" && (
          <span className="text-xs text-green-700 font-medium flex-shrink-0">Auto-executed</span>
        )}
        {policy === "reject" && (
          <span className="text-xs text-red-700 font-medium flex-shrink-0">Blocked</span>
        )}
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
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
  const [showTelemetry, setShowTelemetry] = useState(false);

  const sendMessage = useCallback(
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

  const refreshStatus = useCallback(async () => {
    const response = await sendMessage("GET_PRIVACY_STATUS");
    if (response.success) {
      setPrivacyStatus(response.status);
    }
    const config = await sendMessage("GET_SERVER_CONFIG");
    if (config.success) {
      setServerConnected(config.config.enabled);
      setServerUrl(config.config.url);
    }
  }, [sendMessage]);

  const handleCapture = async () => {
    if (!userGoal.trim()) {
      setError("Please enter a goal");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const captureResponse = await sendMessage("CAPTURE_AND_SEND", { userGoal });
      if (!captureResponse.success) throw new Error(captureResponse.error);

      const payload = captureResponse.payload;
      setLastPayload(payload);

      const serverResponse = await sendMessage("SEND_TO_SERVER", {
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

    const executeResponse = await sendMessage("EXECUTE_ACTIONS", { actions: [action.action] });
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
    await sendMessage("CLEAR_SESSION");
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
      await sendMessage("UPDATE_SERVER_CONFIG", { config: { url, enabled: true } });
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

  return (
    <div className="w-96 min-h-[500px] bg-white font-system text-gray-900">
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m-6 11a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">PrivateSight</h1>
            <div className="text-xs text-gray-500">Privacy-preserving vision agent</div>
          </div>
        </div>
        <button
          onClick={handleClearSession}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
          title="Emergency: Disable agent and clear session"
        >
          Emergency Stop
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium">Agent Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={serverConnected}
              onChange={(e) => handleServerUrlChange(e.target.checked ? serverUrl : "")}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              disabled={loading}
            />
            <span className="text-sm font-medium">Server</span>
          </label>
        </div>

        {serverConnected && (
          <div className="flex gap-2">
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onBlur={(e) => handleServerUrlChange(e.target.value)}
              placeholder="Server URL"
              className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              disabled={loading}
            />
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Connected</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Backend" value={privacyStatus?.backend ?? "—"} />
          <MetricCard label="Redacted" value={redactedCount} />
          <MetricCard label="Payload" value={`${Math.round(payloadSize / 1024)}`} unit="KB" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Goal</label>
          <textarea
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="e.g., Find the submit button and prepare the form"
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleCapture}
          disabled={loading || !active || !userGoal.trim() || !serverConnected}
          className="w-full py-2 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing..." : "Analyze & Plan"}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {serverPlan && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Server Plan</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${
                serverPlan.requiresUserConfirmation ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}>
                {serverPlan.requiresUserConfirmation ? "Confirmation Required" : "Auto-executable"}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-3">{serverPlan.summary}</div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validatedActions.map((action, index) => (
                <ServerActionItem
                  key={action.action.id}
                  action={action}
                  index={index}
                  onConfirm={handleConfirmAction}
                  onReject={handleRejectAction}
                />
              ))}
            </div>
          </div>
        )}

        {lastPayload && lastPayload.redactionManifest && (
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">Redaction Manifest ({redactedCount})</summary>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {lastPayload.redactionManifest.map((entry, i) => {
                if (!entry.bounds) return null;
                return (
                  <div key={i} className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium text-teal-700">{entry.category}</span>{" "}
                    <span className="text-gray-500">@</span>
                    <span>({Math.round(entry.bounds.x)},{Math.round(entry.bounds.y)})</span>{" "}
                    <span className="text-gray-500">{Math.round((entry.confidence ?? 0) * 100)}%</span> →{" "}
                    <span className="text-red-600">{entry.replacement}</span>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        <details className="border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Telemetry {showTelemetry ? "▲" : "▼"}
          </summary>
          {showTelemetry && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {telemetry.slice().reverse().map((entry, i) => (
                <div key={i} className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded flex justify-between">
                  <span>{entry.metric}</span>
                  <span className="font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </details>

        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="text-xs text-teal-600 hover:text-teal-800"
        >
          {showTelemetry ? "Hide" : "Show"} Telemetry
        </button>
      </div>
    </div>
  );
};

if (typeof document !== "undefined") {
  const root = createRoot(document.getElementById("root")!);
  root.render(<Popup />);
}
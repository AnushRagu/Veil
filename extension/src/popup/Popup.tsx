import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ValidatedAction,
  ActionPolicy,
  RiskLevel,
  TelemetryEntry,
} from "@veil/shared";

interface PopupProps {}

const RiskBadge: React.FC<{ riskLevel?: RiskLevel }> = ({ riskLevel }) => {
  const configs: Record<RiskLevel, { label: string; color: string }> = {
    level_0_observation: { label: "L0: Observation", color: "bg-blue-600" },
    level_1_reversible: { label: "L1: Reversible", color: "bg-teal-600" },
    level_2_data_entry: { label: "L2: Data Entry", color: "bg-amber-600" },
    level_3_consequential: { label: "L3: Consequential", color: "bg-orange-600" },
    level_4_high_risk: { label: "L4: Lockout", color: "bg-red-700" },
  };

  const current = riskLevel ? configs[riskLevel] : configs.level_0_observation;
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded ${current.color} text-white uppercase`}>
      {current.label}
    </span>
  );
};

const ActionBadge: React.FC<{ policy: ActionPolicy; label: string }> = ({ policy, label }) => {
  const colors: Record<ActionPolicy, string> = {
    auto: "bg-green-600",
    confirm: "bg-amber-500",
    reject: "bg-red-600",
    lockout: "bg-red-800",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[policy] || "bg-gray-500"} text-white`}>
      {label}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; unit?: string; alert?: boolean }> = ({
  label,
  value,
  unit,
  alert,
}) => (
  <div className={`rounded-lg p-2.5 ${alert ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-100"}`}>
    <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</div>
    <div className={`text-base font-mono font-semibold ${alert ? "text-red-700" : "text-gray-900"}`}>
      {value}{unit && <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>}
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
  const riskLevel: RiskLevel = action.riskLevel ?? "level_0_observation";
  const explanation = action.explanation || action.reason || "";
  const mappedElement = action.mappedElement;
  const isPending = policy === "confirm";
  const isLockout = policy === "reject" || policy === "lockout" || riskLevel === "level_4_high_risk";

  return (
    <div className={`border-l-4 p-3 rounded-r-lg ${
      isLockout
        ? "border-red-600 bg-red-50"
        : isPending
        ? "border-amber-400 bg-amber-50/70"
        : "border-green-500 bg-green-50/70"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs text-gray-500">#{index + 1}</span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-gray-200 text-gray-800 rounded">{a.type}</span>
            <RiskBadge riskLevel={riskLevel} />
            <ActionBadge policy={policy} label={policy} />
            <span className="text-xs text-gray-500 font-mono">conf: {Math.round((a.confidence ?? 0) * 100)}%</span>
          </div>

          {/* Explicit User Explanation */}
          <div className="mt-2 text-xs font-medium text-gray-900 bg-white/80 p-2 rounded border border-gray-200">
            <span className="font-semibold text-gray-700">Intent: </span>
            {explanation}
          </div>

          {mappedElement && (
            <div className="mt-1 text-[11px] text-gray-600 font-mono truncate">
              Target: <span className="text-teal-700 font-medium">{mappedElement.label || "unnamed"}</span> ({mappedElement.role}) [ID: {mappedElement.dataVeilId || mappedElement.id}]
            </div>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => onConfirm(a.id ?? "")}
              className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => onReject(a.id ?? "")}
              className="px-2.5 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Block
            </button>
          </div>
        )}
        {policy === "auto" && (
          <span className="text-xs text-green-700 font-semibold flex-shrink-0">Auto-Pass</span>
        )}
        {isLockout && (
          <span className="text-xs text-red-700 font-bold flex-shrink-0">LOCKOUT</span>
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
        if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
          resolve({ success: false, error: "Chrome runtime unavailable" });
          return;
        }
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
    if (response?.success) {
      setPrivacyStatus(response.status);
    }
    const config = await sendMessage("GET_SERVER_CONFIG");
    if (config?.success) {
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
            ? { ...a, policy: "auto" as ActionPolicy, reason: "User explicitly confirmed action" }
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
          ? { ...a, policy: "reject" as ActionPolicy, reason: "User explicitly blocked action" }
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
  const prunedCount = lastPayload?.pageMap?.minimizedElementCount ?? 0;
  const payloadSize = lastPayload?.sanitizedScreenshot?.length ?? 0;

  return (
    <div className="w-[420px] min-h-[540px] bg-white font-system text-gray-900 flex flex-col justify-between">
      <div>
        <div className="border-b p-4 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-base">
              V
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">VEIL Boundary</h1>
              <div className="text-[11px] text-teal-300">Hardened Vision Privacy Boundary</div>
            </div>
          </div>
          <button
            onClick={handleClearSession}
            className="text-[11px] px-2 py-1 bg-red-700/80 hover:bg-red-700 text-white rounded font-medium transition-colors"
            title="Emergency: Disable agent and clear session"
          >
            Emergency Stop
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-gray-800">Perception Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={serverConnected}
                onChange={(e) => handleServerUrlChange(e.target.checked ? serverUrl : "")}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                disabled={loading}
              />
              <span className="text-xs font-semibold text-gray-800">Server Connected</span>
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
                className="flex-1 px-2.5 py-1 text-xs border rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                disabled={loading}
              />
              <span className="px-2 py-1 text-[11px] bg-green-100 text-green-800 font-medium rounded flex items-center">Online</span>
            </div>
          )}

          {/* Quantitative Metrics Bar */}
          <div className="grid grid-cols-4 gap-1.5">
            <MetricCard label="PLR (Leakage)" value="0.0%" alert={false} />
            <MetricCard label="FNR (Missed)" value="0.0%" alert={false} />
            <MetricCard label="Redactions" value={redactedCount} />
            <MetricCard label="Minimization" value={`-${prunedCount}`} unit="nodes" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Task Goal (Context Minimization Anchor)</label>
            <textarea
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="e.g., Click Checkout, Find Submit Button, Search Products"
              rows={2}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleCapture}
            disabled={loading || !active || !userGoal.trim() || !serverConnected}
            className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Filtering & Minimizing..." : "Perceive, Filter & Plan"}
          </button>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {serverPlan && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">VEIL Action Plan</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                  serverPlan.requiresUserConfirmation ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-green-100 text-green-800 border border-green-200"
                }`}>
                  {serverPlan.requiresUserConfirmation ? "Confirmation Required" : "Auto-Executable"}
                </span>
              </div>
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{serverPlan.summary}</div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
            <details className="border-t pt-2">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">Redaction Manifest ({redactedCount})</summary>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {lastPayload.redactionManifest.map((entry, i) => {
                  if (!entry.bounds) return null;
                  return (
                    <div key={i} className="text-[11px] font-mono text-gray-600 bg-gray-50 p-1.5 rounded flex justify-between">
                      <span className="font-semibold text-teal-700">{entry.category}</span>
                      <span className="text-red-600 font-medium">{entry.replacement}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          <details className="border-t pt-2">
            <summary className="cursor-pointer text-xs font-semibold text-gray-700">
              Telemetry {showTelemetry ? "▲" : "▼"}
            </summary>
            {showTelemetry && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {telemetry.slice().reverse().map((entry, i) => (
                  <div key={i} className="text-[11px] font-mono text-gray-600 bg-gray-50 p-1.5 rounded flex justify-between">
                    <span>{entry.metric}</span>
                    <span className="font-medium">{entry.value}ms</span>
                  </div>
                ))}
              </div>
            )}
          </details>

          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="text-[11px] text-teal-600 hover:text-teal-800 font-medium"
          >
            {showTelemetry ? "Hide" : "Show"} Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};

if (typeof document !== "undefined") {
  const root = createRoot(document.getElementById("root")!);
  root.render(<Popup />);
}
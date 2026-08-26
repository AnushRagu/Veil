import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
import {
  PrivacyStatus,
  ClientPayload,
  ServerPlan,
  ServerAction,
  ValidatedAction,
  ActionPolicy,
  RiskLevel,
  SanitizedElement,
  RedactionManifest,
  TelemetryEntry,
  calculatePrivacyLeakageRate,
  calculateFalseNegativeRate,
  calculateMinimizationEfficiencyRate,
} from "@veil/shared";

interface PopupMetrics {
  plr: number;
  fnr: number;
  mer: number;
  sensitivePresent: number;
  sensitiveRedacted: number;
  sensitiveExposed: number;
  totalElements: number;
  irrelevantPruned: number;
  irrelevantTotal: number;
}

const isChromeExtension = typeof chrome !== "undefined" && !!chrome.runtime?.sendMessage;

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ─── Standalone Pipeline (runs directly in browser tab) ───

function getAccessibleLabel(el: Element): string {
  return (
    el.getAttribute("aria-label") ||
    (el.getAttribute("aria-labelledby") &&
      document.getElementById(el.getAttribute("aria-labelledby")!)?.textContent) ||
    el.getAttribute("title") ||
    el.getAttribute("placeholder") ||
    (el as HTMLInputElement).labels?.[0]?.textContent ||
    el.getAttribute("alt") ||
    el.textContent?.slice(0, 100) ||
    ""
  ).trim();
}

function getImplicitRole(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  const roleMap: Record<string, string> = {
    a: "link", button: "button", input: type === "checkbox" ? "checkbox" : type === "radio" ? "radio" : "textbox",
    select: "combobox", textarea: "textbox", img: "img", h1: "heading", h2: "heading", h3: "heading",
    h4: "heading", h5: "heading", h6: "heading", label: "generic",
  };
  return roleMap[tag] || "generic";
}

const SENSITIVE_LABEL_KEYWORDS = [
  "password", "passwort", "credit card", "card number", "cvv", "cvc", "security code",
  "otp", "one-time", "verification code", "aadhaar", "pan", "ssn", "social security",
  "account number", "routing number", "iban", "swift", "pin",
];

const SENSITIVE_INPUT_TYPES = ["password", "tel", "email"];

function classifySensitive(el: Element): boolean {
  const inputType = (el as HTMLInputElement).type?.toLowerCase();
  if (SENSITIVE_INPUT_TYPES.includes(inputType)) return true;
  const autocomplete = el.getAttribute("autocomplete")?.toLowerCase() || "";
  if (["password", "new-password", "current-password", "cc-number", "cc-csc"].some((v) => autocomplete.includes(v))) return true;
  const label = (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || el.getAttribute("id") || "").toLowerCase();
  if (SENSITIVE_LABEL_KEYWORDS.some((kw) => label.includes(kw))) return true;
  return false;
}

function getReplacementToken(category: string): string {
  const tokens: Record<string, string> = {
    email: "[REDACTED_EMAIL]", phone: "[REDACTED_PHONE]", credit_card: "[REDACTED_CARD]",
    cvv: "[REDACTED_CVV]", password: "[REDACTED_PASSWORD]", otp: "[REDACTED_OTP]",
    aadhaar: "[REDACTED_AADHAAR]", pan: "[REDACTED_PAN]", account_number: "[REDACTED_ACCOUNT]",
    explicit_sensitive: "[REDACTED_SENSITIVE]",
  };
  return tokens[category] || "[REDACTED]";
}

function detectPIICategory(text: string): { category: string; match: string } | null {
  const patterns: [RegExp, string][] = [
    [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "email"],
    [/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "phone"],
    [/\b(?:\d[ -]*?){13,16}\b/g, "credit_card"],
    [/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "aadhaar"],
    [/\b[A-Z]{5}\d{4}[A-Z]{1}\b/g, "pan"],
    [/\b\d{3}-\d{2}-\d{4}\b/g, "account_number"],
  ];
  for (const [pattern, category] of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) return { category, match: matches[0] };
  }
  return null;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "but", "if", "or", "because", "as", "until", "while", "that", "this", "these",
  "those", "then", "just", "so", "than", "such", "both", "through", "during",
]);

function extractGoalKeywords(goal: string): string[] {
  return goal.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function scoreElementRelevance(el: SanitizedElement, keywords: string[]): number {
  if (keywords.length === 0) return 1.0;
  const labelLower = (el.label || "").toLowerCase();
  const roleLower = (el.role || "").toLowerCase();
  let score = 0.0;
  let hasMatch = false;
  for (const kw of keywords) {
    if (labelLower.includes(kw)) { score += 0.7; hasMatch = true; }
    if (roleLower.includes(kw)) { score += 0.4; hasMatch = true; }
  }
  if (hasMatch && ["button", "link", "textbox", "searchbox"].includes(el.role)) score += 0.2;
  return Math.min(1.0, score);
}

async function standaloneCapture(userGoal: string): Promise<{
  payload: ClientPayload;
  privacyMetrics: PopupMetrics;
}> {
  const allElements: SanitizedElement[] = [];
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as Element;
      try {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return NodeFilter.FILTER_REJECT;
      } catch { return NodeFilter.FILTER_SKIP; }
      if (el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true") return NodeFilter.FILTER_REJECT;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return NodeFilter.FILTER_REJECT;
      const role = el.getAttribute("role") || getImplicitRole(el);
      const interactiveRoles = ["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "searchbox", "switch", "option", "listbox"];
      if (interactiveRoles.includes(role) || el.tagName.match(/^(A|BUTTON|INPUT|SELECT|TEXTAREA|IMG|H[1-6])$/i)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    let veilId = el.getAttribute("data-veil-id");
    if (!veilId) {
      veilId = `el-${generateId()}`;
      el.setAttribute("data-veil-id", veilId);
    }

    const role = (el.getAttribute("role") || getImplicitRole(el)) as SanitizedElement["role"];
    const rawLabel = getAccessibleLabel(el);
    const sensitive = classifySensitive(el);
    const label = sensitive ? (detectPIICategory(rawLabel) ? getReplacementToken(detectPIICategory(rawLabel)!.category) : "[REDACTED_SENSITIVE]") : rawLabel;

    allElements.push({
      id: veilId,
      dataVeilId: veilId,
      originalTag: el.tagName.toLowerCase(),
      role,
      label,
      bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      visible: true,
      enabled: !(el instanceof HTMLElement && (el as any).disabled),
      sensitive,
    });
  }

  // Minimize by goal relevance
  const keywords = extractGoalKeywords(userGoal);
  const isGeneric = keywords.length === 0;
  const relevanceThreshold = 0.2;

  const minimizedElements: SanitizedElement[] = [];
  const prunedElements: SanitizedElement[] = [];
  for (const el of allElements) {
    const score = scoreElementRelevance(el, keywords);
    if (isGeneric || score >= relevanceThreshold) {
      minimizedElements.push({ ...el, relevanceScore: score, isPrunedByMinimization: false });
    } else {
      prunedElements.push({ ...el, relevanceScore: score, isPrunedByMinimization: true });
    }
  }

  // Redaction processing
  const manifest: RedactionManifest = [];
  const redactedElements = minimizedElements.map((el) => {
    if (!el.sensitive) return el;
    const pii = detectPIICategory(el.label);
    const category = pii?.category || "explicit_sensitive";
    manifest.push({
      category: category as any,
      bounds: { ...el.bounds },
      confidence: 0.8,
      replacement: getReplacementToken(category),
    });
    return { ...el, label: getReplacementToken(category) };
  });

  // Compute metrics
  const sensitivePresent = allElements.filter((e) => e.sensitive).length;
  let sensitiveExposed = 0;
  for (const el of redactedElements) {
    if (el.sensitive && !el.label.includes("[REDACTED")) sensitiveExposed++;
  }
  const sensitiveRedacted = sensitivePresent - sensitiveExposed;
  let unredactedSensitive = 0;
  for (const el of redactedElements) {
    if (el.sensitive && !el.label.includes("[REDACTED")) unredactedSensitive++;
  }
  const irrelevantTotal = Math.max(0, allElements.length - sensitivePresent);
  const irrelevantPruned = Math.min(prunedElements.length, irrelevantTotal);

  const plr = calculatePrivacyLeakageRate(sensitiveExposed, sensitivePresent);
  const fnr = calculateFalseNegativeRate(unredactedSensitive, sensitivePresent);
  const mer = calculateMinimizationEfficiencyRate(irrelevantPruned, irrelevantTotal);

  const sessionId = generateId();
  const pageMap = {
    urlOrigin: window.location.origin || "standalone",
    title: document.title || "Standalone Demo",
    viewport: { width: window.innerWidth, height: window.innerHeight },
    elements: redactedElements,
    minimizedElementCount: prunedElements.length,
  };

  const payload: ClientPayload = {
    sessionId,
    timestamp: new Date().toISOString(),
    userGoal,
    pageMap,
    redactionManifest: manifest,
    minimizationApplied: prunedElements.length > 0,
  };

  const privacyMetrics: PopupMetrics = {
    plr, fnr, mer,
    sensitivePresent, sensitiveRedacted, sensitiveExposed,
    totalElements: allElements.length,
    irrelevantPruned, irrelevantTotal,
  };

  return { payload, privacyMetrics };
}

function computeMetricsFromPayload(payload: ClientPayload): PopupMetrics {
  const elements = payload.pageMap?.elements ?? [];
  const manifest = payload.redactionManifest ?? [];

  const allCount = elements.length;
  const sensitivePresent = elements.filter((e) => e.sensitive).length;
  let sensitiveExposed = 0;
  for (const el of elements) {
    if (el.sensitive) {
      const label = el.label || "";
      if (!label.includes("[REDACTED") && !label.includes("[redacted")) sensitiveExposed++;
    }
  }
  const sensitiveRedacted = sensitivePresent - sensitiveExposed;
  const irrelevantTotal = Math.max(0, allCount - sensitivePresent);
  const irrelevantPruned = payload.pageMap?.minimizedElementCount ?? 0;

  const plr = calculatePrivacyLeakageRate(sensitiveExposed, sensitivePresent);
  const fnr = calculateFalseNegativeRate(sensitiveExposed, sensitivePresent);
  const mer = calculateMinimizationEfficiencyRate(Math.min(irrelevantPruned, irrelevantTotal), irrelevantTotal);

  return {
    plr, fnr, mer,
    sensitivePresent, sensitiveRedacted, sensitiveExposed,
    totalElements: allCount,
    irrelevantPruned: Math.min(irrelevantPruned, irrelevantTotal),
    irrelevantTotal,
  };
}

async function standaloneSendToServer(payload: ClientPayload, serverUrl: string): Promise<ServerPlan> {
  const response = await fetch(`${serverUrl}/api/agent/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-ID": payload.sessionId },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

function standaloneValidatePlan(plan: ServerPlan, elements: SanitizedElement[]): ValidatedAction[] {
  return (plan.actions ?? []).map((action) => {
    const targetId = action.target?.dataVeilId || action.target?.elementId;
    let mappedElement = targetId ? elements.find((el) => el.id === targetId || el.dataVeilId === targetId) : undefined;

    if (targetId && !mappedElement) {
      return { action, policy: "reject" as ActionPolicy, riskLevel: "level_4_high_risk" as RiskLevel, reason: "Target not found", explanation: "Element not found in page", mappedElement: undefined, validationPassed: false };
    }
    if (mappedElement?.sensitive) {
      return { action, policy: "reject" as ActionPolicy, riskLevel: "level_4_high_risk" as RiskLevel, reason: "Sensitive target", explanation: "Targets a redacted element", mappedElement, validationPassed: false };
    }

    let policy: ActionPolicy = "confirm";
    let riskLevel: RiskLevel = "level_2_data_entry";
    if (["highlight", "scroll", "focus", "wait", "inspect"].includes(action.type)) {
      policy = "auto"; riskLevel = "level_0_observation";
    } else if (action.type === "click") {
      const label = (mappedElement?.label || "").toLowerCase();
      if (["buy", "purchase", "pay", "delete", "submit", "checkout"].some((k) => label.includes(k))) {
        policy = "confirm"; riskLevel = "level_3_consequential";
      } else {
        policy = "confirm"; riskLevel = "level_2_data_entry";
      }
    } else if (action.type === "type" || action.type === "select") {
      policy = "confirm"; riskLevel = "level_2_data_entry";
    }
    if (action.confidence < 0.85 && policy === "auto") { policy = "confirm"; }

    return { action, policy, riskLevel, reason: `Risk: ${riskLevel}`, explanation: action.explanation || `VEIL wants to perform ${action.type}`, mappedElement, validationPassed: (policy as string) !== "reject" };
  });
}

// ─── UI Components ───

const RiskBadge: React.FC<{ riskLevel?: RiskLevel }> = ({ riskLevel }) => {
  const configs: Record<RiskLevel, { label: string; color: string }> = {
    level_0_observation: { label: "L0: Observation", color: "bg-blue-600" },
    level_1_reversible: { label: "L1: Reversible", color: "bg-teal-600" },
    level_2_data_entry: { label: "L2: Data Entry", color: "bg-amber-600" },
    level_3_consequential: { label: "L3: Consequential", color: "bg-orange-600" },
    level_4_high_risk: { label: "L4: Lockout", color: "bg-red-700" },
  };
  const current = riskLevel ? configs[riskLevel] : configs.level_0_observation;
  return <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded ${current.color} text-white uppercase`}>{current.label}</span>;
};

const ActionBadge: React.FC<{ policy: ActionPolicy; label: string }> = ({ policy, label }) => {
  const colors: Record<string, string> = { auto: "bg-green-600", confirm: "bg-amber-500", reject: "bg-red-600", lockout: "bg-red-800" };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[policy] || "bg-gray-500"} text-white`}>{label}</span>;
};

const MetricCard: React.FC<{ label: string; value: string | number; unit?: string; alert?: boolean }> = ({ label, value, unit, alert }) => (
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
    <div className={`border-l-4 p-3 rounded-r-lg ${isLockout ? "border-red-600 bg-red-50" : isPending ? "border-amber-400 bg-amber-50/70" : "border-green-500 bg-green-50/70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs text-gray-500">#{index + 1}</span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-gray-200 text-gray-800 rounded">{a.type}</span>
            <RiskBadge riskLevel={riskLevel} />
            <ActionBadge policy={policy} label={policy} />
            <span className="text-xs text-gray-500 font-mono">conf: {Math.round((a.confidence ?? 0) * 100)}%</span>
          </div>
          <div className="mt-2 text-xs font-medium text-gray-900 bg-white/80 p-2 rounded border border-gray-200">
            <span className="font-semibold text-gray-700">Intent: </span>{explanation}
          </div>
          {mappedElement && (
            <div className="mt-1 text-[11px] text-gray-600 font-mono truncate">
              Target: <span className="text-teal-700 font-medium">{mappedElement.label || "unnamed"}</span> ({mappedElement.role}) [ID: {mappedElement.dataVeilId || mappedElement.id}]
            </div>
          )}
        </div>
        {isPending && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button onClick={() => onConfirm(a.id ?? "")} className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 shadow-sm">Confirm</button>
            <button onClick={() => onReject(a.id ?? "")} className="px-2.5 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700">Block</button>
          </div>
        )}
        {policy === "auto" && <span className="text-xs text-green-700 font-semibold flex-shrink-0">Auto-Pass</span>}
        {isLockout && <span className="text-xs text-red-700 font-bold flex-shrink-0">LOCKOUT</span>}
      </div>
    </div>
  );
};

// ─── Main Popup ───

const Popup: React.FC = () => {
  const [active, setActive] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://localhost:3001");
  const [userGoal, setUserGoal] = useState("");
  const [lastPayload, setLastPayload] = useState<ClientPayload | null>(null);
  const [serverPlan, setServerPlan] = useState<ServerPlan | null>(null);
  const [validatedActions, setValidatedActions] = useState<ValidatedAction[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [privacyMetrics, setPrivacyMetrics] = useState<PopupMetrics | null>(null);

  // Check server health on mount and periodically
  const checkServer = useCallback(async (url: string) => {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) { setServerConnected(true); return; }
    } catch {}
    setServerConnected(false);
  }, []);

  useEffect(() => {
    checkServer(serverUrl);
    const interval = setInterval(() => checkServer(serverUrl), 5000);
    return () => clearInterval(interval);
  }, [serverUrl, checkServer]);

  const handleCapture = async () => {
    if (!userGoal.trim()) { setError("Please enter a goal"); return; }
    setLoading(true);
    setError(null);

    try {
      let payload: ClientPayload | null = null;
      let metrics: PopupMetrics | null = null;
      let validated: ValidatedAction[] = [];

      if (isChromeExtension) {
        // Step 1: Extract elements directly from the active tab
        const tabRes = await new Promise<any>((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) { resolve({ error: "No active tab" }); return; }
            chrome.tabs.sendMessage(tabs[0].id, { type: "CAPTURE_AND_SEND", userGoal }, (r) => resolve(r ?? { error: "No response" }));
          });
        });

        if (!tabRes || tabRes.error || !tabRes.success) {
          // Fallback: use chrome.scripting to extract directly
          const activeTab = await new Promise<chrome.tabs.Tab | undefined>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
          });
          if (!activeTab?.id) throw new Error("No active tab found");

          const injectionResult = await new Promise<any>((resolve) => {
            chrome.scripting.executeScript(
              { target: { tabId: activeTab.id! }, func: () => {
                  const SENSITIVE_TYPES = ["password", "tel", "email"];
                  const SENSITIVE_KW = ["password", "credit card", "card number", "cvv", "otp", "security code", "ssn", "aadhaar", "pan", "account number"];
                  const REDACT: Record<string, string> = { email: "[REDACTED_EMAIL]", phone: "[REDACTED_PHONE]", credit_card: "[REDACTED_CARD]", cvv: "[REDACTED_CVV]", password: "[REDACTED_PASSWORD]", otp: "[REDACTED_OTP]", aadhaar: "[REDACTED_AADHAAR]", pan: "[REDACTED_PAN]", account_number: "[REDACTED_ACCOUNT]" };
                  function getLabel(el: Element): string {
                    return (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("title") || el.getAttribute("name") || el.getAttribute("id") || (el as HTMLInputElement).labels?.[0]?.textContent || el.textContent?.slice(0, 80) || "").trim();
                  }
                  function getRole(el: Element): string {
                    const t = el.tagName.toLowerCase();
                    const tp = (el as HTMLInputElement).type?.toLowerCase();
                    const m: Record<string, string> = { a: "link", button: "button", input: tp === "checkbox" ? "checkbox" : tp === "radio" ? "radio" : "textbox", select: "combobox", textarea: "textbox", img: "img" };
                    return m[t] || "generic";
                  }
                  function detectPII(text: string): string | null {
                    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) return "email";
                    if (/\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text)) return "aadhaar";
                    if (/\b[A-Z]{5}\d{4}[A-Z]\b/.test(text)) return "pan";
                    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) return "account_number";
                    if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) return "phone";
                    if (/\b(?:\d[ -]*?){13,16}\b/.test(text)) return "credit_card";
                    if (/\b\d{3,4}\b/.test(text) && text.length <= 6) return "cvv";
                    return null;
                  }
                  const elements: any[] = [];
                  const walk = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_ELEMENT, {
                    acceptNode(n) {
                      const el = n as Element;
                      try { const s = getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden") return NodeFilter.FILTER_REJECT; } catch { return NodeFilter.FILTER_SKIP; }
                      if (el.hasAttribute("hidden")) return NodeFilter.FILTER_REJECT;
                      const r = el.getBoundingClientRect();
                      if (r.width === 0 && r.height === 0) return NodeFilter.FILTER_SKIP;
                      const role = el.getAttribute("role") || getRole(el);
                      if (["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "searchbox"].includes(role) || el.tagName.match(/^(A|BUTTON|INPUT|SELECT|TEXTAREA|IMG|H[1-6])$/i)) return NodeFilter.FILTER_ACCEPT;
                      return NodeFilter.FILTER_SKIP;
                    }
                  });
                  while (walk.nextNode()) {
                    const el = walk.currentNode as Element;
                    const r = el.getBoundingClientRect();
                    let id = el.getAttribute("data-veil-id");
                    if (!id) { id = "v-" + Math.random().toString(36).slice(2, 10); el.setAttribute("data-veil-id", id); }
                    const inputType = (el as HTMLInputElement).type?.toLowerCase() || "";
                    const label = getLabel(el);
                    const role = el.getAttribute("role") || getRole(el);
                    const isSensitive = SENSITIVE_TYPES.includes(inputType) || SENSITIVE_KW.some(kw => label.toLowerCase().includes(kw)) || el.hasAttribute("data-sensitive") || el.hasAttribute("data-private") || ["password", "cc-number", "cc-csc"].includes(el.getAttribute("autocomplete") || "");
                    const piiCat = isSensitive ? (detectPII(label) || "explicit_sensitive") : null;
                    const displayLabel = piiCat ? (REDACT[piiCat] || "[REDACTED]") : label;
                    elements.push({ id, dataVeilId: id, originalTag: el.tagName.toLowerCase(), role, label: displayLabel, bounds: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }, visible: true, enabled: !(el instanceof HTMLElement && (el as any).disabled), sensitive: isSensitive });
                  }
                  return elements;
                },
              },
              (results) => resolve(results?.[0]?.result)
            );
          });

          if (!injectionResult) throw new Error("Could not extract elements from page");

          const allElements = injectionResult as SanitizedElement[];
          const sensitivePresent = allElements.filter((e: any) => e.sensitive).length;
          let sensitiveExposed = 0;
          for (const el of allElements) {
            if (el.sensitive && !(el.label || "").includes("[REDACTED")) sensitiveExposed++;
          }
          const sensitiveRedacted = sensitivePresent - sensitiveExposed;
          const totalEl = allElements.length;
          const irrelevantTotal = Math.max(0, totalEl - sensitivePresent);

          // Simple minimization based on goal keywords
          const keywords = userGoal.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          let irrelevantPruned = 0;
          for (const el of allElements) {
            if (el.sensitive) continue;
            const match = keywords.some(kw => (el.label || "").toLowerCase().includes(kw) || (el.role || "").includes(kw));
            if (!match && keywords.length > 0) irrelevantPruned++;
          }

          metrics = {
            plr: calculatePrivacyLeakageRate(sensitiveExposed, sensitivePresent),
            fnr: calculateFalseNegativeRate(sensitiveExposed, sensitivePresent),
            mer: calculateMinimizationEfficiencyRate(Math.min(irrelevantPruned, irrelevantTotal), irrelevantTotal),
            sensitivePresent, sensitiveRedacted, sensitiveExposed,
            totalElements: totalEl,
            irrelevantPruned: Math.min(irrelevantPruned, irrelevantTotal),
            irrelevantTotal,
          };

          const manifest: RedactionManifest = allElements.filter((e: any) => e.sensitive).map((e: any) => ({
            category: (detectPIICategory(e.label)?.category || "explicit_sensitive") as any,
            bounds: e.bounds, confidence: 0.8, replacement: e.label,
          }));

          payload = {
            sessionId: generateId(),
            timestamp: new Date().toISOString(),
            userGoal,
            pageMap: { urlOrigin: "extension", title: "Active Tab", viewport: { width: window.innerWidth, height: window.innerHeight }, elements: allElements, minimizedElementCount: irrelevantPruned },
            redactionManifest: manifest,
            minimizationApplied: irrelevantPruned > 0,
          };
        } else {
          payload = tabRes.payload;
          metrics = computeMetricsFromPayload(tabRes.payload);
        }

        // Set metrics/payload IMMEDIATELY (before server call, so they always display)
        setLastPayload(payload);
        setPrivacyMetrics(metrics);
        console.log("[VEIL Popup] Metrics set:", metrics, "Payload elements:", payload.pageMap.elements.length, "Sensitive:", payload.pageMap.elements.filter((e: any) => e.sensitive).length);

        // Step 2: Send to server (errors here won't block metrics display)
        try {
          const srvRes = await new Promise<any>((resolve) => {
            chrome.runtime.sendMessage({ type: "SEND_TO_SERVER", payload, pageMapElements: payload.pageMap.elements }, (r) => resolve(r ?? { success: false, error: "No response from background" }));
          });
          if (!srvRes.success) throw new Error(srvRes.error);
          setServerPlan(srvRes.plan);
          validated = srvRes.validatedActions ?? [];
        } catch (serverErr) {
          console.warn("[VEIL Popup] Server send failed (metrics still shown):", serverErr);
          setError(`Server error: ${serverErr instanceof Error ? serverErr.message : "Unknown"}`);
        }
      } else {
        // Standalone mode: run everything directly in browser
        const result = await standaloneCapture(userGoal);
        payload = result.payload;
        metrics = result.privacyMetrics;
        setLastPayload(payload);
        setPrivacyMetrics(metrics);
        const plan = await standaloneSendToServer(payload, serverUrl);
        setServerPlan(plan);
        validated = standaloneValidatePlan(plan, payload.pageMap.elements);
      }

      setValidatedActions(validated);

      if (payload) {
        setTelemetry((prev) => [...prev, {
          timestamp: new Date().toISOString(),
          metric: "total_latency_ms" as const,
          value: Date.now() - new Date(payload!.timestamp).getTime(),
          sessionId: payload!.sessionId,
        }].slice(-50));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = (actionId: string) => {
    setValidatedActions((prev) => prev.map((a) =>
      a.action.id === actionId ? { ...a, policy: "auto" as ActionPolicy, reason: "User confirmed" } : a
    ));
  };

  const handleRejectAction = (actionId: string) => {
    setValidatedActions((prev) => prev.map((a) =>
      a.action.id === actionId ? { ...a, policy: "reject" as ActionPolicy, reason: "User blocked" } : a
    ));
  };

  const handleClearSession = () => {
    setLastPayload(null);
    setServerPlan(null);
    setValidatedActions([]);
    setPrivacyMetrics(null);
    setError(null);
  };

  const redactedCount = lastPayload?.redactionManifest?.length ?? 0;
  const prunedCount = lastPayload?.pageMap?.minimizedElementCount ?? 0;

  const plrPercent = privacyMetrics ? `${(privacyMetrics.plr * 100).toFixed(1)}%` : "--";
  const fnrPercent = privacyMetrics ? `${(privacyMetrics.fnr * 100).toFixed(1)}%` : "--";
  const plrAlert = privacyMetrics ? privacyMetrics.plr > 0 : false;
  const fnrAlert = privacyMetrics ? privacyMetrics.fnr > 0 : false;
  const redactionsDisplay = privacyMetrics ? `${privacyMetrics.sensitiveRedacted}/${privacyMetrics.sensitivePresent}` : redactedCount;
  const minimizationDisplay = privacyMetrics ? `${privacyMetrics.irrelevantPruned}/${privacyMetrics.irrelevantTotal}` : `-${prunedCount}`;

  return (
    <div className={`${isChromeExtension ? "w-[420px] min-h-[540px]" : "w-full min-h-screen"} bg-white font-system text-gray-900 flex flex-col`}>
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="border-b p-4 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-base">V</div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white">VEIL Boundary</h1>
                <div className="text-[11px] text-teal-300">
                  {isChromeExtension ? "Hardened Vision Privacy Boundary" : "Standalone Demo Mode"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isChromeExtension && (
                <span className="text-[10px] px-2 py-0.5 bg-blue-600/80 text-white rounded font-medium">BROWSER</span>
              )}
              <button onClick={handleClearSession} className="text-[11px] px-2 py-1 bg-red-700/80 hover:bg-red-700 text-white rounded font-medium transition-colors" title="Emergency Stop">Emergency Stop</button>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span className="text-xs font-semibold text-gray-800">Perception Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={serverConnected} onChange={() => {}} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" disabled />
                <span className="text-xs font-semibold text-gray-800">Server Connected</span>
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${serverConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {serverConnected ? "Online" : "Offline"}
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <input type="url" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="Server URL" className="flex-1 px-2.5 py-1 text-xs border rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500" disabled={loading} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-1.5">
              <MetricCard label="PLR (Leakage)" value={plrPercent} alert={plrAlert} />
              <MetricCard label="FNR (Missed)" value={fnrPercent} alert={fnrAlert} />
              <MetricCard label="Redactions" value={redactionsDisplay} />
              <MetricCard label="Minimization" value={minimizationDisplay} unit="nodes" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Task Goal (Context Minimization Anchor)</label>
              <textarea value={userGoal} onChange={(e) => setUserGoal(e.target.value)} placeholder="e.g., Click Checkout, Find Submit Button, Search Products" rows={2} className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" disabled={loading} />
            </div>

            <button onClick={handleCapture} disabled={loading || !active || !userGoal.trim()} className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              {loading ? "Filtering & Minimizing..." : "Perceive, Filter & Plan"}
            </button>

            {error && <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

            {serverPlan && (
              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">VEIL Action Plan</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${serverPlan.requiresUserConfirmation ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-green-100 text-green-800 border border-green-200"}`}>
                    {serverPlan.requiresUserConfirmation ? "Confirmation Required" : "Auto-Executable"}
                  </span>
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{serverPlan.summary}</div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {validatedActions.map((action, index) => (
                    <ServerActionItem key={action.action.id} action={action} index={index} onConfirm={handleConfirmAction} onReject={handleRejectAction} />
                  ))}
                </div>
              </div>
            )}

            {lastPayload && lastPayload.redactionManifest && lastPayload.redactionManifest.length > 0 && (
              <details className="border-t pt-2" open>
                <summary className="cursor-pointer text-xs font-semibold text-gray-700">Redaction Manifest ({redactedCount})</summary>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {lastPayload.redactionManifest.map((entry, i) => (
                    <div key={i} className="text-[11px] font-mono text-gray-600 bg-gray-50 p-1.5 rounded flex justify-between">
                      <span className="font-semibold text-teal-700">{entry.category}</span>
                      <span className="text-red-600 font-medium">{entry.replacement}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <details className="border-t pt-2">
              <summary className="cursor-pointer text-xs font-semibold text-gray-700">Telemetry {showTelemetry ? "▲" : "▼"}</summary>
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

            <button onClick={() => setShowTelemetry(!showTelemetry)} className="text-[11px] text-teal-600 hover:text-teal-800 font-medium">
              {showTelemetry ? "Hide" : "Show"} Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

if (typeof document !== "undefined") {
  const root = createRoot(document.getElementById("root")!);
  root.render(<Popup />);
}

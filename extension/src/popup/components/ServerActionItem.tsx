import React from "react";
import { ValidatedAction, ActionPolicy, AgentStep } from "@privatesight/shared";
import { CrosshairIcon, CheckIcon } from "../icons";
import { StatusPill } from "./StatusPill";

interface ServerActionItemProps {
  action: ValidatedAction;
  index: number;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isExecuting?: boolean;
  stepNumber?: number;
  step?: AgentStep;
}

export const ServerActionItem: React.FC<ServerActionItemProps> = ({
  action,
  index,
  onConfirm,
  onReject,
  isExecuting,
  stepNumber,
  step,
}) => {
  const a = action.action;
  const policy: ActionPolicy = action.policy ?? "confirm";
  const reason = action.reason ?? "";
  const mappedElement = action.mappedElement;
  const isPending = policy === "confirm" && !step;

  const policyMeta: Record<ActionPolicy, { label: string; tone: "ok" | "warn" | "danger" | "off" }> = {
    auto: { label: "Auto", tone: "ok" },
    confirm: { label: "Confirm", tone: "warn" },
    reject: { label: "Blocked", tone: "danger" },
  };

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

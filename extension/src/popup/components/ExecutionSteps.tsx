import React from "react";
import { AgentStep, ServerPlan } from "@privatesight/shared";
import { StatusPill } from "./StatusPill";

interface ExecutionStepsProps {
  steps: AgentStep[];
  planActions: ServerPlan["actions"];
  currentStep: number;
}

export const ExecutionSteps: React.FC<ExecutionStepsProps> = ({ steps, planActions, currentStep }) => {
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

import React from "react";
import { ServerPlan, ValidatedAction } from "@privatesight/shared";
import { AlertIcon, CheckIcon } from "../icons";

interface HighRiskConfirmationCardProps {
  plan: ServerPlan;
  pendingAction?: ValidatedAction;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export const HighRiskConfirmationCard: React.FC<HighRiskConfirmationCardProps> = ({
  plan,
  pendingAction,
  onConfirm,
  onCancel,
  isExecuting,
}) => {
  const action = pendingAction?.action;
  const mappedElement = pendingAction?.mappedElement;
  const targetDesc = mappedElement?.label || action?.target?.label || action?.target?.elementId || "Target Element";
  const actionType = action?.type ? action.type.toUpperCase() : "ACTION";

  return (
    <div className="confirmation-card">
      <div className="confirmation-card__header">
        <div className="confirmation-card__badge">
          <AlertIcon size={13} strokeWidth={2.4} />
          <span>Confirmation Required</span>
        </div>
        <span className="confirmation-card__title">⚠️ Action requires approval</span>
      </div>

      <div className="confirmation-card__body">
        <div className="confirmation-card__intent">
          <strong>Veil wants to:</strong>
          <div className="confirmation-card__action-text">
            {actionType} &ldquo;{targetDesc}&rdquo;
          </div>
        </div>

        <p className="confirmation-card__warning">
          Please review this action before proceeding.
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
          className="btn btn--primary btn--md"
          style={{
            flex: 1.5,
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

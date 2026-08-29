import React from "react";
import { AgentState, GoalClassification } from "@privatesight/shared";
import {
  PauseIcon, SearchIcon, MessageSquareIcon, SparkleIcon,
  CrosshairIcon, AlertIcon, PlayIcon, RefreshCwIcon, CheckIcon, StopIcon, SettingsIcon
} from "../icons";
import { StatusPill } from "./StatusPill";

const agentStateMeta: Record<
  AgentState,
  { label: string; tone: "ok" | "warn" | "danger" | "off"; icon: React.ReactNode }
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

interface AgentStateIndicatorProps {
  status: AgentState;
  classification?: GoalClassification;
  currentStep?: number;
  totalSteps?: number;
}

export const AgentStateIndicator: React.FC<AgentStateIndicatorProps> = ({ status, classification, currentStep, totalSteps }) => {
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

const ACTION_POLICY = {
    highlight: "auto",
    scroll: "auto",
    focus: "auto",
    wait: "auto",
    click: "confirm",
    type: "confirm",
};
const HIGH_CONFIDENCE_AUTO_ACTIONS = ["highlight", "scroll", "focus", "wait"];
const CONFIRMATION_REQUIRED_ACTIONS = ["click", "type"];
function isHighConfidenceAuto(type) {
    return HIGH_CONFIDENCE_AUTO_ACTIONS.includes(type);
}
function isConfirmationRequired(type) {
    return CONFIRMATION_REQUIRED_ACTIONS.includes(type);
}
function getBasePolicy(type) {
    return ACTION_POLICY[type] ?? "confirm";
}
function isSameOrigin(url1, url2) {
    try {
        return new URL(url1).origin === new URL(url2).origin;
    }
    catch {
        return false;
    }
}
function getPageOrigin(pageOrigin) {
    if (pageOrigin)
        return pageOrigin;
    if (typeof window !== "undefined")
        return window.location.origin;
    if (typeof self !== "undefined")
        return self.location.origin;
    return "http://localhost";
}
import { findMatchingPageElement } from "../planner/actionValidator";
export function validateAction(action, pageMapElements, pageOrigin) {
    const basePolicy = getBasePolicy(action.type);
    let policy = basePolicy;
    let reason = "";
    let mappedElement = undefined;
    if (action.target) {
        mappedElement = findMatchingPageElement(action.target, pageMapElements);
        if (!mappedElement && action.type !== "scroll" && action.type !== "wait") {
            return { action, policy: "reject", reason: "Target element not found in current page map", mappedElement: undefined };
        }
        if (mappedElement) {
            if (mappedElement.sensitive) {
                return { action, policy: "reject", reason: "Action targets a sensitive/redacted element", mappedElement };
            }
            if (!mappedElement.visible || !mappedElement.enabled) {
                return { action, policy: "reject", reason: "Target element is not visible or enabled", mappedElement };
            }
        }
    }
    else if (action.type !== "scroll" && action.type !== "wait") {
        return { action, policy: "reject", reason: "Action missing valid target", mappedElement: undefined };
    }
    if (action.risk === "high") {
        policy = "confirm";
        reason = "High-risk action requires explicit user confirmation";
    }
    if (action.type === "click" && mappedElement) {
        const destructiveRoles = ["button", "link"];
        const destructiveLabels = ["delete", "remove", "purchase", "buy", "pay", "transfer", "erase", "close account", "destroy", "wipe"];
        if (destructiveRoles.includes(mappedElement.role) && destructiveLabels.some((l) => mappedElement.label.toLowerCase().includes(l))) {
            policy = "confirm";
            reason = "Potentially destructive action requires confirmation";
        }
    }
    const confidence = action.confidence ?? 0;
    if (confidence < 0.85 && policy !== "reject") {
        policy = "confirm";
        reason = `Low confidence (${Math.round(confidence * 100)}%) requires confirmation`;
    }
    if (action.type === "click" && mappedElement?.role === "link") {
        const href = mappedElement.href;
        const origin = getPageOrigin(pageOrigin);
        if (href && !isSameOrigin(href, origin)) {
            policy = "confirm";
            reason = "Cross-origin navigation requires confirmation";
        }
    }
    return { action, policy, reason, mappedElement };
}
export { ACTION_POLICY, HIGH_CONFIDENCE_AUTO_ACTIONS, CONFIRMATION_REQUIRED_ACTIONS };

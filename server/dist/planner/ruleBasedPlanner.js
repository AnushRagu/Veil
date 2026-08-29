import { classifyGoal } from "@privatesight/shared";
function findElementsByRole(pageMap, roles) {
    return pageMap.elements.filter((el) => roles.includes(el.role) && el.visible && el.enabled && !el.sensitive);
}
function extractKeywords(target) {
    // Split target into individual words, filtering out common stop words
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "for", "to", "in", "on", "at", "with", "by", "of", "my", "your", "our", "their", "form", "field", "input", "box"]);
    return target
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
}
function findElementByLabelOrRole(pageMap, keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const roleKeywords = new Set(["button", "link", "input", "textbox", "checkbox", "radio", "select", "combobox", "menuitem", "tab", "heading", "img", "searchbox", "slider", "spinbutton", "switch"]);
    const nonRoleKeywords = lowerKeywords.filter(kw => !roleKeywords.has(kw));
    // Score each element based on match quality
    const scoredElements = pageMap.elements
        .filter(el => el.visible && el.enabled && !el.sensitive)
        .map(el => {
        let score = 0;
        let hasNonRoleMatch = false;
        const labelLower = el.label.toLowerCase();
        const textLower = el.textContent?.toLowerCase() || "";
        const placeholderLower = el.placeholder?.toLowerCase() || "";
        const nameLower = el.name?.toLowerCase() || "";
        const idLower = el.elementId?.toLowerCase() || "";
        const ariaLower = el.ariaLabel?.toLowerCase() || "";
        const typeLower = el.inputType?.toLowerCase() || "";
        const selectorLower = el.selector?.toLowerCase() || "";
        for (const kw of lowerKeywords) {
            const isRoleKeyword = roleKeywords.has(kw);
            let kwMatched = false;
            if (labelLower === kw) {
                score += 100;
                kwMatched = true;
            }
            else if (labelLower.includes(kw)) {
                score += 50;
                kwMatched = true;
            }
            if (textLower.includes(kw)) {
                score += 30;
                kwMatched = true;
            }
            if (placeholderLower.includes(kw)) {
                score += 40;
                kwMatched = true;
            }
            if (nameLower.includes(kw)) {
                score += 45;
                kwMatched = true;
            }
            if (idLower.includes(kw)) {
                score += 45;
                kwMatched = true;
            }
            if (ariaLower.includes(kw)) {
                score += 45;
                kwMatched = true;
            }
            if (typeLower.includes(kw)) {
                score += 20;
                kwMatched = true;
            }
            if (selectorLower.includes(kw)) {
                score += 10;
                kwMatched = true;
            }
            if (isRoleKeyword && el.role.toLowerCase().includes(kw)) {
                score += 15;
                kwMatched = true;
            }
            if (!isRoleKeyword && kwMatched) {
                hasNonRoleMatch = true;
            }
            // Boost for non-role keywords matching label
            if (!isRoleKeyword && labelLower.includes(kw)) {
                score += 20;
            }
        }
        // Additional boost for search keywords matching searchbox role
        if (nonRoleKeywords.some(kw => ["search", "find", "query", "filter"].includes(kw)) && el.role === "searchbox") {
            score += 25;
        }
        // Require at least one non-role keyword match in label/attributes
        // unless there are no non-role keywords at all
        if (nonRoleKeywords.length > 0 && !hasNonRoleMatch) {
            score = 0;
        }
        return { element: el, score };
    })
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);
    return scoredElements[0]?.element;
}
function findElementByRoleAndLabel(pageMap, roles, keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    return pageMap.elements.find((el) => roles.includes(el.role) &&
        el.visible &&
        el.enabled &&
        !el.sensitive &&
        lowerKeywords.some((kw) => el.label.toLowerCase().includes(kw)));
}
function findSubmitLikeElement(pageMap) {
    // First try to find by name/id/autocomplete
    const byNameOrId = findElementByNameOrId(pageMap, ["submit", "send", "confirm", "apply", "save", "next", "continue"]);
    if (byNameOrId)
        return byNameOrId;
    // Then by label
    const byLabel = findElementByLabelOrRole(pageMap, ["submit", "send", "confirm", "apply", "save", "next", "continue"]);
    if (byLabel)
        return byLabel;
    // Fallback to button role with submit-like label
    return findElementsByRole(pageMap, ["button"]).find((el) => el.label.toLowerCase().includes("submit") || el.label.toLowerCase().includes("send"));
}
function findSearchElement(pageMap) {
    // First try by name/id/autocomplete
    const byNameOrId = findElementByNameOrId(pageMap, ["search", "find", "query", "filter"]);
    if (byNameOrId)
        return byNameOrId;
    // Then by label
    const byLabel = findElementByLabelOrRole(pageMap, ["search", "find", "query", "filter"]);
    if (byLabel)
        return byLabel;
    // Fallback to searchbox role
    return findElementsByRole(pageMap, ["searchbox", "textbox"]).find((el) => el.label.toLowerCase().includes("search"));
}
function findFormFields(pageMap) {
    return findElementsByRole(pageMap, ["textbox", "combobox", "checkbox", "radio", "slider", "spinbutton"]);
}
function findElementByNameOrId(pageMap, keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    return pageMap.elements.find((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.name && lowerKeywords.some(kw => el.name.toLowerCase().includes(kw))) ||
        (el.elementId && lowerKeywords.some(kw => el.elementId.toLowerCase().includes(kw))) ||
        (el.autocomplete && lowerKeywords.some(kw => el.autocomplete.toLowerCase().includes(kw))));
}
function findClickableElements(pageMap) {
    return findElementsByRole(pageMap, ["button", "link", "menuitem", "tab"]);
}
function createAction(type, target, reason, confidence, extra) {
    if (!target)
        return null;
    const elementId = "id" in target && target.id ? target.id : target.elementId;
    const selector = "selector" in target ? target.selector : undefined;
    const label = "label" in target ? target.label : undefined;
    const text = "textContent" in target ? target.textContent || target.label : label;
    const bounds = "bounds" in target ? target.bounds : undefined;
    return {
        id: crypto.randomUUID(),
        type,
        target: {
            elementId,
            selector,
            label,
            text,
            bounds,
        },
        reason,
        confidence,
        ...extra,
    };
}
function planForInformational(classification, pageMap) {
    const interactiveCount = findClickableElements(pageMap).length;
    const formFieldCount = findFormFields(pageMap).filter((f) => !f.sensitive).length;
    const hasSearch = !!findSearchElement(pageMap);
    const hasSubmit = !!findSubmitLikeElement(pageMap);
    const capabilities = [];
    if (interactiveCount > 0)
        capabilities.push(`interact with ${interactiveCount} button(s)/link(s)`);
    if (formFieldCount > 0)
        capabilities.push(`fill ${formFieldCount} form field(s)`);
    if (hasSearch)
        capabilities.push("search");
    if (hasSubmit)
        capabilities.push("submit forms");
    capabilities.push("highlight elements", "scroll", "summarize safe page information");
    let summary = `Veil is ready to assist on this page.\nAvailable safe actions: ${capabilities.join(", ")}.`;
    summary += "\nTell me what you'd like to do (e.g. 'highlight the submit button', 'fill full name as John', 'search for electronics').";
    return {
        actions: [],
        summary,
        confidence: 0.95,
    };
}
function planForAmbiguous(classification, _pageMap) {
    return {
        actions: [],
        summary: classification.clarificationQuestion || "Please clarify what you'd like me to do on this page.",
        confidence: 0.3,
    };
}
function planForUnsupported(classification, _pageMap) {
    return {
        actions: [],
        summary: classification.clarificationQuestion || "I cannot perform that request. Please request a safe browser action such as finding, filling, clicking, or scrolling.",
        confidence: 0.2,
    };
}
function planForFindOrHighlight(classification, pageMap) {
    const intent = classification.extractedIntent;
    const actions = [];
    const targetName = intent?.target || "element";
    const keywords = extractKeywords(targetName);
    // If user says "find my email" or "find password", search all elements (including sensitive ones to highlight location)
    let target = findElementByLabelOrRole(pageMap, keywords);
    if (!target) {
        target = pageMap.elements.find((el) => {
            const label = (el.label || "").toLowerCase();
            const text = (el.textContent || "").toLowerCase();
            const aria = (el.ariaLabel || "").toLowerCase();
            const name = (el.name || "").toLowerCase();
            const id = (el.elementId || "").toLowerCase();
            const full = `${label} ${text} ${aria} ${name} ${id}`;
            return keywords.some((kw) => full.includes(kw));
        });
    }
    if (target) {
        const action = createAction("highlight", target, `Highlight ${targetName}`, 0.95, { risk: "low" });
        if (action)
            actions.push(action);
        return {
            actions,
            summary: `Found and highlighted "${targetName}".`,
            confidence: 0.95,
        };
    }
    return {
        actions: [],
        summary: `Could not find element matching "${targetName}" on the page.`,
        confidence: 0.4,
    };
}
function planForClick(classification, pageMap) {
    const intent = classification.extractedIntent;
    const targetName = intent?.target || "";
    const keywords = extractKeywords(targetName);
    let target = findElementByLabelOrRole(pageMap, keywords);
    if (!target) {
        target = findElementsByRole(pageMap, ["button", "link"]).find((el) => {
            const label = el.label.toLowerCase();
            return keywords.some((kw) => label.includes(kw));
        });
    }
    if (target && !target.sensitive) {
        const action = createAction("click", target, `Click ${targetName}`, 0.9, { risk: "low" });
        return {
            actions: action ? [action] : [],
            summary: `Will click "${target.label}".`,
            confidence: 0.9,
            requiresConfirmation: false,
        };
    }
    return {
        actions: [],
        summary: `Could not find safe clickable element matching "${targetName}".`,
        confidence: 0.3,
        requiresConfirmation: false,
    };
}
function planForFill(classification, pageMap) {
    const intent = classification.extractedIntent;
    const targetName = intent?.target || "";
    const valueToFill = intent?.value || "";
    const keywords = extractKeywords(targetName);
    let target = findElementByNameOrId(pageMap, keywords) || findElementByLabelOrRole(pageMap, keywords);
    if (target) {
        if (target.sensitive) {
            return {
                actions: [],
                summary: `Field "${targetName}" is identified as sensitive and cannot be automatically populated from server.`,
                confidence: 0.7,
                requiresConfirmation: true,
            };
        }
        const typeAction = createAction("type", target, `Fill ${target.label} with "${valueToFill}"`, 0.9, {
            value: valueToFill,
            risk: "low",
        });
        return {
            actions: typeAction ? [typeAction] : [],
            summary: `Will fill "${target.label}" with "${valueToFill}".`,
            confidence: 0.9,
            requiresConfirmation: false,
        };
    }
    return {
        actions: [],
        summary: `Could not find input field matching "${targetName}".`,
        confidence: 0.3,
        requiresConfirmation: false,
    };
}
function planForSearch(classification, pageMap) {
    const intent = classification.extractedIntent;
    const query = intent?.value || intent?.target || "";
    const searchTarget = findSearchElement(pageMap);
    if (searchTarget && !searchTarget.sensitive) {
        const typeAction = createAction("type", searchTarget, `Search for "${query}"`, 0.9, {
            value: query,
            risk: "low",
        });
        return {
            actions: typeAction ? [typeAction] : [],
            summary: `Will search for "${query}".`,
            confidence: 0.9,
            requiresConfirmation: false,
        };
    }
    return {
        actions: [],
        summary: "Could not find a search input on this page.",
        confidence: 0.4,
        requiresConfirmation: false,
    };
}
function planForDelete(classification, pageMap) {
    const intent = classification.extractedIntent;
    const targetName = intent?.target || "delete";
    const keywords = ["delete", "remove", "erase", "close", "destroy", ...extractKeywords(targetName)];
    const target = findElementByLabelOrRole(pageMap, keywords) || findElementsByRole(pageMap, ["button", "link"]).find((el) => el.label.toLowerCase().includes("delete"));
    if (target && !target.sensitive) {
        const action = createAction("click", target, `Click "${target.label}" (High Risk)`, 0.95, {
            risk: "high",
        });
        return {
            actions: action ? [action] : [],
            summary: `High-risk action: Delete account requested ("${target.label}"). Explicit confirmation required.`,
            confidence: 0.95,
            requiresConfirmation: true,
        };
    }
    return {
        actions: [],
        summary: "Could not find delete button on page.",
        confidence: 0.4,
        requiresConfirmation: true,
    };
}
function planForSubmit(_classification, pageMap) {
    const submitBtn = findSubmitLikeElement(pageMap);
    if (submitBtn && !submitBtn.sensitive) {
        const action = createAction("click", submitBtn, `Submit form via "${submitBtn.label}"`, 0.9, {
            risk: "medium",
        });
        return {
            actions: action ? [action] : [],
            summary: `Will submit form via "${submitBtn.label}".`,
            confidence: 0.9,
            requiresConfirmation: true,
        };
    }
    return {
        actions: [],
        summary: "No submit button found on page.",
        confidence: 0.4,
        requiresConfirmation: false,
    };
}
function planForNavigate(classification, pageMap) {
    const intent = classification.extractedIntent;
    const targetName = intent?.target || "";
    const keywords = extractKeywords(targetName);
    const target = findElementByLabelOrRole(pageMap, keywords);
    if (target && !target.sensitive) {
        const action = createAction("click", target, `Navigate to "${target.label}"`, 0.85, {
            risk: "medium",
        });
        return {
            actions: action ? [action] : [],
            summary: `Will navigate to "${target.label}".`,
            confidence: 0.85,
            requiresConfirmation: true,
        };
    }
    return {
        actions: [],
        summary: `Could not find navigation link or button matching "${targetName}".`,
        confidence: 0.3,
        requiresConfirmation: false,
    };
}
function planForScroll(classification) {
    const intent = classification.extractedIntent;
    const direction = intent?.target === "up" ? "up" : "down";
    return {
        actions: [
            {
                id: crypto.randomUUID(),
                type: "scroll",
                direction,
                amount: 350,
                reason: `Scroll ${direction} to reveal page content`,
                confidence: 0.95,
                risk: "low",
            },
        ],
        summary: `Scrolling ${direction}.`,
        confidence: 0.95,
        requiresConfirmation: false,
    };
}
export function createRuleBasedPlan(context) {
    const { userGoal, pageMap, redactionManifest } = context;
    const classification = classifyGoal(userGoal, pageMap);
    let actions = [];
    let summary = "";
    let confidence = classification.confidence;
    let requiresUserConfirmation = classification.requiresConfirmation || classification.riskLevel === "high";
    switch (classification.mode) {
        case "information":
        case "informational": {
            const res = planForInformational(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            break;
        }
        case "ambiguous": {
            const res = planForAmbiguous(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            break;
        }
        case "unsupported": {
            const res = planForUnsupported(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            break;
        }
        case "find":
        case "highlight": {
            const res = planForFindOrHighlight(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            break;
        }
        case "click": {
            const res = planForClick(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = res.requiresConfirmation;
            break;
        }
        case "fill":
        case "type":
        case "form_task": {
            const res = planForFill(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = res.requiresConfirmation;
            break;
        }
        case "search": {
            const res = planForSearch(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = res.requiresConfirmation;
            break;
        }
        case "delete": {
            const res = planForDelete(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = true;
            break;
        }
        case "submit": {
            const res = planForSubmit(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = true;
            break;
        }
        case "navigate":
        case "navigation_task": {
            const res = planForNavigate(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            requiresUserConfirmation = true;
            break;
        }
        case "scroll": {
            const res = planForScroll(classification);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
            break;
        }
        default: {
            const res = planForAmbiguous(classification, pageMap);
            actions = res.actions;
            summary = res.summary;
            confidence = res.confidence;
        }
    }
    // Safety invariant: Check if any high risk actions or sensitive redactions exist
    const hasHighRiskAction = actions.some((a) => a.risk === "high");
    if (hasHighRiskAction || classification.riskLevel === "high") {
        requiresUserConfirmation = true;
    }
    return {
        summary,
        confidence,
        requiresUserConfirmation,
        actions,
    };
}
export async function planAction(context) {
    return createRuleBasedPlan(context);
}

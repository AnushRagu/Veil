export function generatePageSuggestions(pageMap) {
    if (!pageMap || !pageMap.elements || pageMap.elements.length === 0) {
        return [
            {
                id: "sug-scroll-down",
                label: "Scroll down",
                category: "scroll",
                action: {
                    id: "act-sug-scroll-down",
                    type: "scroll",
                    direction: "down",
                    amount: 400,
                    reason: "Scroll down to see more page content",
                    confidence: 0.95,
                    risk: "low",
                },
                icon: "scroll",
                description: "Move viewport down",
            },
        ];
    }
    const suggestions = [];
    const elements = pageMap.elements;
    // 1. Search Suggestion
    const searchElement = elements.find((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "searchbox" ||
            el.type === "search" ||
            (el.placeholder && el.placeholder.toLowerCase().includes("search")) ||
            (el.label && el.label.toLowerCase().includes("search")) ||
            (el.name && el.name.toLowerCase().includes("search")) ||
            (el.elementId && el.elementId.toLowerCase().includes("search"))));
    if (searchElement) {
        suggestions.push({
            id: `sug-search-${searchElement.id}`,
            label: "Search page",
            category: "search",
            action: {
                id: `act-search-${searchElement.id}`,
                type: "focus",
                target: {
                    elementId: searchElement.id,
                    selector: searchElement.selector,
                    label: searchElement.label || searchElement.placeholder || "Search",
                    bounds: searchElement.bounds,
                },
                reason: "Focus search field to enter query",
                confidence: 0.95,
                risk: "low",
            },
            icon: "search",
            description: "Focus search input",
        });
    }
    // 2. Scroll Suggestion
    const viewportHeight = pageMap.viewport?.height || 800;
    const elementsBelowFold = elements.some((el) => el.bounds && el.bounds.y + el.bounds.height > viewportHeight);
    if (elementsBelowFold || elements.length > 5) {
        suggestions.push({
            id: "sug-scroll-down",
            label: "Scroll down",
            category: "scroll",
            action: {
                id: "act-sug-scroll-down",
                type: "scroll",
                direction: "down",
                amount: 400,
                reason: "Scroll down to see more page content",
                confidence: 0.95,
                risk: "low",
            },
            icon: "scroll",
            description: "Move viewport down",
        });
    }
    // 3. Prominent Buttons / Key Actions (Find <Button>)
    const candidateButtons = elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "button" || el.tagName === "button" || (el.role === "link" && el.label && el.label.length < 30)) &&
        el.label &&
        el.label.trim().length > 0 &&
        el.label.trim().length < 35 &&
        !el.label.toLowerCase().includes("close") &&
        !el.label.toLowerCase().includes("privacy"));
    const priorityKeywords = ["submit", "continue", "next", "sign in", "log in", "search", "filter", "download", "save", "add", "send", "view"];
    const sortedButtons = [...candidateButtons].sort((a, b) => {
        const aText = (a.label || "").toLowerCase();
        const bText = (b.label || "").toLowerCase();
        const aPriority = priorityKeywords.some((kw) => aText.includes(kw)) ? 1 : 0;
        const bPriority = priorityKeywords.some((kw) => bText.includes(kw)) ? 1 : 0;
        if (aPriority !== bPriority)
            return bPriority - aPriority;
        return (a.bounds?.y ?? 0) - (b.bounds?.y ?? 0);
    });
    for (const btn of sortedButtons.slice(0, 3)) {
        if (suggestions.length >= 4)
            break;
        const labelTrimmed = btn.label.trim();
        if (labelTrimmed.toLowerCase() === "search" && searchElement)
            continue;
        suggestions.push({
            id: `sug-find-${btn.id}`,
            label: `Find "${labelTrimmed}"`,
            category: "find",
            action: {
                id: `act-find-${btn.id}`,
                type: "highlight",
                target: {
                    elementId: btn.id,
                    selector: btn.selector,
                    label: labelTrimmed,
                    bounds: btn.bounds,
                },
                reason: `Locate and highlight "${labelTrimmed}" on page`,
                confidence: 0.95,
                risk: "low",
            },
            icon: "target",
            description: `Highlight ${labelTrimmed}`,
        });
    }
    // 4. Form Fields Suggestion if inputs exist
    const formFields = elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "textbox" || el.role === "combobox" || el.tagName === "input" || el.tagName === "textarea") &&
        el !== searchElement);
    if (formFields.length > 0 && suggestions.length < 5) {
        const firstField = formFields[0];
        const fieldName = firstField.label || firstField.placeholder || "form field";
        suggestions.push({
            id: `sug-form-${firstField.id}`,
            label: `Find form fields`,
            category: "form",
            action: {
                id: `act-form-${firstField.id}`,
                type: "highlight",
                target: {
                    elementId: firstField.id,
                    selector: firstField.selector,
                    label: fieldName,
                    bounds: firstField.bounds,
                },
                reason: `Highlight available form fields on this page`,
                confidence: 0.9,
                risk: "low",
            },
            icon: "form",
            description: "Locate form fields",
        });
    }
    return suggestions.slice(0, 5);
}

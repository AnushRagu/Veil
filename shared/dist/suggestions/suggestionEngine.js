export function generatePageSuggestions(pageMap, currentUserGoal) {
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
    const goalLower = (currentUserGoal || "").trim().toLowerCase();
    // 1. Search Suggestion (Actionable: Search this page / Search products)
    const searchElement = elements.find((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "searchbox" ||
            el.type === "search" ||
            (el.placeholder && el.placeholder.toLowerCase().includes("search")) ||
            (el.label && el.label.toLowerCase().includes("search")) ||
            (el.name && el.name.toLowerCase().includes("search")) ||
            (el.elementId && el.elementId.toLowerCase().includes("search"))));
    if (searchElement && !goalLower.includes("search")) {
        let searchLabel = "Search this page";
        const placeholder = (searchElement.placeholder || "").trim().toLowerCase();
        const label = (searchElement.label || "").trim().toLowerCase();
        if (placeholder.includes("product") || label.includes("product")) {
            searchLabel = "Search products";
        }
        suggestions.push({
            id: `sug-search-${searchElement.id}`,
            label: searchLabel,
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
                reason: `Focus ${searchLabel} to enter query`,
                confidence: 0.95,
                risk: "low",
            },
            icon: "search",
            description: `Focus ${searchLabel}`,
        });
    }
    // 2. Scroll Suggestion (Actionable: Scroll down)
    const viewportHeight = pageMap.viewport?.height || 800;
    const elementsBelowFold = elements.some((el) => el.bounds && el.bounds.y + el.bounds.height > viewportHeight);
    if ((elementsBelowFold || elements.length > 5) && !goalLower.includes("scroll")) {
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
    // 3. Prominent Actionable Buttons & Result Links (Click / Open actions)
    const candidateInteractive = elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "button" || el.tagName === "button" || (el.role === "link" && el.label && el.label.length < 35)) &&
        el.label &&
        el.label.trim().length >= 2 &&
        el.label.trim().length <= 35 &&
        !el.label.toLowerCase().includes("close") &&
        !el.label.toLowerCase().includes("privacy") &&
        !el.label.toLowerCase().includes("terms"));
    const priorityKeywords = [
        "submit",
        "settings",
        "youtube",
        "google home",
        "continue",
        "next",
        "sign in",
        "log in",
        "save",
        "download",
        "cart",
        "checkout",
        "wikipedia",
    ];
    const sortedInteractive = [...candidateInteractive].sort((a, b) => {
        const aText = (a.label || "").toLowerCase();
        const bText = (b.label || "").toLowerCase();
        const aPriority = priorityKeywords.some((kw) => aText.includes(kw)) ? 1 : 0;
        const bPriority = priorityKeywords.some((kw) => bText.includes(kw)) ? 1 : 0;
        if (aPriority !== bPriority)
            return bPriority - aPriority;
        return (a.bounds?.y ?? 0) - (b.bounds?.y ?? 0);
    });
    for (const item of sortedInteractive) {
        if (suggestions.length >= 4)
            break;
        const labelTrimmed = item.label.trim();
        const labelLower = labelTrimmed.toLowerCase();
        // Skip auxiliary search icons (like "Search by voice" or "Search by image" if searchbox exists)
        if (searchElement &&
            (labelLower === "search" ||
                labelLower.includes("voice") ||
                labelLower.includes("image") ||
                labelLower.includes("search by") ||
                labelLower.includes("search page"))) {
            continue;
        }
        // Skip if it duplicates current user goal
        if (goalLower) {
            const goalKeywords = goalLower
                .split(/\s+/)
                .filter((w) => w.length > 2 && !["the", "find", "click", "and", "for", "button", "link"].includes(w));
            const labelKeywords = labelLower
                .split(/\s+/)
                .filter((w) => w.length > 2 && !["the", "find", "click", "and", "for", "button", "link"].includes(w));
            const hasOverlap = labelKeywords.some((kw) => goalKeywords.includes(kw));
            if (hasOverlap)
                continue;
        }
        // Format as direct action (e.g. "Submit form", "Open settings", "Open YouTube", "Open Google Home")
        let actionLabel = labelTrimmed;
        if (labelLower.includes("submit")) {
            actionLabel = "Submit form";
        }
        else if (labelLower.includes("setting") || labelLower.includes("modal")) {
            actionLabel = "Open settings";
        }
        else if (item.role === "link" ||
            labelLower.includes("youtube") ||
            labelLower.includes("google") ||
            labelLower.includes("home") ||
            labelLower.includes("wiki")) {
            if (!labelLower.startsWith("open ") && !labelLower.startsWith("go to ")) {
                actionLabel = `Open ${labelTrimmed}`;
            }
        }
        // Ensure no duplicate suggestions
        if (suggestions.some((s) => s.label.toLowerCase() === actionLabel.toLowerCase())) {
            continue;
        }
        suggestions.push({
            id: `sug-act-${item.id}`,
            label: actionLabel,
            category: "action",
            action: {
                id: `act-click-${item.id}`,
                type: "click",
                target: {
                    elementId: item.id,
                    selector: item.selector,
                    label: labelTrimmed,
                    bounds: item.bounds,
                },
                reason: `Execute action: ${actionLabel}`,
                confidence: 0.95,
                risk: "low",
            },
            icon: item.role === "link" ? "navigate" : "click",
            description: actionLabel,
        });
    }
    // 4. Form Action Suggestion (Actionable: Fill form)
    const formFields = elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        (el.role === "textbox" || el.role === "combobox" || el.tagName === "input" || el.tagName === "textarea") &&
        el !== searchElement);
    if (formFields.length > 0 && suggestions.length < 5 && !goalLower.includes("form")) {
        const firstField = formFields[0];
        suggestions.push({
            id: `sug-form-${firstField.id}`,
            label: "Fill form",
            category: "form",
            action: {
                id: `act-form-${firstField.id}`,
                type: "focus",
                target: {
                    elementId: firstField.id,
                    selector: firstField.selector,
                    label: firstField.label || firstField.placeholder || "form input",
                    bounds: firstField.bounds,
                },
                reason: "Focus available form field to fill",
                confidence: 0.9,
                risk: "low",
            },
            icon: "form",
            description: "Focus form fields",
        });
    }
    return suggestions.slice(0, 5);
}
const CATEGORY_META = {
    email: { label: "Email Address", replacementToken: "[REDACTED_EMAIL]" },
    phone: { label: "Phone Number", replacementToken: "[REDACTED_PHONE]" },
    password: { label: "Password", replacementToken: "[REDACTED_PASSWORD]" },
    otp: { label: "One-Time Code (OTP)", replacementToken: "[REDACTED_OTP]" },
    credit_card: { label: "Credit Card Number", replacementToken: "[REDACTED_CARD]" },
    cvv: { label: "Card Security Code (CVV)", replacementToken: "[REDACTED_CVV]" },
    aadhaar: { label: "Aadhaar ID (India)", replacementToken: "[REDACTED_AADHAAR]" },
    pan: { label: "PAN Card (India)", replacementToken: "[REDACTED_PAN]" },
    address: { label: "Physical Address / ZIP", replacementToken: "[REDACTED_ADDRESS]" },
    account_number: { label: "Bank Account Number", replacementToken: "[REDACTED_ACCOUNT]" },
    face: { label: "Profile Photo / Face", replacementToken: "[REDACTED_IMAGE]" },
    explicit_sensitive: { label: "Sensitive Form Field", replacementToken: "[REDACTED_PII]" },
    custom: { label: "Sensitive Pattern / Token", replacementToken: "[REDACTED]" },
};
export function summarizeRedactionManifest(manifest) {
    if (!manifest || manifest.length === 0) {
        return {
            totalCount: 0,
            groups: [],
            hasSensitiveData: false,
        };
    }
    const countMap = new Map();
    for (const entry of manifest) {
        const cat = entry.category || "custom";
        countMap.set(cat, (countMap.get(cat) || 0) + 1);
    }
    const groups = [];
    for (const [category, count] of countMap.entries()) {
        const meta = CATEGORY_META[category] || {
            label: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            replacementToken: "[REDACTED]",
        };
        groups.push({
            category,
            label: meta.label,
            count,
            replacementToken: meta.replacementToken,
        });
    }
    // Sort groups by count descending
    groups.sort((a, b) => b.count - a.count);
    return {
        totalCount: manifest.length,
        groups,
        hasSensitiveData: manifest.length > 0,
    };
}

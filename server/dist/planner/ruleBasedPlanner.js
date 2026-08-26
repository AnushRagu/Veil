function findElementsByRole(pageMap, roles) {
    return pageMap.elements.filter((el) => roles.includes(el.role) && el.visible && el.enabled && !el.sensitive);
}
function findElementByLabel(pageMap, keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    return pageMap.elements.find((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        lowerKeywords.some((kw) => el.label.toLowerCase().includes(kw)));
}
function findElementsContainingText(pageMap, text) {
    const lower = text.toLowerCase();
    return pageMap.elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        el.label.toLowerCase().includes(lower));
}
function findAllElementsByLabel(pageMap, keywords) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    return pageMap.elements.filter((el) => el.visible &&
        el.enabled &&
        !el.sensitive &&
        lowerKeywords.some((kw) => el.label.toLowerCase().includes(kw)));
}
function findSubmitLikeElement(pageMap) {
    return (findElementByLabel(pageMap, ["submit", "send", "confirm", "apply", "save", "next", "continue", "purchase", "checkout", "buy", "proceed"]) ||
        findElementsByRole(pageMap, ["button"]).find((el) => el.label.toLowerCase().includes("submit") ||
            el.label.toLowerCase().includes("send") ||
            el.label.toLowerCase().includes("confirm")));
}
function findSearchElement(pageMap) {
    return (findElementByLabel(pageMap, ["search", "find", "query", "filter"]) ||
        findElementsByRole(pageMap, ["searchbox", "textbox"]).find((el) => el.label.toLowerCase().includes("search")));
}
function findFormFields(pageMap) {
    return findElementsByRole(pageMap, ["textbox", "combobox", "checkbox", "radio", "slider", "spinbutton"]);
}
function findClickableElements(pageMap) {
    return findElementsByRole(pageMap, ["button", "link", "menuitem", "tab", "switch", "checkbox"]);
}
function makeTarget(el) {
    return { elementId: el.id, dataVeilId: el.dataVeilId, expectedRole: el.role, expectedLabel: el.label };
}
function highestRisk(actions) {
    const levels = [
        "level_0_observation",
        "level_1_reversible",
        "level_2_data_entry",
        "level_3_consequential",
        "level_4_high_risk",
    ];
    let highest = 0;
    for (const a of actions) {
        const idx = levels.indexOf(a.riskLevel ?? "level_0_observation");
        if (idx > highest)
            highest = idx;
    }
    return levels[highest];
}
export function createRuleBasedPlan(context) {
    const { userGoal, pageMap, redactionManifest } = context;
    const goalLower = userGoal.toLowerCase().trim();
    const goalTokens = goalLower.split(/\s+/).filter((w) => w.length > 1);
    const actions = [];
    let summary = "";
    let confidence = 0.8;
    let requiresUserConfirmation = false;
    const submitBtn = findSubmitLikeElement(pageMap);
    const searchInput = findSearchElement(pageMap);
    const formFields = findFormFields(pageMap);
    const clickables = findClickableElements(pageMap);
    // ── Scroll intents ──
    const isScrollUp = goalLower.includes("scroll up") || goalLower.includes("scroll to top") || (goalLower.includes("up") && goalLower.includes("scroll"));
    const isScrollDown = goalLower.includes("scroll down") || goalLower.includes("scroll to bottom") || (goalLower.includes("down") && goalLower.includes("scroll"));
    // ── Submit / confirm / purchase intents ──
    const isSubmitGoal = goalLower.includes("submit") ||
        goalLower.includes("send") ||
        goalLower.includes("click the button") ||
        goalLower.includes("checkout") ||
        goalLower.includes("buy") ||
        goalLower.includes("purchase") ||
        goalLower.includes("pay") ||
        goalLower.includes("place order") ||
        goalLower.includes("confirm order") ||
        goalLower.includes("proceed");
    // ── Form preparation intents ──
    const isFormPrepGoal = !isSubmitGoal &&
        ((goalLower.includes("prepare") && goalLower.includes("form")) ||
            (goalLower.includes("fill") && goalLower.includes("form")) ||
            goalLower.includes("fill the form") ||
            goalLower.includes("prepare the form") ||
            goalLower.includes("prepare form"));
    // ── Search intents ──
    const isSearchGoal = goalLower.includes("search") ||
        goalLower.includes("find product") ||
        goalLower.includes("look for") ||
        goalLower.includes("query") ||
        goalLower.includes("search for");
    // ── Login / auth intents ──
    const isLoginGoal = goalLower.includes("login") ||
        goalLower.includes("log in") ||
        goalLower.includes("sign in") ||
        goalLower.includes("signin") ||
        goalLower.includes("authenticate");
    const isSignUpGoal = goalLower.includes("sign up") ||
        goalLower.includes("signup") ||
        goalLower.includes("register") ||
        goalLower.includes("create account") ||
        goalLower.includes("new account");
    // ── Navigation intents ──
    const isBackGoal = goalLower.includes("go back") || goalLower.includes("back") || goalLower.includes("navigate back") || goalLower.includes("previous page");
    const isForwardGoal = goalLower.includes("go forward") || goalLower.includes("forward") || goalLower.includes("next page");
    const isRefreshGoal = goalLower.includes("refresh") || goalLower.includes("reload") || goalLower.includes("refresh page");
    const isCloseGoal = goalLower.includes("close") || goalLower.includes("dismiss") || goalLower.includes("close dialog") || goalLower.includes("close modal");
    // ── Toggle / expand / collapse intents ──
    const isToggleGoal = goalLower.includes("toggle") || goalLower.includes("switch") || goalLower.includes("enable") || goalLower.includes("disable");
    const isExpandGoal = goalLower.includes("expand") || goalLower.includes("show more") || goalLower.includes("open menu") || goalLower.includes("open dropdown");
    const isCollapseGoal = goalLower.includes("collapse") || goalLower.includes("show less") || goalLower.includes("close menu");
    // ── Click specific element intents ──
    const isClickGoal = goalLower.includes("click") || goalLower.includes("press") || goalLower.includes("tap");
    const isTypeGoal = goalLower.includes("type") || goalLower.includes("enter") || goalLower.includes("input") || goalLower.includes("write");
    const isSelectGoal = goalLower.includes("select") || goalLower.includes("choose") || goalLower.includes("pick") || goalLower.includes("option");
    // ── Inspect / view / read intents ──
    const isInspectGoal = goalLower.includes("inspect") || goalLower.includes("view") || goalLower.includes("read") || goalLower.includes("check") || goalLower.includes("examine");
    // ── Wait / pause intent ──
    const isWaitGoal = goalLower.includes("wait") || goalLower.includes("pause") || goalLower.includes("hold") || goalLower.includes("delay");
    // ── Download / upload intents ──
    const isDownloadGoal = goalLower.includes("download") || goalLower.includes("save file") || goalLower.includes("export");
    const isUploadGoal = goalLower.includes("upload") || goalLower.includes("choose file") || goalLower.includes("select file");
    // ── Sort / filter intents ──
    const isSortGoal = goalLower.includes("sort") || goalLower.includes("arrange") || goalLower.includes("order by");
    const isFilterGoal = goalLower.includes("filter") || goalLower.includes("narrow") || goalLower.includes("refine");
    // ── Share / print intents ──
    const isShareGoal = goalLower.includes("share") || goalLower.includes("send link") || goalLower.includes("email link");
    const isPrintGoal = goalLower.includes("print") || goalLower.includes("print page");
    // ── Extract target element name from goal ──
    // e.g. "click Checkout" -> target label "Checkout"
    const targetLabelMatch = goalLower.match(/(?:click|press|tap|select|choose|fill|type|enter|focus|inspect|view|read|check)\s+(?:the\s+)?(.+)/i);
    const extractedLabel = targetLabelMatch ? targetLabelMatch[1].trim().replace(/\s*(button|link|field|input|box|tab|menu)\s*$/i, "").trim() : null;
    // ── Check if goal is completely unknown/random ──
    const isKnownIntent = isScrollUp || isScrollDown || isSubmitGoal || isFormPrepGoal || isSearchGoal ||
        isLoginGoal || isSignUpGoal || isBackGoal || isForwardGoal || isRefreshGoal ||
        isCloseGoal || isToggleGoal || isExpandGoal || isCollapseGoal || isClickGoal ||
        isTypeGoal || isSelectGoal || isInspectGoal || isWaitGoal || isDownloadGoal ||
        isUploadGoal || isSortGoal || isFilterGoal || isShareGoal || isPrintGoal ||
        goalLower.includes("do something") || goalLower.includes("click") ||
        goalLower.includes("navigate") || goalLower.includes("view");
    // ── Execute intent matching ──
    if (isScrollUp) {
        actions.push({
            id: crypto.randomUUID(),
            type: "scroll",
            direction: "up",
            amount: 300,
            reason: "Scroll up to reveal previous content",
            confidence: 0.9,
            riskLevel: "level_0_observation",
            explanation: "VEIL is scrolling up to inspect higher page content.",
        });
        summary = "Scrolling up to reveal previous content.";
        confidence = 0.9;
    }
    else if (isScrollDown) {
        actions.push({
            id: crypto.randomUUID(),
            type: "scroll",
            direction: "down",
            amount: 300,
            reason: "Scroll down to reveal more content",
            confidence: 0.9,
            riskLevel: "level_0_observation",
            explanation: "VEIL is scrolling down to inspect lower page content.",
        });
        summary = "Scrolling down to reveal more content.";
        confidence = 0.9;
    }
    else if (isWaitGoal) {
        actions.push({
            id: crypto.randomUUID(),
            type: "wait",
            amount: 2000,
            reason: "Wait for page to settle",
            confidence: 0.9,
            riskLevel: "level_0_observation",
            explanation: "VEIL is pausing to wait for the page to finish loading or settling.",
        });
        summary = "Waiting for page to settle.";
        confidence = 0.9;
    }
    else if (isBackGoal) {
        actions.push({
            id: crypto.randomUUID(),
            type: "scroll",
            direction: "up",
            amount: 999999,
            reason: "Navigate back to previous page",
            confidence: 0.5,
            riskLevel: "level_1_reversible",
            explanation: "VEIL cannot directly navigate back. Please use browser back button.",
        });
        summary = "Browser navigation (back) requires browser controls. VEIL cannot navigate history directly.";
        confidence = 0.5;
        requiresUserConfirmation = true;
    }
    else if (isForwardGoal) {
        actions.push({
            id: crypto.randomUUID(),
            type: "scroll",
            direction: "down",
            amount: 999999,
            reason: "Navigate forward to next page",
            confidence: 0.5,
            riskLevel: "level_1_reversible",
            explanation: "VEIL cannot directly navigate forward. Please use browser forward button.",
        });
        summary = "Browser navigation (forward) requires browser controls. VEIL cannot navigate history directly.";
        confidence = 0.5;
        requiresUserConfirmation = true;
    }
    else if (isRefreshGoal) {
        actions.push({
            id: crypto.randomUUID(),
            type: "wait",
            amount: 100,
            reason: "Trigger page refresh",
            confidence: 0.5,
            riskLevel: "level_1_reversible",
            explanation: "VEIL cannot directly refresh the page. Please use browser refresh.",
        });
        summary = "Page refresh requires browser controls. VEIL cannot reload pages directly.";
        confidence = 0.5;
        requiresUserConfirmation = true;
    }
    else if (isCloseGoal) {
        // Try to find a close/dismiss button
        const closeBtn = findElementByLabel(pageMap, ["close", "dismiss", "x", "cancel", "got it", "ok", "understood"]);
        if (closeBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(closeBtn),
                reason: `Highlight close/dismiss button "${closeBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the close button "${closeBtn.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "click",
                target: makeTarget(closeBtn),
                reason: `Click close/dismiss button "${closeBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_1_reversible",
                explanation: `VEIL will click "${closeBtn.label}" to dismiss the dialog/modal.`,
            });
            summary = `Found close button: "${closeBtn.label}". Will click to dismiss.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No close/dismiss button found on page.";
            confidence = 0.4;
        }
    }
    else if (isToggleGoal || isExpandGoal || isCollapseGoal) {
        const toggleLabel = extractedLabel;
        let target;
        if (toggleLabel) {
            target = findElementByLabel(pageMap, [toggleLabel]);
        }
        if (!target) {
            target = findElementsByRole(pageMap, ["switch", "checkbox", "button"]).find((el) => el.label.toLowerCase().includes("toggle") || el.label.toLowerCase().includes("switch"));
        }
        if (target) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(target),
                reason: `Highlight toggle element "${target.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting "${target.label}" for toggle interaction.`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "click",
                target: makeTarget(target),
                reason: `Toggle "${target.label}"`,
                confidence: 0.85,
                riskLevel: "level_1_reversible",
                explanation: `VEIL will click "${target.label}" to toggle its state.`,
            });
            summary = `Found toggle element: "${target.label}". Will click to toggle.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No toggle/switch element found on page.";
            confidence = 0.4;
        }
    }
    else if (isLoginGoal) {
        const loginBtn = findElementByLabel(pageMap, ["login", "log in", "sign in", "signin"]);
        if (loginBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(loginBtn),
                reason: `Highlight login button "${loginBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the login button "${loginBtn.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(loginBtn),
                reason: `Focus login button "${loginBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing the login button "${loginBtn.label}" for your review.`,
            });
            summary = `Found login button: "${loginBtn.label}". Highlighted and focused for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            // Maybe there's a login form
            const loginField = formFields.find((f) => f.label.toLowerCase().includes("email") || f.label.toLowerCase().includes("username"));
            if (loginField) {
                actions.push({
                    id: crypto.randomUUID(),
                    type: "highlight",
                    target: makeTarget(loginField),
                    reason: `Highlight login field "${loginField.label}"`,
                    confidence: 0.75,
                    riskLevel: "level_0_observation",
                    explanation: `VEIL is highlighting the login field "${loginField.label}".`,
                });
                summary = `Found login field: "${loginField.label}". Ready for credential entry.`;
                confidence = 0.75;
                requiresUserConfirmation = true;
            }
            else {
                summary = "No login button or login form found on page.";
                confidence = 0.4;
            }
        }
    }
    else if (isSignUpGoal) {
        const signUpBtn = findElementByLabel(pageMap, ["sign up", "signup", "register", "create account", "new account"]);
        if (signUpBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(signUpBtn),
                reason: `Highlight sign up button "${signUpBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the sign up button "${signUpBtn.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(signUpBtn),
                reason: `Focus sign up button "${signUpBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing "${signUpBtn.label}" for your review.`,
            });
            summary = `Found sign up button: "${signUpBtn.label}". Highlighted and focused for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No sign up / register button found on page.";
            confidence = 0.4;
        }
    }
    else if (isSubmitGoal) {
        if (submitBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(submitBtn),
                reason: "Highlight submit button for user review",
                confidence: 0.9,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the submit button "${submitBtn.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(submitBtn),
                reason: "Focus submit button to prepare for interaction",
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing the submit button "${submitBtn.label}".`,
            });
            summary = `Found submit button: "${submitBtn.label}". Highlighted and focused for review.`;
            confidence = 0.85;
        }
        else {
            summary = "No submit-like button found on page.";
            confidence = 0.4;
        }
    }
    else if (isFormPrepGoal) {
        const safeFields = formFields.filter((f) => !f.sensitive && (f.label.toLowerCase().includes("name") || f.role === "textbox"));
        const emailFields = formFields.filter((f) => !f.sensitive && f.label.toLowerCase().includes("email"));
        if (safeFields.length > 0) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(safeFields[0]),
                reason: "Highlight form field for user entry",
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the form field "${safeFields[0].label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(safeFields[0]),
                reason: "Focus form field",
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing the form field "${safeFields[0].label}".`,
            });
            summary = `Found ${safeFields.length} safe form field(s). Prepared first field for entry.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else if (emailFields.length > 0) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(emailFields[0]),
                reason: "Highlight email field for user entry",
                confidence: 0.75,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the email field "${emailFields[0].label}".`,
            });
            summary = "Found email field. Requires user confirmation before typing.";
            confidence = 0.75;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No safe form fields found for preparation.";
            confidence = 0.4;
        }
    }
    else if (isSearchGoal) {
        if (searchInput) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(searchInput),
                reason: "Highlight search input",
                confidence: 0.9,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the search input "${searchInput.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(searchInput),
                reason: "Focus search input for user entry",
                confidence: 0.9,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing the search input "${searchInput.label}".`,
            });
            summary = `Found search input: "${searchInput.label}". Ready for search query.`;
            confidence = 0.9;
        }
        else {
            summary = "No search input found on page.";
            confidence = 0.4;
        }
    }
    else if (isClickGoal && extractedLabel) {
        // Try to find element matching the extracted label
        const targetEl = findElementByLabel(pageMap, [extractedLabel]);
        if (targetEl) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(targetEl),
                reason: `Highlight "${targetEl.label}" for click`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting "${targetEl.label}" for your review before clicking.`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "click",
                target: makeTarget(targetEl),
                reason: `Click "${targetEl.label}"`,
                confidence: 0.85,
                riskLevel: targetEl.role === "button" ? "level_3_consequential" : "level_2_data_entry",
                explanation: `VEIL will click "${targetEl.label}".`,
            });
            summary = `Found element: "${targetEl.label}". Will click after confirmation.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = `Could not find an element matching "${extractedLabel}" on page.`;
            confidence = 0.3;
            requiresUserConfirmation = true;
        }
    }
    else if (isTypeGoal && extractedLabel) {
        const targetEl = findElementByLabel(pageMap, [extractedLabel]);
        if (targetEl && (targetEl.role === "textbox" || targetEl.role === "searchbox" || targetEl.role === "combobox")) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(targetEl),
                reason: `Highlight "${targetEl.label}" for text entry`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the input field "${targetEl.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(targetEl),
                reason: `Focus "${targetEl.label}" for typing`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing "${targetEl.label}" so you can type.`,
            });
            summary = `Found input field: "${targetEl.label}". Focused for text entry.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = `Could not find an input field matching "${extractedLabel}" on page.`;
            confidence = 0.3;
        }
    }
    else if (isSelectGoal && extractedLabel) {
        const targetEl = findElementByLabel(pageMap, [extractedLabel]);
        if (targetEl && (targetEl.role === "combobox" || targetEl.role === "listbox" || targetEl.role === "option")) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(targetEl),
                reason: `Highlight "${targetEl.label}" for selection`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the dropdown "${targetEl.label}".`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "click",
                target: makeTarget(targetEl),
                reason: `Open dropdown "${targetEl.label}"`,
                confidence: 0.85,
                riskLevel: "level_1_reversible",
                explanation: `VEIL will click to open the dropdown "${targetEl.label}".`,
            });
            summary = `Found dropdown: "${targetEl.label}". Will open for selection.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = `Could not find a selectable element matching "${extractedLabel}" on page.`;
            confidence = 0.3;
        }
    }
    else if (isInspectGoal && extractedLabel) {
        const targetEl = findElementByLabel(pageMap, [extractedLabel]);
        if (targetEl) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(targetEl),
                reason: `Highlight "${targetEl.label}" for inspection`,
                confidence: 0.9,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting "${targetEl.label}" for visual inspection.`,
            });
            actions.push({
                id: crypto.randomUUID(),
                type: "focus",
                target: makeTarget(targetEl),
                reason: `Focus "${targetEl.label}" for inspection`,
                confidence: 0.9,
                riskLevel: "level_0_observation",
                explanation: `VEIL is focusing "${targetEl.label}" to bring it into view.`,
            });
            summary = `Highlighted and focused "${targetEl.label}" for inspection.`;
            confidence = 0.9;
        }
        else {
            summary = `Could not find an element matching "${extractedLabel}" on page.`;
            confidence = 0.3;
        }
    }
    else if (isDownloadGoal) {
        const dlBtn = findElementByLabel(pageMap, ["download", "save", "export"]);
        if (dlBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(dlBtn),
                reason: `Highlight download button "${dlBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the download button "${dlBtn.label}".`,
            });
            summary = `Found download button: "${dlBtn.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No download button found on page.";
            confidence = 0.4;
        }
    }
    else if (isUploadGoal) {
        const upBtn = findElementByLabel(pageMap, ["upload", "choose file", "select file", "browse", "attach"]);
        if (upBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(upBtn),
                reason: `Highlight upload button "${upBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the upload button "${upBtn.label}".`,
            });
            summary = `Found upload button: "${upBtn.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No upload button found on page.";
            confidence = 0.4;
        }
    }
    else if (isSortGoal) {
        const sortEl = findElementByLabel(pageMap, ["sort", "order", "arrange"]);
        if (sortEl) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(sortEl),
                reason: `Highlight sort control "${sortEl.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the sort control "${sortEl.label}".`,
            });
            summary = `Found sort control: "${sortEl.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No sort control found on page.";
            confidence = 0.4;
        }
    }
    else if (isFilterGoal) {
        const filterEl = findElementByLabel(pageMap, ["filter", "refine", "narrow"]);
        if (filterEl) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(filterEl),
                reason: `Highlight filter control "${filterEl.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the filter control "${filterEl.label}".`,
            });
            summary = `Found filter control: "${filterEl.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No filter control found on page.";
            confidence = 0.4;
        }
    }
    else if (isShareGoal) {
        const shareBtn = findElementByLabel(pageMap, ["share", "send link", "email", "copy link"]);
        if (shareBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(shareBtn),
                reason: `Highlight share button "${shareBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the share button "${shareBtn.label}".`,
            });
            summary = `Found share button: "${shareBtn.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No share button found on page.";
            confidence = 0.4;
        }
    }
    else if (isPrintGoal) {
        const printBtn = findElementByLabel(pageMap, ["print", "printer", "print page"]);
        if (printBtn) {
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(printBtn),
                reason: `Highlight print button "${printBtn.label}"`,
                confidence: 0.85,
                riskLevel: "level_0_observation",
                explanation: `VEIL is highlighting the print button "${printBtn.label}".`,
            });
            summary = `Found print button: "${printBtn.label}". Highlighted for review.`;
            confidence = 0.85;
            requiresUserConfirmation = true;
        }
        else {
            summary = "No print button found on page. Use browser print (Ctrl+P).";
            confidence = 0.4;
        }
    }
    else if (isKnownIntent && goalLower.includes("do something") && !goalLower.includes("random") && !goalLower.includes("unknown")) {
        if (clickables.length > 0) {
            const first = clickables[0];
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(first),
                reason: `Highlight first interactive element: "${first.label}"`,
                confidence: 0.7,
                riskLevel: "level_0_observation",
                explanation: `VEIL highlighted "${first.label}" for user inspection.`,
            });
            summary = `Highlighted first interactive element: "${first.label}". Specify goal for more precise actions.`;
            confidence = 0.7;
        }
        else {
            summary = "No interactive elements found.";
            confidence = 0.3;
        }
    }
    else if (!isKnownIntent && goalTokens.length > 0) {
        // Unknown goal but has tokens -> try fuzzy matching against all element labels
        const fuzzyMatches = [];
        for (const token of goalTokens) {
            for (const el of clickables) {
                if (el.label.toLowerCase().includes(token) && !fuzzyMatches.includes(el)) {
                    fuzzyMatches.push(el);
                }
            }
        }
        // Also check form fields
        for (const token of goalTokens) {
            for (const el of formFields) {
                if (el.label.toLowerCase().includes(token) && !fuzzyMatches.includes(el)) {
                    fuzzyMatches.push(el);
                }
            }
        }
        if (fuzzyMatches.length > 0) {
            const best = fuzzyMatches[0];
            actions.push({
                id: crypto.randomUUID(),
                type: "highlight",
                target: makeTarget(best),
                reason: `Highlight "${best.label}" (matched from goal "${userGoal}")`,
                confidence: 0.6,
                riskLevel: "level_0_observation",
                explanation: `VEIL found "${best.label}" which may relate to your goal. Please verify.`,
            });
            summary = `Found potential match: "${best.label}". Please verify this matches your intent.`;
            confidence = 0.6;
            requiresUserConfirmation = true;
        }
        else {
            summary = `Unknown or ambiguous goal: "${userGoal}". Cannot safely determine required actions. Try being more specific (e.g., "click Checkout", "search for shoes").`;
            confidence = 0.3;
            requiresUserConfirmation = true;
        }
    }
    else {
        summary = `No actionable goal detected. Please describe what you want to do (e.g., "click Checkout", "search for products", "fill the form").`;
        confidence = 0.2;
        requiresUserConfirmation = true;
    }
    // Check if sensitive redactions are present in context
    const hasSensitiveRedactions = redactionManifest && redactionManifest.length > 0 && redactionManifest.some((r) => ["password", "credit_card", "cvv", "aadhaar", "pan", "otp", "explicit_sensitive"].includes(r.category));
    if (hasSensitiveRedactions) {
        requiresUserConfirmation = true;
        confidence = Math.min(confidence, 0.75);
    }
    if (actions.some((a) => a.type === "type")) {
        requiresUserConfirmation = true;
    }
    const riskLevel = highestRisk(actions);
    return {
        summary,
        confidence,
        requiresUserConfirmation,
        actions,
        highestRiskLevel: riskLevel,
    };
}
export async function planAction(context) {
    return createRuleBasedPlan(context);
}

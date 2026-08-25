import {
  ServerPlan,
  ServerAction,
  PageMap,
  SanitizedElement,
  RedactionEntry,
  RiskLevel,
} from "@veil/shared";

export interface PlannerContext {
  userGoal: string;
  pageMap: PageMap;
  redactionManifest: RedactionEntry[];
}

function findElementsByRole(pageMap: PageMap, roles: string[]): SanitizedElement[] {
  return pageMap.elements.filter(
    (el) => roles.includes(el.role) && el.visible && el.enabled && !el.sensitive
  );
}

function findElementByLabel(pageMap: PageMap, keywords: string[]): SanitizedElement | undefined {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return pageMap.elements.find(
    (el) =>
      el.visible &&
      el.enabled &&
      !el.sensitive &&
      lowerKeywords.some((kw) => el.label.toLowerCase().includes(kw))
  );
}

function findSubmitLikeElement(pageMap: PageMap): SanitizedElement | undefined {
  return (
    findElementByLabel(pageMap, ["submit", "send", "confirm", "apply", "save", "next", "continue", "purchase", "checkout", "buy"]) ||
    findElementsByRole(pageMap, ["button"]).find(
      (el) =>
        el.label.toLowerCase().includes("submit") ||
        el.label.toLowerCase().includes("send") ||
        el.label.toLowerCase().includes("confirm")
    )
  );
}

function findSearchElement(pageMap: PageMap): SanitizedElement | undefined {
  return (
    findElementByLabel(pageMap, ["search", "find", "query", "filter"]) ||
    findElementsByRole(pageMap, ["searchbox", "textbox"]).find((el) =>
      el.label.toLowerCase().includes("search")
    )
  );
}

function findFormFields(pageMap: PageMap): SanitizedElement[] {
  return findElementsByRole(pageMap, ["textbox", "combobox", "checkbox", "radio", "slider", "spinbutton"]);
}

export function createRuleBasedPlan(context: PlannerContext): ServerPlan {
  const { userGoal, pageMap, redactionManifest } = context;
  const goalLower = userGoal.toLowerCase().trim();
  const actions: ServerAction[] = [];
  let summary = "";
  let confidence = 0.8;
  let requiresUserConfirmation = false;
  let highestRiskLevel: RiskLevel = "level_0_observation";

  const submitBtn = findSubmitLikeElement(pageMap);
  const searchInput = findSearchElement(pageMap);
  const formFields = findFormFields(pageMap);

  // Check if goal is directional scroll
  const isScrollUp = goalLower.includes("scroll up") || goalLower.includes("scroll to top") || (goalLower.includes("up") && goalLower.includes("scroll"));
  const isScrollDown = goalLower.includes("scroll down") || goalLower.includes("scroll to bottom") || (goalLower.includes("down") && goalLower.includes("scroll"));

  // Check if goal is submit / click button
  const isSubmitGoal =
    goalLower.includes("submit") ||
    goalLower.includes("send") ||
    goalLower.includes("click the button") ||
    goalLower.includes("checkout") ||
    goalLower.includes("buy");

  // Check if goal is form preparation
  const isFormPrepGoal =
    !isSubmitGoal &&
    ((goalLower.includes("prepare") && goalLower.includes("form")) ||
      (goalLower.includes("fill") && goalLower.includes("form")) ||
      goalLower === "prepare the form for filling" ||
      goalLower === "prepare form" ||
      goalLower.includes("prepare"));

  // Check if goal is search
  const isSearchGoal = goalLower.includes("search") || goalLower.includes("find product");

  // Check if goal is completely unknown/random
  const isKnownIntent =
    isScrollUp ||
    isScrollDown ||
    isSubmitGoal ||
    isFormPrepGoal ||
    isSearchGoal ||
    goalLower.includes("do something") ||
    goalLower.includes("click") ||
    goalLower.includes("navigate") ||
    goalLower.includes("view");

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
    highestRiskLevel = "level_0_observation";
  } else if (isScrollDown) {
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
    highestRiskLevel = "level_0_observation";
  } else if (isSubmitGoal) {
    if (submitBtn) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: submitBtn.id, dataVeilId: submitBtn.dataVeilId, expectedRole: submitBtn.role, expectedLabel: submitBtn.label },
        reason: "Highlight submit button for user review",
        confidence: 0.9,
        riskLevel: "level_0_observation",
        explanation: `VEIL is highlighting the submit button "${submitBtn.label}".`,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: submitBtn.id, dataVeilId: submitBtn.dataVeilId, expectedRole: submitBtn.role, expectedLabel: submitBtn.label },
        reason: "Focus submit button to prepare for interaction",
        confidence: 0.85,
        riskLevel: "level_0_observation",
        explanation: `VEIL is focusing the submit button "${submitBtn.label}".`,
      });
      summary = `Found submit button: "${submitBtn.label}". Highlighted and focused for review.`;
      confidence = 0.85;
      highestRiskLevel = "level_3_consequential";
    } else {
      summary = "No submit-like button found on page.";
      confidence = 0.4;
    }
  } else if (isFormPrepGoal) {
    const safeFields = formFields.filter((f) => !f.sensitive && (f.label.toLowerCase().includes("name") || f.role === "textbox"));
    const emailFields = formFields.filter((f) => !f.sensitive && f.label.toLowerCase().includes("email"));

    if (safeFields.length > 0) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: safeFields[0].id, dataVeilId: safeFields[0].dataVeilId, expectedRole: safeFields[0].role, expectedLabel: safeFields[0].label },
        reason: "Highlight form field for user entry",
        confidence: 0.85,
        riskLevel: "level_0_observation",
        explanation: `VEIL is highlighting the form field "${safeFields[0].label}".`,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: safeFields[0].id, dataVeilId: safeFields[0].dataVeilId, expectedRole: safeFields[0].role, expectedLabel: safeFields[0].label },
        reason: "Focus form field",
        confidence: 0.85,
        riskLevel: "level_0_observation",
        explanation: `VEIL is focusing the form field "${safeFields[0].label}".`,
      });
      summary = `Found ${safeFields.length} safe form field(s). Prepared first field for entry.`;
      confidence = 0.85;
      requiresUserConfirmation = true;
      highestRiskLevel = "level_2_data_entry";
    } else if (emailFields.length > 0) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: emailFields[0].id, dataVeilId: emailFields[0].dataVeilId, expectedRole: emailFields[0].role, expectedLabel: emailFields[0].label },
        reason: "Highlight email field for user entry",
        confidence: 0.75,
        riskLevel: "level_0_observation",
        explanation: `VEIL is highlighting the email field "${emailFields[0].label}".`,
      });
      summary = "Found email field. Requires user confirmation before typing.";
      confidence = 0.75;
      requiresUserConfirmation = true;
      highestRiskLevel = "level_2_data_entry";
    } else {
      summary = "No safe form fields found for preparation.";
      confidence = 0.4;
    }
  } else if (isSearchGoal) {
    if (searchInput) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: searchInput.id, dataVeilId: searchInput.dataVeilId, expectedRole: searchInput.role, expectedLabel: searchInput.label },
        reason: "Highlight search input",
        confidence: 0.9,
        riskLevel: "level_0_observation",
        explanation: `VEIL is highlighting the search input "${searchInput.label}".`,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: searchInput.id, dataVeilId: searchInput.dataVeilId, expectedRole: searchInput.role, expectedLabel: searchInput.label },
        reason: "Focus search input for user entry",
        confidence: 0.9,
        riskLevel: "level_0_observation",
        explanation: `VEIL is focusing the search input "${searchInput.label}".`,
      });
      summary = `Found search input: "${searchInput.label}". Ready for search query.`;
      confidence = 0.9;
      highestRiskLevel = "level_0_observation";
    } else {
      summary = "No search input found on page.";
      confidence = 0.4;
    }
  } else if (isKnownIntent && goalLower.includes("do something") && !goalLower.includes("random") && !goalLower.includes("unknown")) {
    const clickableElements = findElementsByRole(pageMap, ["button", "link", "menuitem", "tab"]);
    if (clickableElements.length > 0) {
      const first = clickableElements[0];
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: first.id, dataVeilId: first.dataVeilId, expectedRole: first.role, expectedLabel: first.label },
        reason: `Highlight first interactive element: "${first.label}"`,
        confidence: 0.7,
        riskLevel: "level_0_observation",
        explanation: `VEIL highlighted "${first.label}" for user inspection.`,
      });
      summary = `Highlighted first interactive element: "${first.label}". Specify goal for more precise actions.`;
      confidence = 0.7;
      highestRiskLevel = "level_0_observation";
    } else {
      summary = "No interactive elements found.";
      confidence = 0.3;
    }
  } else {
    // Unknown or completely random goal -> low confidence (< 0.5)
    summary = `Unknown or ambiguous goal: "${userGoal}". Cannot safely determine required actions.`;
    confidence = 0.3;
    requiresUserConfirmation = true;
    highestRiskLevel = "level_2_data_entry";
  }

  // Check if sensitive redactions are present in context
  const hasSensitiveRedactions = redactionManifest && redactionManifest.length > 0 && redactionManifest.some(
    (r) => ["password", "credit_card", "cvv", "aadhaar", "pan", "otp", "explicit_sensitive"].includes(r.category)
  );

  if (hasSensitiveRedactions) {
    requiresUserConfirmation = true;
    confidence = Math.min(confidence, 0.75);
  }

  if (actions.some((a) => a.type === "type")) {
    requiresUserConfirmation = true;
  }

  return {
    summary,
    confidence,
    requiresUserConfirmation,
    actions,
    highestRiskLevel,
  };
}

export async function planAction(context: PlannerContext): Promise<ServerPlan> {
  return createRuleBasedPlan(context);
}
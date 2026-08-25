import {
  ServerPlan,
  ServerAction,
  PageMap,
  SanitizedElement,
  RedactionEntry,
  ActionType,
} from "@privatesight/shared";

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
    findElementByLabel(pageMap, ["submit", "send", "confirm", "apply", "save", "next", "continue"]) ||
    findElementsByRole(pageMap, ["button"]).find(
      (el) => el.label.toLowerCase().includes("submit") || el.label.toLowerCase().includes("send")
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
  const goalLower = userGoal.toLowerCase();
  const actions: ServerAction[] = [];
  let summary = "";
  let confidence = 0.7;
  let requiresUserConfirmation = false;

  const submitBtn = findSubmitLikeElement(pageMap);
  const searchInput = findSearchElement(pageMap);
  const formFields = findFormFields(pageMap);

  if (goalLower.includes("submit") || goalLower.includes("send") || goalLower.includes("form")) {
    if (submitBtn) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: submitBtn.id },
        reason: "Highlight submit button for user review",
        confidence: 0.9,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: submitBtn.id },
        reason: "Focus submit button to prepare for interaction",
        confidence: 0.85,
      });
      summary = `Found submit button: "${submitBtn.label}". Highlighted and focused for review.`;
      confidence = 0.85;
    } else {
      summary = "No submit-like button found on page.";
      confidence = 0.4;
    }
  } else if (goalLower.includes("search") || goalLower.includes("find")) {
    if (searchInput) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: searchInput.id },
        reason: "Highlight search input",
        confidence: 0.9,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: searchInput.id },
        reason: "Focus search input for user entry",
        confidence: 0.9,
      });
      summary = `Found search input: "${searchInput.label}". Ready for search query.`;
      confidence = 0.9;
    } else {
      summary = "No search input found on page.";
      confidence = 0.4;
    }
  } else if (goalLower.includes("prepare") || goalLower.includes("fill") || goalLower.includes("form")) {
    const safeFields = formFields.filter((f) => !f.sensitive && f.label.toLowerCase().includes("name"));
    const emailFields = formFields.filter((f) => !f.sensitive && f.label.toLowerCase().includes("email"));
    const phoneFields = formFields.filter((f) => !f.sensitive && f.label.toLowerCase().includes("phone"));

    if (safeFields.length > 0) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: safeFields[0].id },
        reason: "Highlight name field for user entry",
        confidence: 0.8,
      });
      actions.push({
        id: crypto.randomUUID(),
        type: "focus",
        target: { elementId: safeFields[0].id },
        reason: "Focus name field",
        confidence: 0.8,
      });
      summary = `Found ${safeFields.length} safe name field(s). Highlighted first for user entry.`;
      confidence = 0.8;
      requiresUserConfirmation = true;
    } else if (emailFields.length > 0) {
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: emailFields[0].id },
        reason: "Highlight email field for user entry",
        confidence: 0.75,
      });
      summary = "Found email field. Requires user confirmation before typing.";
      confidence = 0.75;
      requiresUserConfirmation = true;
    } else {
      summary = "No safe form fields found for preparation.";
      confidence = 0.4;
    }
  } else if (goalLower.includes("scroll") || goalLower.includes("down")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "scroll",
      direction: "down",
      amount: 300,
      reason: "Scroll down to reveal more content",
      confidence: 0.9,
    });
    summary = "Scrolling down to reveal more content.";
    confidence = 0.9;
  } else if (goalLower.includes("scroll") || goalLower.includes("up")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "scroll",
      direction: "up",
      amount: 300,
      reason: "Scroll up to reveal previous content",
      confidence: 0.9,
    });
    summary = "Scrolling up to reveal previous content.";
    confidence = 0.9;
  } else {
    const clickableElements = findElementsByRole(pageMap, ["button", "link", "menuitem", "tab"]);
    if (clickableElements.length > 0) {
      const first = clickableElements[0];
      actions.push({
        id: crypto.randomUUID(),
        type: "highlight",
        target: { elementId: first.id },
        reason: `Highlight first interactive element: "${first.label}"`,
        confidence: 0.7,
      });
      summary = `Highlighted first interactive element: "${first.label}". Specify goal for more precise actions.`;
      confidence = 0.7;
    } else {
      summary = "No interactive elements found. Page may be empty or fully redacted.";
      confidence = 0.3;
    }
  }

  const hasSensitiveRedactions = redactionManifest.some(
    (r) => ["password", "credit_card", "cvv", "aadhaar", "pan"].includes(r.category)
  );

  if (hasSensitiveRedactions && actions.some((a) => a.type === "click" || a.type === "type")) {
    requiresUserConfirmation = true;
    confidence = Math.min(confidence, 0.8);
  }

  if (actions.some((a) => a.type === "type")) {
    requiresUserConfirmation = true;
  }

  return {
    summary,
    confidence,
    requiresUserConfirmation,
    actions,
  };
}

export async function planAction(context: PlannerContext): Promise<ServerPlan> {
  return createRuleBasedPlan(context);
}
import { describe, it, expect } from "vitest";
import { classifyGoal, shouldExecuteActions } from "../shared/src/planner/goalClassifier";
import { createRuleBasedPlan } from "../server/src/planner/ruleBasedPlanner";
import { validateActionAgainstGoal } from "../shared/src/planner/actionValidator";
import { validateAction } from "../shared/src/validation/actionPolicy";

const createMockPageMap = (elements: any[]) => ({
  urlOrigin: "http://localhost:3002",
  title: "Veil Banking & Profile Demo",
  viewport: { width: 1920, height: 1080 },
  elements,
});

const demoElements = [
  {
    id: "el-profile-img",
    role: "img",
    label: "[REDACTED_FACE]",
    bounds: { x: 50, y: 50, width: 80, height: 80 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
  {
    id: "el-name",
    role: "textbox",
    label: "Full Name",
    name: "fullName",
    bounds: { x: 150, y: 50, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-email",
    role: "textbox",
    label: "[REDACTED_EMAIL]",
    name: "email",
    placeholder: "[REDACTED_EMAIL]",
    bounds: { x: 150, y: 110, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
  {
    id: "el-phone",
    role: "textbox",
    label: "[REDACTED_PHONE]",
    name: "phone",
    bounds: { x: 150, y: 170, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
  {
    id: "el-search",
    role: "searchbox",
    label: "Search Products",
    name: "searchQuery",
    placeholder: "Search laptops, phones...",
    bounds: { x: 500, y: 50, width: 350, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-submit",
    role: "button",
    label: "Submit Request",
    bounds: { x: 150, y: 300, width: 140, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-delete",
    role: "button",
    label: "Delete Account",
    bounds: { x: 310, y: 300, width: 150, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
];

describe("Agent Intent & Invariants Suite (8 Required Scenarios)", () => {
  // Scenario 1: "what can you do?"
  it("Scenario 1: 'what can you do?' executes ZERO browser actions", () => {
    const classification = classifyGoal("what can you do?", createMockPageMap(demoElements));
    expect(shouldExecuteActions(classification)).toBe(false);
    expect(classification.mode).toBe("information");

    const plan = createRuleBasedPlan({
      userGoal: "what can you do?",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.actions).toHaveLength(0);
    expect(plan.summary.toLowerCase()).toContain("safe actions");
  });

  // Scenario 2: "find the submit button"
  it("Scenario 2: 'find the submit button' produces highlight only, 0 clicks", () => {
    const classification = classifyGoal("find the submit button", createMockPageMap(demoElements));
    expect(classification.mode).toBe("find");
    expect(classification.extractedIntent?.action).toBe("find");

    const plan = createRuleBasedPlan({
      userGoal: "find the submit button",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.actions.every((a) => a.type === "highlight")).toBe(true);
    expect(plan.actions.some((a) => a.type === "click")).toBe(false);

    // Validate that clicking is rejected for a find goal
    const validation = validateActionAgainstGoal(
      { id: "1", type: "click", target: { elementId: "el-submit" }, reason: "invented click" },
      {
        userGoal: "find the submit button",
        classification,
        pageElements: demoElements,
        previousActions: [],
        stepNumber: 0,
      }
    );
    expect(validation.valid).toBe(false);
  });

  // Scenario 3: "click the submit button"
  it("Scenario 3: 'click the submit button' clicks ONLY the requested button", () => {
    const classification = classifyGoal("click the submit button", createMockPageMap(demoElements));
    expect(classification.mode).toBe("click");

    const plan = createRuleBasedPlan({
      userGoal: "click the submit button",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("click");
    expect(plan.actions[0].target?.elementId).toBe("el-submit");

    const policyResult = validateAction(plan.actions[0], demoElements, "http://localhost:3002");
    expect(policyResult.policy === "auto" || policyResult.policy === "confirm").toBe(true);
  });

  // Scenario 4: "fill my name as John"
  it("Scenario 4: 'fill my name as John' fills ONLY the requested field with value", () => {
    const classification = classifyGoal("fill my name as John", createMockPageMap(demoElements));
    expect(classification.mode).toBe("fill");
    expect(classification.extractedIntent?.target).toBe("name");
    expect(classification.extractedIntent?.value).toBe("John");

    const plan = createRuleBasedPlan({
      userGoal: "fill my name as John",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("type");
    expect(plan.actions[0].target?.elementId).toBe("el-name");
    expect(plan.actions[0].value).toBe("John");

    const invalidActionValidation = validateActionAgainstGoal(
      { id: "2", type: "type", target: { elementId: "el-search" }, value: "John", reason: "wrong field" },
      {
        userGoal: "fill my name as John",
        classification,
        pageElements: demoElements,
        previousActions: [],
        stepNumber: 0,
      }
    );
    expect(invalidActionValidation.valid).toBe(false);
  });

  // Scenario 5: "search for laptops under 50000"
  it("Scenario 5: 'search for laptops under 50000' targets search input with full query", () => {
    const classification = classifyGoal("search for laptops under 50000", createMockPageMap(demoElements));
    expect(classification.mode).toBe("search");
    expect(classification.extractedIntent?.value).toBe("laptops under 50000");

    const plan = createRuleBasedPlan({
      userGoal: "search for laptops under 50000",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("type");
    expect(plan.actions[0].target?.elementId).toBe("el-search");
    expect(plan.actions[0].value).toBe("laptops under 50000");
  });

  // Scenario 6: "delete my account"
  it("Scenario 6: 'delete my account' is marked HIGH RISK and requires confirmation", () => {
    const classification = classifyGoal("delete my account", createMockPageMap(demoElements));
    expect(classification.mode).toBe("delete");
    expect(classification.riskLevel).toBe("high");
    expect(classification.requiresConfirmation).toBe(true);

    const plan = createRuleBasedPlan({
      userGoal: "delete my account",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [],
    });

    expect(plan.requiresUserConfirmation).toBe(true);
    expect(plan.actions[0].risk).toBe("high");
    expect(plan.actions[0].target?.elementId).toBe("el-delete");

    const policy = validateAction(plan.actions[0], demoElements, "http://localhost:3002");
    expect(policy.policy).toBe("confirm");
  });

  // Scenario 7: "find my email"
  it("Scenario 7: 'find my email' highlights field location without exposing raw PII", () => {
    const classification = classifyGoal("find my email", createMockPageMap(demoElements));
    expect(classification.mode).toBe("find");

    const plan = createRuleBasedPlan({
      userGoal: "find my email",
      pageMap: createMockPageMap(demoElements),
      redactionManifest: [
        { category: "email", bounds: { x: 150, y: 110, width: 300, height: 40 }, confidence: 0.95, replacement: "[REDACTED_EMAIL]" },
      ],
    });

    expect(plan.actions.some((a) => a.type === "highlight")).toBe(true);
    expect(plan.actions.some((a) => a.type === "click" || a.type === "type")).toBe(false);
  });

  // Scenario 8: "do something" / "continue"
  it("Scenario 8: 'do something' and 'continue' are ambiguous and trigger 0 actions", () => {
    const ambiguousGoals = ["do something", "continue", "do it", "handle this", "go ahead"];
    for (const goal of ambiguousGoals) {
      const classification = classifyGoal(goal, createMockPageMap(demoElements));
      expect(classification.mode).toBe("ambiguous");
      expect(classification.requiresClarification).toBe(true);
      expect(shouldExecuteActions(classification)).toBe(false);

      const plan = createRuleBasedPlan({
        userGoal: goal,
        pageMap: createMockPageMap(demoElements),
        redactionManifest: [],
      });

      expect(plan.actions).toHaveLength(0);
      expect(plan.summary.toLowerCase()).toContain("clarify");
    }
  });
});

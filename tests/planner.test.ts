import { describe, it, expect } from "vitest";
import { createRuleBasedPlan } from "../server/src/planner/ruleBasedPlanner";

const createMockPageMap = (elements: any[]) => ({
  urlOrigin: "https://example.com",
  title: "Test Page",
  viewport: { width: 1920, height: 1080 },
  elements,
});

const mockElements = [
  {
    id: "el-1",
    dataVeilId: "el-1",
    role: "button" as const,
    label: "Submit Request",
    bounds: { x: 100, y: 100, width: 120, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-2",
    dataVeilId: "el-2",
    role: "textbox" as const,
    label: "Search products",
    bounds: { x: 100, y: 200, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-3",
    dataVeilId: "el-3",
    role: "textbox" as const,
    label: "Full Name",
    bounds: { x: 100, y: 300, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-4",
    dataVeilId: "el-4",
    role: "textbox" as const,
    label: "Email",
    bounds: { x: 100, y: 400, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
  {
    id: "el-5",
    dataVeilId: "el-5",
    role: "textbox" as const,
    label: "Password",
    bounds: { x: 100, y: 500, width: 300, height: 40 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
];

describe("VEIL Rule-Based Planner", () => {
  it("finds submit button for submit goal", () => {
    const context = {
      userGoal: "Find the submit button and prepare the form",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.actions.some((a) => a.type === "highlight")).toBe(true);
    expect(plan.actions.some((a) => a.type === "focus")).toBe(true);
    expect(plan.summary).toContain("submit");
  });

  it("finds search input for search goal", () => {
    const context = {
      userGoal: "Search for products",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.some((a) => a.type === "highlight")).toBe(true);
    expect(plan.summary).toContain("search");
  });

  it("handles form preparation goal", () => {
    const context = {
      userGoal: "Prepare the form for filling",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.requiresUserConfirmation).toBe(true);
  });

  it("handles scroll down goal", () => {
    const context = {
      userGoal: "Scroll down to see more",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.some((a) => a.type === "scroll" && a.direction === "down")).toBe(true);
    expect(plan.confidence).toBeGreaterThan(0.8);
  });

  it("handles scroll up goal", () => {
    const context = {
      userGoal: "Scroll up",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.some((a) => a.type === "scroll" && a.direction === "up")).toBe(true);
  });

  it("requires confirmation when sensitive redactions present", () => {
    const context = {
      userGoal: "Click the button",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [
        { category: "password" as const, bounds: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.9, replacement: "[REDACTED_PASSWORD]" },
      ],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.requiresUserConfirmation).toBe(true);
  });

  it("returns low confidence for unknown goals", () => {
    const context = {
      userGoal: "Do something completely random and unknown",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.confidence).toBeLessThan(0.5);
  });

  it("highlights first interactive element for vague goals", () => {
    const context = {
      userGoal: "Do something",
      pageMap: createMockPageMap(mockElements),
      redactionManifest: [],
    };

    const plan = createRuleBasedPlan(context);

    expect(plan.actions.some((a) => a.type === "highlight")).toBe(true);
  });
});
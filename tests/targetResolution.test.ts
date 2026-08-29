import { describe, it, expect } from "vitest";
import { validateActionAgainstGoal } from "../shared/src/planner/actionValidator";
import { classifyGoal } from "../shared/src/planner/goalClassifier";

describe("Multi-Signal Target Resolution", () => {
  const elements = [
    {
      id: "el-1",
      role: "button" as const,
      label: "Submit Payment",
      name: "submitBtn",
      elementId: "btn-submit-main",
      selector: "#btn-submit-main",
      xpath: "//*[@id='btn-submit-main']",
      bounds: { x: 100, y: 200, width: 120, height: 40 },
      visible: true,
      enabled: true,
      sensitive: false,
    },
    {
      id: "el-2",
      role: "textbox" as const,
      label: "Full Name",
      name: "user_full_name",
      elementId: "input-name",
      placeholder: "e.g. Alice Smith",
      selector: "#input-name",
      bounds: { x: 100, y: 100, width: 300, height: 40 },
      visible: true,
      enabled: true,
      sensitive: false,
    },
  ];

  it("resolves target by element ID", () => {
    const classification = classifyGoal("click the submit button", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a1", type: "click", target: { elementId: "el-1" }, reason: "Submit" },
      {
        userGoal: "click the submit button",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(true);
  });

  it("resolves target by bounding box intersection", () => {
    const classification = classifyGoal("click the submit button", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a2", type: "click", target: { bounds: { x: 110, y: 210, width: 20, height: 20 } }, reason: "Submit" },
      {
        userGoal: "click the submit button",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(true);
  });

  it("resolves target by DOM id attribute (fallback)", () => {
    const classification = classifyGoal("click the submit button", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a4", type: "click", target: { elementId: "btn-submit-main" }, reason: "Submit" },
      {
        userGoal: "click the submit button",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(true);
  });

  it("resolves target by CSS selector and label", () => {
    const classification = classifyGoal("fill my name as John", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a5", type: "type", value: "John", target: { selector: "#input-name", label: "Full Name" }, reason: "Fill name" },
      {
        userGoal: "fill my name as John",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(true);
  });

  it("resolves target by placeholder text", () => {
    const classification = classifyGoal("fill my name as John", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a6", type: "type", value: "John", target: { label: "e.g. Alice Smith" }, reason: "Fill name" },
      {
        userGoal: "fill my name as John",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(true);
  });

  it("fails honestly when target cannot be resolved", () => {
    const classification = classifyGoal("click the submit button", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const result = validateActionAgainstGoal(
      { id: "a7", type: "click", target: { elementId: "completely-nonexistent-id" }, reason: "Click" },
      {
        userGoal: "click the submit button",
        classification,
        pageElements: elements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found in current page observation");
  });

  it("rejects actions targeting sensitive elements", () => {
    const sensitiveElements = [
      ...elements,
      {
        id: "el-sensitive",
        role: "textbox" as const,
        label: "Password",
        bounds: { x: 100, y: 300, width: 200, height: 40 },
        visible: true,
        enabled: true,
        sensitive: true,
      },
    ];

    const classification = classifyGoal("fill password", {
      urlOrigin: "http://localhost:3002",
      title: "Test",
      viewport: { width: 1920, height: 1080 },
      elements: sensitiveElements,
    });

    const result = validateActionAgainstGoal(
      { id: "a8", type: "type", value: "secret", target: { elementId: "el-sensitive" }, reason: "Fill" },
      {
        userGoal: "fill password",
        classification,
        pageElements: sensitiveElements,
        previousActions: [],
        stepNumber: 0,
      }
    );

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("sensitive");
  });

  it("proves planner-generated target matches observation element ID", async () => {
    const { planAction } = await import("../server/src/planner/ruleBasedPlanner");
    const plan = await planAction({
      userGoal: "click the submit button",
      pageMap: {
        urlOrigin: "http://localhost:3002",
        title: "Veil Demo Page",
        viewport: { width: 1920, height: 1080 },
        elements,
      },
      redactionManifest: [],
    });

    expect(plan.actions.length).toBeGreaterThan(0);
    const action = plan.actions[0];
    expect(action.target?.elementId).toBe("el-1");

    const classification = classifyGoal("click the submit button", {
      urlOrigin: "http://localhost:3002",
      title: "Veil Demo Page",
      viewport: { width: 1920, height: 1080 },
      elements,
    });

    const validation = validateActionAgainstGoal(action, {
      userGoal: "click the submit button",
      classification,
      pageElements: elements,
      previousActions: [],
      stepNumber: 0,
    });

    expect(validation.valid).toBe(true);
  });
});

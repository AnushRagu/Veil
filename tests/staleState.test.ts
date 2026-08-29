import { describe, it, expect } from "vitest";
import { validateActionAgainstGoal } from "../shared/src/planner/actionValidator";
import { classifyGoal } from "../shared/src/planner/goalClassifier";

describe("Stale State Invalidation", () => {
  const initialElements = [
    {
      id: "el-login-btn",
      role: "button" as const,
      label: "Log In",
      bounds: { x: 100, y: 100, width: 100, height: 40 },
      visible: true,
      enabled: true,
      sensitive: false,
    },
  ];

  const postNavElements = [
    {
      id: "el-dashboard-title",
      role: "heading" as const,
      label: "User Dashboard",
      bounds: { x: 100, y: 100, width: 300, height: 40 },
      visible: true,
      enabled: true,
      sensitive: false,
    },
  ];

  it("invalidates action targeting previous page state when elements change", () => {
    const classification = classifyGoal("click the login button", {
      urlOrigin: "http://localhost:3002",
      title: "Login Page",
      viewport: { width: 1920, height: 1080 },
      elements: initialElements,
    });

    // Valid on initial page
    const initialValidation = validateActionAgainstGoal(
      { id: "a1", type: "click", target: { elementId: "el-login-btn" }, reason: "Log in" },
      {
        userGoal: "click the login button",
        classification,
        pageElements: initialElements,
        previousActions: [],
        stepNumber: 0,
      }
    );
    expect(initialValidation.valid).toBe(true);

    // Invalid after navigation
    const postNavValidation = validateActionAgainstGoal(
      { id: "a1", type: "click", target: { elementId: "el-login-btn" }, reason: "Log in" },
      {
        userGoal: "click the login button",
        classification,
        pageElements: postNavElements,
        previousActions: [],
        stepNumber: 1,
      }
    );
    expect(postNavValidation.valid).toBe(false);
    expect(postNavValidation.reason).toContain("not found");
  });
});

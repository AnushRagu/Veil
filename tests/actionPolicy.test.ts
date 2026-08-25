import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateAction,
  evaluateRiskLevel,
  generateActionExplanation,
  ACTION_POLICY,
  HIGH_CONFIDENCE_AUTO_ACTIONS,
  CONFIRMATION_REQUIRED_ACTIONS,
} from "../extension/src/background/index";

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
    label: "Password",
    bounds: { x: 100, y: 200, width: 200, height: 40 },
    visible: true,
    enabled: true,
    sensitive: true,
  },
  {
    id: "el-3",
    dataVeilId: "el-3",
    role: "link" as const,
    label: "External Link",
    bounds: { x: 100, y: 300, width: 100, height: 30 },
    visible: true,
    enabled: true,
    sensitive: false,
    href: "https://external.com",
  },
  {
    id: "el-4",
    dataVeilId: "el-4",
    role: "button" as const,
    label: "Delete Account",
    bounds: { x: 100, y: 400, width: 120, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-5",
    dataVeilId: "el-5",
    role: "tab" as const,
    label: "Account Settings Tab",
    bounds: { x: 100, y: 500, width: 100, height: 30 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
  {
    id: "el-6",
    dataVeilId: "el-6",
    role: "button" as const,
    label: "Buy Now",
    bounds: { x: 100, y: 600, width: 120, height: 40 },
    visible: true,
    enabled: true,
    sensitive: false,
  },
];

describe("VEIL 5-Level Structural Risk-Based Policy Engine", () => {
  describe("Level 0: Observation (AUTO)", () => {
    it("allows highlight with auto policy", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "highlight" as const,
        target: { elementId: "el-1" },
        reason: "Inspect submit button",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_0_observation");
      expect(result.policy).toBe("auto");
      expect(result.explanation).toContain("observation");
    });

    it("allows scroll with auto policy", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "scroll" as const,
        direction: "down" as const,
        amount: 300,
        reason: "Scroll down",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_0_observation");
      expect(result.policy).toBe("auto");
    });

    it("allows focus with auto policy", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "focus" as const,
        target: { elementId: "el-1" },
        reason: "Focus",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_0_observation");
      expect(result.policy).toBe("auto");
    });

    it("allows wait with auto policy", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "wait" as const,
        amount: 500,
        reason: "Wait for render",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_0_observation");
      expect(result.policy).toBe("auto");
    });
  });

  describe("Level 1: Reversible (AUTO)", () => {
    it("allows reversible tab toggle action", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "click" as const,
        target: { elementId: "el-5" },
        reason: "Switch tab",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_1_reversible");
      expect(result.policy).toBe("auto");
      expect(result.explanation).toContain("reversible UI toggle");
    });
  });

  describe("Level 2: Data Entry (CONFIRM / EVALUATE)", () => {
    it("requires confirmation for typing action", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "type" as const,
        target: { elementId: "el-1" },
        value: "Test Data",
        reason: "Type text",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_2_data_entry");
      expect(result.policy).toBe("confirm");
      expect(result.explanation).toContain("wants to enter data");
    });
  });

  describe("Level 3: Consequential (STRICT USER CONFIRMATION)", () => {
    it("requires strict confirmation with explicit explanation for buy/purchase action", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "click" as const,
        target: { elementId: "el-6" },
        reason: "Initiate purchase",
        confidence: 0.95,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_3_consequential");
      expect(result.policy).toBe("confirm");
      expect(result.explanation).toContain("consequential state change or external transaction");
    });

    it("requires strict confirmation for account deletion", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "click" as const,
        target: { elementId: "el-4" },
        reason: "Delete account",
        confidence: 0.95,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_3_consequential");
      expect(result.policy).toBe("confirm");
    });
  });

  describe("Level 4: High Risk / Lockout (HARD REJECT)", () => {
    it("hard locks out action targeting sensitive/password element", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "type" as const,
        target: { elementId: "el-2" },
        value: "secret",
        reason: "Type password",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.riskLevel).toBe("level_4_high_risk");
      expect(result.policy).toBe("reject");
      expect(result.validationPassed).toBe(false);
      expect(result.explanation).toContain("blocked this action");
    });

    it("rejects action when target element is not found", () => {
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "click" as const,
        target: { elementId: "non-existent-id" },
        reason: "Click non-existent",
        confidence: 0.9,
      };
      const result = validateAction(action, mockElements);
      expect(result.policy).toBe("reject");
      expect(result.validationPassed).toBe(false);
    });

    it("rejects action targeting invisible element", () => {
      const hiddenElements = [
        ...mockElements,
        { ...mockElements[0], id: "el-hidden", dataVeilId: "el-hidden", visible: false },
      ];
      const action = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        type: "click" as const,
        target: { elementId: "el-hidden" },
        reason: "Click hidden",
        confidence: 0.9,
      };
      const result = validateAction(action, hiddenElements);
      expect(result.policy).toBe("reject");
      expect(result.validationPassed).toBe(false);
    });
  });

  describe("Policy Constants", () => {
    it("defines observation actions as auto", () => {
      expect(ACTION_POLICY.highlight).toBe("auto");
      expect(ACTION_POLICY.scroll).toBe("auto");
      expect(ACTION_POLICY.focus).toBe("auto");
      expect(ACTION_POLICY.wait).toBe("auto");
      expect(ACTION_POLICY.inspect).toBe("auto");
    });

    it("defines risky actions as confirm", () => {
      expect(ACTION_POLICY.click).toBe("confirm");
      expect(ACTION_POLICY.type).toBe("confirm");
    });
  });
});
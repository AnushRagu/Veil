import { describe, it, expect } from "vitest";
import {
  detectPIICategory,
  findAllPII,
  getReplacementToken,
  SENSITIVE_LABEL_KEYWORDS,
  EXPLICIT_SENSITIVE_ATTRS,
} from "../extension/src/redaction/patterns";
import { ClientPayloadSchema, ServerPlanSchema, validateClientPayload, validateServerPlan } from "@veil/shared";

describe("VEIL PII Detection", () => {
  describe("detectPIICategory", () => {
    it("detects email addresses", () => {
      const result = detectPIICategory("Contact me at user@example.com");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("email");
    });

    it("detects phone numbers", () => {
      const result = detectPIICategory("Call +1 (555) 123-4567");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("phone");
    });

    it("detects credit card numbers", () => {
      const result = detectPIICategory("Card: 4242 4242 4242 4242");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("credit_card");
    });

    it("detects CVV", () => {
      const result = detectPIICategory("CVV: 123");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("cvv");
    });

    it("detects Aadhaar", () => {
      const result = detectPIICategory("Aadhaar: 1234 5678 9012");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("aadhaar");
    });

    it("detects PAN", () => {
      const result = detectPIICategory("PAN: ABCDE1234F");
      expect(result).not.toBeNull();
      expect(result?.category).toBe("pan");
    });

    it("returns null for non-PII text", () => {
      const result = detectPIICategory("Hello world");
      expect(result).toBeNull();
    });
  });

  describe("findAllPII", () => {
    it("finds multiple PII types in text", () => {
      const text = "Email: test@example.com, Phone: +1-555-123-4567, Card: 4242-4242-4242-4242";
      const results = findAllPII(text);
      expect(results.length).toBeGreaterThanOrEqual(3);
      const categories = results.map((r) => r.category);
      expect(categories).toContain("email");
      expect(categories).toContain("phone");
      expect(categories).toContain("credit_card");
    });

    it("returns empty array for clean text", () => {
      const results = findAllPII("This is clean text with no PII");
      expect(results).toEqual([]);
    });
  });

  describe("getReplacementToken", () => {
    it("returns correct tokens for known categories", () => {
      expect(getReplacementToken("email")).toBe("[REDACTED_EMAIL]");
      expect(getReplacementToken("phone")).toBe("[REDACTED_PHONE]");
      expect(getReplacementToken("credit_card")).toBe("[REDACTED_CARD]");
      expect(getReplacementToken("password")).toBe("[REDACTED_PASSWORD]");
      expect(getReplacementToken("face")).toBe("[REDACTED_FACE]");
    });

    it("returns generic token for unknown categories", () => {
      expect(getReplacementToken("unknown")).toBe("[REDACTED]");
    });
  });
});

describe("VEIL Schema Validation", () => {
  describe("ClientPayloadSchema", () => {
    it("validates a correct payload", () => {
      const payload = {
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        timestamp: new Date().toISOString(),
        userGoal: "Find submit button",
        pageMap: {
          urlOrigin: "https://example.com",
          title: "Test Page",
          viewport: { width: 1920, height: 1080 },
          elements: [
            {
              id: "el-1",
              dataVeilId: "el-1",
              role: "button",
              label: "Submit",
              bounds: { x: 100, y: 100, width: 80, height: 40 },
              visible: true,
              enabled: true,
              sensitive: false,
            },
          ],
        },
        redactionManifest: [],
      };

      const result = validateClientPayload(payload);
      expect(result.sessionId).toBe(payload.sessionId);
    });

    it("rejects payload with missing required fields", () => {
      const payload = {
        sessionId: "123e4567-e89b-12d3-a456-426614174000",
        userGoal: "Test",
      };

      expect(() => validateClientPayload(payload)).toThrow();
    });

    it("rejects invalid sessionId format", () => {
      const payload = {
        sessionId: "invalid-uuid",
        timestamp: new Date().toISOString(),
        userGoal: "Test",
        pageMap: {
          urlOrigin: "https://example.com",
          title: "Test",
          viewport: { width: 100, height: 100 },
          elements: [],
        },
        redactionManifest: [],
      };

      expect(() => validateClientPayload(payload)).toThrow();
    });
  });

  describe("ServerPlanSchema", () => {
    it("validates a correct plan", () => {
      const plan = {
        summary: "Found submit button",
        confidence: 0.9,
        requiresUserConfirmation: false,
        actions: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            type: "highlight",
            target: { elementId: "el-1" },
            reason: "Highlight submit button",
            confidence: 0.9,
          },
        ],
      };

      const result = validateServerPlan(plan);
      expect(result.actions.length).toBe(1);
    });

    it("rejects plan with invalid action type", () => {
      const plan = {
        summary: "Test",
        confidence: 0.5,
        requiresUserConfirmation: false,
        actions: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            type: "invalid_type",
            reason: "Test",
            confidence: 0.5,
          },
        ],
      };

      expect(() => validateServerPlan(plan)).toThrow();
    });
  });
});

describe("Redaction Logic & Defensive Attributes", () => {
  it("has comprehensive sensitive label keywords", () => {
    expect(SENSITIVE_LABEL_KEYWORDS.length).toBeGreaterThan(20);
    expect(SENSITIVE_LABEL_KEYWORDS).toContain("password");
    expect(SENSITIVE_LABEL_KEYWORDS).toContain("credit card");
    expect(SENSITIVE_LABEL_KEYWORDS).toContain("cvv");
  });

  it("has explicit sensitive attributes", () => {
    expect(EXPLICIT_SENSITIVE_ATTRS).toContain("data-sensitive");
    expect(EXPLICIT_SENSITIVE_ATTRS).toContain("data-private");
    expect(EXPLICIT_SENSITIVE_ATTRS).toContain("data-pii");
  });
});
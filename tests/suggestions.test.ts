import { describe, it, expect } from "vitest";
import {
  generatePageSuggestions,
  summarizeRedactionManifest,
} from "../shared/src/suggestions/suggestionEngine";
import { PageMap, SanitizedElement, RedactionManifest } from "../shared/src/schemas";

describe("Direct Executable Suggestions & Redaction Summary Engine", () => {
  it("generates default scroll suggestion for empty page map", () => {
    const suggestions = generatePageSuggestions(null);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].category).toBe("scroll");
    expect(suggestions[0].label).toBe("Scroll down");
    expect(suggestions[0].action.type).toBe("scroll");
  });

  it("suggests direct search action when search input is detected", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Store",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-search",
          role: "searchbox",
          label: "Search products",
          bounds: { x: 100, y: 50, width: 200, height: 40 },
          visible: true,
          enabled: true,
          sensitive: false,
          placeholder: "Search products...",
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const searchSug = suggestions.find((s) => s.category === "search");
    expect(searchSug).toBeDefined();
    expect(searchSug?.label).toBe("Search products");
    expect(searchSug?.action.type).toBe("focus");
    expect(searchSug?.label).not.toContain("Find");
  });

  it("suggests direct executable actions for buttons (e.g. Submit form, Open settings)", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Checkout",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-submit",
          role: "button",
          label: "Submit Request",
          bounds: { x: 100, y: 200, width: 150, height: 45 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
        {
          id: "el-modal",
          role: "button",
          label: "Open Settings Modal",
          bounds: { x: 260, y: 200, width: 100, height: 45 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const submitSug = suggestions.find((s) => s.label === "Submit form");
    expect(submitSug).toBeDefined();
    expect(submitSug?.category).toBe("action");
    expect(submitSug?.action.type).toBe("click");

    const settingsSug = suggestions.find((s) => s.label === "Open settings");
    expect(settingsSug).toBeDefined();
    expect(settingsSug?.action.type).toBe("click");
  });

  it("suggests opening destination for search result links on Google (e.g. Open YouTube)", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://www.google.com",
      title: "Google Search",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-search",
          role: "searchbox",
          label: "Search",
          bounds: { x: 100, y: 50, width: 500, height: 40 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
        {
          id: "el-yt",
          role: "link",
          label: "YouTube",
          bounds: { x: 100, y: 150, width: 200, height: 30 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const ytSug = suggestions.find((s) => s.label === "Open YouTube");
    expect(ytSug).toBeDefined();
    expect(ytSug?.action.type).toBe("click");
  });

  it("does not duplicate current user goal in suggestions", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Form",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-submit",
          role: "button",
          label: "Submit Request",
          bounds: { x: 100, y: 200, width: 150, height: 45 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap, "submit the form");
    expect(suggestions.some((s) => s.label === "Submit form")).toBe(false);
  });

  it("never includes sensitive fields in suggestions", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Login",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-pass",
          role: "textbox",
          label: "[REDACTED_PASSWORD]",
          bounds: { x: 100, y: 100, width: 200, height: 40 },
          visible: true,
          enabled: true,
          sensitive: true,
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const sensitiveSug = suggestions.find((s) => s.label.includes("REDACTED"));
    expect(sensitiveSug).toBeUndefined();
  });

  it("correctly summarizes and groups redaction manifest entries without leaking raw values", () => {
    const manifest: RedactionManifest = [
      { category: "email", bounds: { x: 0, y: 0, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_EMAIL]" },
      { category: "email", bounds: { x: 0, y: 20, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_EMAIL]" },
      { category: "phone", bounds: { x: 0, y: 40, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_PHONE]" },
      { category: "password", bounds: { x: 0, y: 60, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_PASSWORD]" },
      { category: "otp", bounds: { x: 0, y: 80, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_OTP]" },
      { category: "credit_card", bounds: { x: 0, y: 100, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_CARD]" },
      { category: "aadhaar", bounds: { x: 0, y: 120, width: 10, height: 10 }, confidence: 1, replacement: "[REDACTED_AADHAAR]" },
    ];

    const summary = summarizeRedactionManifest(manifest);
    expect(summary.totalCount).toBe(7);
    expect(summary.hasSensitiveData).toBe(true);
    expect(summary.groups.length).toBe(6);

    const emailGroup = summary.groups.find((g) => g.category === "email");
    expect(emailGroup?.count).toBe(2);
    expect(emailGroup?.label).toBe("Email Address");
    expect(emailGroup?.replacementToken).toBe("[REDACTED_EMAIL]");

    const aadhaarGroup = summary.groups.find((g) => g.category === "aadhaar");
    expect(aadhaarGroup?.count).toBe(1);
    expect(aadhaarGroup?.replacementToken).toBe("[REDACTED_AADHAAR]");
  });

  it("handles empty redaction manifest gracefully", () => {
    const summary = summarizeRedactionManifest([]);
    expect(summary.totalCount).toBe(0);
    expect(summary.hasSensitiveData).toBe(false);
    expect(summary.groups).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { generatePageSuggestions } from "../shared/src/suggestions/suggestionEngine";
import { PageMap, SanitizedElement } from "../shared/src/schemas";

describe("Context-Aware Suggestion Engine", () => {
  it("generates default scroll suggestion for empty page map", () => {
    const suggestions = generatePageSuggestions(null);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].category).toBe("scroll");
    expect(suggestions[0].label).toBe("Scroll down");
  });

  it("suggests search when search input is detected", () => {
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
          placeholder: "Search...",
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const searchSug = suggestions.find((s) => s.category === "search");
    expect(searchSug).toBeDefined();
    expect(searchSug?.label).toBe("Search page");
    expect(searchSug?.action.type).toBe("focus");
  });

  it("suggests finding prominent visible safe buttons", () => {
    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Checkout",
      viewport: { width: 1280, height: 800 },
      elements: [
        {
          id: "el-submit",
          role: "button",
          label: "Submit Order",
          bounds: { x: 100, y: 200, width: 150, height: 45 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
        {
          id: "el-cancel",
          role: "button",
          label: "Cancel",
          bounds: { x: 260, y: 200, width: 100, height: 45 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
      ],
    };

    const suggestions = generatePageSuggestions(pageMap);
    const submitSug = suggestions.find((s) => s.label.includes("Submit Order"));
    expect(submitSug).toBeDefined();
    expect(submitSug?.category).toBe("find");
    expect(submitSug?.action.type).toBe("highlight");
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

  it("limits total suggestions to maximum 5", () => {
    const elements: SanitizedElement[] = Array.from({ length: 15 }, (_, i) => ({
      id: `el-${i}`,
      role: "button",
      label: `Action ${i}`,
      bounds: { x: 100, y: i * 50, width: 100, height: 40 },
      visible: true,
      enabled: true,
      sensitive: false,
    }));

    const pageMap: PageMap = {
      urlOrigin: "https://example.com",
      title: "Dashboard",
      viewport: { width: 1280, height: 800 },
      elements,
    };

    const suggestions = generatePageSuggestions(pageMap);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractSanitizedElements, processRedaction, createRedactionManifest, applyRedactionToScreenshot } from "../src/redaction/redactionEngine";
import { SanitizedElement } from "@veil/shared";

describe("VEIL Redaction Engine", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("extractSanitizedElements & Persistent data-veil-id Grounding", () => {
    it("extracts visible interactive elements and stamps data-veil-id", () => {
      document.body.innerHTML = `
        <button id="btn1">Click me</button>
        <input id="email" type="email" placeholder="Email">
        <a href="/link">Link</a>
        <div style="display: none;">Hidden</div>
      `;

      const elements = extractSanitizedElements(document);
      expect(elements.length).toBeGreaterThanOrEqual(3);
      expect(elements.some(e => e.role === "button")).toBe(true);
      expect(elements.some(e => e.role === "textbox")).toBe(true);
      expect(elements.some(e => e.role === "link")).toBe(true);

      // Verify persistent data-veil-id was stamped into the DOM
      const btn = document.getElementById("btn1");
      expect(btn?.getAttribute("data-veil-id")).toBeTruthy();
    });

    it("marks sensitive elements", () => {
      document.body.innerHTML = `
        <input type="password" id="pwd" autocomplete="current-password">
        <input type="text" data-sensitive="true" id="ssn">
        <input type="text" id="normal">
      `;

      const elements = extractSanitizedElements(document);
      const pwdId = document.getElementById("pwd")?.getAttribute("data-veil-id");
      const ssnId = document.getElementById("ssn")?.getAttribute("data-veil-id");
      const normalId = document.getElementById("normal")?.getAttribute("data-veil-id");

      const pwdEl = elements.find(e => e.id === pwdId);
      const ssnEl = elements.find(e => e.id === ssnId);
      const normalEl = elements.find(e => e.id === normalId);

      expect(pwdEl?.sensitive).toBe(true);
      expect(ssnEl?.sensitive).toBe(true);
      expect(normalEl?.sensitive).toBe(false);
    });

    it("skips hidden elements", () => {
      document.body.innerHTML = `
        <button style="display: none;">Hidden</button>
        <button>Visible</button>
      `;

      const elements = extractSanitizedElements(document);
      expect(elements.length).toBe(1);
      expect(elements[0].label).toBe("Visible");
    });
  });

  describe("createRedactionManifest", () => {
    const mockElements: SanitizedElement[] = [
      {
        id: "el-1",
        dataVeilId: "el-1",
        role: "textbox",
        label: "Password",
        bounds: { x: 100, y: 100, width: 200, height: 40 },
        visible: true,
        enabled: true,
        sensitive: true,
      },
      {
        id: "el-2",
        dataVeilId: "el-2",
        role: "textbox",
        label: "Email",
        bounds: { x: 100, y: 200, width: 200, height: 40 },
        visible: true,
        enabled: true,
        sensitive: true,
      },
      {
        id: "el-3",
        dataVeilId: "el-3",
        role: "button",
        label: "Submit",
        bounds: { x: 100, y: 300, width: 100, height: 40 },
        visible: true,
        enabled: true,
        sensitive: false,
      },
    ];

    it("creates manifest for sensitive elements", () => {
      const manifest = createRedactionManifest(mockElements, 800, 600);
      expect(manifest.length).toBe(2);
      expect(manifest[0].category).toBe("password");
      expect(manifest[1].category).toBe("email");
      expect(manifest[0].replacement).toBe("[REDACTED_PASSWORD]");
      expect(manifest[1].replacement).toBe("[REDACTED_EMAIL]");
    });

    it("includes bounds and confidence", () => {
      const manifest = createRedactionManifest(mockElements, 800, 600);
      expect(manifest[0].bounds).toEqual({ x: 100, y: 100, width: 200, height: 40 });
      expect(manifest[0].confidence).toBeGreaterThan(0);
      expect(manifest[0].confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("processRedaction", () => {
    it("redacts sensitive elements and creates manifest", () => {
      const elements: SanitizedElement[] = [
        {
          id: "el-1",
          dataVeilId: "el-1",
          role: "textbox",
          label: "Password",
          bounds: { x: 100, y: 100, width: 200, height: 40 },
          visible: true,
          enabled: true,
          sensitive: true,
        },
        {
          id: "el-2",
          dataVeilId: "el-2",
          role: "button",
          label: "Submit",
          bounds: { x: 100, y: 200, width: 100, height: 40 },
          visible: true,
          enabled: true,
          sensitive: false,
        },
      ];

      const result = processRedaction({
        elements,
        screenshotWidth: 800,
        screenshotHeight: 600,
      });

      expect(result.redactedElements.length).toBe(2);
      expect(result.redactedElements[0].label).toBe("[REDACTED_PASSWORD]");
      expect(result.redactedElements[1].label).toBe("Submit");
      expect(result.manifest.length).toBe(1);
      expect(result.manifest[0].category).toBe("password");
    });
  });

  describe("applyRedactionToScreenshot", () => {
    it("applies black mask for non-face redactions", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;

      const manifest = [{
        category: "password" as const,
        bounds: { x: 10, y: 10, width: 20, height: 20 },
        confidence: 0.9,
        replacement: "[REDACTED_PASSWORD]",
      }];

      applyRedactionToScreenshot(canvas, manifest);

      expect(ctx.fillRect).toHaveBeenCalledWith(10, 10, 20, 20);
    });
  });
});
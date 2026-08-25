import { vi } from "vitest";

const mockChrome = {
  runtime: {
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    sendMessage: vi.fn((msg, cb) => {
      if (msg?.type === "CAPTURE_VISIBLE_TAB") {
        if (cb) cb({ success: true, dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" });
      } else if (cb) {
        cb({ success: true });
      }
    }),
    lastError: null,
    onInstalled: { addListener: vi.fn() },
  },
  tabs: {
    onActivated: { addListener: vi.fn() },
    query: vi.fn(),
    captureVisibleTab: vi.fn((_windowId, _options, cb) => {
      if (cb) cb("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
    }),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    local: { get: vi.fn(), set: vi.fn() },
  },
};

global.chrome = mockChrome as any;
global.fetch = vi.fn();
global.performance = { now: vi.fn(() => Date.now()) } as any;

if (typeof Element !== "undefined") {
  Element.prototype.getBoundingClientRect = function () {
    const el = this as HTMLElement;
    const style = (el.style ? el.style.display : "") || "";
    if (
      style === "none" ||
      el.getAttribute?.("style")?.includes("display: none") ||
      el.hasAttribute?.("hidden") ||
      el.getAttribute?.("aria-hidden") === "true"
    ) {
      return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 } as any;
    }
    return { x: 10, y: 10, width: 100, height: 40, top: 10, left: 10, right: 110, bottom: 50 } as any;
  };
}

if (typeof document !== "undefined") {
  document.elementFromPoint = function (_x, _y) {
    return document.body.firstElementChild || null;
  };
}

if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
    putImageData: vi.fn(),
    fillStyle: "",
    filter: "",
  })) as any;

  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,test");
  HTMLCanvasElement.prototype.cloneNode = vi.fn(() => document.createElement("canvas"));
}
import { vi } from "vitest";

const mockChrome = {
  runtime: {
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    sendMessage: vi.fn((msg, callback) => {
      if (msg?.type === "CAPTURE_VISIBLE_TAB") {
        if (callback) callback({ success: true, dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" });
      } else if (callback) {
        callback({ success: true });
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

Object.defineProperty(global, "chrome", {
  value: mockChrome,
  writable: true,
});

Object.defineProperty(global, "fetch", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(global, "performance", {
  value: { now: vi.fn(() => Date.now()) },
  writable: true,
});

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

export const mockCanvasCtx = {
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn((_x, _y, w = 20, h = 20) => {
    const data = new Uint8ClampedArray(w * h * 4);
    return { data, width: w, height: h };
  }),
  putImageData: vi.fn(),
  fillStyle: "",
  filter: "",
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasCtx) as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,test");
HTMLCanvasElement.prototype.cloneNode = vi.fn(() => document.createElement("canvas"));
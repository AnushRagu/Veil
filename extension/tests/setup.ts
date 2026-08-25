import { vi } from "vitest";

Object.defineProperty(global, "chrome", {
  value: {
    runtime: {
      onMessage: { addListener: vi.fn() },
      sendMessage: vi.fn((msg, callback) => callback({ success: true })),
      lastError: null,
      onInstalled: { addListener: vi.fn() },
    },
    tabs: {
      onActivated: { addListener: vi.fn() },
      query: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
    storage: {
      local: { get: vi.fn(), set: vi.fn() },
    },
  },
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

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  fillStyle: "",
  filter: "",
})) as any;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,test");
HTMLCanvasElement.prototype.cloneNode = vi.fn(() => document.createElement("canvas"));

document.createTreeWalker = vi.fn(() => ({
  nextNode: vi.fn(() => null),
  currentNode: null,
})) as any;

NodeFilter = {
  SHOW_ELEMENT: 1,
  FILTER_ACCEPT: 1,
  FILTER_REJECT: 2,
  FILTER_SKIP: 3,
} as any;
import { vi } from "vitest";

global.chrome = {
  runtime: {
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    lastError: null,
  },
  tabs: {
    onActivated: { addListener: vi.fn() },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    local: { get: vi.fn(), set: vi.fn() },
  },
} as any;

global.fetch = vi.fn();
global.performance = { now: vi.fn(() => Date.now()) };
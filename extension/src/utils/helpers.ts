export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function sanitizeString(input: string, maxLength: number = 200): string {
  return input.slice(0, maxLength).replace(/[\r\n\t]/g, " ").trim();
}

export function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "extension://self";
  }
}

export function isSameOrigin(url1: string, url2: string): boolean {
  return getOrigin(url1) === getOrigin(url2);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rectFromElement(el: Element): DOMRect {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    toJSON: rect.toJSON.bind(rect),
  };
}

export function isElementVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function isElementEnabled(el: Element): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) {
    return !el.disabled;
  }
  return true;
}
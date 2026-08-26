import { extractSanitizedElements, processRedaction, RedactionContext } from "../redaction/redactionEngine";
import {
  SanitizedElement,
  PageMap,
  RedactionManifest,
  Bounds,
  ClientPayload,
} from "@privatesight/shared";
import { sanitizeString, getOrigin, generateSessionId } from "../utils/helpers";

interface ContentScriptState {
  sessionId: string | null;
  pageMap: PageMap | null;
  lastScreenshot: HTMLCanvasElement | null;
  lastRedactionManifest: RedactionManifest;
  isCapturing: boolean;
}

const state: ContentScriptState = {
  sessionId: null,
  pageMap: null,
  lastScreenshot: null,
  lastRedactionManifest: [],
  isCapturing: false,
};

function buildPageMap(elements: SanitizedElement[]): PageMap {
  return {
    urlOrigin: getOrigin(window.location.href),
    title: sanitizeString(document.title),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    elements,
  };
}

function hasValidBounds(bounds: Bounds | undefined): bounds is Bounds {
  return bounds !== undefined &&
    typeof bounds.x === "number" &&
    typeof bounds.y === "number" &&
    typeof bounds.width === "number" &&
    typeof bounds.height === "number";
}

async function captureViewport(): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  await new Promise<void>((resolve) => {
    const handleScroll = () => {
      window.removeEventListener("scroll", handleScroll);
      resolve();
    };
    window.addEventListener("scroll", handleScroll);
    setTimeout(resolve, 50);
  });

  try {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const elements = document.querySelectorAll("body *");
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    });
  } catch {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}

interface VisionResponse {
  ok: boolean;
  result?: {
    redactionEntries: RedactionManifest;
  };
  error?: string;
}

function requestVisionProcessing(
  dataUrl: string,
  width: number,
  height: number
): Promise<VisionResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "VISION_PROCESS",
        imageData: { dataUrl, width, height },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response ?? { ok: false, error: "No response from background" });
      }
    );
  });
}

async function performCapture(userGoal: string): Promise<ClientPayload> {
  if (state.isCapturing) {
    throw new Error("Capture already in progress");
  }
  state.isCapturing = true;

  try {
    const elements = extractSanitizedElements(document);
    const pageMap = buildPageMap(elements);

    const canvas = await captureViewport();
    state.lastScreenshot = canvas;

    // Run DOM-based redaction locally. This produces a redaction manifest
    // (without vision-based entries) and a sanitized element list.
    const redactionContext: RedactionContext = {
      elements: pageMap.elements,
      screenshotWidth: canvas.width,
      screenshotHeight: canvas.height,
    };

    const redactionResult = processRedaction(redactionContext);
    const localManifest = redactionResult.manifest;

    // Hand the screenshot off to the offscreen vision pipeline through the
    // background service worker. The content script never touches ONNX or
    // any module that uses import.meta.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const visionResponse = await requestVisionProcessing(
      dataUrl,
      canvas.width,
      canvas.height
    );

    const visionEntries: RedactionManifest = visionResponse.ok && visionResponse.result
      ? visionResponse.result.redactionEntries
      : [];

    const combinedManifest: RedactionManifest = [...localManifest, ...visionEntries];

    const finalElements = redactionResult.redactedElements.map((el) => {
      const visionRedaction = visionEntries.find((r) => {
        if (!hasValidBounds(r.bounds) || !hasValidBounds(el.bounds)) return false;
        const rb = r.bounds;
        const eb = el.bounds;
        return rb.x < eb.x + eb.width &&
          rb.x + rb.width > eb.x &&
          rb.y < eb.y + eb.height &&
          rb.y + rb.height > eb.y;
      });
      if (visionRedaction) {
        return { ...el, sensitive: true, label: visionRedaction.replacement };
      }
      return el;
    });

    const finalPageMap = buildPageMap(finalElements);

    // Apply all redactions (DOM + vision) to a clone of the screenshot so
    // the only image data leaving the device is fully redacted.
    const sanitizedCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
    applyRedactionsToCanvas(sanitizedCanvas, combinedManifest);
    const sanitizedScreenshot = sanitizedCanvas.toDataURL("image/jpeg", 0.7);

    state.pageMap = finalPageMap;
    state.lastRedactionManifest = combinedManifest;
    state.sessionId = generateSessionId();

    const payload: ClientPayload = {
      sessionId: state.sessionId,
      timestamp: new Date().toISOString(),
      userGoal,
      sanitizedScreenshot,
      pageMap: finalPageMap,
      redactionManifest: combinedManifest,
    };

    return payload;
  } finally {
    state.isCapturing = false;
  }
}

function applyRedactionsToCanvas(canvas: HTMLCanvasElement, manifest: RedactionManifest): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  for (const entry of manifest) {
    if (!hasValidBounds(entry.bounds)) continue;
    const { bounds, category } = entry;
    const x = Math.max(0, Math.floor(bounds.x));
    const y = Math.max(0, Math.floor(bounds.y));
    const w = Math.min(canvas.width - x, Math.floor(bounds.width));
    const h = Math.min(canvas.height - y, Math.floor(bounds.height));
    if (w <= 0 || h <= 0) continue;

    if (category === "face") {
      ctx.filter = "blur(8px)";
      ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
      ctx.filter = "none";
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(x, y, w, h);
    }
  }
}

async function executeAction(action: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { type, target, value, direction, amount } = action;

    let element: Element | null = null;
    if (target?.elementId) {
      element = document.querySelector(`[data-ps-id="${target.elementId}"]`);
    }

    if (!element && target?.bounds && hasValidBounds(target.bounds)) {
      const bounds = target.bounds;
      element = document.elementFromPoint(
        (bounds.x ?? 0) + (bounds.width ?? 0) / 2,
        (bounds.y ?? 0) + (bounds.height ?? 0) / 2
      );
    }

    if (!element) {
      return { success: false, error: "Target element not found" };
    }

    switch (type) {
      case "highlight":
        highlightElement(element);
        break;
      case "focus":
        (element as HTMLElement).focus();
        break;
      case "click":
        (element as HTMLElement).click();
        break;
      case "scroll":
        window.scrollBy({ top: direction === "down" ? amount ?? 300 : -(amount ?? 300), behavior: "smooth" });
        break;
      case "wait":
        await new Promise((r) => setTimeout(r, amount ?? 500));
        break;
      case "type":
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = value ?? "";
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
        break;
      default:
        return { success: false, error: `Unknown action type: ${type}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function highlightElement(element: Element): void {
  element.setAttribute("data-ps-highlight", "true");
  const style = document.createElement("style");
  style.textContent = `
    [data-ps-highlight] {
      outline: 3px solid #00d4aa !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(0, 212, 170, 0.3) !important;
      transition: outline 0.2s, box-shadow 0.2s !important;
    }
  `;
  document.head.appendChild(style);
  setTimeout(() => {
    element.removeAttribute("data-ps-highlight");
    style.remove();
  }, 3000);
}

function assignElementIds(elements: SanitizedElement[]): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let index = 0;
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    if (index < elements.length) {
      const elementId = elements[index].id!;
      el.setAttribute("data-ps-id", elementId);
      index++;
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "CAPTURE_AND_SEND": {
          const payload = await performCapture(message.userGoal);
          sendResponse({ success: true, payload });
          break;
        }
        case "EXECUTE_ACTIONS": {
          const results = [];
          for (const action of message.actions ?? []) {
            const result = await executeAction(action);
            results.push({ actionId: action.id, ...result });
          }
          sendResponse({ success: true, results });
          break;
        }
        case "GET_PAGE_MAP": {
          if (state.pageMap) {
            sendResponse({ success: true, pageMap: state.pageMap, redactionManifest: state.lastRedactionManifest });
          } else {
            const elements = extractSanitizedElements(document);
            const pageMap = buildPageMap(elements);
            assignElementIds(elements);
            state.pageMap = pageMap;
            sendResponse({ success: true, pageMap, redactionManifest: [] });
          }
          break;
        }
        case "GET_PRIVACY_STATUS": {
          sendResponse({
            success: true,
            status: {
              backend: "mock" as const,
              redactedCount: state.lastRedactionManifest.length,
              lastCapture: state.sessionId ? new Date().toISOString() : undefined,
              sessionActive: !!state.sessionId,
            },
          });
          break;
        }
        case "CLEAR_SESSION": {
          state.sessionId = null;
          state.pageMap = null;
          state.lastScreenshot = null;
          state.lastRedactionManifest = [];
          sendResponse({ success: true });
          break;
        }
        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  })();
  return true;
});

console.log("[Veil] Content script loaded");

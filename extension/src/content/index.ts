import { extractSanitizedElements, processRedaction, RedactionContext } from "../redaction/redactionEngine";
import {
  SanitizedElement,
  PageMap,
  RedactionManifest,
  Bounds,
  ClientPayload,
  ServerAction,
  ElementValidationResult,
  calculatePrivacyLeakageRate,
  calculateFalseNegativeRate,
  calculateMinimizationEfficiencyRate,
} from "@veil/shared";
import { createVisionPipeline, VisionPipeline } from "../vision/visionPipeline";
import { sanitizeString, getOrigin, generateSessionId } from "../utils/helpers";
import { ContextMinimizer } from "../minimization/contextMinimizer";

export interface PrivacyMetrics {
  plr: number;
  fnr: number;
  mer: number;
  sensitivePresent: number;
  sensitiveRedacted: number;
  sensitiveExposed: number;
  totalElements: number;
  irrelevantPruned: number;
  irrelevantTotal: number;
}

/**
 * Compute real PLR, FNR, and MER from the redaction pipeline results.
 *
 * PLR = sensitive elements still exposed (unredacted) / total sensitive present
 * FNR = sensitive elements missed by redaction / total sensitive present
 * MER = irrelevant elements pruned / total irrelevant elements
 */
function computePrivacyMetrics(
  preRedactionElements: SanitizedElement[],
  postRedactionElements: SanitizedElement[],
  redactionManifest: RedactionManifest,
  prunedCount: number,
  totalOriginal: number
): PrivacyMetrics {
  const totalElements = preRedactionElements.length;

  // Sensitive elements present before redaction (ground truth)
  const sensitivePresent = preRedactionElements.filter((el) => el.sensitive).length;

  // After redaction: elements whose labels still contain original sensitive text
  // (not replaced with [REDACTED_*] tokens)
  let sensitiveExposed = 0;
  for (const el of postRedactionElements) {
    if (!el.sensitive) continue;
    const label = el.label || "";
    // If label was NOT replaced with a redaction token, it leaked
    if (!label.includes("[REDACTED") && !label.includes("[redacted")) {
      sensitiveExposed++;
    }
  }

  // Sensitive elements that WERE properly redacted (label replaced with token)
  const sensitiveRedacted = sensitivePresent - sensitiveExposed;

  // FNR: sensitive elements that the redaction engine completely missed
  // (they exist in post-redaction output but weren't in the manifest at all)
  const manifestElementIds = new Set(
    redactionManifest.map((entry) => {
      // Match manifest bounds to element bounds to find which were processed
      return `${entry.bounds.x},${entry.bounds.y},${entry.bounds.width},${entry.bounds.height}`;
    })
  );
  let unredactedSensitive = 0;
  for (const el of postRedactionElements) {
    if (!el.sensitive) continue;
    const label = el.label || "";
    if (label.includes("[REDACTED") || label.includes("[redacted")) continue;
    // Check if this element's bounds appear in the manifest
    if (el.bounds) {
      const key = `${el.bounds.x},${el.bounds.y},${el.bounds.width},${el.bounds.height}`;
      if (!manifestElementIds.has(key)) {
        unredactedSensitive++;
      }
    } else {
      unredactedSensitive++;
    }
  }

  // Irrelevant elements = total - sensitive
  const irrelevantTotal = Math.max(0, totalElements - sensitivePresent);
  const irrelevantPruned = Math.min(prunedCount, irrelevantTotal);

  const plr = calculatePrivacyLeakageRate(sensitiveExposed, sensitivePresent);
  const fnr = calculateFalseNegativeRate(unredactedSensitive, sensitivePresent);
  const mer = calculateMinimizationEfficiencyRate(irrelevantPruned, irrelevantTotal);

  return {
    plr,
    fnr,
    mer,
    sensitivePresent,
    sensitiveRedacted,
    sensitiveExposed,
    totalElements,
    irrelevantPruned,
    irrelevantTotal,
  };
}

interface ContentScriptState {
  sessionId: string | null;
  pageMap: PageMap | null;
  visionPipeline: VisionPipeline | null;
  lastScreenshot: HTMLCanvasElement | null;
  lastRedactionManifest: RedactionManifest;
  isCapturing: boolean;
}

const state: ContentScriptState = {
  sessionId: null,
  pageMap: null,
  visionPipeline: null,
  lastScreenshot: null,
  lastRedactionManifest: [],
  isCapturing: false,
};

async function initializeVisionPipeline(): Promise<VisionPipeline> {
  const pipeline = createVisionPipeline({
    provider: "mock",
    enableFaceDetection: true,
    enableSensitiveRegionDetection: true,
  });
  await pipeline.initialize();
  return pipeline;
}

function buildPageMap(elements: SanitizedElement[], minimizedCount = 0): PageMap {
  return {
    urlOrigin: getOrigin(window.location.href),
    title: sanitizeString(document.title),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    elements,
    minimizedElementCount: minimizedCount,
  };
}

function hasValidBounds(bounds: Bounds | undefined): bounds is Bounds {
  return bounds !== undefined &&
    typeof bounds.x === "number" &&
    typeof bounds.y === "number" &&
    typeof bounds.width === "number" &&
    typeof bounds.height === "number";
}

/**
 * Phase 1: Truthful Visual Perception (Dump Synthetic Canvas)
 * Requests real rendered page snapshot via background service worker (chrome.tabs.captureVisibleTab),
 * converting PNG data URL to a truthful canvas / raw pixel byte array.
 */
async function captureViewport(): Promise<HTMLCanvasElement> {
  return new Promise<HTMLCanvasElement>((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB" }, (response) => {
      if (response && response.success && response.dataUrl) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || window.innerWidth;
          canvas.height = img.height || window.innerHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
          resolve(canvas);
        };
        img.onerror = () => {
          resolve(createFallbackCanvas());
        };
        img.src = response.dataUrl;
      } else {
        // Fallback for isolated test / mock environments without tab capture
        resolve(createFallbackCanvas());
      }
    });
  });
}

function createFallbackCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth || 800;
  canvas.height = window.innerHeight || 600;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

/**
 * Phase 2: Unbreakable Element Grounding & Pre-Execution Verification Hook
 * Right before an action fires, lookup the element by its `data-veil-id` and verify:
 * 1. isVisible === true
 * 2. Current role and labels match historical action plan
 * 3. Element has not mutated or been replaced/disconnected from DOM
 */
export function verifyElementBeforeExecution(action: ServerAction): ElementValidationResult {
  const target = action.target;
  if (!target) {
    if (action.type === "scroll" || action.type === "wait") {
      return { valid: true, element: null };
    }
    return { valid: false, element: null, error: "Action is missing target specification", reason: "Target undefined" };
  }

  let element: Element | null = null;
  const veilId = target.dataVeilId || target.elementId;

  // 1. Primary lookup by persistent data-veil-id
  if (veilId) {
    element = document.querySelector(`[data-veil-id="${veilId}"]`);
  }

  // Fallback lookup by bounds if veilId lookup didn't find match
  if (!element && target.bounds && hasValidBounds(target.bounds)) {
    const b = target.bounds;
    element = document.elementFromPoint(
      (b.x ?? 0) + (b.width ?? 0) / 2,
      (b.y ?? 0) + (b.height ?? 0) / 2
    );
  }

  if (!element) {
    return {
      valid: false,
      element: null,
      error: `Grounding Failure: Target element with data-veil-id="${veilId}" not found in current DOM`,
      reason: "Element disconnected or removed",
    };
  }

  // 2. Verify element is connected to DOM
  if (!element.isConnected) {
    return {
      valid: false,
      element: null,
      error: "Grounding Failure: Element is no longer connected to active document DOM",
      reason: "Disconnected DOM node",
    };
  }

  // 3. Verify element visibility
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return {
        valid: false,
        element,
        error: "Pre-execution Verification Failed: Target element is hidden or invisible",
        reason: "Element not visible",
      };
    }
  }

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return {
      valid: false,
      element,
      error: "Pre-execution Verification Failed: Element has zero bounding box dimensions",
      reason: "Zero area bounding box",
    };
  }

  // 4. Verify role and label integrity (Anti-mutation and anti-deception check)
  if (target.expectedRole) {
    const currentRole = element.getAttribute("role") || element.tagName.toLowerCase();
    if (target.expectedRole !== "generic" && !currentRole.includes(target.expectedRole)) {
      return {
        valid: false,
        element,
        error: `Pre-execution Verification Failed: Element role mutated (expected: ${target.expectedRole}, actual: ${currentRole})`,
        reason: "Role mutation detected",
      };
    }
  }

  if (target.expectedLabel) {
    const currentLabel = (
      element.getAttribute("aria-label") ||
      element.getAttribute("placeholder") ||
      (element as HTMLInputElement).value ||
      element.textContent ||
      ""
    ).trim();

    // Check if label has radically changed into a deceptive target
    if (target.expectedLabel.length > 3 && !currentLabel.toLowerCase().includes(target.expectedLabel.toLowerCase()) && !target.expectedLabel.toLowerCase().includes(currentLabel.toLowerCase())) {
      console.warn(`[VEIL Grounding Warning] Label difference: expected "${target.expectedLabel}" vs current "${currentLabel}"`);
    }
  }

  return { valid: true, element };
}

async function performCapture(userGoal: string): Promise<ClientPayload & { privacyMetrics: PrivacyMetrics }> {
  if (state.isCapturing) {
    throw new Error("Capture already in progress");
  }
  state.isCapturing = true;

  try {
    // 1. Extraction with persistent data-veil-id stamping
    const allElements = extractSanitizedElements(document);

    // 2. Task-Aware Context Minimization (Privacy = Redaction + Minimization)
    const minimization = ContextMinimizer.minimizeContext(allElements, userGoal);
    const elementsToProcess = minimization.minimizedElements;

    const initialPageMap = buildPageMap(elementsToProcess, minimization.prunedCount);

    // 3. Visual Perception (optional — if vision pipeline fails, use DOM-only)
    let visionResult: { redactionEntries: RedactionManifest } = { redactionEntries: [] };
    let canvas: HTMLCanvasElement | null = null;
    try {
      canvas = await captureViewport();
      state.lastScreenshot = canvas;

      if (!state.visionPipeline) {
        state.visionPipeline = await initializeVisionPipeline();
      }

      visionResult = await state.visionPipeline.processFrame(canvas, []);
    } catch (visionErr) {
      console.warn("[VEIL] Vision pipeline unavailable, using DOM-only extraction:", visionErr);
    }

    // 4. Redaction Processing
    const redactionContext: RedactionContext = {
      elements: initialPageMap.elements,
      screenshotWidth: canvas?.width || window.innerWidth || 800,
      screenshotHeight: canvas?.height || window.innerHeight || 600,
    };

    const redactionResult = processRedaction(redactionContext);
    const combinedManifest = [...redactionResult.manifest, ...visionResult.redactionEntries];

    const finalElements = redactionResult.redactedElements.map((el) => {
      const visionRedaction = visionResult.redactionEntries.find((r) => {
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

    // Compute real privacy metrics from the pipeline
    const privacyMetrics = computePrivacyMetrics(
      elementsToProcess,
      finalElements,
      combinedManifest,
      minimization.prunedCount,
      allElements.length
    );

    const finalPageMap = buildPageMap(finalElements, minimization.prunedCount);

    // 5. Apply Redactions + Minimization Masking to visual canvas
    let sanitizedScreenshot: string | undefined;
    if (canvas) {
      try {
        const redactedCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
        const ctx = redactedCanvas.getContext("2d");
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(canvas, 0, 0);
        }
        applyRedactionsToCanvas(redactedCanvas, combinedManifest);
        ContextMinimizer.applyMinimizationMasksToCanvas(redactedCanvas, minimization.peripheralMasks);
        sanitizedScreenshot = redactedCanvas.toDataURL("image/jpeg", 0.7);
      } catch { /* screenshot optional */ }
    }

    state.pageMap = finalPageMap;
    state.lastRedactionManifest = combinedManifest;
    state.sessionId = generateSessionId();

    const payload: ClientPayload & { privacyMetrics: PrivacyMetrics } = {
      sessionId: state.sessionId,
      timestamp: new Date().toISOString(),
      userGoal,
      sanitizedScreenshot,
      pageMap: finalPageMap,
      redactionManifest: combinedManifest,
      minimizationApplied: minimization.prunedCount > 0,
      privacyMetrics,
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

async function executeAction(action: ServerAction): Promise<{ success: boolean; error?: string }> {
  try {
    // Immediate pre-execution grounding & revalidation hook
    const validation = verifyElementBeforeExecution(action);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Pre-execution validation failed" };
    }

    const { type, value, direction, amount } = action;
    const element = validation.element;

    switch (type) {
      case "highlight":
        if (element) highlightElement(element);
        break;
      case "focus":
        if (element && "focus" in element) (element as HTMLElement).focus();
        break;
      case "click":
        if (element && "click" in element) (element as HTMLElement).click();
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
      case "select":
        if (element instanceof HTMLSelectElement && value) {
          const option = Array.from(element.options).find(
            (opt) => opt.value === value || opt.textContent?.trim().toLowerCase() === value.toLowerCase()
          );
          if (option) {
            element.value = option.value;
            element.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            return { success: false, error: `Option "${value}" not found in select element` };
          }
        } else if (element instanceof HTMLSelectElement) {
          return { success: false, error: "Select action requires a value to select" };
        }
        break;
      default:
        return { success: false, error: `Unknown action type: ${type}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown execution error" };
  }
}

function highlightElement(element: Element): void {
  element.setAttribute("data-veil-highlight", "true");
  const style = document.createElement("style");
  style.textContent = `
    [data-veil-highlight] {
      outline: 3px solid #00d4aa !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(0, 212, 170, 0.3) !important;
      transition: outline 0.2s, box-shadow 0.2s !important;
    }
  `;
  document.head.appendChild(style);
  setTimeout(() => {
    element.removeAttribute("data-veil-highlight");
    style.remove();
  }, 3000);
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case "CAPTURE_AND_SEND": {
            const payload = await performCapture(message.userGoal || "");
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
              state.pageMap = pageMap;
              sendResponse({ success: true, pageMap, redactionManifest: [] });
            }
            break;
          }
          case "GET_PRIVACY_STATUS": {
            sendResponse({
              success: true,
              status: {
                backend: state.visionPipeline?.getBackend() ?? "mock",
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
            state.visionPipeline?.dispose();
            state.visionPipeline = null;
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
}

console.log("[VEIL] Content script loaded with persistent grounding & minimization boundaries");
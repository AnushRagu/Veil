/**
 * Veil Offscreen Document
 *
 * Runs the vision pipeline inside a dedicated extension page context.
 * Communicates with the background service worker over structured chrome.runtime messaging.
 */
import { createVisionPipeline, VisionPipeline, VisionResult, VisionPipelineConfig } from "../vision/visionPipeline";
import { Bounds, RedactionEntry } from "@privatesight/shared";

interface SerializedDetection {
  bounds: Bounds;
  confidence: number;
  className: string;
  classId: number;
}

interface SerializedVisionResult {
  detections: SerializedDetection[];
  redactionEntries: RedactionEntry[];
  inferenceTimeMs: number;
  backend: "webgpu" | "wasm" | "mock";
}

let pipelineInstance: VisionPipeline | null = null;
let pipelinePromise: Promise<VisionPipeline> | null = null;

async function getPipeline(config?: Partial<VisionPipelineConfig>): Promise<VisionPipeline> {
  if (pipelineInstance && pipelineInstance.isReady()) return pipelineInstance;
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const pipeline = createVisionPipeline({
      provider: config?.provider || "mock",
      enableFaceDetection: true,
      enableSensitiveRegionDetection: true,
      ...config,
    });
    await pipeline.initialize();
    pipelineInstance = pipeline;
    return pipeline;
  })();

  try {
    return await pipelinePromise;
  } finally {
    pipelinePromise = null;
  }
}

function dataUrlToCanvas(dataUrl: string, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width || 1280;
  canvas.height = height || 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Offscreen: could not get 2d canvas context");

  const img = new Image();
  img.src = dataUrl;
  if (!img.complete || img.naturalWidth === 0) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  return canvas;
}

function serializeResult(result: VisionResult): SerializedVisionResult {
  return {
    detections: result.detections.map((d) => ({
      bounds: { ...d.bounds },
      confidence: d.confidence,
      className: d.className,
      classId: d.classId,
    })),
    redactionEntries: result.redactionEntries.map((e) => ({
      category: e.category,
      bounds: { ...e.bounds },
      confidence: e.confidence,
      replacement: e.replacement,
    })),
    inferenceTimeMs: result.inferenceTimeMs,
    backend: result.backend,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  // Filter messages specifically intended for offscreen or of offscreen types
  const isForOffscreen = message.target === "OFFSCREEN" || [
    "OFFSCREEN_INITIALIZE",
    "OFFSCREEN_PROCESS_FRAME",
    "OFFSCREEN_SHUTDOWN",
    "OFFSCREEN_STATUS",
    "PROCESS_FRAME",
    "INITIALIZE_VISION",
    "SHUTDOWN_VISION",
  ].includes(message.type);

  if (!isForOffscreen) return false;

  (async () => {
    try {
      switch (message.type) {
        case "OFFSCREEN_INITIALIZE":
        case "INITIALIZE_VISION": {
          const pipeline = await getPipeline(message.config);
          sendResponse({
            ok: true,
            backend: pipeline.getBackend(),
            provider: pipeline.getProviderName(),
          });
          break;
        }

        case "OFFSCREEN_PROCESS_FRAME":
        case "PROCESS_FRAME":
        case "VISION_PROCESS": {
          console.log(`[VEIL][OFFSCREEN] processing frame (${message.imageData?.width}x${message.imageData?.height})`);
          const pipeline = await getPipeline(message.config);
          const { dataUrl, width, height } = message.imageData || {};
          const canvas = dataUrlToCanvas(dataUrl, width, height);
          const result = await pipeline.processFrame(canvas, message.existingRedactions || []);
          console.log(`[VEIL][OFFSCREEN] frame processed: ${result.redactionEntries.length} redaction entries (${result.backend})`);
          sendResponse({
            ok: true,
            result: serializeResult(result),
          });
          break;
        }

        case "OFFSCREEN_STATUS":
        case "GET_VISION_STATUS": {
          const ready = pipelineInstance?.isReady() ?? false;
          const backend = pipelineInstance?.getBackend() ?? "mock";
          sendResponse({ ok: true, ready, backend });
          break;
        }

        case "OFFSCREEN_SHUTDOWN":
        case "SHUTDOWN_VISION": {
          pipelineInstance?.dispose();
          pipelineInstance = null;
          pipelinePromise = null;
          sendResponse({ ok: true });
          break;
        }

        default:
          sendResponse({ ok: false, error: `Unknown offscreen message type: ${message.type}` });
      }
    } catch (err) {
      console.error("[VEIL][OFFSCREEN] Processing error:", err);
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();

  return true;
});

console.log("[VEIL][OFFSCREEN] Offscreen document initialized");


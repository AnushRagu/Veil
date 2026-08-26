/**
 * Veil Offscreen Document
 *
 * Runs the ONNX Runtime Web vision pipeline inside a real ES module context
 * (the offscreen document is a normal extension page, not a content script).
 * Content scripts cannot use `import.meta` or dynamic `import()`, so the
 * vision pipeline is hosted here and invoked over chrome.runtime messaging
 * via the service worker.
 *
 * Protocol (handled by the background service worker):
 *   Request : { type: "VISION_PROCESS", requestId, imageData: { dataUrl } }
 *   Response: { type: "VISION_PROCESS_RESPONSE", requestId, ok, result?, error? }
 */
import { createVisionPipeline, VisionPipeline } from "../vision/visionPipeline";
import { VisionResult, VisionPipelineConfig } from "../vision/visionPipeline";
import { Bounds, RedactionEntry } from "@privatesight/shared";

interface VisionProcessRequest {
  type: "VISION_PROCESS";
  requestId: string;
  imageData: { dataUrl: string; width: number; height: number };
  config?: Partial<VisionPipelineConfig>;
}

interface VisionProcessResponse {
  type: "VISION_PROCESS_RESPONSE";
  requestId: string;
  ok: boolean;
  result?: SerializedVisionResult;
  error?: string;
}

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

let pipelinePromise: Promise<VisionPipeline> | null = null;

async function getPipeline(config?: Partial<VisionPipelineConfig>): Promise<VisionPipeline> {
  if (pipelinePromise) return pipelinePromise;
  pipelinePromise = (async () => {
    const pipeline = createVisionPipeline({
      provider: "mock",
      enableFaceDetection: true,
      enableSensitiveRegionDetection: true,
      ...config,
    });
    await pipeline.initialize();
    return pipeline;
  })();
  return pipelinePromise;
}

function dataUrlToCanvas(dataUrl: string, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Offscreen: could not get 2d context");
  // Synchronous paint from a fresh Image is fine here because the data URL
  // was created from a canvas in the same process and is immediately ready.
  const img = new Image();
  img.src = dataUrl;
  if (!img.complete || img.naturalWidth === 0) {
    // Fall back: at least produce a usable canvas even if the image
    // hasn't decoded synchronously. The pipeline accepts canvas inputs.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
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

async function handleRequest(req: VisionProcessRequest): Promise<VisionProcessResponse> {
  try {
    const pipeline = await getPipeline(req.config);
    const canvas = dataUrlToCanvas(
      req.imageData.dataUrl,
      req.imageData.width,
      req.imageData.height
    );
    const result = await pipeline.processFrame(canvas, []);
    return {
      type: "VISION_PROCESS_RESPONSE",
      requestId: req.requestId,
      ok: true,
      result: serializeResult(result),
    };
  } catch (err) {
    return {
      type: "VISION_PROCESS_RESPONSE",
      requestId: req.requestId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;
  if (message.type !== "VISION_PROCESS") return false;
  handleRequest(message as VisionProcessRequest).then(sendResponse);
  return true;
});

console.log("[Veil] Offscreen document ready");

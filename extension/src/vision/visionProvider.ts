import { Bounds } from "@veil/shared";

export interface VisionDetection {
  bounds: Bounds;
  confidence: number;
  className: string;
  classId: number;
}

export type VisionInput = ImageData | HTMLCanvasElement | HTMLVideoElement | ImageBitmap | {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
};

export interface VisionProvider {
  name: string;
  initialize(): Promise<void>;
  detect(input: VisionInput): Promise<VisionDetection[]>;
  dispose(): void;
  isReady(): boolean;
}

export interface ModelConfig {
  modelPath: string;
  inputWidth: number;
  inputHeight: number;
  confidenceThreshold: number;
  iouThreshold: number;
  classNames: string[];
  executionProvider: "wasm" | "webgpu";
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelPath: "/models/yolov8n-face.onnx",
  inputWidth: 320,
  inputHeight: 320,
  confidenceThreshold: 0.5,
  iouThreshold: 0.45,
  classNames: ["face", "person", "credit_card", "id_card", "screen", "credentials_form"],
  executionProvider: "wasm",
};

export const MOCK_DETECTIONS: VisionDetection[] = [
  {
    bounds: { x: 100, y: 100, width: 80, height: 80 },
    confidence: 0.92,
    className: "face",
    classId: 0,
  },
  {
    bounds: { x: 400, y: 200, width: 120, height: 60 },
    confidence: 0.87,
    className: "credit_card",
    classId: 2,
  },
];

export class MockVisionProvider implements VisionProvider {
  name = "mock";
  private ready = false;

  async initialize(): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
    this.ready = true;
  }

  async detect(input: VisionInput): Promise<VisionDetection[]> {
    // If input is provided, we simulate real detection based on dimensions
    const dims = getDimensions(input);
    if (dims.width > 0 && dims.height > 0) {
      return MOCK_DETECTIONS.map((d) => ({
        ...d,
        bounds: { ...d.bounds },
      }));
    }
    return [];
  }

  dispose(): void {
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}

function getDimensions(input: VisionInput): { width: number; height: number } {
  if ("data" in input && typeof input.width === "number") {
    return { width: input.width, height: input.height };
  }
  if (input instanceof ImageData || input instanceof HTMLCanvasElement || (typeof ImageBitmap !== "undefined" && input instanceof ImageBitmap)) {
    return { width: input.width, height: input.height };
  }
  if (typeof HTMLVideoElement !== "undefined" && input instanceof HTMLVideoElement) {
    return { width: input.videoWidth, height: input.videoHeight };
  }
  return { width: 800, height: 600 };
}

export class ONNXVisionProvider implements VisionProvider {
  name = "onnx";
  private session: any = null;
  private config: ModelConfig;
  private ready = false;

  constructor(config: Partial<ModelConfig> = {}) {
    this.config = { ...DEFAULT_MODEL_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    try {
      const ort = await import("onnxruntime-web");

      // Configure WebAssembly SIMD and Threading options for truthful UI pixel analysis
      if (ort.env?.wasm) {
        ort.env.wasm.numThreads = Math.min(4, typeof navigator !== "undefined" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 2);
        ort.env.wasm.simd = true;
      }

      const executionProvider = this.config.executionProvider === "webgpu" && (await this.checkWebGPU())
        ? "webgpu"
        : "wasm";

      this.session = await ort.InferenceSession.create(this.config.modelPath, {
        executionProviders: [executionProvider],
        graphOptimizationLevel: "all",
      });

      this.ready = true;
      console.log(`[VEIL Vision] ONNX model loaded with ${executionProvider} backend (WASM SIMD threaded)`);
    } catch (error) {
      console.error("[VEIL Vision] Failed to load ONNX model:", error);
      throw error;
    }
  }

  private async checkWebGPU(): Promise<boolean> {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return false;
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  async detect(input: VisionInput): Promise<VisionDetection[]> {
    if (!this.session || !this.ready) {
      throw new Error("ONNX session not initialized");
    }

    const { width, height } = getDimensions(input);
    const tensor = await this.preprocess(input, width, height);

    const feeds = { [this.session.inputNames[0]]: tensor };
    const results = await this.session.run(feeds);
    const output = results[this.session.outputNames[0]];

    return this.postprocess(output.data, width, height);
  }

  private async preprocess(
    input: VisionInput,
    srcWidth: number,
    srcHeight: number
  ): Promise<any> {
    const ort = await import("onnxruntime-web");
    const targetW = this.config.inputWidth;
    const targetH = this.config.inputHeight;

    let rawData: Uint8ClampedArray | Uint8Array | null = null;

    if ("data" in input && input.data instanceof Uint8ClampedArray) {
      rawData = input.data;
    } else if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if ("data" in input) {
          const imgData = new ImageData(new Uint8ClampedArray(input.data), input.width, input.height);
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = srcWidth;
          tempCanvas.height = srcHeight;
          tempCanvas.getContext("2d")?.putImageData(imgData, 0, 0);
          ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
        } else if (input instanceof ImageData) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = srcWidth;
          tempCanvas.height = srcHeight;
          tempCanvas.getContext("2d")?.putImageData(input, 0, 0);
          ctx.drawImage(tempCanvas, 0, 0, targetW, targetH);
        } else {
          ctx.drawImage(input as CanvasImageSource, 0, 0, targetW, targetH);
        }
        const img = ctx.getImageData(0, 0, targetW, targetH);
        rawData = img.data;
      }
    }

    const float32Data = new Float32Array(3 * targetH * targetW);

    if (rawData) {
      for (let i = 0; i < targetH; i++) {
        for (let j = 0; j < targetW; j++) {
          const srcIdx = (i * targetW + j) * 4;
          float32Data[0 * targetH * targetW + i * targetW + j] = rawData[srcIdx] / 255.0;
          float32Data[1 * targetH * targetW + i * targetW + j] = rawData[srcIdx + 1] / 255.0;
          float32Data[2 * targetH * targetW + i * targetW + j] = rawData[srcIdx + 2] / 255.0;
        }
      }
    }

    return new ort.Tensor("float32", float32Data, [1, 3, targetH, targetW]);
  }

  private postprocess(outputData: Float32Array, srcWidth: number, srcHeight: number): VisionDetection[] {
    const detections: VisionDetection[] = [];
    const numClasses = this.config.classNames.length;
    const numBoxes = outputData.length / (numClasses + 4);

    for (let i = 0; i < numBoxes; i++) {
      const boxStart = i * (numClasses + 4);
      const x = outputData[boxStart];
      const y = outputData[boxStart + 1];
      const w = outputData[boxStart + 2];
      const h = outputData[boxStart + 3];

      let maxConf = 0;
      let classId = 0;
      for (let c = 0; c < numClasses; c++) {
        const conf = outputData[boxStart + 4 + c];
        if (conf > maxConf) {
          maxConf = conf;
          classId = c;
        }
      }

      if (maxConf >= this.config.confidenceThreshold) {
        const scaleX = srcWidth / this.config.inputWidth;
        const scaleY = srcHeight / this.config.inputHeight;
        detections.push({
          bounds: {
            x: Math.round((x - w / 2) * scaleX),
            y: Math.round((y - h / 2) * scaleY),
            width: Math.round(w * scaleX),
            height: Math.round(h * scaleY),
          },
          confidence: maxConf,
          className: this.config.classNames[classId] || "unknown",
          classId,
        });
      }
    }

    return this.nms(detections);
  }

  private nms(detections: VisionDetection[]): VisionDetection[] {
    const sorted = detections.sort((a, b) => b.confidence - a.confidence);
    const keep: VisionDetection[] = [];

    for (const det of sorted) {
      let shouldKeep = true;
      for (const kept of keep) {
        if (this.iou(det.bounds, kept.bounds) > this.config.iouThreshold) {
          shouldKeep = false;
          break;
        }
      }
      if (shouldKeep) keep.push(det);
    }

    return keep;
  }

  private iou(a: Bounds, b: Bounds): number {
    const aX = a.x ?? 0;
    const aY = a.y ?? 0;
    const aW = a.width ?? 0;
    const aH = a.height ?? 0;
    const bX = b.x ?? 0;
    const bY = b.y ?? 0;
    const bW = b.width ?? 0;
    const bH = b.height ?? 0;

    const x1 = Math.max(aX, bX);
    const y1 = Math.max(aY, bY);
    const x2 = Math.min(aX + aW, bX + bW);
    const y2 = Math.min(aY + aH, bY + bH);

    if (x2 <= x1 || y2 <= y1) return 0;

    const intersection = (x2 - x1) * (y2 - y1);
    const areaA = aW * aH;
    const areaB = bW * bH;
    return intersection / (areaA + areaB - intersection);
  }

  dispose(): void {
    this.session = null;
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}

export function createVisionProvider(type: "mock" | "onnx", config?: Partial<ModelConfig>): VisionProvider {
  switch (type) {
    case "mock":
      return new MockVisionProvider();
    case "onnx":
      return new ONNXVisionProvider(config);
    default:
      throw new Error(`Unknown vision provider: ${type}`);
  }
}
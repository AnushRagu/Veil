import { VisionProvider, VisionDetection, createVisionProvider, ModelConfig, VisionInput } from "./visionProvider";
import { Bounds, RedactionEntry } from "@veil/shared";
import { applyRedactionToScreenshot } from "../redaction/redactionEngine";

export interface VisionPipelineConfig {
  provider: "mock" | "onnx";
  modelConfig?: Partial<ModelConfig>;
  enableFaceDetection: boolean;
  enableSensitiveRegionDetection: boolean;
}

export interface VisionResult {
  detections: VisionDetection[];
  redactedCanvas: HTMLCanvasElement | null;
  redactionEntries: RedactionEntry[];
  inferenceTimeMs: number;
  backend: "webgpu" | "wasm" | "mock";
}

export class VisionPipeline {
  private provider: VisionProvider | null = null;
  private config: VisionPipelineConfig;
  private initialized = false;

  constructor(config: VisionPipelineConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.provider = createVisionProvider(this.config.provider, this.config.modelConfig);
      await this.provider.initialize();
      this.initialized = true;
    } catch (error) {
      console.error("[VEIL VisionPipeline] Failed to initialize, falling back to mock:", error);
      this.provider = createVisionProvider("mock");
      await this.provider.initialize();
      this.config.provider = "mock";
      this.initialized = true;
    }
  }

  async processFrame(
    canvas: HTMLCanvasElement,
    existingRedactions: RedactionEntry[] = []
  ): Promise<VisionResult> {
    if (!this.provider || !this.initialized) {
      await this.initialize();
    }

    const startTime = performance.now();
    const detections: VisionDetection[] = [];

    if (this.config.enableFaceDetection || this.config.enableSensitiveRegionDetection) {
      try {
        const results = await this.provider!.detect(canvas);
        detections.push(...results);
      } catch (error) {
        console.error("[VEIL VisionPipeline] Detection failed:", error);
      }
    }

    const filteredDetections = detections.filter((d) => {
      if (!this.config.enableFaceDetection && d.className === "face") return false;
      if (!this.config.enableSensitiveRegionDetection && ["credit_card", "id_card", "screen", "credentials_form"].includes(d.className)) return false;
      return true;
    });

    const redactionEntries: RedactionEntry[] = [...existingRedactions];
    for (const det of filteredDetections) {
      redactionEntries.push({
        category: det.className === "face" ? "face" : "custom",
        bounds: det.bounds,
        confidence: det.confidence,
        replacement: det.className === "face" ? "[REDACTED_FACE]" : `[REDACTED_${det.className.toUpperCase()}]`,
      });
    }

    let redactedCanvas: HTMLCanvasElement | null = null;
    if (redactionEntries.length > 0) {
      redactedCanvas = canvas.cloneNode(true) as HTMLCanvasElement;
      applyRedactionToScreenshot(redactedCanvas, redactionEntries);
    }

    const inferenceTimeMs = performance.now() - startTime;
    const backend = this.config.provider === "mock" ? "mock" : this.provider!.name === "onnx" ? "wasm" : "webgpu";

    return {
      detections: filteredDetections,
      redactedCanvas,
      redactionEntries,
      inferenceTimeMs,
      backend,
    };
  }

  async detectOnly(input: VisionInput): Promise<VisionDetection[]> {
    if (!this.provider || !this.initialized) {
      await this.initialize();
    }
    try {
      return await this.provider!.detect(input);
    } catch (error) {
      console.error("[VEIL VisionPipeline] Detection failed:", error);
      return [];
    }
  }

  getProviderName(): string {
    return this.provider?.name || "none";
  }

  getBackend(): "webgpu" | "wasm" | "mock" {
    if (this.config.provider === "mock") return "mock";
    return "wasm";
  }

  isReady(): boolean {
    return this.initialized && this.provider?.isReady() === true;
  }

  dispose(): void {
    this.provider?.dispose();
    this.provider = null;
    this.initialized = false;
  }

  updateConfig(config: Partial<VisionPipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export function createVisionPipeline(config: Partial<VisionPipelineConfig> = {}): VisionPipeline {
  const defaultConfig: VisionPipelineConfig = {
    provider: "mock",
    enableFaceDetection: true,
    enableSensitiveRegionDetection: true,
    ...config,
  };
  return new VisionPipeline(defaultConfig);
}
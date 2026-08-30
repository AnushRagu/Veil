import { z } from "zod";

export type GoalMode =
  | "information"
  | "informational"
  | "find"
  | "highlight"
  | "fill"
  | "click"
  | "select"
  | "type"
  | "search"
  | "scroll"
  | "navigate"
  | "navigation_task"
  | "submit"
  | "delete"
  | "ambiguous"
  | "unsupported"
  | "browser_action"
  | "form_task";

export type ActionRiskLevel = "low" | "medium" | "high";

export interface GoalIntent {
  action?: string;
  target?: string;
  value?: string;
  risk?: ActionRiskLevel;
  requiresConfirmation?: boolean;
}

export interface GoalClassification {
  mode: GoalMode;
  confidence: number;
  interpretation: string;
  extractedIntent?: GoalIntent;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  riskLevel?: ActionRiskLevel;
  requiresConfirmation?: boolean;
}

export const BoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export type Bounds = z.infer<typeof BoundsSchema>;

export const ElementRoleSchema = z.enum([
  "button",
  "link",
  "textbox",
  "combobox",
  "checkbox",
  "radio",
  "menuitem",
  "tab",
  "heading",
  "img",
  "region",
  "generic",
  "searchbox",
  "slider",
  "spinbutton",
  "switch",
  "treeitem",
  "option",
  "listbox",
  "dialog",
  "alert",
  "banner",
  "contentinfo",
  "form",
  "main",
  "navigation",
  "search",
  "complementary",
]);

export type ElementRole = z.infer<typeof ElementRoleSchema>;

export const SanitizedElementSchema = z.object({
  id: z.string(),
  role: ElementRoleSchema,
  label: z.string(),
  bounds: BoundsSchema,
  visible: z.boolean(),
  enabled: z.boolean(),
  sensitive: z.boolean(),
  placeholder: z.string().optional(),
  valueState: z.enum(["empty", "filled", "unknown"]).optional(),
  href: z.string().optional(),
  tagName: z.string().optional(),
  type: z.string().optional(),
  // Robust locator fields
  selector: z.string().optional(),
  xpath: z.string().optional(),
  ariaLabel: z.string().optional(),
  ariaLabelledBy: z.string().optional(),
  name: z.string().optional(),
  elementId: z.string().optional(),
  formId: z.string().optional(),
  autocomplete: z.string().optional(),
  inputType: z.string().optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  // Text content (sanitized)
  textContent: z.string().optional(),
  value: z.string().optional(),
  // Vision / perception fusion fields
  domConfidence: z.number().min(0).max(1).optional(),
  visionConfidence: z.number().min(0).max(1).optional(),
  combinedConfidence: z.number().min(0).max(1).optional(),
});

export type SanitizedElement = z.infer<typeof SanitizedElementSchema>;

export const PageMapSchema = z.object({
  urlOrigin: z.string().url(),
  title: z.string(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  elements: z.array(SanitizedElementSchema),
});

export type PageMap = z.infer<typeof PageMapSchema>;

export const RedactionCategorySchema = z.enum([
  "password",
  "otp",
  "credit_card",
  "cvv",
  "aadhaar",
  "pan",
  "email",
  "phone",
  "address",
  "account_number",
  "face",
  "explicit_sensitive",
  "custom",
]);

export type RedactionCategory = z.infer<typeof RedactionCategorySchema>;

export const RedactionEntrySchema = z.object({
  category: RedactionCategorySchema,
  bounds: BoundsSchema,
  confidence: z.number().min(0).max(1),
  replacement: z.string(),
});

export type RedactionEntry = z.infer<typeof RedactionEntrySchema>;
export type RedactionRegion = RedactionEntry;

export const RedactionManifestSchema = z.array(RedactionEntrySchema);

export type RedactionManifest = z.infer<typeof RedactionManifestSchema>;

export const ClientPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime(),
  userGoal: z.string().min(1).max(2000),
  sanitizedScreenshot: z.string().optional(),
  pageMap: PageMapSchema,
  redactionManifest: RedactionManifestSchema,
});

export type ClientPayload = z.infer<typeof ClientPayloadSchema>;

export const ActionTypeSchema = z.enum([
  "click",
  "scroll",
  "focus",
  "type",
  "wait",
  "highlight",
  "select",
  "navigate",
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ScrollDirectionSchema = z.enum(["up", "down", "left", "right"]);

export type ScrollDirection = z.infer<typeof ScrollDirectionSchema>;

export const ActionTargetSchema = z.object({
  elementId: z.string().optional(),
  bounds: BoundsSchema.optional(),
  selector: z.string().optional(),
  text: z.string().optional(),
  label: z.string().optional(),
});

export type ActionTarget = z.infer<typeof ActionTargetSchema>;

export const ServerActionSchema = z.object({
  id: z.string().uuid(),
  type: ActionTypeSchema,
  target: ActionTargetSchema.optional(),
  value: z.string().optional(),
  direction: ScrollDirectionSchema.optional(),
  amount: z.number().optional(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  risk: z.enum(["low", "medium", "high"]).optional(),
});

export type ServerAction = z.infer<typeof ServerActionSchema>;

export const ServerPlanSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  requiresUserConfirmation: z.boolean(),
  actions: z.array(ServerActionSchema),
  mode: z.string().optional(),
});

export type ServerPlan = z.infer<typeof ServerPlanSchema>;

export const InferenceBackendSchema = z.enum(["webgpu", "wasm", "mock"]);

export type InferenceBackend = z.infer<typeof InferenceBackendSchema>;

export const PrivacyStatusSchema = z.object({
  backend: InferenceBackendSchema,
  redactedCount: z.number().nonnegative(),
  lastCapture: z.string().datetime().optional(),
  sessionActive: z.boolean(),
});

export type PrivacyStatus = z.infer<typeof PrivacyStatusSchema>;

export const TelemetryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  metric: z.enum([
    "model_inference_ms",
    "screenshot_capture_ms",
    "dom_extraction_ms",
    "redaction_ms",
    "payload_size_before_bytes",
    "payload_size_after_bytes",
    "server_roundtrip_ms",
    "total_latency_ms",
    "sensitive_regions_detected",
    "actions_blocked",
    "inference_backend",
    "vision_latency_ms",
    "execution_latency_ms",
  ]),
  value: z.number(),
  sessionId: z.string().uuid(),
});

export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;

export const ActionPolicySchema = z.enum(["auto", "confirm", "reject"]);

export type ActionPolicy = z.infer<typeof ActionPolicySchema>;

export const ValidatedActionSchema = z.object({
  action: ServerActionSchema,
  policy: ActionPolicySchema,
  reason: z.string(),
  mappedElement: SanitizedElementSchema.optional(),
});

export type ValidatedAction = z.infer<typeof ValidatedActionSchema>;

export interface ExecutionResult {
  success: boolean;
  error?: string;
  verified: boolean;
  details?: Record<string, any>;
  actionId?: string;
}

export interface VerificationResult {
  verified: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export interface VisionDetection {
  bounds: Bounds;
  confidence: number;
  className: string;
  classId?: number;
  label?: string;
  type?: string;
}

export interface SanitizedPageContext {
  pageMap: PageMap;
  sanitizedScreenshot?: string;
  redactionManifest: RedactionManifest;
  visionDetections?: VisionDetection[];
}

export function validateClientPayload(data: unknown): ClientPayload {
  return ClientPayloadSchema.parse(data);
}

export function validateServerPlan(data: unknown): ServerPlan {
  return ServerPlanSchema.parse(data);
}

export function validateTelemetryEntry(data: unknown): TelemetryEntry {
  return TelemetryEntrySchema.parse(data);
}

export const ALLOWED_SERVER_ORIGINS = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
] as const;

export type AllowedServerOrigin = (typeof ALLOWED_SERVER_ORIGINS)[number];

export function isAllowedOrigin(origin: string): origin is AllowedServerOrigin {
  return ALLOWED_SERVER_ORIGINS.includes(origin as AllowedServerOrigin);
}

export const MAX_PAYLOAD_SIZE = 500_000;
export const MAX_SCREENSHOT_DIMENSION = 1920;
export const REQUEST_TIMEOUT_MS = 10_000;
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export type AgentState =
  | "idle"
  | "observing"
  | "interpreting"
  | "planning"
  | "validating"
  | "waiting_for_confirmation"
  | "needs_clarification"
  | "ready"
  | "executing"
  | "verifying"
  | "completed"
  | "blocked"
  | "failed"
  | "stopped";

export interface AgentStep {
  stepNumber: number;
  action: ServerAction;
  result: "success" | "failed" | "pending";
  error?: string;
  pageChanged: boolean;
  timestamp: string;
  verified?: boolean;
  details?: Record<string, any>;
}

export interface AgentExecutionContext {
  taskId?: string;
  goal: string;
  classification: GoalClassification;
  plan: ServerPlan;
  currentStep: number;
  maxSteps: number;
  steps: AgentStep[];
  status: AgentState;
  lastObservation?: PageMap;
  sessionId: string;
  userGoal: string;
  isExecuting: boolean;
  error?: string | null;
  serverConnected?: boolean;
}

export type SuggestionCategory = "scroll" | "find" | "search" | "form" | "action";

export interface PageSuggestion {
  id: string;
  label: string;
  category: SuggestionCategory;
  action: ServerAction;
  icon?: string;
  risk?: ActionRiskLevel;
  description?: string;
}

export interface RedactionCategorySummary {
  category: RedactionCategory;
  label: string;
  count: number;
  replacementToken: string;
}

export interface RedactionSummary {
  totalCount: number;
  groups: RedactionCategorySummary[];
  hasSensitiveData: boolean;
}
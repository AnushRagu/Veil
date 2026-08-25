import { z } from "zod";

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
  dataVeilId: z.string().optional(),
  role: ElementRoleSchema,
  label: z.string(),
  bounds: BoundsSchema,
  visible: z.boolean(),
  enabled: z.boolean(),
  sensitive: z.boolean(),
  originalTag: z.string().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  isPrunedByMinimization: z.boolean().optional(),
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
  minimizedElementCount: z.number().optional(),
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

export const RedactionManifestSchema = z.array(RedactionEntrySchema);

export type RedactionManifest = z.infer<typeof RedactionManifestSchema>;

export const ClientPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  timestamp: z.string().datetime(),
  userGoal: z.string().min(1).max(2000),
  sanitizedScreenshot: z.string().optional(),
  pageMap: PageMapSchema,
  redactionManifest: RedactionManifestSchema,
  minimizationApplied: z.boolean().optional(),
});

export type ClientPayload = z.infer<typeof ClientPayloadSchema>;

export const ActionTypeSchema = z.enum([
  "click",
  "scroll",
  "focus",
  "type",
  "wait",
  "highlight",
  "inspect",
  "select",
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

export const ScrollDirectionSchema = z.enum(["up", "down"]);

export type ScrollDirection = z.infer<typeof ScrollDirectionSchema>;

export const ActionTargetSchema = z.object({
  elementId: z.string().optional(),
  dataVeilId: z.string().optional(),
  bounds: BoundsSchema.optional(),
  expectedRole: ElementRoleSchema.optional(),
  expectedLabel: z.string().optional(),
});

export type ActionTarget = z.infer<typeof ActionTargetSchema>;

/**
 * 5 Structural Risk Levels:
 * Level 0 (Observation): scroll, focus, inspect, highlight -> AUTO
 * Level 1 (Reversible): menu toggle, tab change -> AUTO
 * Level 2 (Data Entry): typing, selection changes -> CONFIRM/EVALUATE
 * Level 3 (Consequential): click submit, delete, purchase -> STRICT USER CONFIRMATION
 * Level 4 (High Risk): cryptographic fields, password fields, payment transfers -> SECURE EXPLICIT LOCKOUT
 */
export const RiskLevelSchema = z.enum([
  "level_0_observation",
  "level_1_reversible",
  "level_2_data_entry",
  "level_3_consequential",
  "level_4_high_risk",
]);

export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ServerActionSchema = z.object({
  id: z.string().uuid(),
  type: ActionTypeSchema,
  target: ActionTargetSchema.optional(),
  value: z.string().optional(),
  direction: ScrollDirectionSchema.optional(),
  amount: z.number().optional(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  riskLevel: RiskLevelSchema.optional(),
  explanation: z.string().optional(),
});

export type ServerAction = z.infer<typeof ServerActionSchema>;

export const ServerPlanSchema = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  requiresUserConfirmation: z.boolean(),
  actions: z.array(ServerActionSchema),
  highestRiskLevel: RiskLevelSchema.optional(),
});

export type ServerPlan = z.infer<typeof ServerPlanSchema>;

export const InferenceBackendSchema = z.enum(["webgpu", "wasm", "mock"]);

export type InferenceBackend = z.infer<typeof InferenceBackendSchema>;

export const PrivacyStatusSchema = z.object({
  backend: InferenceBackendSchema,
  redactedCount: z.number().nonnegative(),
  lastCapture: z.string().datetime().optional(),
  sessionActive: z.boolean(),
  privacyLeakageRate: z.number().optional(),
  falseNegativeRate: z.number().optional(),
  minimizationEfficiency: z.number().optional(),
});

export type PrivacyStatus = z.infer<typeof PrivacyStatusSchema>;

export const TelemetryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  metric: z.enum([
    "model_inference_ms",
    "screenshot_capture_ms",
    "dom_extraction_ms",
    "redaction_ms",
    "minimization_ms",
    "payload_size_before_bytes",
    "payload_size_after_bytes",
    "server_roundtrip_ms",
    "total_latency_ms",
    "sensitive_regions_detected",
    "actions_blocked",
    "actions_confirmed",
    "inference_backend",
    "privacy_leakage_rate",
    "false_negative_rate",
  ]),
  value: z.number(),
  sessionId: z.string().uuid(),
});

export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;

export const ActionPolicySchema = z.enum(["auto", "confirm", "lockout", "reject"]);

export type ActionPolicy = z.infer<typeof ActionPolicySchema>;

export const ValidatedActionSchema = z.object({
  action: ServerActionSchema,
  policy: ActionPolicySchema,
  riskLevel: RiskLevelSchema,
  reason: z.string(),
  explanation: z.string(),
  mappedElement: SanitizedElementSchema.optional(),
  validationPassed: z.boolean().default(true),
});

export type ValidatedAction = z.infer<typeof ValidatedActionSchema>;

export interface ElementValidationResult {
  valid: boolean;
  element: Element | null;
  error?: string;
  reason?: string;
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
import { z } from "zod";
export const BoundsSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
});
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
export const PageMapSchema = z.object({
    urlOrigin: z.string().min(1),
    title: z.string(),
    viewport: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
    }),
    elements: z.array(SanitizedElementSchema),
    minimizedElementCount: z.number().optional(),
});
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
export const RedactionEntrySchema = z.object({
    category: RedactionCategorySchema,
    bounds: BoundsSchema,
    confidence: z.number().min(0).max(1),
    replacement: z.string(),
});
export const RedactionManifestSchema = z.array(RedactionEntrySchema);
export const ClientPayloadSchema = z.object({
    sessionId: z.string().uuid(),
    timestamp: z.string().datetime(),
    userGoal: z.string().min(1).max(2000),
    sanitizedScreenshot: z.string().optional(),
    pageMap: PageMapSchema,
    redactionManifest: RedactionManifestSchema,
    minimizationApplied: z.boolean().optional(),
});
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
export const ScrollDirectionSchema = z.enum(["up", "down"]);
export const ActionTargetSchema = z.object({
    elementId: z.string().optional(),
    dataVeilId: z.string().optional(),
    bounds: BoundsSchema.optional(),
    expectedRole: ElementRoleSchema.optional(),
    expectedLabel: z.string().optional(),
});
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
export const ServerPlanSchema = z.object({
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    requiresUserConfirmation: z.boolean(),
    actions: z.array(ServerActionSchema),
    highestRiskLevel: RiskLevelSchema.optional(),
});
export const InferenceBackendSchema = z.enum(["webgpu", "wasm", "mock"]);
export const PrivacyStatusSchema = z.object({
    backend: InferenceBackendSchema,
    redactedCount: z.number().nonnegative(),
    lastCapture: z.string().datetime().optional(),
    sessionActive: z.boolean(),
    privacyLeakageRate: z.number().optional(),
    falseNegativeRate: z.number().optional(),
    minimizationEfficiency: z.number().optional(),
});
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
export const ActionPolicySchema = z.enum(["auto", "confirm", "lockout", "reject"]);
export const ValidatedActionSchema = z.object({
    action: ServerActionSchema,
    policy: ActionPolicySchema,
    riskLevel: RiskLevelSchema,
    reason: z.string(),
    explanation: z.string(),
    mappedElement: SanitizedElementSchema.optional(),
    validationPassed: z.boolean().default(true),
});
export function validateClientPayload(data) {
    return ClientPayloadSchema.parse(data);
}
export function validateServerPlan(data) {
    return ServerPlanSchema.parse(data);
}
export function validateTelemetryEntry(data) {
    return TelemetryEntrySchema.parse(data);
}
export const ALLOWED_SERVER_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
];
export function isAllowedOrigin(origin) {
    return ALLOWED_SERVER_ORIGINS.includes(origin);
}
export const MAX_PAYLOAD_SIZE = 500_000;
export const MAX_SCREENSHOT_DIMENSION = 1920;
export const REQUEST_TIMEOUT_MS = 10_000;
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_WINDOW_MS = 60_000;

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
export const PageMapSchema = z.object({
    urlOrigin: z.string().url(),
    title: z.string(),
    viewport: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
    }),
    elements: z.array(SanitizedElementSchema),
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
});
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
export const ScrollDirectionSchema = z.enum(["up", "down", "left", "right"]);
export const ActionTargetSchema = z.object({
    elementId: z.string().optional(),
    bounds: BoundsSchema.optional(),
    selector: z.string().optional(),
    text: z.string().optional(),
    label: z.string().optional(),
});
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
export const ServerPlanSchema = z.object({
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    requiresUserConfirmation: z.boolean(),
    actions: z.array(ServerActionSchema),
    mode: z.string().optional(),
});
export const InferenceBackendSchema = z.enum(["webgpu", "wasm", "mock"]);
export const PrivacyStatusSchema = z.object({
    backend: InferenceBackendSchema,
    redactedCount: z.number().nonnegative(),
    lastCapture: z.string().datetime().optional(),
    sessionActive: z.boolean(),
});
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
export const ActionPolicySchema = z.enum(["auto", "confirm", "reject"]);
export const ValidatedActionSchema = z.object({
    action: ServerActionSchema,
    policy: ActionPolicySchema,
    reason: z.string(),
    mappedElement: SanitizedElementSchema.optional(),
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

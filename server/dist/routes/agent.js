import { Router } from "express";
import { planAction } from "../planner/ruleBasedPlanner";
import { validatePlanActions } from "@privatesight/shared";
import { classifyGoal } from "@privatesight/shared";
import { validatePayload, sanitizeOriginCheck, rateLimiter } from "../validation/payloadValidator";
const router = Router();
router.post("/plan", sanitizeOriginCheck, rateLimiter(30, 60_000), validatePayload, async (req, res) => {
    const startTime = Date.now();
    const payload = req.body;
    try {
        console.log(`[VEIL][SERVER] received plan request session=${payload.sessionId} goal="${payload.userGoal}" elements=${payload.pageMap?.elements?.length ?? 0} redacted=${payload.redactionManifest?.length ?? 0}`);
        const plan = await planAction({
            userGoal: payload.userGoal,
            pageMap: payload.pageMap,
            redactionManifest: payload.redactionManifest,
        });
        const classification = classifyGoal(payload.userGoal, payload.pageMap);
        const validationResults = validatePlanActions(plan.actions, {
            userGoal: payload.userGoal,
            classification,
            pageElements: payload.pageMap.elements,
            previousActions: [],
            stepNumber: 0,
        });
        const validatedActions = plan.actions.filter((_, i) => validationResults[i].valid);
        const rejectedReasons = validationResults.filter((r) => !r.valid).map((r) => r.reason);
        const finalPlan = {
            ...plan,
            actions: validatedActions,
            summary: rejectedReasons.length > 0
                ? `${plan.summary} (${rejectedReasons.length} action(s) rejected: ${rejectedReasons.join("; ")})`
                : plan.summary,
            confidence: rejectedReasons.length > 0 ? Math.min(plan.confidence, 0.5) : plan.confidence,
        };
        const processingTime = Date.now() - startTime;
        console.log(`[VEIL][SERVER] returning plan: "${finalPlan.summary}" (${validatedActions.length}/${plan.actions.length} valid actions) time=${processingTime}ms`);
        res.set("X-Processing-Time-Ms", processingTime.toString());
        res.json(finalPlan);
    }
    catch (error) {
        console.error("[PLAN ERROR]", error);
        res.status(500).json({
            summary: "Failed to generate action plan",
            confidence: 0,
            requiresUserConfirmation: true,
            actions: [],
        });
    }
});
router.post("/validate-action", sanitizeOriginCheck, rateLimiter(30, 60_000), validatePayload, async (req, res) => {
    const payload = req.body;
    try {
        const classification = classifyGoal(payload.userGoal, payload.pageMap);
        const validation = validatePlanActions([payload.action], {
            userGoal: payload.userGoal,
            classification,
            pageElements: payload.pageMap.elements,
            previousActions: payload.previousActions,
            stepNumber: payload.stepNumber,
        })[0];
        res.json({
            valid: validation.valid,
            reason: validation.reason,
        });
    }
    catch (error) {
        console.error("[VALIDATE ERROR]", error);
        res.status(500).json({ valid: false, reason: "Validation failed" });
    }
});
router.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
    });
});
router.get("/info", (_req, res) => {
    res.json({
        name: "Veil Agent Server",
        version: "0.1.0",
        planner: "rule-based",
        capabilities: [
            "highlight",
            "focus",
            "scroll",
            "wait",
            "click (with confirmation)",
            "type (with confirmation)",
        ],
        privacy: {
            noRawDataStorage: true,
            noExternalApiCalls: true,
            localOnlyProcessing: true,
        },
    });
});
export default router;

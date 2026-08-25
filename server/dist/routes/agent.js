import { Router } from "express";
import { planAction } from "../planner/ruleBasedPlanner";
import { validatePayload, sanitizeOriginCheck, rateLimiter } from "../validation/payloadValidator";
const router = Router();
router.post("/plan", sanitizeOriginCheck, rateLimiter(30, 60_000), validatePayload, async (req, res) => {
    const startTime = Date.now();
    const payload = req.body;
    try {
        const plan = await planAction({
            userGoal: payload.userGoal,
            pageMap: payload.pageMap,
            redactionManifest: payload.redactionManifest,
        });
        const processingTime = Date.now() - startTime;
        console.log(`[PLAN] session=${payload.sessionId} goal="${payload.userGoal}" actions=${plan.actions.length} time=${processingTime}ms`);
        res.set("X-Processing-Time-Ms", processingTime.toString());
        res.json(plan);
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
router.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "0.1.0",
    });
});
router.get("/info", (_req, res) => {
    res.json({
        name: "PrivateSight Agent Server",
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

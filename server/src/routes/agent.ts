import { Router, Request, Response } from "express";
import { planAction } from "../planner/ruleBasedPlanner";
import { validatePayload, sanitizeOriginCheck, rateLimiter } from "../validation/payloadValidator";
import { ServerPlan, ClientPayload } from "@veil/shared";

const router = Router();

router.post(
  "/plan",
  sanitizeOriginCheck,
  rateLimiter(30, 60_000),
  validatePayload,
  async (req: Request<{}, {}, ClientPayload>, res: Response<ServerPlan>) => {
    const startTime = Date.now();
    const payload = req.body;

    try {
      const plan = await planAction({
        userGoal: payload.userGoal,
        pageMap: payload.pageMap,
        redactionManifest: payload.redactionManifest,
      });

      const processingTime = Date.now() - startTime;
      console.log(`[VEIL PLAN] session=${payload.sessionId} goal="${payload.userGoal}" actions=${plan.actions.length} time=${processingTime}ms`);

      res.set("X-Processing-Time-Ms", processingTime.toString());
      res.json(plan);
    } catch (error) {
      console.error("[VEIL PLAN ERROR]", error);
      res.status(500).json({
        summary: "Failed to generate action plan",
        confidence: 0,
        requiresUserConfirmation: true,
        actions: [],
      } as ServerPlan);
    }
  }
);

router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    service: "VEIL Agent Core",
  });
});

router.get("/info", (_req: Request, res: Response) => {
  res.json({
    name: "VEIL Agent Server",
    version: "0.1.0",
    planner: "rule-based",
    capabilities: [
      "highlight (Level 0)",
      "focus (Level 0)",
      "scroll (Level 0)",
      "wait (Level 0)",
      "inspect (Level 0)",
      "select (Level 2)",
      "type (Level 2)",
      "click (Level 1-3 with confirmation/explanations)",
    ],
    privacy: {
      noRawDataStorage: true,
      noExternalApiCalls: true,
      localOnlyProcessing: true,
      contextMinimization: true,
    },
  });
});

export default router;
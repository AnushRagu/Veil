import { PageMap, GoalMode, GoalClassification } from "@privatesight/shared";
export declare function classifyGoal(userGoal: string, pageMap?: PageMap): GoalClassification;
export declare function isInformationalMode(mode: GoalMode): boolean;
export declare function requiresBrowserAction(mode: GoalMode): boolean;
export declare function shouldExecuteActions(classification: GoalClassification): boolean;
//# sourceMappingURL=goalClassifier.d.ts.map
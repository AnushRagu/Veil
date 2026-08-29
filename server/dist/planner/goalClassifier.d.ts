import { PageMap } from "@privatesight/shared";
export type GoalMode = "informational" | "browser_action" | "form_task" | "navigation_task" | "ambiguous" | "unsupported";
export interface GoalClassification {
    mode: GoalMode;
    confidence: number;
    interpretation: string;
    extractedIntent?: {
        action?: string;
        target?: string;
        value?: string;
    };
    requiresClarification: boolean;
    clarificationQuestion?: string;
}
export declare function classifyGoal(userGoal: string, pageMap?: PageMap): GoalClassification;
export declare function isInformationalMode(mode: GoalMode): boolean;
export declare function requiresBrowserAction(mode: GoalMode): boolean;
export declare function shouldExecuteActions(classification: GoalClassification): boolean;
//# sourceMappingURL=goalClassifier.d.ts.map
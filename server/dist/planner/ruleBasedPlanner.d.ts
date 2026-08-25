import { ServerPlan, PageMap, RedactionEntry } from "@privatesight/shared";
export interface PlannerContext {
    userGoal: string;
    pageMap: PageMap;
    redactionManifest: RedactionEntry[];
}
export declare function createRuleBasedPlan(context: PlannerContext): ServerPlan;
export declare function planAction(context: PlannerContext): Promise<ServerPlan>;
//# sourceMappingURL=ruleBasedPlanner.d.ts.map
import { ServerAction, SanitizedElement, GoalClassification } from "@privatesight/shared";
export interface ValidationResult {
    valid: boolean;
    reason: string;
    action: ServerAction;
}
export interface ActionValidationContext {
    userGoal: string;
    classification: GoalClassification;
    pageElements: SanitizedElement[];
    previousActions: ServerAction[];
    stepNumber: number;
}
export declare function findMatchingPageElement(target: ServerAction["target"] | undefined | null, pageElements: SanitizedElement[]): SanitizedElement | undefined;
export declare function validateActionAgainstGoal(action: ServerAction, context: ActionValidationContext): ValidationResult;
export declare function validatePlanActions(planActions: ServerAction[], context: ActionValidationContext): ValidationResult[];
//# sourceMappingURL=actionValidator.d.ts.map
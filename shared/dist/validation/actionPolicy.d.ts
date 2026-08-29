import { ServerAction, ValidatedAction, ActionPolicy, ActionType, SanitizedElement } from "@privatesight/shared";
declare const ACTION_POLICY: Record<string, ActionPolicy>;
declare const HIGH_CONFIDENCE_AUTO_ACTIONS: ActionType[];
declare const CONFIRMATION_REQUIRED_ACTIONS: ActionType[];
export declare function validateAction(action: ServerAction, pageMapElements: SanitizedElement[], pageOrigin?: string): ValidatedAction;
export { ACTION_POLICY, HIGH_CONFIDENCE_AUTO_ACTIONS, CONFIRMATION_REQUIRED_ACTIONS };
//# sourceMappingURL=actionPolicy.d.ts.map
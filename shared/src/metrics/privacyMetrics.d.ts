/**
 * VEIL Quantitative Privacy Metric System
 *
 * Implements formal mathematical verification and measurement:
 *
 * 1. Privacy Leakage Rate (PLR):
 *    PLR = (Sensitive Information Exposed) / (Sensitive Information Present)
 *    Ideal target = 0.0 (Zero leakage across security boundary)
 *
 * 2. False Negative Rate (FNR):
 *    FNR = (Unredacted Sensitive Elements) / (Total Sensitive Elements)
 *    Ideal target = 0.0 (No sensitive element left unredacted)
 *
 * 3. Minimization Efficiency Rate (MER):
 *    MER = (Irrelevant Elements Pruned) / (Total Irrelevant Elements)
 *    Measures context minimization compliance (Privacy = Redaction + Minimization)
 */
export interface EvaluationGroundTruth {
    totalSensitiveElements: number;
    totalIrrelevantElements: number;
    sensitiveLabels: string[];
    sensitiveFields: string[];
}
export interface MetricEvaluationResult {
    sensitivePresent: number;
    sensitiveExposed: number;
    unredactedSensitive: number;
    irrelevantPresent: number;
    irrelevantPruned: number;
    privacyLeakageRate: number;
    falseNegativeRate: number;
    minimizationEfficiencyRate: number;
    passedVerification: boolean;
    violations: string[];
}
/**
 * Calculates Privacy Leakage Rate (PLR):
 * PLR = Sensitive Information Exposed / Sensitive Information Present
 */
export declare function calculatePrivacyLeakageRate(sensitiveExposed: number, sensitivePresent: number): number;
/**
 * Calculates False Negative Rate (FNR):
 * FNR = Unredacted Sensitive Elements / Total Sensitive Elements
 */
export declare function calculateFalseNegativeRate(unredactedSensitive: number, totalSensitive: number): number;
/**
 * Calculates Minimization Efficiency Rate (MER):
 * MER = Irrelevant Elements Pruned / Total Irrelevant Elements
 */
export declare function calculateMinimizationEfficiencyRate(irrelevantPruned: number, totalIrrelevant: number): number;
/**
 * Evaluates transmitted payload against security ground truth
 */
export declare function evaluatePayloadPrivacy(transmittedPageMap: {
    elements: Array<{
        label?: string;
        sensitive?: boolean;
        isPrunedByMinimization?: boolean;
        id?: string;
    }>;
}, groundTruth: EvaluationGroundTruth): MetricEvaluationResult;
//# sourceMappingURL=privacyMetrics.d.ts.map
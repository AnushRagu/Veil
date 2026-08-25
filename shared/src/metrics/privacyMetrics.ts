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
export function calculatePrivacyLeakageRate(
  sensitiveExposed: number,
  sensitivePresent: number
): number {
  if (sensitivePresent <= 0) return 0.0;
  return Math.min(1.0, Math.max(0.0, sensitiveExposed / sensitivePresent));
}

/**
 * Calculates False Negative Rate (FNR):
 * FNR = Unredacted Sensitive Elements / Total Sensitive Elements
 */
export function calculateFalseNegativeRate(
  unredactedSensitive: number,
  totalSensitive: number
): number {
  if (totalSensitive <= 0) return 0.0;
  return Math.min(1.0, Math.max(0.0, unredactedSensitive / totalSensitive));
}

/**
 * Calculates Minimization Efficiency Rate (MER):
 * MER = Irrelevant Elements Pruned / Total Irrelevant Elements
 */
export function calculateMinimizationEfficiencyRate(
  irrelevantPruned: number,
  totalIrrelevant: number
): number {
  if (totalIrrelevant <= 0) return 1.0;
  return Math.min(1.0, Math.max(0.0, irrelevantPruned / totalIrrelevant));
}

/**
 * Evaluates transmitted payload against security ground truth
 */
export function evaluatePayloadPrivacy(
  transmittedPageMap: { elements: Array<{ label?: string; sensitive?: boolean; isPrunedByMinimization?: boolean; id?: string }> },
  groundTruth: EvaluationGroundTruth
): MetricEvaluationResult {
  const violations: string[] = [];
  let sensitiveExposedCount = 0;
  let unredactedSensitiveCount = 0;

  const transmittedElements = transmittedPageMap.elements || [];

  // Check if any transmitted un-redacted element matches known sensitive labels/fields
  for (const element of transmittedElements) {
    const labelLower = (element.label || "").toLowerCase();
    const isExplicitlySensitive = groundTruth.sensitiveLabels.some((s) =>
      labelLower.includes(s.toLowerCase())
    );

    if (isExplicitlySensitive && !element.sensitive && !labelLower.includes("[redacted")) {
      sensitiveExposedCount++;
      unredactedSensitiveCount++;
      violations.push(`Unredacted sensitive element exposed: "${element.label}" (id: ${element.id})`);
    }
  }

  const irrelevantPruned = transmittedElements.filter((e) => e.isPrunedByMinimization).length;

  const plr = calculatePrivacyLeakageRate(
    sensitiveExposedCount,
    groundTruth.totalSensitiveElements
  );
  const fnr = calculateFalseNegativeRate(
    unredactedSensitiveCount,
    groundTruth.totalSensitiveElements
  );
  const mer = calculateMinimizationEfficiencyRate(
    irrelevantPruned,
    groundTruth.totalIrrelevantElements
  );

  return {
    sensitivePresent: groundTruth.totalSensitiveElements,
    sensitiveExposed: sensitiveExposedCount,
    unredactedSensitive: unredactedSensitiveCount,
    irrelevantPresent: groundTruth.totalIrrelevantElements,
    irrelevantPruned,
    privacyLeakageRate: plr,
    falseNegativeRate: fnr,
    minimizationEfficiencyRate: mer,
    passedVerification: plr === 0 && fnr === 0,
    violations,
  };
}

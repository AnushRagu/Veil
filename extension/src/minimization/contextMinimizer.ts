import { SanitizedElement, Bounds } from "@veil/shared";

export interface MinimizationResult {
  minimizedElements: SanitizedElement[];
  prunedElements: SanitizedElement[];
  totalOriginal: number;
  totalKept: number;
  prunedCount: number;
  minimizationEfficiency: number;
  peripheralMasks: Bounds[];
}

/**
 * Task-Aware Context Minimization Engine
 *
 * Implements: Privacy = Redaction + Minimization
 *
 * Strict information boundary: Prunes peripheral text blocks, unrelated user details,
 * distant navigation sidebars, and irrelevant forms based on user goal.
 */
export class ContextMinimizer {
  private static STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "but", "if", "or", "because", "as", "until", "while", "that", "this", "these",
    "those", "then", "just", "so", "than", "such", "both", "through", "during"
  ]);

  /**
   * Extract meaningful keywords and intent tokens from user goal
   */
  public static extractGoalKeywords(goal: string): string[] {
    return goal
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !this.STOP_WORDS.has(w));
  }

  /**
   * Calculates element relevance score (0.0 to 1.0) relative to goal keywords
   */
  public static scoreElementRelevance(element: SanitizedElement, keywords: string[]): number {
    if (keywords.length === 0) return 1.0;

    const labelLower = (element.label || "").toLowerCase();
    const roleLower = (element.role || "").toLowerCase();
    const idLower = (element.id || "").toLowerCase();

    let score = 0.0;
    let hasDirectMatch = false;

    // Direct exact or partial keyword matches
    for (const kw of keywords) {
      if (labelLower.includes(kw)) {
        score += 0.7;
        hasDirectMatch = true;
      }
      if (roleLower.includes(kw) || idLower.includes(kw)) {
        score += 0.4;
        hasDirectMatch = true;
      }
    }

    if (hasDirectMatch) {
      if (["button", "link", "textbox", "searchbox"].includes(element.role)) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Minimizes the elements by task relevance
   */
  public static minimizeContext(
    elements: SanitizedElement[],
    userGoal: string,
    relevanceThreshold = 0.2
  ): MinimizationResult {
    const keywords = this.extractGoalKeywords(userGoal);
    const scoredElements = elements.map((el) => {
      const score = this.scoreElementRelevance(el, keywords);
      return {
        ...el,
        relevanceScore: score,
      };
    });

    // If goal is very generic, keep elements with base visibility
    const isGeneric = keywords.length === 0;

    const minimizedElements: SanitizedElement[] = [];
    const prunedElements: SanitizedElement[] = [];
    const peripheralMasks: Bounds[] = [];

    for (const el of scoredElements) {
      const isRelevant = isGeneric || (el.relevanceScore !== undefined && el.relevanceScore >= relevanceThreshold);

      if (isRelevant) {
        minimizedElements.push({
          ...el,
          isPrunedByMinimization: false,
        });
      } else {
        prunedElements.push({
          ...el,
          isPrunedByMinimization: true,
        });
        if (el.bounds && el.bounds.width > 0 && el.bounds.height > 0) {
          peripheralMasks.push({ ...el.bounds });
        }
      }
    }

    const totalOriginal = elements.length;
    const totalKept = minimizedElements.length;
    const prunedCount = prunedElements.length;
    const minimizationEfficiency = totalOriginal > 0 ? prunedCount / totalOriginal : 0.0;

    return {
      minimizedElements,
      prunedElements,
      totalOriginal,
      totalKept,
      prunedCount,
      minimizationEfficiency,
      peripheralMasks,
    };
  }

  /**
   * Applies spatial minimization masks onto screenshot canvas to obscure peripheral zones
   */
  public static applyMinimizationMasksToCanvas(
    canvas: HTMLCanvasElement,
    peripheralMasks: Bounds[]
  ): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "rgba(240, 240, 240, 0.85)";
    for (const bounds of peripheralMasks) {
      if (bounds.width > 0 && bounds.height > 0) {
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }
  }
}

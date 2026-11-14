import type {
  AttemptComparisonDelta,
  AttemptComparisonResult,
  CategoryPerformanceLabel,
  DetailedEvaluationReport,
  EvaluationCategoryId,
  EvaluationCategoryResult,
  EvaluationStatus,
  OverallPerformanceClassification,
} from './types.ts';

export interface EvaluationCriterionDefinition {
  id: EvaluationCategoryId;
  label: string;
  weightPct: number;
  summary: string;
  focusAreas: string[];
}

export const EVALUATION_CRITERIA: EvaluationCriterionDefinition[] = [
  {
    id: 'code_quality',
    label: 'Code Quality',
    weightPct: 20,
    summary: 'Readability, naming conventions, modularity, error handling, reusability, and coding standards.',
    focusAreas: [
      'Readability & clear structure',
      'Naming conventions & semantic clarity',
      'Maintainability & modularity',
      'Error handling & edge-case guards',
      'Reusability & coding standards',
    ],
  },
  {
    id: 'security',
    label: 'Security',
    weightPct: 20,
    summary: 'Input validation, auth boundaries, data protection, injection avoidance, secret safety, and secure API patterns.',
    focusAreas: [
      'Input validation & sanitization',
      'Authentication & authorization awareness',
      'Injection & dynamic execution safety',
      'Sensitive information protection',
      'Secure API & boundary handling',
    ],
  },
  {
    id: 'efficiency',
    label: 'Efficiency',
    weightPct: 15,
    summary: 'Time/space complexity, algorithmic choices, query/lookup efficiency, and avoiding bottlenecks.',
    focusAreas: [
      'Time complexity & loop depth',
      'Space complexity & allocation discipline',
      'Algorithmic lookup optimization (Set/Map)',
      'Resource consumption & execution latency',
      'Bottleneck avoidance',
    ],
  },
  {
    id: 'testing',
    label: 'Testing',
    weightPct: 15,
    summary: 'Automated verification pass rate, edge-case coverage, invalid input handling, and failure resilience.',
    focusAreas: [
      'Automated test pass coverage',
      'Integration & contract assertions',
      'Boundary & empty-input edge cases',
      'Invalid input & error scenario handling',
      'Diagnostic conceptual alignment',
    ],
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    weightPct: 10,
    summary: 'WCAG semantic structure, keyboard navigation, ARIA attributes, contrast awareness, and assistive clarity.',
    focusAreas: [
      'WCAG 2.1 semantic landmarks & headings',
      'Keyboard operability & focus flow',
      'Screen-reader & ARIA labeling',
      'Contrast & visual clarity',
      'Form & interactive control semantics',
    ],
  },
  {
    id: 'alignment',
    label: 'Problem Statement Alignment',
    weightPct: 20,
    summary: 'Exact fulfillment of prompt requirements, functional completeness, return contract accuracy, and conceptual mastery.',
    focusAreas: [
      'Functional completeness against prompt',
      'Output contract & signature fidelity',
      'Conceptual diagnostic accuracy',
      'Domain correctness & edge-case adherence',
      'No missing required behaviors',
    ],
  },
];

export const EVALUATION_PIPELINE_STEPS: string[] = [
  '1. Receive submission payload',
  '2. Validate payload structure & inputs',
  '3. Analyze prompt & target skill requirements',
  '4. Execute deterministic automated checks',
  '5. Evaluate Code Quality (20%)',
  '6. Evaluate Security (20%)',
  '7. Evaluate Efficiency (15%)',
  '8. Evaluate Testing (15%)',
  '9. Evaluate Accessibility (10%)',
  '10. Evaluate Problem Statement Alignment (20%)',
  '11. Calculate mathematically weighted overall score',
  '12. Generate grounded actionable AI/diagnostic feedback',
  '13. Persist normalized evaluation report & category scores',
];

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function classifyCategoryPerformance(score: number): CategoryPerformanceLabel {
  const s = clampScore(score);
  if (s >= 90) return 'Exemplary';
  if (s >= 78) return 'Strong';
  if (s >= 65) return 'Proficient';
  if (s >= 50) return 'Developing';
  return 'Needs Remediation';
}

export function classifyOverallPerformance(overallScore: number): OverallPerformanceClassification {
  const s = clampScore(overallScore);
  if (s >= 90) return 'Distinction';
  if (s >= 78) return 'Proficient';
  if (s >= 65) return 'Satisfactory';
  if (s >= 50) return 'Developing';
  return 'Needs Improvement';
}

export function determineEvaluationStatus(
  combinedScore: number,
  overallScore: number
): EvaluationStatus {
  if (combinedScore < 50 || overallScore < 50) {
    return 'Remediation Triggered';
  }
  if (combinedScore >= 70 && overallScore >= 70) {
    return 'Verified Pass';
  }
  return 'Conditional Pass';
}

/**
 * Mathematically derives the overall score (0-100) strictly from category scores and weights.
 */
export function computeWeightedEvaluationScore(
  categories: Array<Pick<EvaluationCategoryResult, 'id' | 'score' | 'weightPct'>>
): {
  overallScore: number;
  rawWeightedSum: number;
  contributions: Record<EvaluationCategoryId, number>;
} {
  let rawWeightedSum = 0;
  let weightTotal = 0;
  const contributions: Record<EvaluationCategoryId, number> = {
    code_quality: 0,
    security: 0,
    efficiency: 0,
    testing: 0,
    accessibility: 0,
    alignment: 0,
  };

  for (const cat of categories) {
    const cleanScore = clampScore(cat.score);
    const contrib = roundToTwo((cleanScore * cat.weightPct) / 100);
    contributions[cat.id] = contrib;
    rawWeightedSum += contrib;
    weightTotal += cat.weightPct;
  }

  const normalized =
    weightTotal > 0 && Math.abs(weightTotal - 100) > 0.01
      ? (rawWeightedSum / weightTotal) * 100
      : rawWeightedSum;

  return {
    overallScore: clampScore(normalized),
    rawWeightedSum: roundToTwo(rawWeightedSum),
    contributions,
  };
}

/**
 * Compares Attempt A (earlier/baseline) against Attempt B (later/target).
 */
export function compareEvaluationAttempts(
  attemptA: DetailedEvaluationReport,
  attemptB: DetailedEvaluationReport
): AttemptComparisonResult {
  const mapA = new Map(attemptA.categories.map((c) => [c.id, c]));
  const mapB = new Map(attemptB.categories.map((c) => [c.id, c]));

  const categoryDeltas: AttemptComparisonDelta[] = EVALUATION_CRITERIA.map((def) => {
    const catA = mapA.get(def.id);
    const catB = mapB.get(def.id);
    const scoreA = catA?.score ?? 0;
    const scoreB = catB?.score ?? 0;
    const delta = Math.round(scoreB - scoreA);
    const weightedDelta = roundToTwo(((scoreB - scoreA) * def.weightPct) / 100);
    const direction: AttemptComparisonDelta['direction'] =
      delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'unchanged';

    return {
      categoryId: def.id,
      label: def.label,
      weightPct: def.weightPct,
      scoreA,
      scoreB,
      delta,
      weightedDelta,
      direction,
    };
  });

  const overallDelta = Math.round(attemptB.overallScore - attemptA.overallScore);
  const improvementPct =
    attemptA.overallScore > 0
      ? Math.round(((attemptB.overallScore - attemptA.overallScore) / attemptA.overallScore) * 1000) / 10
      : null;

  return {
    attemptA,
    attemptB,
    overallDelta,
    improvementPct,
    improvedCategories: categoryDeltas.filter((d) => d.direction === 'improved'),
    decliningCategories: categoryDeltas.filter((d) => d.direction === 'declined'),
    unchangedCategories: categoryDeltas.filter((d) => d.direction === 'unchanged'),
    categoryDeltas,
  };
}

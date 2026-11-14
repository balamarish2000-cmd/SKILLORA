import { SKILLS_CATALOG, TARGET_ROLES } from '../../src/shared/seedData.ts';
import type { LearnerProfile, SkillAnalysis, SkillGapItem } from '../../src/shared/types.ts';

export function runSkillAnalyst(profile: LearnerProfile): SkillAnalysis {
  const role = TARGET_ROLES.find((r) => r.id === profile.targetRoleId) ?? TARGET_ROLES[0];
  const userSkillMap = new Map(profile.skills.map((s) => [s.skillId, s]));

  let weightedScoreSum = 0;
  let totalWeight = 0;
  let confidenceSum = 0;

  const comparisons: SkillGapItem[] = role.requirements.map((req) => {
    const def = SKILLS_CATALOG.find((s) => s.id === req.skillId);
    const current = userSkillMap.get(req.skillId);
    const currentLevel = current ? Math.min(5, Math.max(0, current.level)) : 0;
    const confidence = current ? current.confidence : 0.35;
    const gap = Math.max(0, Math.round((req.targetLevel - currentLevel) * 10) / 10);

    const attainment = Math.min(1, currentLevel / req.targetLevel);
    weightedScoreSum += attainment * req.weight;
    totalWeight += req.weight;
    confidenceSum += confidence;

    const prerequisites = def?.prerequisites ?? [];
    const missingPrerequisites = prerequisites.filter((preId) => {
      const preSkill = userSkillMap.get(preId);
      return !preSkill || preSkill.level < 2;
    });

    const status: SkillGapItem['status'] =
      gap <= 0.1 ? 'met' : currentLevel > 0 ? 'partial' : 'missing';

    const priorityMultiplier =
      req.requirementType === 'foundational'
        ? 1.15
        : req.requirementType === 'optional'
          ? 0.65
          : 1.0;

    const priorityScore =
      Math.round(gap * req.weight * priorityMultiplier * (1.2 - confidence * 0.2) * 10) / 10;

    return {
      skillId: req.skillId,
      skillName: def?.name ?? req.skillId,
      domainId: def?.domainId ?? role.domainId,
      category: def?.category ?? 'Foundations',
      requirementType: req.requirementType,
      currentLevel,
      targetLevel: req.targetLevel,
      gap,
      weight: req.weight,
      confidence: Math.round(confidence * 100) / 100,
      source: current?.source ?? 'unassessed',
      evidence: current?.evidence ?? 'Not yet evidenced in Digital Twin',
      priorityScore,
      status,
      prerequisites,
      missingPrerequisites,
    };
  });

  const overallReadiness =
    totalWeight > 0 ? Math.round((weightedScoreSum / totalWeight) * 100) : 0;
  const averageConfidence =
    comparisons.length > 0
      ? Math.round((confidenceSum / comparisons.length) * 100) / 100
      : 0;

  const strengths = comparisons
    .filter((c) => c.status === 'met' || c.currentLevel >= 3)
    .sort((a, b) => b.currentLevel - a.currentLevel);

  const gaps = comparisons
    .filter((c) => c.gap > 0.1 && c.requirementType !== 'optional')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const optionalGaps = comparisons
    .filter((c) => c.gap > 0.1 && c.requirementType === 'optional')
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    profileId: profile.id,
    targetRoleId: role.id,
    targetRoleTitle: role.title,
    targetDomainId: role.domainId,
    overallReadiness,
    averageConfidence,
    strengths,
    gaps,
    optionalGaps,
    allSkillComparisons: comparisons,
    generatedAt: new Date().toISOString(),
  };
}

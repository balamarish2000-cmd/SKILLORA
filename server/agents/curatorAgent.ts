import {
  CAREER_DOMAINS,
  LEARNING_RESOURCES,
  SKILLS_CATALOG,
  TARGET_ROLES,
} from '../../src/shared/seedData.ts';
import type {
  CareerTransitionSimulation,
  LearnerProfile,
  LearningPlanMode,
  LearningResource,
  ReplanDiff,
  ReplanDiffItem,
  RoadmapStep,
  RoleId,
  SkillAnalysis,
} from '../../src/shared/types.ts';
import { runSkillAnalyst } from './skillAnalyst.ts';

export interface CuratorOptions {
  previousSteps?: RoadmapStep[];
  remediationSkillIds?: string[];
  remediationReason?: string;
  trigger?: ReplanDiff['trigger'];
  triggerDetail?: string;
  previousGoalRole?: string;
  newGoalRole?: string;
  learningPlanOverride?: LearningPlanMode;
}

function selectResourceForSkill(
  skillId: string,
  currentLevel: number,
  isRemediation: boolean,
  variantIndex = 0
): LearningResource | undefined {
  const candidates = LEARNING_RESOURCES.filter((r) => r.skillId === skillId);
  if (candidates.length === 0) return undefined;

  if (isRemediation) {
    const practiceOrBeginner = candidates.filter(
      (r) => r.difficulty === 'Beginner' || r.type === 'practice'
    );
    if (practiceOrBeginner.length > 0) {
      return practiceOrBeginner[variantIndex % practiceOrBeginner.length];
    }
  }

  if (currentLevel < 1.5) {
    const beginner = candidates.find((r) => r.difficulty === 'Beginner');
    if (beginner) return beginner;
  } else if (currentLevel < 3.0) {
    const inter = candidates.find((r) => r.difficulty === 'Intermediate');
    if (inter) return inter;
  }

  return candidates[variantIndex % candidates.length];
}

export function topologicalOrderSkills(
  neededSkillIds: string[],
  priorityBySkill: Map<string, number>,
  remediationSet: Set<string>
): string[] {
  const neededSet = new Set(neededSkillIds);
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: string[] = [];

  const sortedInputs = [...neededSkillIds].sort((a, b) => {
    const remA = remediationSet.has(a) ? 1 : 0;
    const remB = remediationSet.has(b) ? 1 : 0;
    if (remA !== remB) return remB - remA;
    return (priorityBySkill.get(b) ?? 0) - (priorityBySkill.get(a) ?? 0);
  });

  function visit(skillId: string) {
    if (visited.has(skillId) || visiting.has(skillId)) return;
    visiting.add(skillId);

    const def = SKILLS_CATALOG.find((s) => s.id === skillId);
    if (def) {
      const prereqs = [...def.prerequisites].sort(
        (a, b) => (priorityBySkill.get(b) ?? 0) - (priorityBySkill.get(a) ?? 0)
      );
      for (const pre of prereqs) {
        if (neededSet.has(pre)) {
          visit(pre);
        }
      }
    }

    visiting.delete(skillId);
    visited.add(skillId);
    ordered.push(skillId);
  }

  for (const id of sortedInputs) {
    visit(id);
  }

  return ordered;
}

export function runCuratorAgent(
  profile: LearnerProfile,
  analysis: SkillAnalysis,
  options: CuratorOptions = {}
): { steps: RoadmapStep[]; diff: ReplanDiff } {
  const previousSteps = options.previousSteps ?? [];
  const planMode: LearningPlanMode =
    options.learningPlanOverride ?? profile.learningPlan ?? 'balanced';
  const remediationSet = new Set(options.remediationSkillIds ?? []);
  const userSkillMap = new Map(profile.skills.map((s) => [s.skillId, s.level]));
  const prevCompletionMap = new Map(
    previousSteps.map((s) => [s.resourceId, { completed: s.completed, completedAt: s.completedAt }])
  );

  // Collect core gaps; deep_mastery also includes optional stretch gaps
  const activeGaps =
    planMode === 'deep_mastery'
      ? [...analysis.gaps, ...analysis.optionalGaps]
      : [...analysis.gaps];

  const gapMap = new Map(activeGaps.map((g) => [g.skillId, g]));
  const neededSkillIds = new Set<string>(activeGaps.map((g) => g.skillId));

  for (const remId of remediationSet) {
    neededSkillIds.add(remId);
  }

  // Expand transitive prerequisites when user level < 2
  const queue = [...neededSkillIds];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const def = SKILLS_CATALOG.find((s) => s.id === cur);
    if (!def) continue;
    for (const preId of def.prerequisites) {
      const level = userSkillMap.get(preId) ?? 0;
      if (level < 2 && !neededSkillIds.has(preId)) {
        neededSkillIds.add(preId);
        queue.push(preId);
      }
    }
  }

  const priorityBySkill = new Map<string, number>();
  for (const skillId of neededSkillIds) {
    const gapItem = gapMap.get(skillId);
    let score = gapItem ? gapItem.priorityScore : 8;
    if (remediationSet.has(skillId)) {
      score += 100;
    }
    priorityBySkill.set(skillId, score);
  }

  const orderedSkillIds = topologicalOrderSkills(
    [...neededSkillIds],
    priorityBySkill,
    remediationSet
  );

  const steps: RoadmapStep[] = [];
  let orderCounter = 1;

  for (const skillId of orderedSkillIds) {
    const def = SKILLS_CATALOG.find((s) => s.id === skillId);
    if (!def) continue;

    const currentLevel = userSkillMap.get(skillId) ?? 0;
    const gapItem = gapMap.get(skillId);
    const targetLevel = gapItem?.targetLevel ?? 3;
    const isRem = remediationSet.has(skillId);

    const primaryRes = selectResourceForSkill(skillId, currentLevel, isRem, 0);
    if (primaryRes) {
      const prevState = isRem ? undefined : prevCompletionMap.get(primaryRes.id);
      const effectiveHours =
        planMode === 'fast_track'
          ? Math.max(2, Math.round(primaryRes.hours * 0.7))
          : primaryRes.hours;
      const reason = isRem
        ? options.remediationReason ||
          `Remediation inserted: Assessment score below 50% on ${def.name}`
        : gapItem
          ? `Closes ${gapItem.gap.toFixed(1)}-level gap for ${analysis.targetRoleTitle} (weight ${gapItem.weight}/5)`
          : `Prerequisite foundation required before downstream ${analysis.targetRoleTitle} skills`;

      steps.push({
        id: `step_${skillId}_${primaryRes.id}`,
        order: orderCounter++,
        skillId,
        skillName: def.name,
        domainId: def.domainId,
        category: def.category,
        learningObjective: `Build ${def.name} competency from level ${currentLevel} toward ${targetLevel}: ${def.description}`,
        currentLevel,
        targetLevel,
        resourceId: primaryRes.id,
        resourceTitle: primaryRes.title,
        provider: primaryRes.provider,
        url: primaryRes.url,
        verified: primaryRes.verified,
        resourceType: primaryRes.type,
        difficulty: primaryRes.difficulty,
        hours: effectiveHours,
        practicalAssignment: def.practicalIndicator,
        assessmentCheckpoint: `${def.assessmentMethod} (Target >= 70%)`,
        completed: prevState?.completed ?? false,
        completedAt: prevState?.completedAt ?? null,
        isRemediation: isRem,
        reason,
        prerequisites: def.prerequisites,
        gapSeverity: gapItem?.gap ?? 2,
      });
    }

    // Add applied practice modules in Balanced (for large gaps >= 3) or Deep Mastery (for gaps >= 2)
    const shouldAddPractice =
      isRem ||
      (planMode === 'balanced' && gapItem && gapItem.gap >= 3) ||
      (planMode === 'deep_mastery' && gapItem && gapItem.gap >= 2);

    if (shouldAddPractice) {
      const practiceRes = selectResourceForSkill(skillId, currentLevel, true, 1);
      if (practiceRes && practiceRes.id !== primaryRes?.id) {
        const prevState = isRem ? undefined : prevCompletionMap.get(practiceRes.id);
        steps.push({
          id: `step_${skillId}_${practiceRes.id}`,
          order: orderCounter++,
          skillId,
          skillName: def.name,
          domainId: def.domainId,
          category: def.category,
          learningObjective: `Apply ${def.name} in a practical exercise to close remaining mastery gap.`,
          currentLevel,
          targetLevel,
          resourceId: practiceRes.id,
          resourceTitle: practiceRes.title,
          provider: practiceRes.provider,
          url: practiceRes.url,
          verified: practiceRes.verified,
          resourceType: practiceRes.type,
          difficulty: practiceRes.difficulty,
          hours: practiceRes.hours,
          practicalAssignment: def.practicalIndicator,
          assessmentCheckpoint: `Complete applied verification in ${def.name}`,
          completed: prevState?.completed ?? false,
          completedAt: prevState?.completedAt ?? null,
          isRemediation: isRem,
          reason: isRem
            ? `Targeted hands-on drills after ${def.name} assessment failure`
            : `Applied practice lab to solidify ${def.name} from level ${currentLevel} to ${targetLevel}`,
          prerequisites: def.prerequisites,
          gapSeverity: gapItem?.gap ?? 2,
        });
      }
    }

    // Dedicated remediation lab when an assessment drops below 50%
    if (isRem) {
      const allForSkill = LEARNING_RESOURCES.filter((r) => r.skillId === skillId);
      const alreadyUsedIds = new Set(steps.filter((s) => s.skillId === skillId).map((s) => s.resourceId));
      const freshRemRes =
        allForSkill.find((r) => !alreadyUsedIds.has(r.id) && r.type === 'practice') ??
        allForSkill.find((r) => !alreadyUsedIds.has(r.id)) ??
        allForSkill[0];

      if (freshRemRes) {
        steps.push({
          id: `step_rem_${skillId}_${freshRemRes.id}`,
          order: orderCounter++,
          skillId,
          skillName: def.name,
          domainId: def.domainId,
          category: def.category,
          learningObjective: `Remediate foundational gaps in ${def.name} before retrying the Assessor verification.`,
          currentLevel,
          targetLevel,
          resourceId: freshRemRes.id,
          resourceTitle: `Remediation Lab: ${freshRemRes.title}`,
          provider: freshRemRes.provider,
          url: freshRemRes.url,
          verified: freshRemRes.verified,
          resourceType: 'practice',
          difficulty: 'Beginner',
          hours: Math.min(8, freshRemRes.hours),
          practicalAssignment: def.practicalIndicator,
          assessmentCheckpoint: `Re-take ${def.name} assessment and achieve >= 50%`,
          completed: false,
          completedAt: null,
          isRemediation: true,
          reason:
            options.remediationReason ||
            `Inserted targeted ${def.name} remediation lab after assessment score < 50%`,
          prerequisites: def.prerequisites,
          gapSeverity: gapItem?.gap ?? 3,
        });
      }
    }
  }

  const diff = computeReplanDiff(profile.id, previousSteps, steps, options);
  return { steps, diff };
}

export function computeReplanDiff(
  profileId: string,
  previousSteps: RoadmapStep[],
  nextSteps: RoadmapStep[],
  options: CuratorOptions = {}
): ReplanDiff {
  const prevById = new Map(previousSteps.map((s) => [s.id, s]));
  const nextById = new Map(nextSteps.map((s) => [s.id, s]));

  const added: ReplanDiffItem[] = [];
  const removed: ReplanDiffItem[] = [];
  const reordered: ReplanDiffItem[] = [];

  for (const step of nextSteps) {
    const prev = prevById.get(step.id);
    if (!prev) {
      added.push({
        skillId: step.skillId,
        skillName: step.skillName,
        resourceTitle: step.resourceTitle,
        changeType: 'added',
        newOrder: step.order,
        reason: step.reason,
      });
    } else if (prev.order !== step.order || (step.isRemediation && !prev.isRemediation)) {
      reordered.push({
        skillId: step.skillId,
        skillName: step.skillName,
        resourceTitle: step.resourceTitle,
        changeType: 'reordered',
        previousOrder: prev.order,
        newOrder: step.order,
        reason: step.isRemediation
          ? step.reason
          : `Reprioritized from step #${prev.order} to #${step.order} to satisfy prerequisite chain`,
      });
    }
  }

  for (const prev of previousSteps) {
    if (!nextById.has(prev.id)) {
      removed.push({
        skillId: prev.skillId,
        skillName: prev.skillName,
        resourceTitle: prev.resourceTitle,
        changeType: 'removed',
        previousOrder: prev.order,
        reason:
          options.trigger === 'goal_change'
            ? `No longer required for ${options.newGoalRole ?? 'new target role'}`
            : `Replaced by updated ${prev.skillName} learning sequence`,
      });
    }
  }

  const totalHoursBefore = Math.round(previousSteps.reduce((s, x) => s + x.hours, 0) * 10) / 10;
  const totalHoursAfter = Math.round(nextSteps.reduce((s, x) => s + x.hours, 0) * 10) / 10;

  return {
    id: `diff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    profileId,
    trigger: options.trigger ?? 'initial_build',
    triggerDetail:
      options.triggerDetail ??
      'Generated prerequisite-aware roadmap from current Skill Digital Twin',
    previousGoalRole: options.previousGoalRole,
    newGoalRole: options.newGoalRole,
    previousPlanSummary: previousSteps
      .slice(0, 6)
      .map((s) => `#${s.order} ${s.skillName}: ${s.resourceTitle} (${s.hours}h)`),
    newPlanSummary: nextSteps
      .slice(0, 6)
      .map((s) => `#${s.order} ${s.skillName}: ${s.resourceTitle} (${s.hours}h)`),
    added,
    removed,
    reordered,
    totalHoursBefore,
    totalHoursAfter,
    createdAt: new Date().toISOString(),
  };
}

export function simulateCareerTransition(
  profile: LearnerProfile,
  fromRoleId: RoleId,
  toRoleId: RoleId
): CareerTransitionSimulation {
  const fromRole = TARGET_ROLES.find((r) => r.id === fromRoleId) ?? TARGET_ROLES[0];
  const toRole = TARGET_ROLES.find((r) => r.id === toRoleId) ?? TARGET_ROLES[0];
  const domainMap = new Map(CAREER_DOMAINS.map((d) => [d.id, d]));

  const fromAnalysis = runSkillAnalyst({ ...profile, targetRoleId: fromRole.id });
  const toAnalysis = runSkillAnalyst({ ...profile, targetRoleId: toRole.id });

  const userSkillMap = new Map(profile.skills.map((s) => [s.skillId, s]));
  const fromReqSet = new Set(fromRole.requirements.map((r) => r.skillId));

  const transferableSkills: CareerTransitionSimulation['transferableSkills'] = [];
  const missingSkills: CareerTransitionSimulation['missingSkills'] = [];

  for (const req of toRole.requirements) {
    const def = SKILLS_CATALOG.find((s) => s.id === req.skillId);
    const skillName = def?.name ?? req.skillId;
    const current = userSkillMap.get(req.skillId);
    const currentLevel = current?.level ?? 0;

    if (currentLevel >= 1.5 || fromReqSet.has(req.skillId)) {
      const isDirectOverlap = fromReqSet.has(req.skillId);
      if (currentLevel >= 1.5) {
        transferableSkills.push({
          skillId: req.skillId,
          skillName,
          currentLevel,
          targetLevel: req.targetLevel,
          reuseNote: isDirectOverlap
            ? `Shared core competency between ${fromRole.title} and ${toRole.title}`
            : `Existing proficiency (${currentLevel}/5) transfers directly into ${toRole.title}`,
        });
      }
    }

    if (currentLevel < req.targetLevel - 0.1) {
      const gap = Math.round((req.targetLevel - currentLevel) * 10) / 10;
      const priority: 'Foundational' | 'Core' | 'Advanced' =
        req.requirementType === 'foundational'
          ? 'Foundational'
          : req.requirementType === 'advanced' || req.requirementType === 'optional'
            ? 'Advanced'
            : 'Core';
      missingSkills.push({
        skillId: req.skillId,
        skillName,
        currentLevel,
        targetLevel: req.targetLevel,
        gap,
        priority,
      });
    }
  }

  const { steps } = runCuratorAgent({ ...profile, targetRoleId: toRole.id }, toAnalysis, {
    trigger: 'goal_change',
    triggerDetail: `Simulated transition from ${fromRole.title} to ${toRole.title}`,
  });

  const estimatedHours = Math.round(steps.reduce((s, x) => s + x.hours, 0) * 10) / 10;
  const weeklyHours = Math.max(1, profile.weeklyHours || 12);
  const estimatedWeeks = Math.ceil(estimatedHours / weeklyHours);

  const toDomain = domainMap.get(toRole.domainId);
  const qualificationRequirements = `${toRole.educationNote}${toDomain?.qualificationNote ? ` ${toDomain.qualificationNote}` : ''}`;

  return {
    fromRoleId: fromRole.id,
    fromRoleTitle: fromRole.title,
    fromDomainName: domainMap.get(fromRole.domainId)?.name ?? fromRole.domainId,
    toRoleId: toRole.id,
    toRoleTitle: toRole.title,
    toDomainName: toDomain?.name ?? toRole.domainId,
    fromReadinessPct: fromAnalysis.overallReadiness,
    toReadinessBeforeTransitionPct: toAnalysis.overallReadiness,
    transferableSkills,
    missingSkills,
    qualificationRequirements,
    estimatedHours,
    estimatedWeeks,
    suggestedRoadmap: steps,
  };
}

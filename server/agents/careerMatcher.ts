import { CAREER_DOMAINS, SKILLS_CATALOG, TARGET_ROLES } from '../../src/shared/seedData.ts';
import type { CareerMatchItem, LearnerProfile } from '../../src/shared/types.ts';

export function runCareerMatcher(profile: LearnerProfile): CareerMatchItem[] {
  const userSkillMap = new Map(profile.skills.map((s) => [s.skillId, s.level]));
  const domainMap = new Map(CAREER_DOMAINS.map((d) => [d.id, d.name]));

  const matches: CareerMatchItem[] = TARGET_ROLES.map((role) => {
    let weightedSum = 0;
    let totalWeight = 0;
    let matchedSkillsCount = 0;
    const transferable: string[] = [];
    const missing: Array<{ name: string; gapWeight: number }> = [];

    for (const req of role.requirements) {
      const level = userSkillMap.get(req.skillId) ?? 0;
      const attainment = Math.min(1, level / req.targetLevel);
      weightedSum += attainment * req.weight;
      totalWeight += req.weight;

      const def = SKILLS_CATALOG.find((s) => s.id === req.skillId);
      const skillName = def?.name ?? req.skillId;

      if (level >= req.targetLevel - 0.5) {
        matchedSkillsCount += 1;
        transferable.push(skillName);
      } else {
        if (level >= 1.5) {
          transferable.push(skillName);
        }
        missing.push({
          name: skillName,
          gapWeight: (req.targetLevel - level) * req.weight,
        });
      }
    }

    missing.sort((a, b) => b.gapWeight - a.gapWeight);
    const readinessPct = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

    return {
      roleId: role.id,
      domainId: role.domainId,
      domainName: domainMap.get(role.domainId) ?? role.domainId,
      roleTitle: role.title,
      readinessPct,
      matchedSkillsCount,
      totalRequiredSkills: role.requirements.length,
      transferableSkills: transferable.slice(0, 4),
      topMissingSkills: missing.slice(0, 3).map((m) => m.name),
      avgSalaryRange: role.avgSalaryRange,
      demandLevel: role.demandLevel,
      demandGrowthPct: role.demandGrowthPct,
      summary: role.summary,
      isCurrentGoal: role.id === profile.targetRoleId,
    };
  });

  return matches.sort((a, b) => {
    if (b.readinessPct !== a.readinessPct) return b.readinessPct - a.readinessPct;
    return a.isCurrentGoal ? -1 : 1;
  });
}

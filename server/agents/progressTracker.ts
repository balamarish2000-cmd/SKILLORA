import type { LearnerProfile, ProgressMetrics, RoadmapStep } from '../../src/shared/types.ts';

export function runProgressTracker(
  profile: LearnerProfile,
  roadmap: RoadmapStep[],
  referenceDate: Date = new Date()
): ProgressMetrics {
  const totalSteps = roadmap.length;
  const completedSteps = roadmap.filter((s) => s.status === 'completed' || s.completed).length;
  const inProgressSteps = roadmap.filter(
    (s) => !s.completed && s.status === 'in_progress'
  ).length;
  const completionPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const totalHours = Math.round(roadmap.reduce((acc, s) => acc + s.hours, 0) * 10) / 10;
  const completedHours =
    Math.round(
      roadmap
        .filter((s) => s.status === 'completed' || s.completed)
        .reduce((acc, s) => acc + s.hours, 0) * 10
    ) / 10;
  const remainingHours = Math.max(0, Math.round((totalHours - completedHours) * 10) / 10);

  const weeklyHours = Math.max(1, profile.weeklyHours || 10);
  const dailyHours = Math.round((weeklyHours / 7) * 10) / 10;
  const estimatedWeeksRemaining = Math.ceil(remainingHours / weeklyHours);

  const readyDate = new Date(referenceDate.getTime());
  readyDate.setDate(readyDate.getDate() + estimatedWeeksRemaining * 7);
  const forecastedReadyDate = readyDate.toISOString().slice(0, 10);

  let paceStatus: ProgressMetrics['paceStatus'] = 'On Track';
  if (totalSteps > 0 && (completionPct >= 50 || estimatedWeeksRemaining <= 4)) {
    paceStatus = 'Ahead';
  } else if (estimatedWeeksRemaining > 14 || weeklyHours < 8) {
    paceStatus = 'Needs Acceleration';
  }

  return {
    profileId: profile.id,
    learningPlan: profile.learningPlan ?? 'balanced',
    totalSteps,
    completedSteps,
    inProgressSteps,
    completionPct,
    totalHours,
    completedHours,
    remainingHours,
    weeklyHours,
    dailyHours,
    estimatedWeeksRemaining,
    forecastedReadyDate,
    paceStatus,
  };
}

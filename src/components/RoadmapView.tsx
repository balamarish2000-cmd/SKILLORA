import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  ExternalLink,
  GitBranch,
  Info,
} from 'lucide-react';
import type { LearningPlanMode, RoadmapStepStatus, TwinSnapshot } from '../shared/types';

interface RoadmapViewProps {
  twin: TwinSnapshot;
  onUpdateStepStatus: (stepId: string, status: RoadmapStepStatus) => Promise<void>;
  onChangeLearningPlan: (plan: LearningPlanMode) => Promise<void>;
  onOpenReplanDiff: () => void;
  onStartAssessmentForSkill: (skillId: string) => void;
}

type FilterMode = 'all' | 'not_started' | 'in_progress' | 'completed' | 'remediation';

const PLAN_OPTIONS: Array<{ id: LearningPlanMode; label: string; hint: string }> = [
  { id: 'fast_track', label: 'Fast Track', hint: 'Core gaps only' },
  { id: 'balanced', label: 'Balanced', hint: 'Core + foundations' },
  { id: 'deep_mastery', label: 'Deep Mastery', hint: 'Full depth + optional' },
];

const STATUS_BUTTONS: Array<{ id: RoadmapStepStatus; label: string }> = [
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'Started' },
  { id: 'completed', label: 'Completed' },
];

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  twin,
  onUpdateStepStatus,
  onChangeLearningPlan,
  onOpenReplanDiff,
  onStartAssessmentForSkill,
}) => {
  const [filter, setFilter] = useState<FilterMode>('all');
  const [paceUnit, setPaceUnit] = useState<'weekly' | 'daily'>('weekly');
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);

  const { roadmap, progress, latestDiff, analysis } = twin;
  const remediationCount = roadmap.filter((s) => s.isRemediation).length;

  const getStepStatus = (step: (typeof roadmap)[number]): RoadmapStepStatus =>
    step.status ?? (step.completed ? 'completed' : 'not_started');

  const notStartedCount = roadmap.filter((s) => getStepStatus(s) === 'not_started').length;
  const inProgressCount = roadmap.filter((s) => getStepStatus(s) === 'in_progress').length;

  const filteredSteps = roadmap.filter((step) => {
    const st = getStepStatus(step);
    if (filter === 'not_started') return st === 'not_started';
    if (filter === 'in_progress') return st === 'in_progress';
    if (filter === 'completed') return st === 'completed';
    if (filter === 'remediation') return step.isRemediation;
    return true;
  });

  const handleStatusChange = async (stepId: string, nextStatus: RoadmapStepStatus) => {
    setBusyStepId(stepId);
    try {
      await onUpdateStepStatus(stepId, nextStatus);
    } finally {
      setBusyStepId(null);
    }
  };

  const handlePlanSwitch = async (plan: LearningPlanMode) => {
    if (plan === progress.learningPlan || changingPlan) return;
    setChangingPlan(true);
    try {
      await onChangeLearningPlan(plan);
    } finally {
      setChangingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted tabular-nums">
            {analysis.targetRoleTitle} · {progress.completedSteps}/{progress.totalSteps} completed
            {inProgressCount > 0 ? ` · ${inProgressCount} started` : ''} · {progress.remainingHours}h remaining · Ready {progress.forecastedReadyDate}
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Adaptive Prerequisite Roadmap
          </h1>
        </div>

        {latestDiff && (
          <button
            type="button"
            onClick={onOpenReplanDiff}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-pp-text bg-pp-card border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-pp-accent" />
            <span>View Replan Diff ({latestDiff.added.length} added, {latestDiff.removed.length} removed)</span>
          </button>
        )}
      </div>

      {/* Honest Verification Notice */}
      <div className="bg-pp-surface border border-pp-border rounded-xl px-4 py-3 text-xs text-pp-text-muted flex items-center gap-2.5">
        <Info className="w-4 h-4 text-pp-accent shrink-0" />
        <span>
          Opening external courses or marking a step <strong className="text-pp-text">Started / Completed</strong> tracks your personal study progress in SQLite. To upgrade a skill to <strong className="text-pp-success">Assessment Verified</strong>, pass its domain assessment check.
        </span>
      </div>

      {/* Learning Plan Switcher + Study Pace */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-pp-text">Learning Plan:</span>
          <div className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border">
            {PLAN_OPTIONS.map((opt) => {
              const active = progress.learningPlan === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={changingPlan}
                  onClick={() => void handlePlanSwitch(opt.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                    active
                      ? 'bg-pp-card text-pp-accent border border-pp-accent/40 font-semibold'
                      : 'text-pp-text-muted hover:text-pp-text border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-pp-text-muted">
            {PLAN_OPTIONS.find((p) => p.id === progress.learningPlan)?.hint}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-pp-text-muted tabular-nums">
          <div className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border">
            <button
              type="button"
              onClick={() => setPaceUnit('weekly')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                paceUnit === 'weekly' ? 'bg-pp-card text-pp-accent border border-pp-accent/40' : 'text-pp-text-muted'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPaceUnit('daily')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                paceUnit === 'daily' ? 'bg-pp-card text-pp-accent border border-pp-accent/40' : 'text-pp-text-muted'
              }`}
            >
              Daily
            </button>
          </div>
          <span className="font-mono font-semibold text-pp-text">
            {paceUnit === 'weekly'
              ? `${progress.weeklyHours}h / week`
              : `${progress.dailyHours}h / day`}
          </span>
          <span>· {progress.totalHours}h total</span>
        </div>
      </div>

      {/* Remediation alert banner when active */}
      {remediationCount > 0 && (
        <div className="bg-pp-amber-soft border border-pp-amber/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-pp-amber shrink-0 mt-0.5" />
            <div className="text-sm text-pp-text">
              <span className="font-semibold text-pp-amber">Dynamic Remediation Active:</span>{' '}
              {remediationCount} foundational step{remediationCount > 1 ? 's' : ''} were prioritized after a sub-50% assessment score.
            </div>
          </div>
          {latestDiff && (
            <button
              type="button"
              onClick={onOpenReplanDiff}
              className="text-xs font-semibold text-pp-amber underline hover:opacity-80 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Inspect Diff Reason
            </button>
          )}
        </div>
      )}

      {/* Segmented Step Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border">
          {(
            [
              ['all', `All (${roadmap.length})`],
              ['not_started', `Not Started (${notStartedCount})`],
              ['in_progress', `Started (${inProgressCount})`],
              ['completed', `Completed (${progress.completedSteps})`],
              ['remediation', `Remediation (${remediationCount})`],
            ] as Array<[FilterMode, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === key
                  ? 'bg-pp-card text-pp-accent border border-pp-accent/40 font-semibold'
                  : 'text-pp-text-muted hover:text-pp-text border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-xs text-pp-text-muted tabular-nums">
          Estimated completion: {progress.estimatedWeeksRemaining} weeks ({progress.forecastedReadyDate})
        </div>
      </div>

      {/* Roadmap Steps List */}
      {filteredSteps.length === 0 ? (
        <div className="bg-pp-card border border-pp-border rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-pp-text">
            No roadmap steps match this filter.
          </p>
          <p className="mt-1 text-xs text-pp-text-muted">
            Switch filters, pick Deep Mastery, or update your target role in Settings to generate steps.
          </p>
        </div>
      ) : (
        <div className="bg-pp-card border border-pp-border rounded-xl divide-y divide-pp-border">
          {filteredSteps.map((step) => {
            const isBusy = busyStepId === step.id;
            const currentStatus = getStepStatus(step);
            return (
              <div
                key={step.id}
                className={`p-5 flex flex-col gap-4 transition-colors ${
                  currentStatus === 'completed' ? 'bg-pp-surface/40' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-pp-text-muted">
                      <span className="font-mono font-semibold text-pp-accent tabular-nums">
                        Step {String(step.order).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-pp-text">{step.skillName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{step.difficulty}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{step.hours}h</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{step.resourceType}</span>
                      {step.isRemediation && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-pp-amber">
                            Remediation Priority
                          </span>
                        </>
                      )}
                    </div>

                    <h3
                      className={`font-display text-base font-semibold ${
                        currentStatus === 'completed' ? 'line-through text-pp-text-muted' : 'text-pp-text'
                      }`}
                    >
                      {step.resourceTitle}
                    </h3>

                    <p className="text-xs text-pp-text-muted leading-relaxed">
                      <span className="font-semibold text-pp-text">Objective:</span>{' '}
                      {step.learningObjective}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-pp-text-muted pt-0.5">
                      <div>
                        <span className="font-semibold text-pp-text">Practical Exercise:</span>{' '}
                        {step.practicalAssignment}
                      </div>
                      <div>
                        <span className="font-semibold text-pp-text">Checkpoint:</span>{' '}
                        {step.assessmentCheckpoint}
                      </div>
                    </div>

                    <p className="text-[11px] text-pp-text-muted">
                      {step.reason}
                      {step.prerequisites.length > 0
                        ? ` · Prerequisites: ${step.prerequisites.join(', ')}`
                        : ''}
                    </p>
                  </div>

                  {/* Right Actions: 3-state status + Assess + Verified External Link */}
                  <div className="flex flex-col items-start lg:items-end gap-2.5 shrink-0">
                    <div
                      role="group"
                      aria-label={`Progress status for ${step.resourceTitle}`}
                      className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border"
                    >
                      {STATUS_BUTTONS.map((st) => {
                        const active = currentStatus === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleStatusChange(step.id, st.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                              active
                                ? st.id === 'completed'
                                  ? 'bg-pp-success text-pp-accent-fg'
                                  : st.id === 'in_progress'
                                    ? 'bg-pp-amber text-pp-accent-fg'
                                    : 'bg-pp-card text-pp-text border border-pp-border'
                                : 'text-pp-text-muted hover:text-pp-text'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStartAssessmentForSkill(step.skillId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pp-text bg-pp-surface border border-pp-border hover:border-pp-accent rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5 text-pp-accent" />
                        <span>Assess</span>
                      </button>
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-accent bg-pp-accent-soft border border-pp-accent/30 hover:bg-pp-elevated rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {step.verified && <CheckCircle2 className="w-3 h-3 text-pp-success" />}
                        <span>{step.provider}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

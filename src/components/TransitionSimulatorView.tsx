import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  GraduationCap,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import type {
  CareerDomain,
  CareerTransitionSimulation,
  RoleId,
  TargetRole,
  TwinSnapshot,
} from '../shared/types';

interface TransitionSimulatorViewProps {
  domains: CareerDomain[];
  roles: TargetRole[];
  twin: TwinSnapshot;
  initialToRoleId?: RoleId;
  onTransitionApplied: (nextTwin: TwinSnapshot) => void;
}

const TRANSITION_PRESETS: Array<{ label: string; from: RoleId; to: RoleId }> = [
  {
    label: 'Mechanical Design Eng → Robotics Eng',
    from: 'mechanical_design_engineer',
    to: 'robotics_engineer',
  },
  {
    label: 'Data Analyst → Machine Learning Eng',
    from: 'data_analyst',
    to: 'ml_engineer',
  },
  {
    label: 'Electronics Eng → Embedded Systems Eng',
    from: 'electronics_engineer',
    to: 'embedded_systems_engineer',
  },
  {
    label: 'Business Analyst → Product Manager',
    from: 'business_analyst',
    to: 'product_manager',
  },
];

export const TransitionSimulatorView: React.FC<TransitionSimulatorViewProps> = ({
  domains,
  roles,
  twin,
  initialToRoleId,
  onTransitionApplied,
}) => {
  const defaultFrom = twin.profile.currentRoleId ?? 'mechanical_design_engineer';
  const defaultTo =
    initialToRoleId && initialToRoleId !== defaultFrom
      ? initialToRoleId
      : twin.profile.targetRoleId !== defaultFrom
        ? twin.profile.targetRoleId
        : 'robotics_engineer';

  const [fromRoleId, setFromRoleId] = useState<RoleId>(defaultFrom);
  const [toRoleId, setToRoleId] = useState<RoleId>(defaultTo);
  const [simulation, setSimulation] = useState<CareerTransitionSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedRoles = useMemo(() => {
    return domains.map((dom) => ({
      domain: dom,
      roles: roles.filter((r) => r.domainId === dom.id),
    }));
  }, [domains, roles]);

  const runSimulation = async (fromId: RoleId, toId: RoleId) => {
    setError(null);
    setIsSimulating(true);
    try {
      const res = await api.simulateTransition({
        profileId: twin.profile.id,
        fromRoleId: fromId,
        toRoleId: toId,
      });
      setSimulation(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to simulate career transition');
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    void runSimulation(fromRoleId, toRoleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twin.profile.id]);

  useEffect(() => {
    if (initialToRoleId) {
      setToRoleId(initialToRoleId);
      void runSimulation(fromRoleId, initialToRoleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToRoleId]);

  const handleApplyTransition = async () => {
    setError(null);
    setIsApplying(true);
    try {
      const updated = await api.applyTransition({
        profileId: twin.profile.id,
        fromRoleId,
        toRoleId,
      });
      onTransitionApplied(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply transition');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-pp-text-muted">
          Explore Your Next Career · Cross-Domain Skill Transfer &amp; Prerequisite Modeling
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
          Career Transition Simulator
        </h1>
        <p className="mt-1 text-sm text-pp-text-muted">
          Compare your current foundation against any target role across all 12 domains. Inspect transferable competencies, missing gaps, qualification requirements, and estimated time-to-readiness before committing.
        </p>
      </div>

      {/* Quick Cross-Domain Presets */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-4">
        <div className="text-xs font-semibold text-pp-text-muted mb-2.5">
          Popular Cross-Domain Transition Scenarios
        </div>
        <div className="flex flex-wrap gap-2">
          {TRANSITION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setFromRoleId(preset.from);
                setToRoleId(preset.to);
                void runSimulation(preset.from, preset.to);
              }}
              className="px-3 py-1.5 text-xs font-medium text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent hover:text-pp-accent transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role Pair Selector */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-5">
          <label htmlFor="sim-from-role" className="block text-xs font-semibold text-pp-text-muted mb-1.5">
            Current / Origin Career Role
          </label>
          <select
            id="sim-from-role"
            value={fromRoleId}
            onChange={(e) => setFromRoleId(e.target.value as RoleId)}
            className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2.5 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          >
            {groupedRoles.map(({ domain, roles: domRoles }) => (
              <optgroup key={domain.id} label={domain.name}>
                {domRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="lg:col-span-5">
          <label htmlFor="sim-to-role" className="block text-xs font-semibold text-pp-text-muted mb-1.5">
            Target / Destination Career Role
          </label>
          <select
            id="sim-to-role"
            value={toRoleId}
            onChange={(e) => setToRoleId(e.target.value as RoleId)}
            className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2.5 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          >
            {groupedRoles.map(({ domain, roles: domRoles }) => (
              <optgroup key={domain.id} label={domain.name}>
                {domRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <button
            type="button"
            disabled={isSimulating}
            onClick={() => void runSimulation(fromRoleId, toRoleId)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {isSimulating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4" />
            )}
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isSimulating && !simulation ? (
        <div className="bg-pp-card border border-pp-border rounded-xl p-10 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
          <span>Running cross-domain skill transfer analysis...</span>
        </div>
      ) : simulation ? (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-pp-card border border-pp-border rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-pp-text-muted">
                  {simulation.fromDomainName} → {simulation.toDomainName}
                </div>
                <h2 className="mt-1 font-display text-xl font-bold text-pp-text">
                  {simulation.fromRoleTitle} → {simulation.toRoleTitle}
                </h2>
              </div>

              <button
                type="button"
                disabled={isApplying}
                onClick={handleApplyTransition}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GitBranch className="w-4 h-4" />
                )}
                <span>Adopt Transition &amp; Replan Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-pp-border">
              <div>
                <div className="text-xs text-pp-text-muted">Origin Role Fit</div>
                <div className="mt-1 font-mono text-2xl font-bold text-pp-text tabular-nums">
                  {simulation.fromReadinessPct}%
                </div>
              </div>
              <div>
                <div className="text-xs text-pp-text-muted">Starting Fit in Target</div>
                <div className="mt-1 font-mono text-2xl font-bold text-pp-accent tabular-nums">
                  {simulation.toReadinessBeforeTransitionPct}%
                </div>
              </div>
              <div>
                <div className="text-xs text-pp-text-muted">Transferable vs Missing</div>
                <div className="mt-1 font-mono text-xl font-bold text-pp-text tabular-nums">
                  {simulation.transferableSkills.length} / {simulation.missingSkills.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-pp-text-muted">Estimated Transition Effort</div>
                <div className="mt-1 font-mono text-xl font-bold text-pp-text tabular-nums">
                  {simulation.estimatedHours}h · {simulation.estimatedWeeks} wks
                </div>
              </div>
            </div>

            <div className="mt-4 bg-pp-surface border border-pp-border rounded-lg p-3.5 text-xs text-pp-text-muted flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-pp-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-pp-text">Qualification &amp; Credential Notes: </span>
                {simulation.qualificationRequirements}
              </div>
            </div>
          </div>

          {/* Transferable vs Missing Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-pp-card border border-pp-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pp-success" />
                  <span>Transferable Foundation ({simulation.transferableSkills.length})</span>
                </h3>
              </div>

              {simulation.transferableSkills.length === 0 ? (
                <p className="text-xs text-pp-text-muted">
                  No direct overlapping skills yet — your transition roadmap will start cleanly from foundational prerequisites.
                </p>
              ) : (
                <div className="divide-y divide-pp-border/70">
                  {simulation.transferableSkills.map((sk) => (
                    <div key={sk.skillId} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-pp-text">{sk.skillName}</div>
                        <div className="mt-0.5 text-xs text-pp-text-muted">{sk.reuseNote}</div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-pp-success tabular-nums shrink-0">
                        {sk.currentLevel}/{sk.targetLevel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-pp-card border border-pp-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pp-amber" />
                  <span>Skills to Acquire ({simulation.missingSkills.length})</span>
                </h3>
              </div>

              {simulation.missingSkills.length === 0 ? (
                <p className="text-xs text-pp-success font-medium">
                  Your current Twin already meets all required competency levels for this role.
                </p>
              ) : (
                <div className="divide-y divide-pp-border/70">
                  {simulation.missingSkills.map((sk) => (
                    <div key={sk.skillId} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-pp-text">{sk.skillName}</div>
                        <div className="mt-0.5 text-xs text-pp-text-muted">
                          Priority: {sk.priority}
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs tabular-nums shrink-0">
                        <div className="font-semibold text-pp-text">
                          {sk.currentLevel} → {sk.targetLevel}
                        </div>
                        <div className="text-pp-amber">Gap {sk.gap}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview Prerequisite-Ordered Roadmap */}
          <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-pp-border flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-pp-text">
                  Simulated Transition Roadmap ({simulation.suggestedRoadmap.length} Steps)
                </h3>
                <p className="text-xs text-pp-text-muted">
                  Prerequisite DAG sequence preview before adopting into your Digital Twin
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-pp-accent tabular-nums">
                {simulation.estimatedHours}h total
              </span>
            </div>

            <div className="divide-y divide-pp-border/70">
              {simulation.suggestedRoadmap.map((step) => (
                <div key={step.id} className="px-6 py-3.5 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <div className="text-xs text-pp-text-muted font-mono tabular-nums">
                      Step {String(step.order).padStart(2, '0')} · {step.skillName} · {step.difficulty} · {step.hours}h
                    </div>
                    <div className="font-semibold text-pp-text truncate mt-0.5">
                      {step.resourceTitle}
                    </div>
                    <div className="text-xs text-pp-text-muted mt-0.5">
                      {step.learningObjective}
                    </div>
                  </div>
                  <span className="text-xs text-pp-text-muted shrink-0">{step.provider}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

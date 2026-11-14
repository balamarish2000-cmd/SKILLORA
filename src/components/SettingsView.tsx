import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, IndianRupee, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { formatINR, formatINRLpa, validateSalaryExpectations } from '../shared/currency';
import type {
  CareerDomain,
  LearningPlanMode,
  ParsedSkill,
  RoleId,
  TargetRole,
  TwinSnapshot,
} from '../shared/types';

interface SettingsViewProps {
  twin: TwinSnapshot;
  domains: CareerDomain[];
  roles: TargetRole[];
  onTwinUpdated: (nextTwin: TwinSnapshot, showDiff?: boolean) => void;
  onResetDemo: () => void;
}

const PLAN_MODES: Array<{ id: LearningPlanMode; label: string; desc: string }> = [
  { id: 'fast_track', label: 'Fast Track', desc: 'Core essentials' },
  { id: 'balanced', label: 'Balanced', desc: 'Core + foundations' },
  { id: 'deep_mastery', label: 'Deep Mastery', desc: 'Full + optional' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  twin,
  domains,
  roles,
  onTwinUpdated,
  onResetDemo,
}) => {
  const [targetRoleId, setTargetRoleId] = useState<RoleId>(twin.profile.targetRoleId);
  const [learningPlan, setLearningPlan] = useState<LearningPlanMode>(twin.profile.learningPlan);
  const [weeklyHours, setWeeklyHours] = useState<number>(twin.profile.weeklyHours);
  const [preferredLocation, setPreferredLocation] = useState<string>(
    twin.profile.preferredLocation ?? 'India'
  );
  const [specialization, setSpecialization] = useState<string>(
    twin.profile.specialization ?? ''
  );
  const [expectedAnnualSalaryInr, setExpectedAnnualSalaryInr] = useState<number>(
    twin.profile.expectedAnnualSalaryInr ?? 1200000
  );
  const [minimumExpectedSalaryInr, setMinimumExpectedSalaryInr] = useState<number>(
    twin.profile.minimumExpectedSalaryInr ?? 800000
  );
  const [skills, setSkills] = useState<ParsedSkill[]>(twin.profile.skills);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTargetRoleId(twin.profile.targetRoleId);
    setLearningPlan(twin.profile.learningPlan);
    setWeeklyHours(twin.profile.weeklyHours);
    setPreferredLocation(twin.profile.preferredLocation ?? 'India');
    setSpecialization(twin.profile.specialization ?? '');
    setExpectedAnnualSalaryInr(twin.profile.expectedAnnualSalaryInr ?? 1200000);
    setMinimumExpectedSalaryInr(twin.profile.minimumExpectedSalaryInr ?? 800000);
    setSkills(twin.profile.skills);
  }, [
    twin.profile.id,
    twin.profile.targetRoleId,
    twin.profile.learningPlan,
    twin.profile.weeklyHours,
    twin.profile.preferredLocation,
    twin.profile.specialization,
    twin.profile.expectedAnnualSalaryInr,
    twin.profile.minimumExpectedSalaryInr,
    twin.profile.skills,
  ]);

  const groupedRoles = useMemo(
    () =>
      domains.map((dom) => ({
        domain: dom,
        roles: roles.filter((r) => r.domainId === dom.id),
      })),
    [domains, roles]
  );

  const handleSkillChange = (skillId: string, level: number) => {
    setSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId ? { ...s, level, source: 'self_reported' } : s
      )
    );
  };

  const handleApplyChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(null);

    const salaryCheck = validateSalaryExpectations(
      expectedAnnualSalaryInr,
      minimumExpectedSalaryInr
    );
    if (!salaryCheck.valid) {
      setError(salaryCheck.error ?? 'Invalid salary expectation values.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await api.updateGoal({
        profileId: twin.profile.id,
        targetRoleId,
        learningPlan,
        weeklyHours,
        preferredLocation: preferredLocation.trim() || 'India',
        specialization: specialization.trim(),
        expectedAnnualSalaryInr: salaryCheck.expected,
        minimumExpectedSalaryInr: salaryCheck.minimum,
        skills,
      });
      setSavedNotice(
        `Orchestrator recalculated roadmap for ${updated.analysis.targetRoleTitle} (${updated.roadmap.length} steps, target CTC ${formatINRLpa(updated.profile.expectedAnnualSalaryInr)}, ready ${updated.progress.forecastedReadyDate}).`
      );
      onTwinUpdated(updated, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate profile');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === targetRoleId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted">
            Compensation Targets (₹), Plan Intensity &amp; Twin Calibration
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Workspace &amp; Career Settings
          </h1>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-pp-text bg-pp-card border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-pp-accent" />
          <span>Load Default Maya Chen Twin</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="bg-pp-success-soft border border-pp-success/40 text-pp-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <form onSubmit={handleApplyChanges} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-pp-card border border-pp-border rounded-xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-pp-text">
              Target Career Role ({roles.length} Roles Across {domains.length} Domains)
            </h2>
            <p className="text-xs text-pp-text-muted mt-0.5">
              Switching roles invokes Career Matcher, Skill Analyst, and Curator to compute an instant Replan Diff.
            </p>
          </div>

          <div>
            <label htmlFor="settings-role-select" className="block text-xs font-semibold text-pp-text-muted mb-1.5">
              Target Career
            </label>
            <select
              id="settings-role-select"
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value as RoleId)}
              className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2.5 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
            >
              {groupedRoles.map(({ domain, roles: domRoles }) => (
                <optgroup key={domain.id} label={domain.name}>
                  {domRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.avgSalaryRange})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedRole && (
            <div className="bg-pp-surface border border-pp-border rounded-lg p-4 text-xs text-pp-text-muted leading-relaxed space-y-1.5">
              <div className="font-semibold text-pp-text">
                {selectedRole.title} · <span className="text-pp-accent">{selectedRole.avgSalaryRange}</span> · Demand: {selectedRole.demandLevel} (+{selectedRole.demandGrowthPct}%)
              </div>
              <p>{selectedRole.summary}</p>
              <div className="text-pp-text-muted">
                Qualification Path: {selectedRole.educationNote}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settings-specialization" className="block text-xs font-medium text-pp-text-muted mb-1">
                Specialization / Focus Area
              </label>
              <input
                id="settings-specialization"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Distributed Backend, Clinical Data"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="settings-location" className="block text-xs font-medium text-pp-text-muted mb-1">
                Preferred Location
              </label>
              <input
                id="settings-location"
                type="text"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="Bengaluru / Remote"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Expected & Minimum Salary in Indian Rupees */}
          <div className="pt-3 border-t border-pp-border space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-pp-text">
              <IndianRupee className="w-3.5 h-3.5 text-pp-accent" />
              <span>Compensation Expectations (Indian Rupees ₹ / Annual CTC)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-expected-inr" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Expected Annual Salary (₹)
                </label>
                <input
                  id="settings-expected-inr"
                  type="number"
                  min={0}
                  step={50000}
                  value={expectedAnnualSalaryInr}
                  onChange={(e) => setExpectedAnnualSalaryInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-sm text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                />
                <div className="mt-1 text-[11px] font-mono text-pp-accent tabular-nums">
                  {formatINRLpa(expectedAnnualSalaryInr)} ({formatINR(expectedAnnualSalaryInr)})
                </div>
              </div>

              <div>
                <label htmlFor="settings-minimum-inr" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Minimum Expected Salary (₹)
                </label>
                <input
                  id="settings-minimum-inr"
                  type="number"
                  min={0}
                  step={50000}
                  value={minimumExpectedSalaryInr}
                  onChange={(e) => setMinimumExpectedSalaryInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-sm text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                />
                <div className="mt-1 text-[11px] font-mono text-pp-text-muted tabular-nums">
                  Floor: {formatINRLpa(minimumExpectedSalaryInr)} ({formatINR(minimumExpectedSalaryInr)})
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-pp-text mb-1.5">
              Learning Plan Mode
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-pp-surface rounded-lg border border-pp-border">
              {PLAN_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLearningPlan(m.id)}
                  className={`px-2.5 py-2 text-left rounded-md transition-colors cursor-pointer ${
                    learningPlan === m.id
                      ? 'bg-pp-card text-pp-accent border border-pp-accent/40'
                      : 'text-pp-text-muted hover:text-pp-text border border-transparent'
                  }`}
                >
                  <div className="text-xs font-semibold">{m.label}</div>
                  <div className="text-[10px] text-pp-text-muted">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-pp-border">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="settings-hours" className="text-xs font-semibold text-pp-text">
                Weekly Study Commitment
              </label>
              <span className="font-mono text-xs font-bold text-pp-accent tabular-nums">
                {weeklyHours} hrs/wk ({Math.round((weeklyHours / 7) * 10) / 10} hrs/day)
              </span>
            </div>
            <input
              id="settings-hours"
              type="range"
              min={4}
              max={40}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-full accent-pp-accent cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isSaving ? 'Recalculating Twin...' : 'Apply Goal & Recalculate Roadmap'}</span>
          </button>
        </div>

        <div className="lg:col-span-6 bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-pp-text">
              Self-Calibrate Current Twin Skills ({skills.length})
            </h2>
            <p className="text-xs text-pp-text-muted mt-0.5">
              Adjust any proficiency (0–5) before triggering a roadmap recalculation.
            </p>
          </div>

          <div className="divide-y divide-pp-border border border-pp-border rounded-xl max-h-[500px] overflow-y-auto bg-pp-surface/50">
            {skills.map((sk) => (
              <div key={sk.skillId} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-pp-text">
                    {sk.skillName}
                    <span className="ml-2 text-[11px] font-normal text-pp-text-muted">
                      · {sk.source.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-pp-text-muted truncate">{sk.evidence}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={sk.level}
                    onChange={(e) => handleSkillChange(sk.skillId, Number(e.target.value))}
                    aria-label={`${sk.skillName} proficiency`}
                    className="w-24 accent-pp-accent cursor-pointer"
                  />
                  <span className="font-mono text-xs font-semibold text-pp-text w-8 text-right tabular-nums">
                    {sk.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

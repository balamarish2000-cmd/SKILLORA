import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Compass,
  GraduationCap,
  Search,
  TrendingUp,
} from 'lucide-react';
import type {
  CareerDomain,
  CareerDomainId,
  CareerMatchItem,
  RoleId,
  SkillDefinition,
  TargetRole,
  TwinSnapshot,
} from '../shared/types';

interface CareerExplorerViewProps {
  domains: CareerDomain[];
  roles: TargetRole[];
  skills: SkillDefinition[];
  twin: TwinSnapshot;
  initialDomainFilter?: 'all' | CareerDomainId;
  onSetTargetRole: (roleId: RoleId) => void;
  onSimulateTransitionTo: (toRoleId: RoleId) => void;
}

export const CareerExplorerView: React.FC<CareerExplorerViewProps> = ({
  domains,
  roles,
  skills,
  twin,
  initialDomainFilter = 'all',
  onSetTargetRole,
  onSimulateTransitionTo,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<'all' | CareerDomainId>(initialDomainFilter);
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>(() => {
    if (initialDomainFilter !== 'all') {
      return roles.find((r) => r.domainId === initialDomainFilter)?.id ?? twin.profile.targetRoleId;
    }
    return twin.profile.targetRoleId;
  });

  useEffect(() => {
    setSelectedDomain(initialDomainFilter);
    setSearch('');
    if (initialDomainFilter !== 'all') {
      const firstInDomain = roles.find((r) => r.domainId === initialDomainFilter);
      if (firstInDomain) {
        setSelectedRoleId(firstInDomain.id);
      }
    }
  }, [initialDomainFilter, roles]);

  const skillNameMap = useMemo(() => new Map(skills.map((s) => [s.id, s.name])), [skills]);
  const domainMap = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains]);
  const matchMap = useMemo(
    () => new Map<RoleId, CareerMatchItem>(twin.matches.map((m) => [m.roleId, m])),
    [twin.matches]
  );

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      if (selectedDomain !== 'all' && r.domainId !== selectedDomain) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.specialization.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
  }, [roles, selectedDomain, search]);

  const activeRole =
    filteredRoles.find((r) => r.id === selectedRoleId) ??
    filteredRoles[0] ??
    roles.find((r) => r.id === selectedRoleId) ??
    roles[0];
  const activeDomain = activeRole ? domainMap.get(activeRole.domainId) : undefined;
  const activeMatch = activeRole ? matchMap.get(activeRole.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted">
            Universal Career Taxonomy · {domains.length} Domains · {roles.length} Roles (₹ LPA Ranges)
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Universal Career Explorer
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-pp-text-muted absolute left-3 top-2.5" />
          <input
            type="search"
            aria-label="Search roles across all domains"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles (e.g. Robotics, Nurse, CFO)..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-pp-border bg-pp-surface text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Domain Filter Controls (Interactive Tabs) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-pp-surface border border-pp-border rounded-xl">
        <button
          type="button"
          onClick={() => setSelectedDomain('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedDomain === 'all'
              ? 'bg-pp-card text-pp-accent border border-pp-accent/40 font-semibold'
              : 'text-pp-text-muted hover:text-pp-text border border-transparent'
          }`}
        >
          All Domains ({roles.length})
        </button>
        {domains.map((dom) => {
          const count = roles.filter((r) => r.domainId === dom.id).length;
          const active = selectedDomain === dom.id;
          return (
            <button
              key={dom.id}
              type="button"
              onClick={() => setSelectedDomain(dom.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-pp-card text-pp-accent border border-pp-accent/40 font-semibold'
                  : 'text-pp-text-muted hover:text-pp-text border border-transparent'
              }`}
            >
              {dom.shortName} ({count})
            </button>
          );
        })}
      </div>

      {/* Selected Domain Qualification Note (if filtered) */}
      {selectedDomain !== 'all' && domainMap.get(selectedDomain)?.qualificationNote && (
        <div className="bg-pp-amber-soft border border-pp-amber/40 rounded-xl p-4 flex items-start gap-2.5 text-xs text-pp-text">
          <AlertCircle className="w-4 h-4 text-pp-amber shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-pp-amber">
              {domainMap.get(selectedDomain)?.name} Qualification Guidance:{' '}
            </span>
            {domainMap.get(selectedDomain)?.qualificationNote}
          </div>
        </div>
      )}

      {/* Split Layout: Role Catalog List + Role Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-pp-border flex items-center justify-between bg-pp-surface/70">
            <span className="text-xs font-semibold text-pp-text">
              Showing {filteredRoles.length} Career Paths
            </span>
            <span className="text-xs text-pp-text-muted">
              Sorted by domain · Click any role to inspect rubric
            </span>
          </div>

          {filteredRoles.length === 0 ? (
            <div className="p-10 text-center text-sm text-pp-text-muted">
              No career roles match &quot;{search}&quot;. Clear search or choose another domain.
            </div>
          ) : (
            <div className="divide-y divide-pp-border/70 max-h-[620px] overflow-y-auto">
              {filteredRoles.map((role) => {
                const match = matchMap.get(role.id);
                const isSelected = activeRole?.id === role.id;
                const isGoal = twin.profile.targetRoleId === role.id;
                const dom = domainMap.get(role.domainId);

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-pp-accent-soft/60' : 'hover:bg-pp-surface/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-pp-text-muted">
                          <span>{dom?.shortName ?? role.domainId}</span>
                          <span aria-hidden="true">·</span>
                          <span>{role.specialization}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-pp-text">{role.avgSalaryRange}</span>
                          {isGoal && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-pp-accent">Active Goal</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1 font-display text-sm font-semibold text-pp-text">
                          {role.title}
                        </div>
                        <div className="mt-1 text-xs text-pp-text-muted line-clamp-1">
                          {role.summary}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-pp-accent tabular-nums">
                          {match?.readinessPct ?? 0}% fit
                        </div>
                        <div className="text-[11px] text-pp-text-muted font-mono tabular-nums mt-0.5">
                          +{role.demandGrowthPct}% growth
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Role Detail Inspector */}
        <div className="lg:col-span-5 bg-pp-card border border-pp-border rounded-xl p-6 self-start space-y-5">
          {activeRole ? (
            <>
              <div>
                <div className="text-xs text-pp-text-muted">
                  {activeDomain?.name} · {activeRole.specialization}
                </div>
                <h2 className="mt-1 font-display text-xl font-bold text-pp-text">
                  {activeRole.title}
                </h2>
                <p className="mt-2 text-sm text-pp-text-muted leading-relaxed">
                  {activeRole.summary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 py-3 border-y border-pp-border text-xs">
                <div>
                  <div className="text-pp-text-muted">Twin Fit</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-pp-accent tabular-nums">
                    {activeMatch?.readinessPct ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="text-pp-text-muted">Demand</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-pp-text flex items-center gap-1 tabular-nums">
                    <TrendingUp className="w-3.5 h-3.5 text-pp-success" />
                    <span>{activeRole.demandLevel} (+{activeRole.demandGrowthPct}%)</span>
                  </div>
                </div>
                <div>
                  <div className="text-pp-text-muted">Typical CTC</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-pp-amber tabular-nums">
                    {activeRole.avgSalaryRange}
                  </div>
                </div>
              </div>

              <div className="bg-pp-surface border border-pp-border rounded-lg p-3.5 text-xs text-pp-text-muted flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-pp-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-pp-text">Qualification &amp; Education Path: </span>
                  {activeRole.educationNote}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-pp-text mb-2.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-pp-accent" />
                  <span>Weighted Competency Rubric ({activeRole.requirements.length} Skills)</span>
                </div>
                <div className="divide-y divide-pp-border/70 border border-pp-border rounded-lg bg-pp-surface/50">
                  {activeRole.requirements.map((req) => (
                    <div key={req.skillId} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium text-pp-text truncate">
                          {skillNameMap.get(req.skillId) ?? req.skillId}
                        </div>
                        <div className="text-[11px] text-pp-text-muted capitalize">
                          {req.requirementType} · Weight {req.weight}/5
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-pp-accent tabular-nums shrink-0">
                        Target {req.targetLevel}/5
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onSimulateTransitionTo(activeRole.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-pp-accent" />
                  <span>Simulate Transition</span>
                </button>
                <button
                  type="button"
                  disabled={twin.profile.targetRoleId === activeRole.id}
                  onClick={() => onSetTargetRole(activeRole.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {twin.profile.targetRoleId === activeRole.id
                      ? 'Active Target Role'
                      : 'Set as Target Career'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

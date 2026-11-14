import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import { getChartPalette, useTheme } from '../theme';
import type { CareerDomainId, CohortLearner, CohortOverview } from '../shared/types';

export const CohortAdminView: React.FC = () => {
  const { theme } = useTheme();
  const chartColors = getChartPalette(theme);
  const [data, setData] = useState<CohortOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState<'all' | CohortLearner['riskLevel']>('all');
  const [domainFilter, setDomainFilter] = useState<'all' | CareerDomainId>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<CohortLearner | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getCohortOverview()
      .then((res) => {
        if (!active) return;
        setData(res);
        setSelectedLearner(res.learners.find((l) => l.riskLevel === 'At Risk') ?? res.learners[0] ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load cohort analytics');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const uniqueRoles = useMemo(() => {
    if (!data) return [];
    const seen = new Map<string, string>();
    for (const l of data.learners) {
      if (domainFilter === 'all' || l.domainId === domainFilter) {
        seen.set(l.targetRoleId, l.targetRoleTitle);
      }
    }
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [data, domainFilter]);

  if (loading) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
        <span>Loading universal cohort intelligence...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl p-5 text-sm">
        {error || 'Unable to load cohort overview'}
      </div>
    );
  }

  const filteredLearners = data.learners.filter((l) => {
    if (riskFilter !== 'all' && l.riskLevel !== riskFilter) return false;
    if (domainFilter !== 'all' && l.domainId !== domainFilter) return false;
    if (roleFilter !== 'all' && l.targetRoleId !== roleFilter) return false;
    if (
      search.trim() &&
      !l.name.toLowerCase().includes(search.toLowerCase()) &&
      !l.topBottleneckSkill.toLowerCase().includes(search.toLowerCase()) &&
      !l.cohortName.toLowerCase().includes(search.toLowerCase()) &&
      !l.domainName.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-pp-text-muted">
          Universal Institutional Analytics · {data.totalLearners} Synthetic Learners Across {data.domainDistribution.length} Domains
        </div>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
          Cohort Admin &amp; Industry Demand Intelligence
        </h1>
      </div>

      {/* Explicit Synthetic Demo Notice */}
      {data.isSyntheticDemo && (
        <div
          role="note"
          data-testid="synthetic-cohort-notice"
          className="bg-pp-surface border border-pp-border text-pp-text-muted rounded-xl px-4 py-3 text-xs flex items-start gap-2.5"
        >
          <Info className="w-4 h-4 text-pp-accent shrink-0 mt-0.5" />
          <span>{data.notice}</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Total Enrolled (Demo)</span>
            <Users className="w-4 h-4 text-pp-text-muted" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-text tabular-nums">
            {data.totalLearners}
          </div>
          <div className="mt-1 text-xs text-pp-text-muted">Across {data.domainDistribution.length} career domains</div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Avg Cohort Readiness</span>
            <CheckCircle2 className="w-4 h-4 text-pp-accent" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-accent tabular-nums">
            {data.avgReadinessPct}%
          </div>
          <div className="mt-1 text-xs text-pp-text-muted">Weighted role attainment</div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>At-Risk Learners</span>
            <AlertTriangle className="w-4 h-4 text-pp-error" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-error tabular-nums">
            {data.atRiskCount}
          </div>
          <div className="mt-1 text-xs text-pp-text-muted">Readiness &lt; 48% or inactive</div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Watch / On Track</span>
            <Clock className="w-4 h-4 text-pp-success" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-text tabular-nums">
            {data.watchCount} / {data.onTrackCount}
          </div>
          <div className="mt-1 text-xs text-pp-text-muted">Watch vs nominal pace</div>
        </div>
      </div>

      {/* Bottleneck Skills Chart + 9-Domain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-pp-card border border-pp-border rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-pp-text">
            Cross-Domain Bottleneck Skills
          </h2>
          <p className="text-xs text-pp-text-muted mb-4">
            Most frequent missing competencies across all 12 domains
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.bottleneckSkills.slice(0, 8).map((b) => ({
                  ...b,
                  shortName: b.skillName.length > 18 ? `${b.skillName.slice(0, 17)}…` : b.skillName,
                }))}
                layout="vertical"
                margin={{ left: 4, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: chartColors.axisText }} />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={156}
                  interval={0}
                  tick={{ fontSize: 11, fill: chartColors.axisText }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    color: chartColors.tooltipText,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="affectedLearners"
                  name="Affected Learners"
                  fill={chartColors.accentTeal}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-pp-card border border-pp-border rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-pp-text">
            Readiness Across 12 Professional Domains
          </h2>
          <p className="text-xs text-pp-text-muted mb-3">
            Synthetic cohort distribution across technology, healthcare, engineering, science, business, education, finance, agriculture &amp; design
          </p>
          <div className="divide-y divide-pp-border/60">
            {data.domainDistribution.map((item) => (
              <div key={item.domainId} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-pp-text">{item.domainName}</div>
                  <div className="text-[11px] text-pp-text-muted tabular-nums">{item.count} learners</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-pp-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pp-accent"
                      style={{ width: `${item.avgReadiness}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-pp-text tabular-nums w-10 text-right">
                    {item.avgReadiness}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industry Demand & Fastest-Growing Career Projections */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pp-success" />
              <span>Industry Demand &amp; Growth Projections (India ₹ LPA Reference)</span>
            </h2>
            <p className="text-xs text-pp-text-muted">
              High-growth target roles ranked by projected demand velocity across all 12 domains
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.industryDemand.slice(0, 8).map((row) => (
            <div key={row.roleTitle} className="border border-pp-border bg-pp-surface/50 rounded-lg p-3.5 text-xs">
              <div className="text-[11px] text-pp-text-muted truncate">{row.domainName}</div>
              <div className="mt-0.5 font-semibold text-pp-text truncate">{row.roleTitle}</div>
              <div className="mt-2 flex items-center justify-between gap-2 font-mono tabular-nums">
                <span className="text-pp-success font-semibold">+{row.growthPct}% ({row.demandLevel})</span>
                <span className="text-pp-text-muted">{row.avgSalaryRange}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Learner Table + Selected Learner Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-pp-border flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border">
              {(['all', 'At Risk', 'Watch', 'On Track'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRiskFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap transition-colors ${
                    riskFilter === status
                      ? 'bg-pp-card text-pp-accent shadow-xs'
                      : 'text-pp-text-muted hover:text-pp-text'
                  }`}
                >
                  {status === 'all' ? `All (${data.totalLearners})` : status}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by career domain"
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value as 'all' | CareerDomainId);
                  setRoleFilter('all');
                }}
                className="rounded-lg border border-pp-border bg-pp-surface px-2.5 py-1.5 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              >
                <option value="all">All 12 Domains</option>
                {data.domainDistribution.map((d) => (
                  <option key={d.domainId} value={d.domainId}>
                    {d.domainName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by target role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-pp-border bg-pp-surface px-2.5 py-1.5 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-pp-text-muted absolute left-2.5 top-2" />
                <input
                  type="search"
                  aria-label="Search learners or bottleneck skills"
                  placeholder="Search learner or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-pp-border bg-pp-surface text-xs text-pp-text placeholder:text-pp-text-muted focus:border-pp-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-pp-surface border-b border-pp-border text-xs font-medium text-pp-text-muted">
                <tr>
                  <th className="py-2.5 px-4">Learner</th>
                  <th className="py-2.5 px-3">Domain &amp; Target Role</th>
                  <th className="py-2.5 px-3 text-right">Readiness</th>
                  <th className="py-2.5 px-3">Top Bottleneck</th>
                  <th className="py-2.5 px-4">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pp-border/60 text-xs">
                {filteredLearners.map((learner) => {
                  const isSelected = selectedLearner?.id === learner.id;
                  return (
                    <tr
                      key={learner.id}
                      onClick={() => setSelectedLearner(learner)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-pp-accent-soft' : 'hover:bg-pp-elevated/60'
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-pp-text">{learner.name}</div>
                        <div className="text-[11px] text-pp-text-muted">{learner.cohortName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-pp-text-muted">
                        <div className="font-medium text-pp-text">{learner.targetRoleTitle}</div>
                        <div className="text-[11px] text-pp-text-muted">{learner.domainName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-pp-text tabular-nums">
                        {learner.readinessPct}%
                      </td>
                      <td className="py-2.5 px-3 text-pp-text-muted">{learner.topBottleneckSkill}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {learner.riskLevel === 'At Risk' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-pp-error">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>At Risk</span>
                          </span>
                        ) : learner.riskLevel === 'Watch' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-pp-amber">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Watch</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-pp-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>On Track</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Learner Inspector */}
        <div className="lg:col-span-4 bg-pp-card border border-pp-border rounded-xl p-6 self-start">
          {selectedLearner ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-pp-text-muted">
                  {selectedLearner.domainName} · {selectedLearner.cohortName}
                </div>
                <h3 className="mt-0.5 font-display text-lg font-bold text-pp-text">
                  {selectedLearner.name}
                </h3>
                <div className="mt-1 text-xs text-pp-text-muted">
                  Target: {selectedLearner.targetRoleTitle}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-pp-border text-xs">
                <div>
                  <div className="text-pp-text-muted">Role Readiness</div>
                  <div className="font-mono text-lg font-bold text-pp-text tabular-nums">
                    {selectedLearner.readinessPct}%
                  </div>
                </div>
                <div>
                  <div className="text-pp-text-muted">Roadmap Done</div>
                  <div className="font-mono text-lg font-bold text-pp-text tabular-nums">
                    {selectedLearner.roadmapCompletionPct}%
                  </div>
                </div>
                <div>
                  <div className="text-pp-text-muted">Study Pace</div>
                  <div className="font-mono text-sm font-semibold text-pp-text tabular-nums">
                    {selectedLearner.weeklyHours} hrs/wk
                  </div>
                </div>
                <div>
                  <div className="text-pp-text-muted">Failed Checks</div>
                  <div className="font-mono text-sm font-semibold text-pp-error tabular-nums">
                    {selectedLearner.failedAssessmentsCount}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-pp-border">
                <div className="text-xs font-semibold text-pp-text mb-2">
                  Primary Missing Skills
                </div>
                <ul className="space-y-1.5 text-xs text-pp-text">
                  {selectedLearner.missingSkills.map((sk) => (
                    <li key={sk} className="flex items-center justify-between bg-pp-surface px-3 py-2 rounded-lg border border-pp-border">
                      <span>{sk}</span>
                      <span className="font-mono text-pp-amber">Bottleneck</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-pp-text-muted pt-1">
                Last active {selectedLearner.lastActiveDaysAgo} day{selectedLearner.lastActiveDaysAgo === 1 ? '' : 's'} ago
              </div>
            </div>
          ) : (
            <div className="text-sm text-pp-text-muted">Select a learner row to inspect gaps.</div>
          )}
        </div>
      </div>
    </div>
  );
};

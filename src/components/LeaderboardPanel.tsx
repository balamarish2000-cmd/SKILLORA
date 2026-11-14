import React, { useEffect, useState } from 'react';
import { Award, Eye, Loader2, TrendingUp, Users } from 'lucide-react';
import { api } from '../api';
import type { CareerDomain, DetailedEvaluationReport, LeaderboardEntry } from '../shared/types';

interface LeaderboardPanelProps {
  currentProfileId: string;
  domains: CareerDomain[];
  refreshTrigger: number;
  onInspectAssessmentId: (assessmentId: string) => void;
}

const CATEGORY_SHORT: Array<{ key: keyof LeaderboardEntry['categoryAverages']; label: string }> = [
  { key: 'code_quality', label: 'Quality' },
  { key: 'security', label: 'Security' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'testing', label: 'Testing' },
  { key: 'accessibility', label: 'Access.' },
  { key: 'alignment', label: 'Alignment' },
];

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  currentProfileId,
  domains,
  refreshTrigger,
  onInspectAssessmentId,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getEvaluationLeaderboard()
      .then((res) => {
        if (!active) return;
        setEntries(res.entries);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const domainMap = new Map(domains.map((d) => [d.id, d.shortName || d.name]));

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 flex items-center justify-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
        <span>Aggregating leaderboard from stored evaluations...</span>
      </div>
    );
  }

  const totalAttempts = entries.reduce((sum, e) => sum + e.attemptCount, 0);
  const topScore = entries.length > 0 ? entries[0].bestScore : 0;
  const highestImprovement = entries
    .filter((e) => e.improvementPct !== null)
    .sort((a, b) => (b.improvementPct ?? 0) - (a.improvementPct ?? 0))[0];

  return (
    <div className="space-y-6" data-testid="leaderboard-panel">
      {error && (
        <div role="alert" className="bg-[#FEF2F2] border border-[#DC2626]/35 text-[#DC2626] rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Ranked Learners (Stored Evaluations)</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#172B4D] tabular-nums">
            {entries.length}
          </div>
          <div className="mt-1 text-xs text-[#64748B] tabular-nums">
            {totalAttempts} persisted evaluation reports aggregated
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Highest Weighted Score</span>
            <Award className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#2563EB] tabular-nums">
            {topScore}
            <span className="text-base font-medium text-[#64748B]">/100</span>
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {entries[0] ? `${entries[0].learnerName} (Attempt #${entries[0].bestAttemptNumber})` : 'No submissions yet'}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Top Multi-Attempt Improvement</span>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-[#172B4D] tabular-nums">
            {highestImprovement && highestImprovement.improvementPct !== null
              ? `${highestImprovement.improvementPct > 0 ? '+' : ''}${highestImprovement.improvementPct}%`
              : '—'}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {highestImprovement
              ? `${highestImprovement.learnerName} (${highestImprovement.firstScore} → ${highestImprovement.recentScore})`
              : 'Requires 2+ attempts by a learner'}
          </div>
        </div>
      </div>

      {/* Leaderboard Rankings & Category Breakdown */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#172B4D]">
            Performance &amp; Category Breakdown Leaderboard
          </h2>
          <p className="text-xs text-[#64748B]">
            Rankings computed directly from normalized SQLite evaluation reports and category scores — zero synthetic scores.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B]">
            No evaluation attempts stored yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-2.5 pr-3 font-medium">Rank</th>
                  <th className="py-2.5 px-3 font-medium">Learner</th>
                  <th className="py-2.5 px-3 text-right font-medium">Attempts</th>
                  <th className="py-2.5 px-3 text-right font-medium">Best Attempt</th>
                  <th className="py-2.5 px-3 text-right font-medium">Recent Score</th>
                  <th className="py-2.5 px-3 text-right font-medium">Improvement</th>
                  <th className="py-2.5 px-3 font-medium">6-Category Averages</th>
                  <th className="py-2.5 pl-3 text-right font-medium">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {entries.map((entry) => {
                  const isCurrent = entry.profileId === currentProfileId;
                  return (
                    <tr
                      key={entry.profileId}
                      className={isCurrent ? 'bg-[#EFF6FF]/70' : 'hover:bg-[#EFF6FF]/35'}
                    >
                      <td className="py-3.5 pr-3 font-mono font-bold text-[#2563EB] tabular-nums">
                        #{entry.rank}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#172B4D]">
                          {entry.learnerName}
                          {isCurrent && (
                            <span className="ml-2 text-[11px] font-mono text-[#2563EB]">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {entry.currentTitle} · {domainMap.get(entry.domainId) ?? entry.domainId}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#172B4D]">
                        {entry.attemptCount}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                        <span className="font-bold text-[#2563EB]">{entry.bestScore}/100</span>
                        <span className="ml-1 text-[11px] text-[#64748B]">
                          (#{entry.bestAttemptNumber})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                        {entry.recentScore}/100
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold">
                        {entry.improvementPct === null ? (
                          <span className="text-[#64748B]">—</span>
                        ) : (
                          <span
                            className={
                              entry.improvementPct >= 0 ? 'text-[#2563EB]' : 'text-[#DC2626]'
                            }
                          >
                            {entry.improvementPct > 0 ? '+' : ''}
                            {entry.improvementPct}%
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1 min-w-[210px]">
                          {CATEGORY_SHORT.map((c) => {
                            const val = entry.categoryAverages[c.key] ?? 0;
                            return (
                              <div key={c.key} className="text-[10px]">
                                <div className="flex justify-between font-mono tabular-nums text-[#64748B]">
                                  <span>{c.label}</span>
                                  <span className="text-[#172B4D] font-semibold">{val}</span>
                                </div>
                                <div className="h-1 w-full bg-[#EFF6FF] rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className="h-full bg-[#2563EB] rounded-full"
                                    style={{ width: `${val}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onInspectAssessmentId(entry.bestAssessmentId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Best</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

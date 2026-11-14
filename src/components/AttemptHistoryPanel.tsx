import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  Eye,
  GitCompare,
  Loader2,
  Minus,
} from 'lucide-react';
import { api } from '../api';
import { compareEvaluationAttempts } from '../shared/evaluationRubric';
import type { AttemptComparisonResult, DetailedEvaluationReport } from '../shared/types';

interface AttemptHistoryPanelProps {
  profileId: string;
  refreshTrigger: number;
  onInspectReport: (report: DetailedEvaluationReport) => void;
}

export const AttemptHistoryPanel: React.FC<AttemptHistoryPanelProps> = ({
  profileId,
  refreshTrigger,
  onInspectReport,
}) => {
  const [reports, setReports] = useState<DetailedEvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attemptAId, setAttemptAId] = useState<string>('');
  const [attemptBId, setAttemptBId] = useState<string>('');
  const [comparison, setComparison] = useState<AttemptComparisonResult | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getEvaluationHistory(profileId)
      .then((res) => {
        if (!active) return;
        setReports(res.reports);
        if (res.reports.length >= 2) {
          // Chronological oldest = reports[last], latest = reports[0]
          const oldest = res.reports[res.reports.length - 1];
          const latest = res.reports[0];
          setAttemptAId(oldest.assessmentId);
          setAttemptBId(latest.assessmentId);
          setComparison(compareEvaluationAttempts(oldest, latest));
        } else if (res.reports.length === 1) {
          setAttemptAId(res.reports[0].assessmentId);
          setAttemptBId(res.reports[0].assessmentId);
          setComparison(null);
        } else {
          setComparison(null);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load evaluation history');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId, refreshTrigger]);

  const handleCompare = async (nextA = attemptAId, nextB = attemptBId) => {
    if (!nextA || !nextB) return;
    setComparing(true);
    setError(null);
    try {
      const res = await api.compareAttempts(nextA, nextB);
      setComparison(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 flex items-center justify-center gap-2 text-sm text-[#64748B]">
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
        <span>Loading evaluation history &amp; progression...</span>
      </div>
    );
  }

  const chronological = [...reports].sort(
    (a, b) => a.attemptNumber - b.attemptNumber || a.submittedAt.localeCompare(b.submittedAt)
  );
  const bestScore =
    reports.length > 0 ? Math.max(...reports.map((r) => r.overallScore)) : 0;
  const latestReport = reports[0];
  const firstReport = chronological[0];
  const totalGrowth =
    reports.length >= 2 && firstReport && latestReport
      ? latestReport.overallScore - firstReport.overallScore
      : null;

  return (
    <div className="space-y-6" data-testid="attempt-history-panel">
      {error && (
        <div role="alert" className="bg-[#FEF2F2] border border-[#DC2626]/35 text-[#DC2626] rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-2">
          <BarChart3 className="w-8 h-8 text-[#2563EB] mx-auto" />
          <div className="font-display text-base font-bold text-[#172B4D]">
            No Evaluation Attempts Recorded Yet
          </div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Complete an assessment in the Assessment Lab tab to record your weighted 6-criterion score breakdown and track progression over attempts.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Strip + Score Progression */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#172B4D]">
                  Score Progression Across Attempts ({reports.length})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Weighted overall scores (/100) computed from the 6 normalized evaluation criteria
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-[#64748B]">Latest: </span>
                  <strong className="text-[#172B4D]">{latestReport.overallScore}/100</strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Personal Best: </span>
                  <strong className="text-[#2563EB]">{bestScore}/100</strong>
                </div>
                {totalGrowth !== null && (
                  <div>
                    <span className="text-[#64748B]">Net Change: </span>
                    <strong className={totalGrowth >= 0 ? 'text-[#2563EB]' : 'text-[#DC2626]'}>
                      {totalGrowth >= 0 ? `+${totalGrowth}` : totalGrowth} pts
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Clean Chronological Progression Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {chronological.map((rep) => {
                const isRem = rep.evaluationStatus === 'Remediation Triggered';
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => onInspectReport(rep)}
                    className="group border border-[#E2E8F0] hover:border-[#2563EB] rounded-lg p-3 text-left transition-colors cursor-pointer bg-[#EFF6FF]/40"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                      <span>#{rep.attemptNumber}</span>
                      <span className={isRem ? 'text-[#DC2626] font-bold' : 'text-[#2563EB] font-bold'}>
                        {rep.overallScore}/100
                      </span>
                    </div>
                    <div className="mt-2 h-14 flex items-end bg-white rounded border border-[#E2E8F0] p-1">
                      <div
                        className={`w-full rounded-sm transition-all ${
                          isRem ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
                        }`}
                        style={{ height: `${Math.max(10, rep.overallScore)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs font-medium text-[#172B4D] truncate">
                      {rep.skillName}
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">
                      {rep.performanceClassification}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Attempt Comparison Workbench */}
          {reports.length >= 2 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5" data-testid="attempt-comparison-card">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-[#2563EB]" />
                    <h2 className="font-display text-base font-bold text-[#172B4D]">
                      Compare Two Attempts
                    </h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Inspect overall score delta, improved categories, and declining categories between any two stored attempts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    aria-label="Baseline Attempt A"
                    value={attemptAId}
                    onChange={(e) => {
                      setAttemptAId(e.target.value);
                      void handleCompare(e.target.value, attemptBId);
                    }}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172B4D] focus:border-[#2563EB] focus:outline-none"
                  >
                    {chronological.map((r) => (
                      <option key={`a_${r.assessmentId}`} value={r.assessmentId}>
                        Baseline: #{r.attemptNumber} · {r.skillName} ({r.overallScore}/100)
                      </option>
                    ))}
                  </select>

                  <ArrowRight className="w-4 h-4 text-[#64748B] shrink-0" />

                  <select
                    aria-label="Comparison Attempt B"
                    value={attemptBId}
                    onChange={(e) => {
                      setAttemptBId(e.target.value);
                      void handleCompare(attemptAId, e.target.value);
                    }}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#172B4D] focus:border-[#2563EB] focus:outline-none"
                  >
                    {chronological.map((r) => (
                      <option key={`b_${r.assessmentId}`} value={r.assessmentId}>
                        Compare: #{r.attemptNumber} · {r.skillName} ({r.overallScore}/100)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {comparing ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                  <span>Computing attempt comparison...</span>
                </div>
              ) : comparison && (
                <div className="space-y-4">
                  {/* Overall Delta Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#EFF6FF]/50">
                      <div className="text-xs text-[#64748B]">Overall Score Delta</div>
                      <div
                        className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                          comparison.overallDelta > 0
                            ? 'text-[#2563EB]'
                            : comparison.overallDelta < 0
                              ? 'text-[#DC2626]'
                              : 'text-[#172B4D]'
                        }`}
                      >
                        {comparison.overallDelta > 0
                          ? `+${comparison.overallDelta}`
                          : comparison.overallDelta}{' '}
                        pts
                        {comparison.improvementPct !== null && (
                          <span className="ml-2 text-xs font-normal text-[#64748B]">
                            ({comparison.improvementPct > 0 ? `+${comparison.improvementPct}%` : `${comparison.improvementPct}%`})
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs font-mono text-[#64748B] tabular-nums">
                        Attempt #{comparison.attemptA.attemptNumber} ({comparison.attemptA.overallScore}) → Attempt #{comparison.attemptB.attemptNumber} ({comparison.attemptB.overallScore})
                      </div>
                    </div>

                    <div className="border border-[#E2E8F0] rounded-lg p-4 bg-white">
                      <div className="text-xs text-[#64748B]">
                        Improved Categories ({comparison.improvedCategories.length})
                      </div>
                      <div className="mt-1.5 text-xs text-[#172B4D] space-y-1">
                        {comparison.improvedCategories.length === 0 ? (
                          <span className="text-[#64748B]">No upward category shifts.</span>
                        ) : (
                          comparison.improvedCategories.map((c) => (
                            <div key={c.categoryId} className="flex items-center justify-between font-mono tabular-nums">
                              <span className="font-sans text-[#172B4D]">{c.label}</span>
                              <span className="text-[#2563EB] font-semibold inline-flex items-center gap-0.5">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                +{c.delta}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border border-[#E2E8F0] rounded-lg p-4 bg-white">
                      <div className="text-xs text-[#64748B]">
                        Declining Categories ({comparison.decliningCategories.length})
                      </div>
                      <div className="mt-1.5 text-xs text-[#172B4D] space-y-1">
                        {comparison.decliningCategories.length === 0 ? (
                          <span className="text-[#64748B]">No declining categories.</span>
                        ) : (
                          comparison.decliningCategories.map((c) => (
                            <div key={c.categoryId} className="flex items-center justify-between font-mono tabular-nums">
                              <span className="font-sans text-[#172B4D]">{c.label}</span>
                              <span className="text-[#DC2626] font-semibold inline-flex items-center gap-0.5">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                {c.delta}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Per-Criterion Diff Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                          <th className="py-2 pr-3 font-medium">Criterion</th>
                          <th className="py-2 px-3 text-right font-medium">Weight</th>
                          <th className="py-2 px-3 text-right font-medium">
                            Attempt #{comparison.attemptA.attemptNumber}
                          </th>
                          <th className="py-2 px-3 text-right font-medium">
                            Attempt #{comparison.attemptB.attemptNumber}
                          </th>
                          <th className="py-2 px-3 text-right font-medium">Score Delta</th>
                          <th className="py-2 pl-3 text-right font-medium">Weighted Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {comparison.categoryDeltas.map((d) => (
                          <tr key={d.categoryId} className="hover:bg-[#EFF6FF]/40">
                            <td className="py-2.5 pr-3 font-medium text-[#172B4D]">{d.label}</td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#64748B]">
                              {d.weightPct}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#64748B]">
                              {d.scoreA}/100
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#172B4D]">
                              {d.scoreB}/100
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                              {d.direction === 'improved' ? (
                                <span className="text-[#2563EB] inline-flex items-center gap-0.5">
                                  <ArrowUpRight className="w-3.5 h-3.5" />+{d.delta}
                                </span>
                              ) : d.direction === 'declined' ? (
                                <span className="text-[#DC2626] inline-flex items-center gap-0.5">
                                  <ArrowDownRight className="w-3.5 h-3.5" />{d.delta}
                                </span>
                              ) : (
                                <span className="text-[#64748B] inline-flex items-center gap-0.5">
                                  <Minus className="w-3.5 h-3.5" />0
                                </span>
                              )}
                            </td>
                            <td
                              className={`py-2.5 pl-3 text-right font-mono tabular-nums ${
                                d.weightedDelta > 0
                                  ? 'text-[#2563EB]'
                                  : d.weightedDelta < 0
                                    ? 'text-[#DC2626]'
                                    : 'text-[#64748B]'
                              }`}
                            >
                              {d.weightedDelta > 0
                                ? `+${d.weightedDelta.toFixed(1)}`
                                : d.weightedDelta.toFixed(1)}{' '}
                              pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complete Attempt History List */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#172B4D]">
                Stored Evaluation Attempts
              </h2>
              <p className="text-xs text-[#64748B]">
                Click any attempt to reopen its full 6-criterion evaluation score breakdown modal.
              </p>
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {reports.map((rep) => {
                const isRem = rep.evaluationStatus === 'Remediation Triggered';
                return (
                  <div
                    key={rep.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#2563EB]">
                          Attempt #{rep.attemptNumber}
                        </span>
                        <span aria-hidden="true" className="text-[#E2E8F0]">·</span>
                        <span className="font-semibold text-sm text-[#172B4D]">{rep.skillName}</span>
                        <span aria-hidden="true" className="text-[#E2E8F0]">·</span>
                        <span className={isRem ? 'text-[#DC2626] font-semibold' : 'text-[#2563EB] font-semibold'}>
                          {rep.evaluationStatus}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3" />
                          {new Date(rep.submittedAt).toLocaleString()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{rep.performanceClassification}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Quiz {rep.quizScore}% · Applied {rep.practicalScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`font-mono text-lg font-bold tabular-nums ${
                            isRem ? 'text-[#DC2626]' : 'text-[#172B4D]'
                          }`}
                        >
                          {rep.overallScore}/100
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onInspectReport(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Breakdown</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

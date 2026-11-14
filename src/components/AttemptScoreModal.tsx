import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitCompare,
  Info,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { EvaluationCategoryKey, EvaluationReport } from '../shared/types';

interface AttemptScoreModalProps {
  report: EvaluationReport | null;
  open: boolean;
  onClose: () => void;
  canComparePrevious?: boolean;
  onCompareWithPrevious?: (attemptId: string) => void;
}

export const AttemptScoreModal: React.FC<AttemptScoreModalProps> = ({
  report,
  open,
  onClose,
  canComparePrevious = false,
  onCompareWithPrevious,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<EvaluationCategoryKey>>(new Set());
  const [barsAnimated, setBarsAnimated] = useState(false);

  useEffect(() => {
    if (!open || !report) {
      setBarsAnimated(false);
      return;
    }

    // Default-expand the lowest-scoring category so actionable guidance is visible immediately
    const sorted = [...report.categories].sort((a, b) => a.score - b.score);
    setExpandedKeys(sorted[0] ? new Set([sorted[0].key]) : new Set());

    const timer = window.setTimeout(() => setBarsAnimated(true), 40);
    return () => window.clearTimeout(timer);
  }, [open, report]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !report) return null;

  const toggleCategory = (key: EvaluationCategoryKey) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allExpanded = expandedKeys.size === report.categories.length;
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedKeys(new Set());
    } else {
      setExpandedKeys(new Set(report.categories.map((c) => c.key)));
    }
  };

  const isWeakScore = (score: number) => score < 50;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attempt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172B4D]/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-pp-card border border-pp-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-pp-border bg-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-mono text-pp-text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-pp-accent">
                Attempt #{report.attemptNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{new Date(report.timestamp).toLocaleString()}</span>
              <span aria-hidden="true">·</span>
              <span>{report.submissionType === 'project_code' ? 'Project & Code Evaluation' : 'Domain Assessment'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-pp-text">
                {report.aiMode === 'gemini' ? 'Gemini AI + Deterministic Pipeline' : 'Deterministic Pipeline'}
              </span>
            </div>
            <h2
              id="attempt-modal-title"
              className="mt-1 font-display text-lg font-bold text-pp-text truncate"
            >
              {report.submissionTitle} — {report.skillName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close evaluation breakdown"
            className="p-1.5 text-pp-text-muted hover:text-pp-text hover:bg-pp-surface rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {/* Overall Weighted Score Hero Strip */}
          <div className="rounded-xl border border-pp-border bg-pp-surface p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-pp-text-muted">
                  Weighted Overall Score
                </div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span
                    data-testid="modal-overall-score"
                    className={`font-display text-4xl font-extrabold tabular-nums ${
                      isWeakScore(report.overallScore) ? 'text-pp-error' : 'text-pp-accent'
                    }`}
                  >
                    {report.overallScore}
                  </span>
                  <span className="font-mono text-sm font-semibold text-pp-text-muted">/ 100</span>
                  <span
                    className={`text-sm font-semibold ${
                      isWeakScore(report.overallScore) ? 'text-pp-error' : 'text-pp-text'
                    }`}
                  >
                    · {report.performanceClassification}
                  </span>
                </div>
                <div className="mt-1 text-xs text-pp-text-muted">
                  Evaluation Status:{' '}
                  <span
                    className={`font-semibold ${
                      report.evaluationStatus === 'Needs Remediation'
                        ? 'text-pp-error'
                        : 'text-pp-text'
                    }`}
                  >
                    {report.evaluationStatus}
                  </span>
                </div>
              </div>

              <div className="text-xs text-pp-text-muted max-w-md leading-relaxed">
                {report.summaryNote}
              </div>
            </div>

            {/* Animated Overall Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-white border border-pp-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isWeakScore(report.overallScore) ? 'bg-pp-error' : 'bg-pp-accent'
                }`}
                style={{ width: barsAnimated ? `${report.overallScore}%` : '0%' }}
              />
            </div>

            {/* Weighted Math Breakdown Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {report.categories.map((cat) => {
                const shortName =
                  cat.key === 'problem_alignment' ? 'Alignment' : cat.label;
                return (
                  <div
                    key={`contrib_${cat.key}`}
                    className="bg-white border border-pp-border rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="text-[11px] font-medium text-pp-text-muted flex items-center justify-between gap-1">
                      <span>{shortName}</span>
                      <span className="font-mono">{cat.weightPct}%</span>
                    </div>
                    <div className="mt-0.5 font-mono font-bold text-pp-text tabular-nums">
                      {cat.score}/100{' '}
                      <span className="text-[11px] font-normal text-pp-accent">
                        (+{cat.weightedContribution})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Expandable Category Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-pp-text">
                  6-Criteria Detailed Category Breakdown
                </h3>
                <p className="text-xs text-pp-text-muted">
                  Click any category to inspect strengths, weaknesses, and 5-part actionable guidance.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="px-3 py-1.5 text-xs font-semibold text-pp-accent hover:bg-pp-surface border border-pp-border rounded-lg transition-colors cursor-pointer"
              >
                {allExpanded ? 'Collapse All' : 'Expand All 6 Criteria'}
              </button>
            </div>

            <div className="divide-y divide-pp-border border border-pp-border rounded-xl overflow-hidden bg-white">
              {report.categories.map((cat) => {
                const isExpanded = expandedKeys.has(cat.key);
                const weak = isWeakScore(cat.score);

                return (
                  <div key={cat.key} className="bg-white">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleCategory(cat.key)}
                      className="w-full px-5 py-4 text-left hover:bg-pp-surface/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pp-accent"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-display text-sm font-semibold text-pp-text">
                              {cat.label}
                            </span>
                            <span className="text-xs font-mono text-pp-text-muted tabular-nums">
                              · Weight {cat.weightPct}% · Contribution +{cat.weightedContribution} pts
                            </span>
                            {!cat.applicable && (
                              <span className="text-xs text-pp-text-muted">
                                · N/A for non-UI logic (Neutral)
                              </span>
                            )}
                          </div>

                          <div className="mt-2 h-2 w-full rounded-full bg-pp-surface border border-pp-border/70 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                weak ? 'bg-pp-error' : 'bg-pp-accent'
                              }`}
                              style={{ width: barsAnimated ? `${cat.score}%` : '0%' }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`font-mono text-base font-bold tabular-nums ${
                                weak ? 'text-pp-error' : 'text-pp-accent'
                              }`}
                            >
                              {cat.score}/100
                            </div>
                            <div className="text-[11px] font-medium text-pp-text-muted">
                              {cat.performanceLabel}
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-pp-text-muted" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-pp-text-muted" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-pp-border/70 bg-pp-surface/35 space-y-4 text-xs">
                        {/* Strengths / Weaknesses / Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="font-semibold text-pp-accent flex items-center gap-1.5 mb-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Strengths</span>
                            </div>
                            <ul className="space-y-1 text-pp-text list-disc pl-4">
                              {cat.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="font-semibold text-pp-error flex items-center gap-1.5 mb-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Weaknesses</span>
                            </div>
                            <ul className="space-y-1 text-pp-text list-disc pl-4">
                              {cat.weaknesses.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <div className="font-semibold text-pp-text flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-pp-accent" />
                              <span>Recommendations</span>
                            </div>
                            <ul className="space-y-1 text-pp-text list-disc pl-4">
                              {cat.recommendations.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 5-Part Actionable Feedback */}
                        <div className="bg-white border border-pp-border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <div className="font-semibold text-pp-text">What You Did Well</div>
                            <p className="mt-0.5 text-pp-text-muted leading-relaxed">
                              {cat.feedback.didWell}
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-pp-text">What Needs Improvement</div>
                            <p className="mt-0.5 text-pp-text-muted leading-relaxed">
                              {cat.feedback.needsImprovement}
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-pp-text">Why It Matters</div>
                            <p className="mt-0.5 text-pp-text-muted leading-relaxed">
                              {cat.feedback.whyItMatters}
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-pp-text">How To Fix</div>
                            <p className="mt-0.5 text-pp-text-muted leading-relaxed">
                              {cat.feedback.howToFix}
                            </p>
                          </div>
                          <div className="md:col-span-2 pt-2 border-t border-pp-border/60">
                            <div className="font-semibold text-pp-text">Recommended Next Steps</div>
                            <ol className="mt-1 space-y-1 text-pp-text-muted list-decimal pl-4">
                              {cat.feedback.nextSteps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Evidence & Honest Limitations */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-pp-text-muted">
                          <div>
                            <span className="font-semibold text-pp-text">Evidence:</span>{' '}
                            {cat.feedback.evidence.join(' · ')}
                          </div>
                          {cat.feedback.limitations && (
                            <div className="flex items-start gap-1">
                              <Info className="w-3.5 h-3.5 text-pp-accent shrink-0 mt-0.5" />
                              <span>{cat.feedback.limitations}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Executed Checks Audit Strip */}
          {report.checksExecuted.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pp-text">
                <ShieldCheck className="w-4 h-4 text-pp-accent" />
                <span>Automated Verification &amp; Scope Transparency</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {report.checksExecuted.map((chk, idx) => (
                  <div
                    key={idx}
                    className="border border-pp-border rounded-lg p-3 text-xs bg-pp-surface/40"
                  >
                    <div className="flex items-center justify-between gap-2 font-semibold text-pp-text">
                      <span>{chk.name}</span>
                      <span
                        className={`font-mono text-[11px] uppercase ${
                          chk.outcome === 'failed'
                            ? 'text-pp-error'
                            : chk.executed
                              ? 'text-pp-accent'
                              : 'text-pp-text-muted'
                        }`}
                      >
                        {chk.outcome.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-pp-text-muted leading-relaxed">{chk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-pp-border bg-pp-surface/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-pp-text-muted">
            6-Criteria Weights: Code Quality 20% · Security 20% · Efficiency 15% · Testing 15% · Accessibility 10% · Alignment 20%
          </div>
          <div className="flex items-center gap-2.5">
            {canComparePrevious && onCompareWithPrevious && (
              <button
                type="button"
                onClick={() => {
                  onCompareWithPrevious(report.attemptId);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-pp-accent bg-white border border-pp-accent/40 hover:bg-pp-surface rounded-lg transition-colors cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare With Previous Attempt</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

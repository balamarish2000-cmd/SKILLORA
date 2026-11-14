import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Code2,
  Eye,
  GitCompare,
  History,
  Loader2,
  Minus,
  Play,
  Trophy,
} from 'lucide-react';
import { api } from '../api';
import type {
  EvaluationAttemptComparison,
  EvaluationAttemptRecord,
  EvaluationHistoryResponse,
  EvaluationLeaderboardResponse,
  EvaluationReport,
  SkillDefinition,
  TwinSnapshot,
} from '../shared/types';

/* -------------------------------------------------------------------------- */
/* 1. Project & Code Evaluator Panel                                          */
/* -------------------------------------------------------------------------- */

interface ProjectCodeEvaluatorPanelProps {
  profileId: string;
  skillsCatalog: SkillDefinition[];
  defaultSkillId: string;
  onEvaluated: (report: EvaluationReport, nextTwin: TwinSnapshot) => void;
}

const CLEAN_SAMPLE_SNIPPET = {
  title: 'Accessible Profile Filter Component',
  skillId: 'react',
  problemStatement:
    'Build an accessible React filter component that guards empty inputs, uses Set lookup for O(1) category filtering, labels inputs cleanly, and avoids raw HTML injection.',
  code: `function FilterableSkillList({ items, activeCategories }) {
  if (!Array.isArray(items)) return null;
  const activeSet = new Set(Array.isArray(activeCategories) ? activeCategories : []);

  const visibleItems = items.filter((item) => {
    if (!item || typeof item.name !== 'string') return false;
    return activeSet.size === 0 || activeSet.has(item.category);
  });

  return (
    <section aria-label="Filtered skills">
      <label htmlFor="skill-search-input">Search skill catalog</label>
      <input id="skill-search-input" type="text" placeholder="Type a skill..." />
      <ul>
        {visibleItems.map((item) => (
          <li key={item.id}>
            <button type="button">{item.name}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}`,
  testNotes: `expect(visibleItems.length).toBe(2);
assert.equal(typeof FilterableSkillList, 'function');`,
};

const FLAWED_SAMPLE_SNIPPET = {
  title: 'Legacy Unvalidated HTML Renderer',
  skillId: 'javascript',
  problemStatement:
    'Render user search results safely and efficiently without XSS sinks, O(n^2) nested scans, or missing input validation.',
  code: `function renderMatches(users, selectedIds) {
  var results = [];
  for (var i = 0; i < users.length; i++) {
    if (selectedIds.includes(users[i].id)) {
      var box = document.getElementById('out');
      box.innerHTML = '<div>' + users[i].bio + '</div>';
      results.push(users[i].name);
    }
  }
  return results;
}`,
  testNotes: '',
};

export const ProjectCodeEvaluatorPanel: React.FC<ProjectCodeEvaluatorPanelProps> = ({
  profileId,
  skillsCatalog,
  defaultSkillId,
  onEvaluated,
}) => {
  const [skillId, setSkillId] = useState(defaultSkillId || 'javascript');
  const [title, setTitle] = useState(CLEAN_SAMPLE_SNIPPET.title);
  const [problemStatement, setProblemStatement] = useState(CLEAN_SAMPLE_SNIPPET.problemStatement);
  const [submittedCode, setSubmittedCode] = useState(CLEAN_SAMPLE_SNIPPET.code);
  const [testNotes, setTestNotes] = useState(CLEAN_SAMPLE_SNIPPET.testNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !problemStatement.trim() || !submittedCode.trim()) {
      setError('Please provide a submission title, problem statement, and code snippet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.evaluateProjectSubmission({
        profileId,
        skillId,
        title: title.trim(),
        problemStatement: problemStatement.trim(),
        submittedCode,
        testNotes: testNotes.trim() || undefined,
      });
      onEvaluated(res.report, res.twin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project evaluation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-pp-text flex items-center gap-2">
            <Code2 className="w-4 h-4 text-pp-accent" />
            <span>Standalone Project &amp; Code Evaluator</span>
          </h2>
          <p className="text-xs text-pp-text-muted mt-0.5">
            Run 6-criteria weighted analysis (Code Quality 20%, Security 20%, Efficiency 15%, Testing 15%, Accessibility 10%, Alignment 20%) and persist a full Attempt Breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSkillId(FLAWED_SAMPLE_SNIPPET.skillId);
              setTitle(FLAWED_SAMPLE_SNIPPET.title);
              setProblemStatement(FLAWED_SAMPLE_SNIPPET.problemStatement);
              setSubmittedCode(FLAWED_SAMPLE_SNIPPET.code);
              setTestNotes(FLAWED_SAMPLE_SNIPPET.testNotes);
            }}
            className="px-3 py-1.5 text-xs font-medium text-pp-error bg-pp-error-soft border border-pp-error/30 rounded-lg hover:opacity-90 cursor-pointer"
          >
            Load Vulnerable Sample
          </button>
          <button
            type="button"
            onClick={() => {
              setSkillId(CLEAN_SAMPLE_SNIPPET.skillId);
              setTitle(CLEAN_SAMPLE_SNIPPET.title);
              setProblemStatement(CLEAN_SAMPLE_SNIPPET.problemStatement);
              setSubmittedCode(CLEAN_SAMPLE_SNIPPET.code);
              setTestNotes(CLEAN_SAMPLE_SNIPPET.testNotes);
            }}
            className="px-3 py-1.5 text-xs font-medium text-pp-accent bg-pp-surface border border-pp-border rounded-lg hover:bg-pp-elevated cursor-pointer"
          >
            Load Clean Sample
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-lg px-4 py-2.5 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="proj-eval-title" className="block text-xs font-semibold text-pp-text mb-1.5">
            Submission Title
          </label>
          <input
            id="proj-eval-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Auth Middleware & Token Validator"
            className="w-full rounded-lg border border-pp-border bg-white px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="proj-eval-skill" className="block text-xs font-semibold text-pp-text mb-1.5">
            Target Skill Domain
          </label>
          <select
            id="proj-eval-skill"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full rounded-lg border border-pp-border bg-white px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          >
            {skillsCatalog.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="proj-eval-prompt" className="block text-xs font-semibold text-pp-text mb-1.5">
          Problem Statement / Acceptance Criteria
        </label>
        <textarea
          id="proj-eval-prompt"
          rows={2}
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          placeholder="Describe what this code must accomplish, constraints, and expected outputs..."
          className="w-full rounded-lg border border-pp-border bg-white px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <label htmlFor="proj-eval-code" className="block text-xs font-semibold text-pp-text mb-1.5">
            Code / Implementation Submission
          </label>
          <textarea
            id="proj-eval-code"
            rows={12}
            spellCheck={false}
            value={submittedCode}
            onChange={(e) => setSubmittedCode(e.target.value)}
            className="w-full rounded-lg border border-pp-border bg-pp-surface/50 p-3.5 font-mono text-xs text-pp-text leading-relaxed focus:border-pp-accent focus:outline-none"
          />
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          <div>
            <label htmlFor="proj-eval-tests" className="block text-xs font-semibold text-pp-text mb-1.5">
              Unit Tests / Assertions (Optional)
            </label>
            <textarea
              id="proj-eval-tests"
              rows={8}
              spellCheck={false}
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              placeholder="Paste test cases, expect(...) assertions, or edge-case verification notes..."
              className="w-full rounded-lg border border-pp-border bg-white p-3 font-mono text-xs text-pp-text leading-relaxed focus:border-pp-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isSubmitting ? 'Running 6-Criteria Evaluation...' : 'Evaluate Code & Generate Report'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Attempt History & Two-Attempt Comparison Panel                          */
/* -------------------------------------------------------------------------- */

interface AttemptHistoryComparePanelProps {
  profileId: string;
  refreshSignal: number;
  initialCompareTargetId?: string | null;
  onInspectReport: (report: EvaluationReport) => void;
}

function toEvaluationReport(attempt: EvaluationAttemptRecord): EvaluationReport {
  return {
    attemptId: attempt.id,
    profileId: attempt.profileId,
    skillId: attempt.skillId,
    skillName: attempt.skillName,
    submissionType: attempt.submissionType,
    submissionTitle: attempt.submissionTitle,
    attemptNumber: attempt.attemptNumber,
    timestamp: attempt.timestamp,
    overallScore: attempt.overallScore,
    performanceClassification: attempt.performanceClassification,
    evaluationStatus: attempt.evaluationStatus,
    aiMode: attempt.aiMode,
    categories: attempt.categories,
    checksExecuted: attempt.checksExecuted,
    summaryNote: attempt.summaryNote,
  };
}

export const AttemptHistoryComparePanel: React.FC<AttemptHistoryComparePanelProps> = ({
  profileId,
  refreshSignal,
  initialCompareTargetId,
  onInspectReport,
}) => {
  const [history, setHistory] = useState<EvaluationHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [baselineId, setBaselineId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [comparison, setComparison] = useState<EvaluationAttemptComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getEvaluationHistory(profileId)
      .then((res) => {
        if (!active) return;
        setHistory(res);
        if (res.attempts.length >= 2) {
          const newest = initialCompareTargetId && res.attempts.some((a) => a.id === initialCompareTargetId)
            ? initialCompareTargetId
            : res.attempts[0].id;
          const idx = res.attempts.findIndex((a) => a.id === newest);
          const older = res.attempts[idx + 1]?.id ?? res.attempts[res.attempts.length - 1].id;
          setTargetId(newest);
          setBaselineId(older);
        } else if (res.attempts.length === 1) {
          setTargetId(res.attempts[0].id);
          setBaselineId(res.attempts[0].id);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load attempt history');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId, refreshSignal, initialCompareTargetId]);

  useEffect(() => {
    if (!baselineId || !targetId || baselineId === targetId) {
      setComparison(null);
      return;
    }
    let active = true;
    setComparing(true);
    api
      .compareEvaluationAttempts(baselineId, targetId)
      .then((res) => {
        if (active) setComparison(res);
      })
      .catch(() => {
        if (active) setComparison(null);
      })
      .finally(() => {
        if (active) setComparing(false);
      });
    return () => {
      active = false;
    };
  }, [baselineId, targetId]);

  const chartData = useMemo(() => {
    if (!history) return [];
    return [...history.attempts]
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map((a) => ({
        name: `#${a.attemptNumber}`,
        score: a.overallScore,
        title: a.submissionTitle,
      }));
  }, [history]);

  if (loading) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-10 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
        <span>Loading evaluation attempt history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!history || history.attempts.length === 0) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-8 text-center space-y-2">
        <History className="w-8 h-8 text-pp-accent mx-auto" />
        <h3 className="font-display text-base font-bold text-pp-text">No Evaluation Attempts Yet</h3>
        <p className="text-xs text-pp-text-muted max-w-md mx-auto">
          Complete an Assessment Lab challenge or submit code in Project &amp; Code Evaluator to record your first 6-criteria weighted evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Recorded Attempts</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-text tabular-nums">
            {history.totalAttempts}
          </div>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Best Attempt Score</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-accent tabular-nums">
            {history.bestAttempt?.overallScore ?? 0}/100
          </div>
          <div className="text-[11px] text-pp-text-muted truncate">
            Attempt #{history.bestAttempt?.attemptNumber} · {history.bestAttempt?.performanceClassification}
          </div>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Recent Score</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-text tabular-nums">
            {history.latestAttempt?.overallScore ?? 0}/100
          </div>
          <div className="text-[11px] text-pp-text-muted">
            Average: {history.averageScore}/100
          </div>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Score Progression</div>
          <div
            className={`mt-1 font-display text-2xl font-bold tabular-nums ${
              history.improvementPct === null
                ? 'text-pp-text-muted'
                : history.improvementPct >= 0
                  ? 'text-pp-accent'
                  : 'text-pp-error'
            }`}
          >
            {history.improvementPct === null
              ? '—'
              : `${history.improvementPct >= 0 ? '+' : ''}${history.improvementPct} pts`}
          </div>
          <div className="text-[11px] text-pp-text-muted">First attempt vs latest</div>
        </div>
      </div>

      {/* Progression Chart */}
      {chartData.length >= 2 && (
        <div className="bg-pp-card border border-pp-border rounded-xl p-6">
          <h3 className="font-display text-sm font-bold text-pp-text">
            Score Progression Across Attempts
          </h3>
          <p className="text-xs text-pp-text-muted mb-4">
            Weighted overall score (/100) from Attempt #1 through Attempt #{chartData.length}
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="#DBEAFE"
                  fillOpacity={0.75}
                  isAnimationActive={false}
                  dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#1D4ED8' }}
                  name="Overall Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Side-by-Side Attempt Comparison */}
      {history.attempts.length >= 2 && (
        <div className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-pp-text flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-pp-accent" />
                <span>Side-by-Side Attempt Comparison</span>
              </h3>
              <p className="text-xs text-pp-text-muted mt-0.5">
                Compare any two attempts to inspect improved criteria, declining criteria, and prior feedback.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-1.5">
                <label htmlFor="compare-baseline-select" className="text-pp-text-muted font-medium whitespace-nowrap">
                  Baseline:
                </label>
                <select
                  id="compare-baseline-select"
                  value={baselineId}
                  onChange={(e) => setBaselineId(e.target.value)}
                  className="rounded-lg border border-pp-border bg-white px-2.5 py-1.5 text-xs text-pp-text"
                >
                  {history.attempts.map((a) => (
                    <option key={`base_${a.id}`} value={a.id}>
                      Attempt #{a.attemptNumber} — {a.overallScore}/100 ({a.skillName})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-pp-text-muted font-semibold">vs</span>

              <div className="inline-flex items-center gap-1.5">
                <label htmlFor="compare-target-select" className="text-pp-text-muted font-medium whitespace-nowrap">
                  Target:
                </label>
                <select
                  id="compare-target-select"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="rounded-lg border border-pp-border bg-white px-2.5 py-1.5 text-xs text-pp-text"
                >
                  {history.attempts.map((a) => (
                    <option key={`tgt_${a.id}`} value={a.id}>
                      Attempt #{a.attemptNumber} — {a.overallScore}/100 ({a.skillName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {baselineId === targetId ? (
            <div className="text-xs text-pp-text-muted bg-pp-surface rounded-lg p-3">
              Select two different attempts to view score deltas and category changes.
            </div>
          ) : comparing ? (
            <div className="flex items-center gap-2 text-xs text-pp-text-muted py-4">
              <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
              <span>Comparing attempts...</span>
            </div>
          ) : comparison ? (
            <div className="space-y-4">
              <div className="bg-pp-surface border border-pp-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-semibold text-pp-text">
                    Attempt #{comparison.baselineAttempt.attemptNumber} ({comparison.baselineAttempt.overallScore}/100) → Attempt #{comparison.targetAttempt.attemptNumber} ({comparison.targetAttempt.overallScore}/100)
                  </div>
                  <div className="text-pp-text-muted mt-0.5">
                    {comparison.improvedCategories.length} improved · {comparison.decliningCategories.length} declined · {comparison.unchangedCategories.length} unchanged
                  </div>
                </div>
                <div
                  data-testid="comparison-overall-delta"
                  className={`font-mono text-lg font-bold tabular-nums ${
                    comparison.overallDelta >= 0 ? 'text-pp-accent' : 'text-pp-error'
                  }`}
                >
                  {comparison.overallDelta >= 0 ? '+' : ''}
                  {comparison.overallDelta} pts overall
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border border-pp-border rounded-xl p-4 bg-white">
                  <div className="font-semibold text-pp-accent flex items-center gap-1.5 mb-2.5">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Improved Categories ({comparison.improvedCategories.length})</span>
                  </div>
                  {comparison.improvedCategories.length === 0 ? (
                    <div className="text-pp-text-muted">No category score increases between these attempts.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {comparison.improvedCategories.map((c) => {
                        const prevFeedback = comparison.baselineAttempt.categories.find(
                          (x) => x.key === c.key
                        )?.feedback.needsImprovement;
                        return (
                          <div key={c.key} className="pb-2 border-b border-pp-border/60 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between font-semibold text-pp-text">
                              <span>{c.label}</span>
                              <span className="font-mono text-pp-accent tabular-nums">
                                {c.beforeScore} → {c.afterScore} (+{c.delta})
                              </span>
                            </div>
                            {prevFeedback && (
                              <div className="mt-1 text-[11px] text-pp-text-muted">
                                Previous note: {prevFeedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-pp-border rounded-xl p-4 bg-white">
                  <div className="font-semibold text-pp-error flex items-center gap-1.5 mb-2.5">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Declining Categories ({comparison.decliningCategories.length})</span>
                  </div>
                  {comparison.decliningCategories.length === 0 ? (
                    <div className="text-pp-text-muted">No regressions detected across the 6 criteria.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {comparison.decliningCategories.map((c) => {
                        const currFix = comparison.targetAttempt.categories.find(
                          (x) => x.key === c.key
                        )?.feedback.howToFix;
                        return (
                          <div key={c.key} className="pb-2 border-b border-pp-border/60 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between font-semibold text-pp-text">
                              <span>{c.label}</span>
                              <span className="font-mono text-pp-error tabular-nums">
                                {c.beforeScore} → {c.afterScore} ({c.delta})
                              </span>
                            </div>
                            {currFix && (
                              <div className="mt-1 text-[11px] text-pp-text-muted">
                                Fix: {currFix}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-pp-border rounded-xl p-4 bg-white">
                  <div className="font-semibold text-pp-text flex items-center gap-1.5 mb-2.5">
                    <Minus className="w-4 h-4 text-pp-text-muted" />
                    <span>Unchanged Categories ({comparison.unchangedCategories.length})</span>
                  </div>
                  {comparison.unchangedCategories.length === 0 ? (
                    <div className="text-pp-text-muted">Every category changed between these attempts.</div>
                  ) : (
                    <div className="space-y-2">
                      {comparison.unchangedCategories.map((c) => (
                        <div key={c.key} className="flex items-center justify-between text-pp-text-muted">
                          <span>{c.label}</span>
                          <span className="font-mono font-semibold text-pp-text tabular-nums">
                            {c.score}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Attempt History Table */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-6">
        <h3 className="font-display text-base font-bold text-pp-text mb-3">
          All Evaluation Attempts ({history.attempts.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pp-border text-pp-text-muted">
                <th className="py-2.5 pr-3 font-semibold">Attempt</th>
                <th className="py-2.5 px-3 font-semibold">Submission</th>
                <th className="py-2.5 px-3 font-semibold">Skill</th>
                <th className="py-2.5 px-3 font-semibold text-right">Weighted Score</th>
                <th className="py-2.5 px-3 font-semibold">Classification</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pp-border/70">
              {history.attempts.map((att) => (
                <tr key={att.id} className="hover:bg-pp-surface/40">
                  <td className="py-3 pr-3 font-mono font-bold text-pp-accent tabular-nums">
                    #{att.attemptNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-pp-text">{att.submissionTitle}</div>
                    <div className="text-[11px] text-pp-text-muted">
                      {att.submissionType === 'project_code' ? 'Project/Code Evaluation' : 'Domain Assessment'}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-pp-text">{att.skillName}</td>
                  <td
                    className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                      att.overallScore < 50 ? 'text-pp-error' : 'text-pp-accent'
                    }`}
                  >
                    {att.overallScore}/100
                  </td>
                  <td className="py-3 px-3 text-pp-text">{att.performanceClassification}</td>
                  <td className="py-3 px-3 text-pp-text-muted whitespace-nowrap">
                    {new Date(att.timestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 pl-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectReport(toEvaluationReport(att))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-pp-accent hover:bg-pp-surface rounded-md transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Breakdown</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Performance & Evaluation Leaderboard Panel                              */
/* -------------------------------------------------------------------------- */

interface EvaluationLeaderboardPanelProps {
  profileId: string;
  refreshSignal: number;
}

export const EvaluationLeaderboardPanel: React.FC<EvaluationLeaderboardPanelProps> = ({
  profileId,
  refreshSignal,
}) => {
  const [data, setData] = useState<EvaluationLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getEvaluationLeaderboard(profileId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileId, refreshSignal]);

  if (loading) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-10 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
        <span>Computing leaderboard from stored evaluation scores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-8 text-center text-sm text-pp-text-muted">
        No evaluated submissions recorded yet.
      </div>
    );
  }

  const currentUserEntry = data.entries.find((e) => e.isCurrentUser);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Evaluated Learners</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-text tabular-nums">
            {data.totalEvaluatedLearners}
          </div>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Total Evaluation Runs</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-text tabular-nums">
            {data.totalRecordedAttempts}
          </div>
        </div>
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <div className="text-xs text-pp-text-muted">Your Leaderboard Standing</div>
          <div className="mt-1 font-display text-2xl font-bold text-pp-accent tabular-nums">
            {currentUserEntry ? `#${currentUserEntry.rank}` : 'Unranked'}
          </div>
          <div className="text-[11px] text-pp-text-muted">
            {currentUserEntry
              ? `Best ${currentUserEntry.bestScore}/100 · Recent ${currentUserEntry.recentScore}/100`
              : 'Submit an evaluation to enter rankings'}
          </div>
        </div>
      </div>

      <div className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-pp-text flex items-center gap-2">
              <Trophy className="w-4 h-4 text-pp-accent" />
              <span>Performance &amp; Evaluation Leaderboard</span>
            </h3>
            <p className="text-xs text-pp-text-muted mt-0.5">
              Ranked by verified weighted evaluation scores (/100) across all 6 engineering &amp; domain criteria.
            </p>
          </div>
          <Award className="w-5 h-5 text-pp-accent shrink-0" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pp-border text-pp-text-muted">
                <th className="py-2.5 pr-3 font-semibold">Rank</th>
                <th className="py-2.5 px-3 font-semibold">Learner &amp; Target</th>
                <th className="py-2.5 px-2 font-semibold text-right">Attempts</th>
                <th className="py-2.5 px-2 font-semibold text-right">Best</th>
                <th className="py-2.5 px-2 font-semibold text-right">Recent</th>
                <th className="py-2.5 px-2 font-semibold text-right">Improve</th>
                <th className="py-2.5 px-2 font-semibold text-right" title="Code Quality (20%)">CQ</th>
                <th className="py-2.5 px-2 font-semibold text-right" title="Security (20%)">SEC</th>
                <th className="py-2.5 px-2 font-semibold text-right" title="Efficiency (15%)">EFF</th>
                <th className="py-2.5 px-2 font-semibold text-right" title="Testing (15%)">TEST</th>
                <th className="py-2.5 px-2 font-semibold text-right" title="Accessibility (10%)">A11Y</th>
                <th className="py-2.5 pl-2 font-semibold text-right" title="Problem Alignment (20%)">ALIGN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pp-border/70">
              {data.entries.map((entry) => (
                <tr
                  key={entry.profileId}
                  className={entry.isCurrentUser ? 'bg-pp-surface/70' : 'hover:bg-pp-surface/35'}
                >
                  <td className="py-3 pr-3 font-mono font-bold text-pp-accent tabular-nums">
                    #{entry.rank}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-pp-text">
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="ml-1.5 text-[11px] font-semibold text-pp-accent">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-pp-text-muted">
                      {entry.targetRoleTitle} · {entry.domainName}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.attemptCount}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-bold text-pp-accent tabular-nums">
                    {entry.bestScore}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-pp-text tabular-nums">
                    {entry.recentScore}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-mono tabular-nums ${
                      entry.improvementPct === null
                        ? 'text-pp-text-muted'
                        : entry.improvementPct >= 0
                          ? 'text-pp-accent font-semibold'
                          : 'text-pp-error font-semibold'
                    }`}
                  >
                    {entry.improvementPct === null
                      ? '—'
                      : `${entry.improvementPct >= 0 ? '+' : ''}${entry.improvementPct}`}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.code_quality}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.security}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.efficiency}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.testing}
                  </td>
                  <td className="py-3 px-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.accessibility}
                  </td>
                  <td className="py-3 pl-2 text-right font-mono tabular-nums text-pp-text">
                    {entry.categoryAverages.problem_alignment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Code2,
  FlaskConical,
  GitBranch,
  HelpCircle,
  History,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  Trophy,
  XCircle,
} from 'lucide-react';
import { api } from '../api';
import type {
  AssessmentStartResponse,
  AssessmentSubmitResponse,
  CareerDomain,
  EvaluationReport,
  SkillDefinition,
  TwinSnapshot,
} from '../shared/types';
import { AttemptScoreModal } from './AttemptScoreModal';
import {
  AttemptHistoryComparePanel,
  EvaluationLeaderboardPanel,
  ProjectCodeEvaluatorPanel,
} from './EvaluationAnalyticsPanels';

type EvaluationTab = 'lab' | 'project' | 'history' | 'leaderboard';

interface AssessmentViewProps {
  twin: TwinSnapshot;
  domains: CareerDomain[];
  skillsCatalog: SkillDefinition[];
  initialSkillId?: string;
  onAssessmentCompleted: (res: AssessmentSubmitResponse) => void;
  onTwinUpdated?: (nextTwin: TwinSnapshot) => void;
  onOpenReplanDiff: () => void;
}

const REFERENCE_SOLUTIONS: Record<string, string> = {
  javascript: `function findReadySkills(skills, completedIds) {
  const done = new Set(completedIds);
  return skills
    .filter((s) => !done.has(s.id) && s.prerequisites.every((p) => done.has(p)))
    .map((s) => s.id)
    .sort();
}`,
  react: `function toggleStepReducer(steps, stepId) {
  return steps.map((step) =>
    step.id === stepId ? { ...step, completed: !step.completed } : step
  );
}`,
  typescript: `function computeWeightedReadiness(requirements, userLevels) {
  let sum = 0;
  let totalWeight = 0;
  for (const req of requirements) {
    const level = userLevels[req.skillId] || 0;
    const attainment = Math.min(1, level / req.targetLevel);
    sum += attainment * req.weight;
    totalWeight += req.weight;
  }
  return totalWeight > 0 ? Math.round((sum / totalWeight) * 100) : 0;
}`,
  python: `function mergeSkillLevels(records) {
  const acc = {};
  for (const r of records) {
    const key = r.skill.trim().toLowerCase();
    acc[key] = Math.max(acc[key] ?? 0, r.level);
  }
  return acc;
}`,
  sql: `function filterAtRiskLearners(learners, threshold) {
  return learners
    .filter((l) => l.readiness < threshold)
    .sort((a, b) => a.readiness - b.readiness)
    .map((l) => l.id);
}`,
};

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  twin,
  domains,
  skillsCatalog,
  initialSkillId,
  onAssessmentCompleted,
  onTwinUpdated,
  onOpenReplanDiff,
}) => {
  const defaultSkill =
    initialSkillId || twin.analysis.gaps[0]?.skillId || 'javascript';

  const [activeTab, setActiveTab] = useState<EvaluationTab>('lab');
  const [selectedSkillId, setSelectedSkillId] = useState(defaultSkill);
  const [session, setSession] = useState<AssessmentStartResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [code, setCode] = useState('');
  const [practicalAnswer, setPracticalAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modalReport, setModalReport] = useState<EvaluationReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [compareTargetId, setCompareTargetId] = useState<string | null>(null);

  const loadAssessment = async (skillId: string) => {
    setError(null);
    setResult(null);
    setShowHint(false);
    setIsLoading(true);
    try {
      const started = await api.startAssessment({
        profileId: twin.profile.id,
        skillId,
      });
      setSession(started);
      setQuizAnswers(new Array(started.questions.length).fill(-1));
      setCode(started.challenge?.starterCode ?? '');
      setPracticalAnswer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSkillId) {
      setSelectedSkillId(initialSkillId);
      void loadAssessment(initialSkillId);
    } else if (!session) {
      void loadAssessment(selectedSkillId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkillId, twin.profile.id]);

  const handleSkillChange = (nextId: string) => {
    setSelectedSkillId(nextId);
    void loadAssessment(nextId);
  };

  const handleLoadSolution = () => {
    if (!session) return;
    setQuizAnswers(session.questions.map((q) => q.correctIndex));
    if (session.challenge) {
      const sol =
        REFERENCE_SOLUTIONS[session.skillId] ||
        `function evaluateMastery(scores) {
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { avg, passed: avg >= 70 };
}`;
      setCode(sol);
    } else if (session.practicalTask) {
      setPracticalAnswer(session.practicalTask.referenceSampleAnswer);
    }
  };

  const handleSimulateFailure = () => {
    if (!session) return;
    setQuizAnswers(session.questions.map((q) => (q.correctIndex + 1) % q.options.length));
    if (session.challenge) {
      setCode(session.challenge.starterCode);
    } else if (session.practicalTask) {
      if (session.practicalTask.inputMode === 'numeric') {
        const expected = session.practicalTask.expectedNumericValue ?? 10;
        setPracticalAnswer(String(expected + 999));
      } else {
        const wrongIdx = ((session.practicalTask.correctOptionIndex ?? 0) + 1) %
          Math.max(2, session.practicalTask.options?.length ?? 4);
        setPracticalAnswer(String(wrongIdx));
      }
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.submitAssessment({
        profileId: twin.profile.id,
        assessmentId: session.assessmentId,
        quizAnswers,
        submittedCode: session.challenge ? code : undefined,
        practicalAnswer: session.practicalTask ? practicalAnswer : undefined,
      });
      setResult(res);
      setRefreshSignal((n) => n + 1);
      if (res.evaluationReport) {
        setModalReport(res.evaluationReport);
        setModalOpen(true);
      }
      onAssessmentCompleted(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gapSkillIds = useMemo(
    () => new Set(twin.analysis.gaps.map((g) => g.skillId)),
    [twin.analysis.gaps]
  );

  const groupedSkills = useMemo(() => {
    const gapSkills = skillsCatalog.filter((s) => gapSkillIds.has(s.id));
    const byDomain = domains.map((dom) => ({
      domain: dom,
      skills: skillsCatalog.filter((s) => s.domainId === dom.id),
    }));
    return { gapSkills, byDomain };
  }, [domains, skillsCatalog, gapSkillIds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted">
            Assessor Agent · {session ? `${session.domainName} · ` : ''}Weighted 6-Criteria Evaluation Engine
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Evaluation, Scoring &amp; Assessment Studio
          </h1>
        </div>

        {activeTab === 'lab' && (
          <div className="flex items-center gap-3">
            <label htmlFor="assess-skill-select" className="text-xs font-medium text-pp-text-muted whitespace-nowrap">
              Target Skill:
            </label>
            <select
              id="assess-skill-select"
              value={selectedSkillId}
              onChange={(e) => handleSkillChange(e.target.value)}
              className="rounded-lg border border-pp-border bg-pp-card px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none max-w-xs"
            >
              {groupedSkills.gapSkills.length > 0 && (
                <optgroup label="Your Current Priority Gaps">
                  {groupedSkills.gapSkills.map((s) => (
                    <option key={`gap_${s.id}`} value={s.id}>
                      {s.name} (Priority Gap)
                    </option>
                  ))}
                </optgroup>
              )}
              {groupedSkills.byDomain.map(({ domain, skills }) => (
                <optgroup key={domain.id} label={domain.name}>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Section Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Evaluation Studio sections"
        className="flex flex-wrap items-center gap-2 border-b border-pp-border pb-3"
      >
        {[
          { id: 'lab' as const, label: 'Assessment Lab', icon: FlaskConical },
          { id: 'project' as const, label: 'Project & Code Evaluator', icon: Code2 },
          { id: 'history' as const, label: 'Attempt History & Compare', icon: History },
          { id: 'leaderboard' as const, label: 'Performance & Leaderboard', icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-pp-accent text-white'
                  : 'bg-pp-surface text-pp-text-muted hover:text-pp-text hover:bg-pp-elevated border border-pp-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'project' && (
        <ProjectCodeEvaluatorPanel
          profileId={twin.profile.id}
          skillsCatalog={skillsCatalog}
          defaultSkillId={selectedSkillId}
          onEvaluated={(report, nextTwin) => {
            setRefreshSignal((n) => n + 1);
            setModalReport(report);
            setModalOpen(true);
            onTwinUpdated?.(nextTwin);
          }}
        />
      )}

      {activeTab === 'history' && (
        <AttemptHistoryComparePanel
          profileId={twin.profile.id}
          refreshSignal={refreshSignal}
          initialCompareTargetId={compareTargetId}
          onInspectReport={(report) => {
            setModalReport(report);
            setModalOpen(true);
          }}
        />
      )}

      {activeTab === 'leaderboard' && (
        <EvaluationLeaderboardPanel
          profileId={twin.profile.id}
          refreshSignal={refreshSignal}
        />
      )}

      {activeTab === 'lab' && (
        <>
          {error && (
            <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

      {/* Mandatory Medical & Healthcare Safety Disclaimer */}
      {session?.safetyDisclaimer && (
        <div
          role="note"
          data-testid="medical-safety-disclaimer"
          className="bg-pp-amber-soft border border-pp-amber/40 text-pp-text rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed"
        >
          <ShieldAlert className="w-5 h-5 text-pp-amber shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-pp-amber">
              Healthcare Educational Boundary Notice
            </div>
            <p className="mt-0.5 text-pp-text">{session.safetyDisclaimer}</p>
          </div>
        </div>
      )}

      {/* Result Banner */}
      {result && (
        <div
          className={`rounded-xl border p-5 ${
            result.replanTriggered
              ? 'bg-pp-error-soft border-pp-error/40 text-pp-text'
              : 'bg-pp-success-soft border-pp-success/40 text-pp-text'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {result.replanTriggered ? (
                <AlertTriangle className="w-6 h-6 text-pp-error shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-pp-success shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-display text-base font-bold text-pp-text">
                  {result.replanTriggered
                    ? `Score ${result.combinedScore}% (< 50% threshold) — Orchestrator Triggered Dynamic Remediation Replan`
                    : `Assessment Verified — Combined Score ${result.combinedScore}%`}
                </div>
                <div className="mt-1 font-mono text-xs tabular-nums text-pp-text-muted">
                  Quiz: {result.quizScore}% · Applied Check: {result.practicalScore}% · Updated {result.skillName} Level: {result.updatedSkillLevel}/5 · Role Readiness: {result.analysis.overallReadiness}%
                </div>
                <div className="mt-1 text-xs text-pp-text">{result.practicalFeedback}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {result.evaluationReport && (
                <button
                  type="button"
                  onClick={() => {
                    setModalReport(result.evaluationReport!);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    Score Breakdown: {result.evaluationReport.overallScore}/100 ({result.evaluationReport.performanceClassification})
                  </span>
                </button>
              )}

              {result.replanTriggered && result.replanDiff && (
                <button
                  type="button"
                  onClick={onOpenReplanDiff}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-pp-error hover:opacity-90 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>
                    Inspect Replan Diff (+{result.replanDiff.added.length} added · {result.replanDiff.reordered.length} updated)
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Per-Test Case / Applied Evaluation Results */}
          {result.testResults.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {result.testResults.map((tc) => (
                <div
                  key={tc.testCaseId}
                  className="bg-pp-card border border-pp-border rounded-lg p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="text-pp-text">{tc.description}</span>
                    {tc.passed ? (
                      <span className="inline-flex items-center gap-1 text-pp-success shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-pp-error shrink-0">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-mono text-[11px] text-pp-text-muted space-y-0.5">
                    <div>Expected: {tc.expected}</div>
                    <div>Actual: {tc.error ? `Error: ${tc.error}` : tc.actual}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading || !session ? (
        <div className="bg-pp-card border border-pp-border rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
          <span>Generating domain assessment for {selectedSkillId}...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Conceptual Quiz */}
          <div className="lg:col-span-5 bg-pp-card border border-pp-border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Part 1: Conceptual Diagnostic (30% weight)
              </h2>
              <p className="text-xs text-pp-text-muted mt-0.5">
                {session.questions.length} diagnostic items for {session.skillName} ({session.domainName})
              </p>
            </div>

            <div className="space-y-5">
              {session.questions.map((q, qIdx) => (
                <fieldset key={q.id} className="space-y-2.5 pb-4 border-b border-pp-border/60 last:border-b-0 last:pb-0">
                  <legend className="text-sm font-medium text-pp-text leading-snug">
                    {qIdx + 1}. {q.prompt}
                  </legend>
                  <div className="space-y-1.5">
                    {q.options.map((opt, optIdx) => {
                      const selected = quizAnswers[qIdx] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'border-pp-accent bg-pp-accent-soft text-pp-text font-medium'
                              : 'border-pp-border bg-pp-surface/50 hover:bg-pp-elevated text-pp-text-muted hover:text-pp-text'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${q.id}`}
                            checked={selected}
                            onChange={() =>
                              setQuizAnswers((prev) =>
                                prev.map((v, idx) => (idx === qIdx ? optIdx : v))
                              )
                            }
                            className="mt-0.5 accent-pp-accent"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  {result && (
                    <div className="text-xs text-pp-text-muted bg-pp-surface border border-pp-border rounded-md p-2.5">
                      {q.explanation}
                    </div>
                  )}
                </fieldset>
              ))}
            </div>
          </div>

          {/* Right: Either IT Coding Sandbox OR Non-IT Domain Practical Task */}
          <div className="lg:col-span-7 bg-pp-card border border-pp-border rounded-xl p-6 flex flex-col justify-between space-y-4">
            {session.challenge ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-pp-accent" />
                      <span>Part 2: {session.challenge.title} (70% weight)</span>
                    </h2>
                    <div className="text-xs text-pp-text-muted mt-0.5">
                      Function: <span className="font-mono text-pp-text">{session.challenge.functionName}</span> · {session.challenge.testCases.length} automated test cases
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHint((v) => !v)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-pp-text-muted hover:text-pp-text bg-pp-surface border border-pp-border hover:bg-pp-elevated rounded-lg cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Hint</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCode(session.challenge?.starterCode ?? '')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-pp-text-muted hover:text-pp-text bg-pp-surface border border-pp-border hover:bg-pp-elevated rounded-lg cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-pp-text leading-relaxed bg-pp-surface border border-pp-border rounded-lg p-3.5">
                  {session.challenge.description}
                </p>

                {showHint && (
                  <div className="text-xs text-pp-text bg-pp-accent-soft border border-pp-accent/40 rounded-lg p-3">
                    <span className="font-semibold text-pp-accent">Hint:</span> {session.challenge.solutionHint}
                  </div>
                )}

                <div>
                  <label htmlFor="code-editor" className="sr-only">
                    Code submission editor
                  </label>
                  <textarea
                    id="code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={11}
                    spellCheck={false}
                    className="w-full rounded-lg border border-pp-border bg-pp-surface text-pp-text p-4 font-mono text-xs leading-relaxed focus:border-pp-accent focus:outline-none"
                  />
                </div>
              </div>
            ) : session.practicalTask ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-pp-accent" />
                      <span>Part 2: {session.practicalTask.title} (70% weight)</span>
                    </h2>
                    <div className="text-xs text-pp-text-muted mt-0.5 capitalize">
                      {session.domainName} · {session.practicalTask.assessmentType.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHint((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-pp-text-muted hover:text-pp-text bg-pp-surface border border-pp-border hover:bg-pp-elevated rounded-lg cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Methodology Note</span>
                  </button>
                </div>

                <div className="bg-pp-surface border border-pp-border rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-pp-text-muted">Scenario &amp; Given Data</div>
                  <p className="text-sm text-pp-text leading-relaxed">
                    {session.practicalTask.scenarioPrompt}
                  </p>
                </div>

                {showHint && (
                  <div className="text-xs text-pp-text bg-pp-accent-soft border border-pp-accent/40 rounded-lg p-3">
                    <span className="font-semibold text-pp-accent">Verification Guide:</span> {session.practicalTask.solutionExplanation}
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="text-sm font-semibold text-pp-text">
                    {session.practicalTask.questionPrompt}
                  </div>

                  {session.practicalTask.inputMode === 'numeric' ? (
                    <div className="flex items-center gap-3">
                      <label htmlFor="practical-numeric-input" className="sr-only">
                        Numeric calculated answer
                      </label>
                      <input
                        id="practical-numeric-input"
                        type="text"
                        value={practicalAnswer}
                        onChange={(e) => setPracticalAnswer(e.target.value)}
                        placeholder={`Enter numeric value${session.practicalTask.unitLabel ? ` (${session.practicalTask.unitLabel})` : ''}...`}
                        className="w-64 rounded-lg border border-pp-border bg-pp-surface px-3.5 py-2.5 font-mono text-sm text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                      />
                      {session.practicalTask.unitLabel && (
                        <span className="text-sm font-mono text-pp-text-muted">
                          {session.practicalTask.unitLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(session.practicalTask.options ?? []).map((opt, idx) => {
                        const selected = practicalAnswer === String(idx);
                        return (
                          <label
                            key={idx}
                            className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                              selected
                                ? 'border-pp-accent bg-pp-accent-soft text-pp-text font-medium'
                                : 'border-pp-border bg-pp-surface/50 hover:bg-pp-elevated text-pp-text-muted hover:text-pp-text'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`practical-${session.practicalTask?.id}`}
                              checked={selected}
                              onChange={() => setPracticalAnswer(String(idx))}
                              className="mt-0.5 accent-pp-accent"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-pp-border">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  className="px-3 py-1.5 text-xs font-medium text-pp-error bg-pp-error-soft border border-pp-error/40 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Prefill Failing Baseline (Test Replan)
                </button>
                <button
                  type="button"
                  onClick={handleLoadSolution}
                  className="px-3 py-1.5 text-xs font-medium text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:bg-pp-elevated transition-colors cursor-pointer"
                >
                  Load Reference Solution
                </button>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? 'Evaluating Submission...'
                    : session.challenge
                      ? 'Run Tests & Submit'
                      : 'Evaluate & Submit'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      <AttemptScoreModal
        report={modalReport}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        canComparePrevious={(twin.assessmentHistory?.length ?? 0) >= 2}
        onCompareWithPrevious={(attemptId) => {
          setCompareTargetId(attemptId);
          setActiveTab('history');
        }}
      />
    </div>
  );
};

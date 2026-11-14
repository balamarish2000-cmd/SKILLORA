import vm from 'node:vm';
import {
  CAREER_DOMAINS,
  SKILLS_CATALOG,
  domainAssessmentType,
  getChallengeForSkill,
  getPracticalTaskForSkill,
  getQuizForSkill,
} from '../../src/shared/seedData.ts';
import type {
  AssessmentStartResponse,
  CodingChallenge,
  DomainPracticalTask,
  QuizQuestion,
  TestCaseExecutionResult,
} from '../../src/shared/types.ts';
import { getActiveAIMode } from '../gemini.ts';

export function startSkillAssessment(skillId: string): AssessmentStartResponse {
  const skill = SKILLS_CATALOG.find((s) => s.id === skillId);
  const skillName = skill?.name ?? skillId;
  const domainId = skill?.domainId ?? 'information_technology';
  const domain = CAREER_DOMAINS.find((d) => d.id === domainId);
  const assessmentType = domainAssessmentType(domainId);

  const questions = getQuizForSkill(skillId);
  const challenge = getChallengeForSkill(skillId);
  const practicalTask = getPracticalTaskForSkill(skillId);

  return {
    assessmentId: `assess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    skillId,
    skillName,
    domainId,
    domainName: domain?.name ?? 'Information Technology',
    assessmentType,
    safetyDisclaimer: practicalTask?.safetyDisclaimer,
    questions,
    challenge,
    practicalTask,
    aiMode: getActiveAIMode(),
  };
}

export function evaluateProblemSubmission(params: {
  questions: QuizQuestion[];
  quizAnswers: number[];
  challenge: CodingChallenge | null;
  practicalTask?: DomainPracticalTask | null;
  submittedCode?: string;
  practicalAnswer?: string;
}): {
  quizScore: number;
  practicalScore: number;
  combinedScore: number;
  passed: boolean;
  testResults: TestCaseExecutionResult[];
  practicalFeedback: string;
  stdout: string[];
  executionMs: number;
} {
  const {
    questions,
    quizAnswers,
    challenge,
    practicalTask,
    submittedCode,
    practicalAnswer,
  } = params;

  // 1. Evaluate conceptual quiz questions
  let quizCorrect = 0;
  for (let i = 0; i < questions.length; i++) {
    if (quizAnswers[i] === questions[i].correctIndex) {
      quizCorrect += 1;
    }
  }
  const quizScore =
    questions.length > 0 ? Math.round((quizCorrect / questions.length) * 100) : 100;

  // 2. Evaluate either IT coding challenge OR domain practical calculation/scenario
  const tExecStart = performance.now();
  const stdout: string[] = [];
  const testResults: TestCaseExecutionResult[] = [];
  let practicalScore = 0;
  let practicalFeedback = '';

  if (challenge) {
    const code = (submittedCode ?? '').trim();
    if (!code) {
      for (const tc of challenge.testCases) {
        testResults.push({
          testCaseId: tc.id,
          description: tc.description,
          passed: false,
          expected: tc.expectedJson,
          actual: 'undefined',
          error: 'Empty code submission',
        });
      }
    } else {
      for (const tc of challenge.testCases) {
        try {
          const sandbox = {
            console: {
              log: (...args: unknown[]) => {
                stdout.push(
                  args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
                );
              },
            },
            __result: undefined as unknown,
          };

          const scriptSource = `
            "use strict";
            ${code}
            if (typeof ${challenge.functionName} !== 'function') {
              throw new Error("Function '${challenge.functionName}' is not defined.");
            }
            const __args = ${tc.inputJson};
            __result = ${challenge.functionName}.apply(null, __args);
          `;

          vm.runInNewContext(scriptSource, sandbox, { timeout: 500 });

          const actualJson = JSON.stringify(sandbox.__result);
          const passed = actualJson === tc.expectedJson;

          testResults.push({
            testCaseId: tc.id,
            description: tc.description,
            passed,
            expected: tc.expectedJson,
            actual: actualJson ?? 'undefined',
          });
        } catch (err) {
          testResults.push({
            testCaseId: tc.id,
            description: tc.description,
            passed: false,
            expected: tc.expectedJson,
            actual: 'RuntimeError',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    const passedTests = testResults.filter((r) => r.passed).length;
    practicalScore =
      testResults.length > 0 ? Math.round((passedTests / testResults.length) * 100) : 0;
    practicalFeedback = `${passedTests}/${testResults.length} automated code test cases passed.`;
  } else if (practicalTask) {
    const rawAns = String(practicalAnswer ?? submittedCode ?? '').trim();

    if (practicalTask.inputMode === 'numeric') {
      const numericVal = Number.parseFloat(rawAns.replace(/[^0-9.\-]/g, ''));
      const expected = practicalTask.expectedNumericValue ?? 0;
      const tolerance = practicalTask.numericTolerance ?? 0.1;
      const passed = Number.isFinite(numericVal) && Math.abs(numericVal - expected) <= tolerance;
      practicalScore = passed ? 100 : 0;
      practicalFeedback = passed
        ? `Quantitative answer ${numericVal} ${practicalTask.unitLabel ?? ''} is within engineering/domain tolerance (${expected} ± ${tolerance}). ${practicalTask.solutionExplanation}`
        : `Submitted value (${Number.isFinite(numericVal) ? numericVal : 'invalid'}) differed from expected ${expected} ${practicalTask.unitLabel ?? ''} (±${tolerance}). ${practicalTask.solutionExplanation}`;

      testResults.push({
        testCaseId: practicalTask.id,
        description: practicalTask.title,
        passed,
        expected: `${expected} ${practicalTask.unitLabel ?? ''}`.trim(),
        actual: Number.isFinite(numericVal)
          ? `${numericVal} ${practicalTask.unitLabel ?? ''}`.trim()
          : 'No valid numeric value submitted',
      });
    } else {
      const selectedIdx = Number.parseInt(rawAns, 10);
      const expectedIdx = practicalTask.correctOptionIndex ?? 0;
      const passed = selectedIdx === expectedIdx;
      practicalScore = passed ? 100 : 0;
      practicalFeedback = passed
        ? `Correct domain reasoning selected. ${practicalTask.solutionExplanation}`
        : `Selected option #${Number.isFinite(selectedIdx) ? selectedIdx + 1 : '?'} did not match standard protocol. ${practicalTask.solutionExplanation}`;

      testResults.push({
        testCaseId: practicalTask.id,
        description: practicalTask.title,
        passed,
        expected: practicalTask.options?.[expectedIdx] ?? `Option ${expectedIdx + 1}`,
        actual:
          Number.isFinite(selectedIdx) && practicalTask.options?.[selectedIdx]
            ? practicalTask.options[selectedIdx]
            : 'No option selected',
      });
    }
  } else {
    practicalScore = quizScore;
    practicalFeedback = 'Evaluated via conceptual diagnostic rubric.';
  }

  const executionMs = Math.max(1, Math.round(performance.now() - tExecStart));

  const combinedScore =
    questions.length > 0
      ? Math.round(practicalScore * 0.7 + quizScore * 0.3)
      : practicalScore;

  return {
    quizScore,
    practicalScore,
    combinedScore,
    passed: combinedScore >= 50,
    testResults,
    practicalFeedback,
    stdout: stdout.slice(0, 20),
    executionMs,
  };
}

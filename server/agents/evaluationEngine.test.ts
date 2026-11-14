import assert from 'node:assert/strict';
import test from 'node:test';

process.env.DATABASE_PATH = ':memory:';
process.env.GEMINI_API_KEY = '';

import { SAMPLE_RESUMES } from '../../src/shared/seedData.ts';
import {
  getEvaluationAttemptById,
  getEvaluationAttemptsByProfileId,
} from '../db.ts';
import {
  EVALUATION_CRITERIA,
  calculateWeightedOverallScore,
  classifyPerformance,
  compareEvaluationAttempts,
  computeWeightedContribution,
  runDeterministicEvaluationPipeline,
} from './evaluationEngine.ts';
import {
  createProfileWorkflow,
  evaluateProjectSubmissionWorkflow,
  getEvaluationHistoryWorkflow,
  getEvaluationLeaderboardWorkflow,
} from './orchestrator.ts';

test('6-Criteria Evaluation Weights sum to 100% and weighted overall score is mathematically exact', () => {
  const totalWeight = EVALUATION_CRITERIA.reduce((sum, c) => sum + c.weightPct, 0);
  assert.equal(totalWeight, 100);

  const sampleCategories = [
    { key: 'code_quality', score: 90, weightPct: 20 },
    { key: 'security', score: 80, weightPct: 20 },
    { key: 'efficiency', score: 70, weightPct: 15 },
    { key: 'testing', score: 60, weightPct: 15 },
    { key: 'accessibility', score: 100, weightPct: 10 },
    { key: 'problem_alignment', score: 85, weightPct: 20 },
  ];
  // Expected: 18 + 16 + 10.5 + 9 + 10 + 17 = 80.5
  const overall = calculateWeightedOverallScore(sampleCategories);
  assert.equal(overall, 80.5);
  assert.equal(computeWeightedContribution(70, 15), 10.5);
  assert.equal(classifyPerformance(90), 'Exemplary');
  assert.equal(classifyPerformance(75), 'Proficient');
  assert.equal(classifyPerformance(55), 'Developing');
  assert.equal(classifyPerformance(40), 'Needs Attention');
});

test('Static Security, Efficiency, and N/A Accessibility neutrality behave accurately without fake scores', () => {
  const flawedReport = runDeterministicEvaluationPipeline({
    attemptId: 'att_flawed',
    profileId: 'p_test',
    skillId: 'javascript',
    skillName: 'JavaScript',
    submissionType: 'project_code',
    submissionTitle: 'Flawed Search Handler',
    attemptNumber: 1,
    problemStatement: 'Filter users safely without XSS injection or nested O(n^2) loops.',
    submittedCode: `function renderUsers(users, ids) {
  var res = [];
  for (var i = 0; i < users.length; i++) {
    if (ids.includes(users[i].id)) {
      document.getElementById('out').innerHTML = users[i].name;
      res.push(eval(users[i].expr));
    }
  }
  return res;
}`,
    quizScore: 0,
    practicalScore: 0,
  });

  const secCat = flawedReport.categories.find((c) => c.key === 'security')!;
  const a11yCat = flawedReport.categories.find((c) => c.key === 'accessibility')!;
  const cqCat = flawedReport.categories.find((c) => c.key === 'code_quality')!;

  assert.ok(secCat.score < 50, `Expected security penalty for innerHTML + eval, got ${secCat.score}`);
  assert.ok(secCat.weaknesses.some((w) => w.includes('innerHTML') || w.includes('HTML injection')));
  assert.ok(cqCat.weaknesses.some((w) => w.includes('var')));
  assert.equal(a11yCat.applicable, false, 'Pure JS logic should mark WCAG DOM checks as N/A');
  assert.ok(a11yCat.score >= 70, 'N/A accessibility must not be penalized as failure');

  // Verify overallScore strictly equals the sum of weighted contributions
  const summed = flawedReport.categories.reduce((s, c) => s + c.weightedContribution, 0);
  assert.ok(Math.abs(flawedReport.overallScore - summed) <= 0.3);

  // Now check HTML/JSX accessibility detection
  const uiReport = runDeterministicEvaluationPipeline({
    attemptId: 'att_ui',
    profileId: 'p_test',
    skillId: 'react',
    skillName: 'React',
    submissionType: 'project_code',
    submissionTitle: 'Inaccessible Modal Form',
    attemptNumber: 2,
    problemStatement: 'Render a labeled form input and avatar image with accessible button controls.',
    submittedCode: `function UserCard({ onSave }) {
  return (
    <div>
      <img src="/avatar.png" />
      <input type="text" placeholder="Name" />
      <div onClick={onSave}>Save</div>
    </div>
  );
}`,
    quizScore: 0,
    practicalScore: 0,
  });

  const uiA11y = uiReport.categories.find((c) => c.key === 'accessibility')!;
  assert.equal(uiA11y.applicable, true);
  assert.ok(uiA11y.score < 50, `Expected low a11y score for missing alt, label, and div onClick, got ${uiA11y.score}`);
});

test('Separate SQLite relational tables persist evaluation attempts, comparisons, and leaderboard rankings', async () => {
  const sample = SAMPLE_RESUMES[0];
  const twin = await createProfileWorkflow({
    id: 'test_eval_relational',
    name: 'Kiran Nair',
    email: 'kiran.nair@example.com',
    currentTitle: 'Frontend Engineer',
    experienceYears: 2,
    targetRoleId: 'fullstack_developer',
    weeklyHours: 14,
    rawResumeText: sample.resumeText,
  });

  // Attempt 1: Vulnerable code
  const first = await evaluateProjectSubmissionWorkflow({
    profileId: twin.profile.id,
    skillId: 'javascript',
    title: 'Profile Filter v1',
    problemStatement: 'Filter skill items safely with Set lookup, input validation, and unit assertions.',
    submittedCode: `function filterSkills(items, ids) {
  var out = [];
  for (var i = 0; i < items.length; i++) {
    if (ids.includes(items[i].id)) {
      document.body.innerHTML = items[i].name;
      out.push(items[i].name);
    }
  }
  return out;
}`,
  });

  // Attempt 2: Hardened code with Set, guards, and assertions
  const second = await evaluateProjectSubmissionWorkflow({
    profileId: twin.profile.id,
    skillId: 'javascript',
    title: 'Profile Filter v2',
    problemStatement: 'Filter skill items safely with Set lookup, input validation, and unit assertions.',
    submittedCode: `function filterSkills(items, ids) {
  if (!Array.isArray(items) || !Array.isArray(ids)) return [];
  const allowed = new Set(ids);
  return items.filter((item) => item && allowed.has(item.id)).map((item) => item.name);
}`,
    testNotes: `assert.deepEqual(filterSkills([{ id: '1', name: 'JS' }], ['1']), ['JS']);
expect(filterSkills(null, [])).toEqual([]);
assert.equal(filterSkills([], ['1']).length, 0);`,
  });

  assert.equal(first.report.attemptNumber, 1);
  assert.equal(second.report.attemptNumber, 2);
  assert.ok(second.report.overallScore > first.report.overallScore);

  const storedAttempts = getEvaluationAttemptsByProfileId(twin.profile.id);
  assert.equal(storedAttempts.length, 2);

  const baseline = getEvaluationAttemptById(first.report.attemptId)!;
  const target = getEvaluationAttemptById(second.report.attemptId)!;
  assert.equal(baseline.categories.length, 6);
  assert.equal(target.categories.length, 6);

  const cmp = compareEvaluationAttempts(baseline, target);
  assert.ok(cmp.overallDelta > 0);
  assert.ok(cmp.improvedCategories.some((c) => c.key === 'security'));
  assert.ok(cmp.improvedCategories.some((c) => c.key === 'testing'));

  const history = getEvaluationHistoryWorkflow(twin.profile.id);
  assert.equal(history.totalAttempts, 2);
  assert.ok(history.improvementPct !== null && history.improvementPct > 0);
  assert.equal(history.bestAttempt?.id, second.report.attemptId);

  const leaderboard = getEvaluationLeaderboardWorkflow(twin.profile.id);
  const kiranEntry = leaderboard.entries.find((e) => e.profileId === twin.profile.id);
  assert.ok(kiranEntry !== undefined);
  assert.equal(kiranEntry.isCurrentUser, true);
  assert.equal(kiranEntry.attemptCount, 2);
  assert.equal(kiranEntry.bestScore, second.report.overallScore);
});

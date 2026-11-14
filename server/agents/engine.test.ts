import assert from 'node:assert/strict';
import test from 'node:test';

// Use isolated in-memory SQLite for unit tests
process.env.DATABASE_PATH = ':memory:';
process.env.GEMINI_API_KEY = '';

import {
  formatINR,
  formatINRLpa,
  formatINRMonthly,
  usdRangeToIndianLpaRange,
  validateSalaryExpectations,
} from '../../src/shared/currency.ts';
import { buildVerifiedSearchChannels } from '../../src/shared/opportunitiesCatalog.ts';
import {
  CAREER_DOMAINS,
  LEARNING_RESOURCES,
  MEDICAL_SAFETY_DISCLAIMER,
  SAMPLE_RESUMES,
  SKILLS_CATALOG,
  TARGET_ROLES,
  generateCohortLearners,
} from '../../src/shared/seedData.ts';
import { GeminiServiceError } from '../gemini.ts';
import { runCareerMatcher } from './careerMatcher.ts';
import {
  computeReplanDiff,
  runCuratorAgent,
  simulateCareerTransition,
} from './curatorAgent.ts';
import {
  applyTransitionWorkflow,
  changeGoalWorkflow,
  createProfileWorkflow,
  deleteApplicationWorkflow,
  getOpportunitiesOverviewWorkflow,
  loginUserWorkflow,
  mentorChatWorkflow,
  registerUserWorkflow,
  startAssessmentWorkflow,
  submitAssessmentWorkflow,
  updateProgressWorkflow,
  updateResumeProfileWorkflow,
  upsertApplicationWorkflow,
} from './orchestrator.ts';
import { deterministicParseResume } from './profileAgent.ts';
import { runSkillAnalyst } from './skillAnalyst.ts';

test('SKILLORA Universal Catalog integrity: 12 sectors, 86 skills, 75 roles, 258 verified resources, 48 cohort benchmarks', () => {
  assert.equal(CAREER_DOMAINS.length, 12);
  assert.ok(TARGET_ROLES.length >= 75, `Expected >=75 roles, got ${TARGET_ROLES.length}`);
  assert.ok(SKILLS_CATALOG.length >= 86, `Expected >=86 skills, got ${SKILLS_CATALOG.length}`);
  assert.ok(
    LEARNING_RESOURCES.length >= 258,
    `Expected >=258 resources, got ${LEARNING_RESOURCES.length}`
  );

  const skillIds = new Set(SKILLS_CATALOG.map((s) => s.id));
  for (const sk of SKILLS_CATALOG) {
    assert.ok(
      CAREER_DOMAINS.some((d) => d.id === sk.domainId),
      `Invalid domainId ${sk.domainId} on skill ${sk.id}`
    );
    for (const pre of sk.prerequisites) {
      assert.ok(skillIds.has(pre), `Broken prerequisite '${pre}' on skill '${sk.id}'`);
    }
    const resCount = LEARNING_RESOURCES.filter((r) => r.skillId === sk.id).length;
    assert.ok(resCount >= 3, `Expected >=3 resources for skill '${sk.id}', got ${resCount}`);
  }

  for (const role of TARGET_ROLES) {
    for (const req of role.requirements) {
      assert.ok(skillIds.has(req.skillId), `Broken skillId '${req.skillId}' in role '${role.id}'`);
    }
  }

  for (const res of LEARNING_RESOURCES) {
    assert.equal(res.verified, true);
    assert.ok(res.url.startsWith('https://'), `Expected https URL on ${res.id}: ${res.url}`);
  }

  const cohort = generateCohortLearners();
  assert.equal(cohort.length, 48);
  const coveredDomains = new Set(cohort.map((l) => l.domainId));
  assert.equal(coveredDomains.size, 12, 'Cohort must span all 12 career domains');
});

test('Gap scoring & Career Matcher computes accurate readiness and honest resume provenance', () => {
  const sample = SAMPLE_RESUMES[0]; // Maya Chen
  const parsed = deterministicParseResume(sample.resumeText);
  const now = new Date().toISOString();

  assert.ok(parsed.skills.every((s) => s.source === 'resume_extracted'));
  assert.ok(parsed.skills.every((s) => s.level <= 4.0));

  const profile = {
    id: 'test_gap_scoring',
    name: sample.name,
    email: sample.email,
    currentTitle: sample.currentTitle,
    currentDomainId: sample.domainId,
    experienceYears: sample.experienceYears,
    education: parsed.education,
    targetRoleId: 'fullstack_developer',
    learningPlan: 'balanced' as const,
    weeklyHours: 12,
    expectedAnnualSalaryInr: 1200000,
    minimumExpectedSalaryInr: 800000,
    rawResumeText: sample.resumeText,
    skills: parsed.skills,
    certifications: parsed.certifications,
    projects: parsed.projects,
    transitionHistory: [],
    aiMode: 'deterministic_fallback' as const,
    createdAt: now,
    updatedAt: now,
  };

  const analysis = runSkillAnalyst(profile);
  assert.ok(analysis.overallReadiness > 10 && analysis.overallReadiness < 70);
  const gapIds = new Set(analysis.gaps.map((g) => g.skillId));
  assert.ok(gapIds.has('javascript'), 'Expected javascript in gaps');
  assert.ok(gapIds.has('react'), 'Expected react in gaps');

  const matches = runCareerMatcher(profile);
  const daMatch = matches.find((m) => m.roleId === 'data_analyst')!;
  const fsMatch = matches.find((m) => m.roleId === 'fullstack_developer')!;
  assert.ok(daMatch.readinessPct > fsMatch.readinessPct);
});

test('Career Transition Simulator: Mechanical Design Engineer -> Robotics Engineer identifies transferable and missing skills', () => {
  const vikram = SAMPLE_RESUMES[1];
  const parsed = deterministicParseResume(vikram.resumeText);
  const now = new Date().toISOString();

  const profile = {
    id: 'test_vikram_transition',
    name: vikram.name,
    email: vikram.email,
    currentTitle: vikram.currentTitle,
    currentDomainId: vikram.domainId,
    currentRoleId: vikram.currentRoleId,
    experienceYears: vikram.experienceYears,
    education: parsed.education,
    targetRoleId: 'robotics_engineer',
    learningPlan: 'balanced' as const,
    weeklyHours: 14,
    expectedAnnualSalaryInr: 1200000,
    minimumExpectedSalaryInr: 800000,
    rawResumeText: vikram.resumeText,
    skills: parsed.skills,
    certifications: parsed.certifications,
    projects: parsed.projects,
    transitionHistory: [],
    aiMode: 'deterministic_fallback' as const,
    createdAt: now,
    updatedAt: now,
  };

  const sim = simulateCareerTransition(profile, 'mechanical_design_engineer', 'robotics_engineer');
  assert.ok(
    sim.transferableSkills.some((s) => s.skillId === 'engineering_mechanics'),
    'Expected Engineering Statics & Dynamics to transfer from Mechanical -> Robotics'
  );
  assert.ok(
    sim.missingSkills.some((s) => s.skillId === 'ros2_robotics'),
    'Expected ROS2 Middleware in missing skills for Robotics Engineer'
  );
  assert.ok(sim.estimatedHours > 0);
  assert.ok(sim.suggestedRoadmap.length >= 4);

  // Verify prerequisite ordering in robotics transition roadmap: circuit_analysis -> sensors_actuators -> ros2_robotics
  const idx = (id: string) => sim.suggestedRoadmap.findIndex((s) => s.skillId === id);
  assert.ok(idx('circuit_analysis') !== -1 && idx('sensors_actuators') !== -1 && idx('ros2_robotics') !== -1);
  assert.ok(idx('circuit_analysis') < idx('sensors_actuators'));
  assert.ok(idx('sensors_actuators') < idx('ros2_robotics'));
});

test('Learning Plan modes: Fast Track < Balanced <= Deep Mastery total workload', () => {
  const sample = SAMPLE_RESUMES[0];
  const parsed = deterministicParseResume(sample.resumeText);
  const now = new Date().toISOString();

  const baseProfile = {
    id: 'test_plans',
    name: sample.name,
    email: sample.email,
    currentTitle: sample.currentTitle,
    currentDomainId: sample.domainId,
    experienceYears: sample.experienceYears,
    education: parsed.education,
    targetRoleId: 'fullstack_developer',
    weeklyHours: 12,
    expectedAnnualSalaryInr: 1200000,
    minimumExpectedSalaryInr: 800000,
    rawResumeText: sample.resumeText,
    skills: parsed.skills,
    certifications: parsed.certifications,
    projects: parsed.projects,
    transitionHistory: [],
    aiMode: 'deterministic_fallback' as const,
    createdAt: now,
    updatedAt: now,
  };

  const analysis = runSkillAnalyst({ ...baseProfile, learningPlan: 'balanced' });
  const fast = runCuratorAgent({ ...baseProfile, learningPlan: 'fast_track' }, analysis);
  const balanced = runCuratorAgent({ ...baseProfile, learningPlan: 'balanced' }, analysis);
  const deep = runCuratorAgent({ ...baseProfile, learningPlan: 'deep_mastery' }, analysis);

  const sumHours = (arr: typeof fast.steps) => arr.reduce((a, b) => a + b.hours, 0);
  assert.ok(sumHours(fast.steps) < sumHours(balanced.steps));
  assert.ok(balanced.steps.length <= deep.steps.length);
  assert.ok(sumHours(balanced.steps) <= sumHours(deep.steps));
});

test('Medical & Healthcare educational assessment includes disclaimer and failure triggers remediation replan', async () => {
  const sofia = SAMPLE_RESUMES[2];
  const twin = await createProfileWorkflow({
    id: 'test_sofia_medical',
    name: sofia.name,
    email: sofia.email,
    currentTitle: sofia.currentTitle,
    currentDomainId: sofia.domainId,
    experienceYears: sofia.experienceYears,
    targetRoleId: 'registered_nurse',
    weeklyHours: 15,
    rawResumeText: sofia.resumeText,
  });

  const medAssess = startAssessmentWorkflow(twin.profile.id, 'pharmacology');
  assert.equal(medAssess.domainId, 'medical_healthcare');
  assert.equal(medAssess.assessmentType, 'medical_case');
  assert.equal(medAssess.safetyDisclaimer, MEDICAL_SAFETY_DISCLAIMER);
  assert.ok(medAssess.practicalTask !== null);

  // Submit wrong numeric value & wrong quiz answers (< 50%)
  const failedMed = submitAssessmentWorkflow({
    profileId: twin.profile.id,
    assessmentId: medAssess.assessmentId,
    quizAnswers: [0, 0],
    practicalAnswer: '999',
  });
  assert.equal(failedMed.passed, false);
  assert.equal(failedMed.replanTriggered, true);
  assert.ok(failedMed.replanDiff !== null && failedMed.replanDiff.added.length >= 1);

  // Now test passing a Mechanical calculation assessment -> sets source to assessment_verified
  const mechAssess = startAssessmentWorkflow(twin.profile.id, 'engineering_mechanics');
  assert.equal(mechAssess.assessmentType, 'engineering_calc');
  const passedMech = submitAssessmentWorkflow({
    profileId: twin.profile.id,
    assessmentId: mechAssess.assessmentId,
    quizAnswers: [1, 1],
    practicalAnswer: '1000',
  });
  assert.equal(passedMech.passed, true);
  assert.equal(passedMech.combinedScore, 100);
});

test('IT Coding Challenge workflow + Transition Apply records transition history and diffs', async () => {
  const sample = SAMPLE_RESUMES[0];
  const twin = await createProfileWorkflow({
    id: 'test_fullstack_scenario',
    name: sample.name,
    email: sample.email,
    currentTitle: sample.currentTitle,
    experienceYears: sample.experienceYears,
    targetRoleId: 'fullstack_developer',
    weeklyHours: 12,
    rawResumeText: sample.resumeText,
  });

  const assessment = startAssessmentWorkflow(twin.profile.id, 'javascript');
  assert.ok(assessment.challenge !== null && assessment.challenge.testCases.length >= 2);

  const submission = submitAssessmentWorkflow({
    profileId: twin.profile.id,
    assessmentId: assessment.assessmentId,
    quizAnswers: [0, 2],
    submittedCode: `function findReadySkills(skills, completedIds) { return ['wrong']; }`,
  });

  assert.equal(submission.passed, false);
  assert.equal(submission.replanTriggered, true);

  const switchedTwin = changeGoalWorkflow(twin.profile.id, 'data_scientist', 15);
  assert.equal(switchedTwin.profile.targetRoleId, 'data_scientist');
  assert.equal(switchedTwin.latestDiff!.trigger, 'goal_change');
  assert.ok(switchedTwin.profile.transitionHistory.length >= 1);

  const applied = applyTransitionWorkflow(twin.profile.id, 'data_scientist', 'ai_engineer');
  assert.equal(applied.profile.targetRoleId, 'ai_engineer');
  assert.equal(applied.profile.currentRoleId, 'data_scientist');
});

test('Replan Diff Engine accurately captures added, removed, and reordered steps', () => {
  const prev = [
    {
      id: 'step_a',
      order: 1,
      skillId: 'git',
      skillName: 'Git',
      domainId: 'information_technology' as const,
      category: 'Foundations',
      learningObjective: 'obj',
      currentLevel: 1,
      targetLevel: 3,
      resourceId: 'res_001',
      resourceTitle: 'Pro Git',
      provider: 'Git',
      url: 'https://git-scm.com',
      verified: true,
      resourceType: 'textbook' as const,
      difficulty: 'Beginner' as const,
      hours: 6,
      practicalAssignment: 'prac',
      assessmentCheckpoint: 'chk',
      completed: false,
      completedAt: null,
      isRemediation: false,
      reason: 'init',
      prerequisites: [],
      gapSeverity: 2,
    },
    {
      id: 'step_b',
      order: 2,
      skillId: 'react',
      skillName: 'React',
      domainId: 'information_technology' as const,
      category: 'Frontend',
      learningObjective: 'obj',
      currentLevel: 0,
      targetLevel: 4,
      resourceId: 'res_020',
      resourceTitle: 'React Docs',
      provider: 'React',
      url: 'https://react.dev',
      verified: true,
      resourceType: 'documentation' as const,
      difficulty: 'Beginner' as const,
      hours: 12,
      practicalAssignment: 'prac',
      assessmentCheckpoint: 'chk',
      completed: false,
      completedAt: null,
      isRemediation: false,
      reason: 'init',
      prerequisites: ['javascript'],
      gapSeverity: 3,
    },
  ];

  const next = [
    { ...prev[1], order: 1 },
    {
      ...prev[0],
      id: 'step_c',
      order: 2,
      skillId: 'javascript',
      skillName: 'JavaScript',
      resourceId: 'res_010',
      resourceTitle: 'JS Info',
    },
  ];

  const diff = computeReplanDiff('p1', prev, next, { trigger: 'manual_replan' });
  assert.equal(diff.added.length, 1);
  assert.equal(diff.removed.length, 1);
  assert.equal(diff.reordered.length, 1);
  assert.ok(diff.previousPlanSummary.length === 2);
  assert.ok(diff.newPlanSummary.length === 2);
});

test('Indian Currency (₹) formatting (Intl, Lakhs, Crores), conversion, and salary validation', () => {
  assert.equal(formatINR(1200000), '₹12,00,000');
  assert.equal(formatINRLpa(1250000), '₹12.5 LPA');
  assert.equal(formatINRLpa(12500000), '₹1.25 Cr');
  assert.equal(formatINRMonthly(45000), '₹45,000/month');
  assert.match(usdRangeToIndianLpaRange('$115k – $165k'), /^₹\d+(\.\d+)?\s–\s₹\d+(\.\d+)?\sLPA$/);

  for (const role of TARGET_ROLES) {
    assert.ok(role.avgSalaryRange.includes('₹'), `Expected ₹ on role ${role.id}: ${role.avgSalaryRange}`);
    assert.ok(!role.avgSalaryRange.includes('$'), `Unexpected $ on role ${role.id}: ${role.avgSalaryRange}`);
  }

  assert.equal(validateSalaryExpectations(1500000, 1000000).valid, true);
  assert.equal(validateSalaryExpectations(800000, 1000000).valid, false);
  assert.equal(validateSalaryExpectations(-100, 0).valid, false);
});

test('Verified Search Portals, Resume Studio sync, 3-state roadmap status, and SQLite Application Tracker', async () => {
  const sample = SAMPLE_RESUMES[0];
  const twin = await createProfileWorkflow({
    id: 'test_opportunities_suite',
    name: sample.name,
    email: sample.email,
    currentTitle: sample.currentTitle,
    specialization: 'Analytics & SQL',
    preferredLocation: 'Bengaluru',
    experienceYears: sample.experienceYears,
    targetRoleId: 'data_analyst',
    weeklyHours: 12,
    expectedAnnualSalaryInr: 1200000,
    minimumExpectedSalaryInr: 800000,
    rawResumeText: sample.resumeText,
  });

  assert.equal(twin.profile.preferredLocation, 'Bengaluru');
  assert.equal(twin.profile.specialization, 'Analytics & SQL');

  // Test 3-state roadmap step status transitions: not_started -> in_progress -> completed
  const firstStep = twin.roadmap[0];
  assert.ok(firstStep);
  const startedTwin = updateProgressWorkflow(twin.profile.id, firstStep.id, 'in_progress');
  assert.equal(startedTwin.roadmap[0].status, 'in_progress');
  assert.equal(startedTwin.roadmap[0].completed, false);
  assert.equal(startedTwin.progress.inProgressSteps, 1);

  const completedTwin = updateProgressWorkflow(twin.profile.id, firstStep.id, 'completed');
  assert.equal(completedTwin.roadmap[0].status, 'completed');
  assert.equal(completedTwin.roadmap[0].completed, true);

  const synced = updateResumeProfileWorkflow({
    profileId: twin.profile.id,
    currentTitle: 'Senior Analytics Engineer',
    certifications: [...twin.profile.certifications, 'AWS Cloud Practitioner'],
  });
  assert.equal(synced.profile.currentTitle, 'Senior Analytics Engineer');
  assert.ok(synced.profile.certifications.includes('AWS Cloud Practitioner'));

  const updatedSalaryTwin = changeGoalWorkflow(
    twin.profile.id,
    'data_analyst',
    14,
    undefined,
    'fast_track',
    1600000,
    1100000,
    'Hyderabad'
  );
  assert.equal(updatedSalaryTwin.profile.preferredLocation, 'Hyderabad');

  const channelBundle = buildVerifiedSearchChannels(updatedSalaryTwin.profile);
  assert.ok(channelBundle.channels.length >= 6);
  assert.ok(channelBundle.channels.every((c) => c.url.startsWith('https://')));

  const overview0 = getOpportunitiesOverviewWorkflow(twin.profile.id);
  assert.equal(overview0.applications.length, 0);
  assert.equal(overview0.liveFeedConnected, false);

  const { application, overview: overview1 } = upsertApplicationWorkflow({
    profileId: twin.profile.id,
    opportunityId: 'ext_test_1',
    opportunityType: 'job',
    title: 'Data Analyst',
    company: 'Real External Employer',
    domainId: 'information_technology',
    compensationLabel: '₹12 LPA',
    currency: 'INR',
    sourceUrl: 'https://www.linkedin.com/jobs/',
    status: 'Applied',
    notes: 'Tailored resume attached',
  });
  assert.equal(application.status, 'Applied');
  assert.equal(overview1.applications.length, 1);

  const { overview: overview2 } = upsertApplicationWorkflow({
    profileId: twin.profile.id,
    opportunityId: 'ext_test_1',
    opportunityType: 'job',
    title: 'Data Analyst',
    company: 'Real External Employer',
    domainId: 'information_technology',
    compensationLabel: '₹12 LPA',
    currency: 'INR',
    sourceUrl: 'https://www.linkedin.com/jobs/',
    status: 'Interviewing',
  });
  assert.equal(overview2.applications[0].status, 'Interviewing');

  const overview3 = deleteApplicationWorkflow(twin.profile.id, application.id);
  assert.equal(overview3.applications.length, 0);
});

test('Auth register/login starts new users honestly at 0% progress, and Mentor fails honestly without GEMINI_API_KEY', async () => {
  const reg = await registerUserWorkflow({
    name: 'Aarav Patel',
    email: 'aarav.patel@example.com',
    password: 'password123',
    targetRoleId: 'backend_engineer',
    currentDomainId: 'information_technology',
    specialization: 'API Systems',
    preferredLocation: 'Pune',
  });

  assert.equal(reg.user.email, 'aarav.patel@example.com');
  assert.equal(reg.twin.profile.skills.length, 0);
  assert.equal(reg.twin.progress.completionPct, 0);
  assert.equal(reg.twin.progress.completedSteps, 0);
  assert.equal(reg.twin.assessmentHistory.length, 0);
  assert.equal(reg.twin.mentorHistory.length, 0);

  const loggedIn = loginUserWorkflow({
    email: 'aarav.patel@example.com',
    password: 'password123',
  });
  assert.equal(loggedIn.user.id, reg.user.id);

  assert.throws(
    () => loginUserWorkflow({ email: 'aarav.patel@example.com', password: 'wrongpassword' }),
    /Invalid email or password/
  );

  // Without GEMINI_API_KEY, mentorChatWorkflow must throw GeminiServiceError (503) and never invent fake replies
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await assert.rejects(
      () => mentorChatWorkflow(reg.twin.profile.id, 'What should I study first?'),
      (err: unknown) => err instanceof GeminiServiceError && err.status === 503
    );
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

import crypto from 'node:crypto';
import { buildVerifiedSearchChannels } from '../../src/shared/opportunitiesCatalog.ts';
import { CAREER_DOMAINS, SAMPLE_RESUMES, SKILLS_CATALOG, TARGET_ROLES } from '../../src/shared/seedData.ts';
import type {
  AIMode,
  AgentTraceEvent,
  ApplicationStatus,
  AssessmentStartResponse,
  AssessmentSubmitResponse,
  AuthUser,
  CareerDomainId,
  CareerTransitionRecord,
  CareerTransitionSimulation,
  EducationEntry,
  EvaluationCategoryKey,
  EvaluationHistoryResponse,
  EvaluationLeaderboardResponse,
  EvaluationReport,
  JobApplication,
  LeaderboardEntry,
  LearnerProfile,
  LearningPlanMode,
  MentorMessage,
  OpportunitiesOverview,
  OpportunityType,
  ParsedSkill,
  ProjectEntry,
  ReplanDiff,
  RoadmapStepStatus,
  RoleId,
  TwinSnapshot,
} from '../../src/shared/types.ts';
import {
  createUserRecord,
  deleteApplicationById,
  getAllEvaluationAttempts,
  getApplicationsByProfileId,
  getAssessmentHistoryByProfileId,
  getAssessmentRecord,
  getEvaluationAttemptsByProfileId,
  getMentorMessages,
  getNextAttemptNumber,
  getProfileById,
  getReplanDiffs,
  getRoadmapByProfileId,
  getTracesByProfileId,
  getUserByEmail,
  insertTraceEvent,
  listProfiles,
  saveAssessmentRecord,
  saveEvaluationReport,
  saveMentorMessage,
  saveProfile,
  saveReplanDiff,
  saveRoadmap,
  updateAssessmentResult,
  upsertApplication,
} from '../db.ts';
import { getActiveAIMode } from '../gemini.ts';
import { evaluateProblemSubmission, startSkillAssessment } from './assessorAgent.ts';
import { runCareerMatcher } from './careerMatcher.ts';
import { runCuratorAgent, simulateCareerTransition } from './curatorAgent.ts';
import {
  EVALUATION_CRITERIA,
  runDeterministicEvaluationPipeline,
  runFullEvaluationPipeline,
} from './evaluationEngine.ts';
import { type MentorToolbox, runMentorAgent } from './mentorAgent.ts';
import { deterministicParseResume, runProfileAgent } from './profileAgent.ts';
import { runProgressTracker } from './progressTracker.ts';
import { runSkillAnalyst } from './skillAnalyst.ts';

function logTrace(
  profileId: string,
  correlationId: string,
  agentName: AgentTraceEvent['agentName'],
  action: string,
  inputSummary: string,
  outputSummary: string,
  durationMs: number,
  aiMode: AIMode,
  status: AgentTraceEvent['status'] = 'ok'
): void {
  insertTraceEvent({
    id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    profileId,
    correlationId,
    agentName,
    action,
    inputSummary,
    outputSummary,
    durationMs: Math.max(1, Math.round(durationMs)),
    aiMode,
    status,
    createdAt: new Date().toISOString(),
  });
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function buildTwinSnapshot(profileId: string): TwinSnapshot | null {
  const profile = getProfileById(profileId);
  if (!profile) return null;

  const analysis = runSkillAnalyst(profile);
  const matches = runCareerMatcher(profile);
  const roadmap = getRoadmapByProfileId(profileId);
  const progress = runProgressTracker(profile, roadmap);
  const assessmentHistory = getAssessmentHistoryByProfileId(profileId);
  const diffHistory = getReplanDiffs(profileId);
  const traces = getTracesByProfileId(profileId);
  const mentorHistory = getMentorMessages(profileId);

  return {
    profile,
    analysis,
    matches,
    roadmap,
    progress,
    assessmentHistory,
    latestDiff: diffHistory[0] ?? null,
    diffHistory,
    traces,
    mentorHistory,
    aiMode: getActiveAIMode(),
  };
}

function seedBaselineEvaluationForProfile(
  profileId: string,
  skillId: string,
  quizAnswers: number[],
  codeOrPractical: { submittedCode?: string; practicalAnswer?: string },
  timestamp: string
): void {
  const startPayload = startSkillAssessment(skillId);
  saveAssessmentRecord(startPayload.assessmentId, profileId, skillId, startPayload);
  const evalRes = evaluateProblemSubmission({
    questions: startPayload.questions,
    quizAnswers,
    challenge: startPayload.challenge,
    practicalTask: startPayload.practicalTask,
    submittedCode: codeOrPractical.submittedCode,
    practicalAnswer: codeOrPractical.practicalAnswer,
  });
  const attemptNumber = getNextAttemptNumber(profileId);
  const submissionTitle =
    startPayload.challenge?.title ?? startPayload.practicalTask?.title ?? `${startPayload.skillName} Assessment`;
  const problemStatement =
    startPayload.challenge?.description ??
    startPayload.practicalTask?.scenarioPrompt ??
    `Demonstrate applied competency in ${startPayload.skillName}.`;

  const report = runDeterministicEvaluationPipeline({
    attemptId: startPayload.assessmentId,
    profileId,
    skillId: startPayload.skillId,
    skillName: startPayload.skillName,
    submissionType: 'assessment',
    submissionTitle,
    attemptNumber,
    timestamp,
    problemStatement,
    submittedCode: codeOrPractical.submittedCode,
    practicalAnswer: codeOrPractical.practicalAnswer,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    questions: startPayload.questions,
    quizAnswers,
    challenge: startPayload.challenge,
    practicalTask: startPayload.practicalTask,
    testResults: evalRes.testResults,
    executionMs: evalRes.executionMs,
  });

  saveEvaluationReport({
    report,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    combinedScore: evalRes.combinedScore,
    passed: evalRes.passed,
    replanTriggered: evalRes.combinedScore < 50,
    updatedSkillLevel: evalRes.combinedScore >= 80 ? 4 : evalRes.combinedScore >= 50 ? 3 : 1,
  });

  updateAssessmentResult(startPayload.assessmentId, {
    assessmentId: startPayload.assessmentId,
    profileId,
    skillId: startPayload.skillId,
    skillName: startPayload.skillName,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    combinedScore: evalRes.combinedScore,
    passed: evalRes.passed,
    testResults: evalRes.testResults,
    practicalFeedback: evalRes.practicalFeedback,
    stdout: evalRes.stdout,
    updatedSkillLevel: evalRes.combinedScore >= 80 ? 4 : evalRes.combinedScore >= 50 ? 3 : 1,
    replanTriggered: evalRes.combinedScore < 50,
    replanDiff: null,
    evaluationReport: report,
  });
}

function ensureDemoBaselineEvaluations(): void {
  if (getEvaluationAttemptsByProfileId('twin_demo_maya').length === 0) {
    const t1 = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString();
    const t2 = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString();

    // Attempt 1: Baseline javascript submission with nested lookup & missing edge guard
    seedBaselineEvaluationForProfile(
      'twin_demo_maya',
      'javascript',
      [1, 0],
      {
        submittedCode: `function findReadySkills(skills, completedIds) {
  var out = [];
  for (var i = 0; i < skills.length; i++) {
    var s = skills[i];
    if (!completedIds.includes(s.id)) {
      out.push(s.id);
    }
  }
  return out;
}`,
      },
      t1
    );

    // Attempt 2: Improved submission using Set + input guard + all test cases passing
    const jsAssess = startSkillAssessment('javascript');
    const correctQuiz = jsAssess.questions.map((q) => q.correctIndex);
    seedBaselineEvaluationForProfile(
      'twin_demo_maya',
      'javascript',
      correctQuiz,
      {
        submittedCode: `function findReadySkills(skills, completedIds) {
  if (!Array.isArray(skills) || !Array.isArray(completedIds)) return [];
  const done = new Set(completedIds);
  return skills
    .filter((s) => !done.has(s.id) && s.prerequisites.every((p) => done.has(p)))
    .map((s) => s.id)
    .sort();
}`,
      },
      t2
    );
  }

  // Seed 2 realistic peer profiles & genuinely computed baseline evaluations if leaderboard has < 2 learners
  const peers = [
    {
      id: 'twin_peer_vikram',
      sample: SAMPLE_RESUMES[1],
      skillId: 'engineering_mechanics',
      practicalAnswer: '1000',
      hoursAgo: 30,
    },
    {
      id: 'twin_peer_sofia',
      sample: SAMPLE_RESUMES[2],
      skillId: 'pharmacology',
      practicalAnswer: '25',
      hoursAgo: 20,
    },
  ];

  for (const peer of peers) {
    if (!peer.sample) continue;
    if (!getProfileById(peer.id)) {
      const parsed = deterministicParseResume(peer.sample.resumeText);
      const now = new Date().toISOString();
      saveProfile({
        id: peer.id,
        name: peer.sample.name,
        email: peer.sample.email,
        currentTitle: peer.sample.currentTitle,
        currentDomainId: peer.sample.domainId,
        currentRoleId: peer.sample.currentRoleId,
        specialization: 'Applied Practice',
        preferredLocation: 'Bengaluru, India',
        careerInterests: [],
        experienceYears: peer.sample.experienceYears,
        education: parsed.education,
        targetRoleId: peer.sample.defaultTargetRole,
        learningPlan: 'balanced',
        weeklyHours: peer.sample.weeklyHours,
        expectedAnnualSalaryInr: 1400000,
        minimumExpectedSalaryInr: 900000,
        rawResumeText: peer.sample.resumeText,
        skills: parsed.skills,
        certifications: parsed.certifications,
        projects: parsed.projects,
        transitionHistory: [],
        aiMode: getActiveAIMode(),
        createdAt: now,
        updatedAt: now,
      });
    }
    if (getEvaluationAttemptsByProfileId(peer.id).length === 0) {
      const start = startSkillAssessment(peer.skillId);
      const answers = start.questions.map((q) => q.correctIndex);
      seedBaselineEvaluationForProfile(
        peer.id,
        peer.skillId,
        answers,
        { practicalAnswer: peer.practicalAnswer },
        new Date(Date.now() - 1000 * 60 * 60 * peer.hoursAgo).toISOString()
      );
    }
  }
}

export function ensureSeededDemoTwin(): TwinSnapshot {
  const existing = getProfileById('twin_demo_maya');
  if (existing) {
    ensureDemoBaselineEvaluations();
    return buildTwinSnapshot('twin_demo_maya')!;
  }

  const all = listProfiles();
  if (all.length > 0) {
    return buildTwinSnapshot(all[0].id)!;
  }

  const sample = SAMPLE_RESUMES[0];
  const parsed = deterministicParseResume(sample.resumeText);
  const now = new Date().toISOString();

  const profile: LearnerProfile = {
    id: 'twin_demo_maya',
    name: sample.name,
    email: sample.email,
    currentTitle: sample.currentTitle,
    currentDomainId: sample.domainId,
    currentRoleId: sample.currentRoleId,
    specialization: 'Analytics & Telemetry Systems',
    preferredLocation: 'Bengaluru, India',
    careerInterests: ['Full Stack Development', 'Data Engineering'],
    experienceYears: sample.experienceYears,
    education:
      parsed.education.length > 0
        ? parsed.education
        : [
            {
              degree: sample.educationDegree,
              field: sample.educationField,
              institution: sample.educationInstitution,
            },
          ],
    targetRoleId: sample.defaultTargetRole,
    learningPlan: 'balanced',
    weeklyHours: sample.weeklyHours,
    expectedAnnualSalaryInr: 1200000,
    minimumExpectedSalaryInr: 800000,
    rawResumeText: sample.resumeText,
    skills: parsed.skills,
    certifications: parsed.certifications,
    projects: parsed.projects,
    transitionHistory: [],
    aiMode: getActiveAIMode(),
    createdAt: now,
    updatedAt: now,
  };

  const corr = `corr_seed_${Date.now()}`;
  saveProfile(profile);

  const t0 = performance.now();
  const analysis = runSkillAnalyst(profile);
  logTrace(
    profile.id,
    corr,
    'Skill Analyst',
    'compute_initial_gaps',
    `${profile.skills.length} skills vs ${analysis.targetRoleTitle}`,
    `Readiness ${analysis.overallReadiness}%, ${analysis.gaps.length} skill gaps detected`,
    performance.now() - t0,
    profile.aiMode
  );

  const t1 = performance.now();
  const matches = runCareerMatcher(profile);
  logTrace(
    profile.id,
    corr,
    'Career Matcher',
    'rank_universal_roles',
    `Evaluating ${TARGET_ROLES.length} roles across 12 domains`,
    `Top match: ${matches[0].roleTitle} (${matches[0].readinessPct}%)`,
    performance.now() - t1,
    profile.aiMode
  );

  const t2 = performance.now();
  const { steps, diff } = runCuratorAgent(profile, analysis, {
    trigger: 'initial_build',
    triggerDetail: `Initial roadmap compiled for ${analysis.targetRoleTitle}`,
    newGoalRole: analysis.targetRoleTitle,
  });
  saveRoadmap(profile.id, steps);
  saveReplanDiff(diff);
  logTrace(
    profile.id,
    corr,
    'Curator',
    'build_prerequisite_roadmap',
    `${analysis.gaps.length} gaps -> DAG sort`,
    `${steps.length} steps (${steps.reduce((a, b) => a + b.hours, 0)}h)`,
    performance.now() - t2,
    profile.aiMode
  );

  const t3 = performance.now();
  const progress = runProgressTracker(profile, steps);
  logTrace(
    profile.id,
    corr,
    'Progress Tracker',
    'forecast_readiness_date',
    `${progress.remainingHours}h @ ${progress.weeklyHours}h/wk`,
    `Job-ready forecast: ${progress.forecastedReadyDate}`,
    performance.now() - t3,
    profile.aiMode
  );

  ensureDemoBaselineEvaluations();

  return buildTwinSnapshot(profile.id)!;
}

export async function registerUserWorkflow(input: {
  name: string;
  email: string;
  password: string;
  targetRoleId?: RoleId;
  currentDomainId?: CareerDomainId;
  specialization?: string;
  preferredLocation?: string;
}): Promise<{ user: AuthUser; twin: TwinSnapshot }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !email || input.password.length < 6) {
    throw new Error('Name, valid email, and password (min 6 characters) are required.');
  }
  if (getUserByEmail(email)) {
    throw new Error('An account with this email already exists. Please sign in.');
  }

  const targetRole =
    TARGET_ROLES.find((r) => r.id === input.targetRoleId) ?? TARGET_ROLES[0];

  const twin = await createProfileWorkflow({
    name,
    email,
    currentTitle: input.specialization?.trim() || 'Learner',
    currentDomainId: input.currentDomainId ?? targetRole.domainId,
    specialization: input.specialization?.trim() || '',
    preferredLocation: input.preferredLocation?.trim() || 'India',
    experienceYears: 0,
    targetRoleId: targetRole.id,
    weeklyHours: 10,
    rawResumeText: '',
    skills: [],
  });

  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const passwordHash = hashPassword(input.password);
  createUserRecord({
    id: userId,
    name,
    email,
    passwordHash,
    profileId: twin.profile.id,
    createdAt: new Date().toISOString(),
  });

  return {
    user: { id: userId, name, email, profileId: twin.profile.id },
    twin,
  };
}

export function loginUserWorkflow(input: {
  email: string;
  password: string;
}): { user: AuthUser; twin: TwinSnapshot } {
  const email = input.email.trim().toLowerCase();
  const stored = getUserByEmail(email);
  if (!stored || !verifyPassword(input.password, stored.passwordHash)) {
    throw new Error('Invalid email or password.');
  }
  const twin = buildTwinSnapshot(stored.profileId);
  if (!twin) {
    throw new Error('Associated learner profile not found.');
  }
  return {
    user: {
      id: stored.id,
      name: stored.name,
      email: stored.email,
      profileId: stored.profileId,
    },
    twin,
  };
}

export async function createProfileWorkflow(input: {
  id?: string;
  name: string;
  email?: string;
  currentTitle?: string;
  currentDomainId?: CareerDomainId;
  currentRoleId?: RoleId;
  specialization?: string;
  preferredLocation?: string;
  careerInterests?: string[];
  experienceYears?: number;
  education?: EducationEntry[];
  targetRoleId: RoleId;
  learningPlan?: LearningPlanMode;
  weeklyHours?: number;
  expectedAnnualSalaryInr?: number;
  minimumExpectedSalaryInr?: number;
  rawResumeText?: string;
  skills?: ParsedSkill[];
  certifications?: string[];
  projects?: ProjectEntry[];
}): Promise<TwinSnapshot> {
  const corr = `corr_create_${Date.now()}`;
  const profileId = input.id || `twin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const existing = getProfileById(profileId);
  const now = new Date().toISOString();

  let parsedSkills = input.skills;
  let parsedCerts = input.certifications ?? [];
  let parsedProjects = input.projects ?? [];
  let parsedEducation = input.education ?? [];
  let inferredDomain: CareerDomainId = input.currentDomainId ?? 'information_technology';
  let aiMode: AIMode = getActiveAIMode();

  if ((!parsedSkills || parsedSkills.length === 0) && input.rawResumeText?.trim()) {
    const tParse = performance.now();
    const parsed = await runProfileAgent(input.rawResumeText);
    parsedSkills = parsed.skills;
    parsedCerts = parsedCerts.length > 0 ? parsedCerts : parsed.certifications;
    parsedProjects = parsedProjects.length > 0 ? parsedProjects : parsed.projects;
    parsedEducation = parsedEducation.length > 0 ? parsedEducation : parsed.education;
    if (!input.currentDomainId) {
      inferredDomain = parsed.currentDomainId;
    }
    aiMode = parsed.aiMode;
    logTrace(
      profileId,
      corr,
      'Profile Agent',
      'parse_resume_to_skills',
      `${input.rawResumeText.length} chars raw resume`,
      `Extracted ${parsedSkills.length} skills, ${parsedCerts.length} certs, ${parsedProjects.length} projects`,
      performance.now() - tParse,
      aiMode,
      aiMode === 'gemini' ? 'ok' : 'fallback'
    );
  }

  const targetRole = TARGET_ROLES.find((r) => r.id === input.targetRoleId) ?? TARGET_ROLES[0];

  const profile: LearnerProfile = {
    id: profileId,
    name: input.name.trim() || 'Learner',
    email: (input.email || 'learner@skillora.demo').trim(),
    currentTitle: (input.currentTitle || 'Practitioner').trim(),
    currentDomainId: input.currentDomainId ?? inferredDomain ?? targetRole.domainId,
    currentRoleId: input.currentRoleId,
    specialization: input.specialization?.trim() ?? existing?.specialization ?? '',
    preferredLocation: input.preferredLocation?.trim() || existing?.preferredLocation || 'India',
    careerInterests: input.careerInterests ?? existing?.careerInterests ?? [],
    experienceYears: Number(input.experienceYears ?? 0),
    education: parsedEducation,
    targetRoleId: targetRole.id,
    learningPlan: input.learningPlan ?? 'balanced',
    weeklyHours: Math.min(40, Math.max(4, Number(input.weeklyHours ?? 12))),
    expectedAnnualSalaryInr: Number(input.expectedAnnualSalaryInr ?? existing?.expectedAnnualSalaryInr ?? 1200000),
    minimumExpectedSalaryInr: Number(input.minimumExpectedSalaryInr ?? existing?.minimumExpectedSalaryInr ?? 800000),
    rawResumeText: input.rawResumeText || '',
    skills: parsedSkills ?? [],
    certifications: parsedCerts,
    projects: parsedProjects,
    transitionHistory: existing?.transitionHistory ?? [],
    aiMode,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  saveProfile(profile);

  const tOrch = performance.now();
  const t1 = performance.now();
  const analysis = runSkillAnalyst(profile);
  logTrace(
    profileId,
    corr,
    'Skill Analyst',
    'analyze_skill_gaps',
    `${profile.skills.length} skills vs ${analysis.targetRoleTitle}`,
    `Readiness ${analysis.overallReadiness}%, ${analysis.gaps.length} gaps`,
    performance.now() - t1,
    aiMode
  );

  const t2 = performance.now();
  const matches = runCareerMatcher(profile);
  logTrace(
    profileId,
    corr,
    'Career Matcher',
    'match_career_roles',
    `Scored ${TARGET_ROLES.length} roles across 12 domains`,
    `Best match: ${matches[0].roleTitle} (${matches[0].readinessPct}%)`,
    performance.now() - t2,
    aiMode
  );

  const t3 = performance.now();
  const previousSteps = existing ? getRoadmapByProfileId(profileId) : [];
  const { steps, diff } = runCuratorAgent(profile, analysis, {
    previousSteps,
    trigger: existing ? 'manual_replan' : 'initial_build',
    triggerDetail: existing
      ? `Profile updated for ${analysis.targetRoleTitle}`
      : `Initial Digital Twin roadmap built for ${analysis.targetRoleTitle}`,
    newGoalRole: analysis.targetRoleTitle,
  });
  saveRoadmap(profileId, steps);
  saveReplanDiff(diff);
  logTrace(
    profileId,
    corr,
    'Curator',
    'generate_roadmap',
    `${analysis.gaps.length} gaps (${profile.learningPlan})`,
    `${steps.length} ordered steps (+${diff.added.length}/-${diff.removed.length})`,
    performance.now() - t3,
    aiMode
  );

  const t4 = performance.now();
  const progress = runProgressTracker(profile, steps);
  logTrace(
    profileId,
    corr,
    'Progress Tracker',
    'compute_forecast',
    `${progress.remainingHours}h remaining`,
    `Ready by ${progress.forecastedReadyDate}`,
    performance.now() - t4,
    aiMode
  );

  logTrace(
    profileId,
    corr,
    'Orchestrator',
    'profile_pipeline_complete',
    `Twin ${profile.name} (${analysis.targetRoleTitle})`,
    `Pipeline finished in ${Math.round(performance.now() - tOrch)}ms`,
    performance.now() - tOrch,
    aiMode
  );

  return buildTwinSnapshot(profileId)!;
}

export function changeGoalWorkflow(
  profileId: string,
  targetRoleId: RoleId,
  weeklyHours?: number,
  skillsOverride?: ParsedSkill[],
  learningPlanOverride?: LearningPlanMode,
  expectedAnnualSalaryInr?: number,
  minimumExpectedSalaryInr?: number,
  preferredLocation?: string,
  specialization?: string
): TwinSnapshot {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);

  const corr = `corr_goal_${Date.now()}`;
  const tStart = performance.now();
  const prevRole = TARGET_ROLES.find((r) => r.id === profile.targetRoleId)?.title ?? profile.targetRoleId;
  const nextRoleObj = TARGET_ROLES.find((r) => r.id === targetRoleId);
  if (!nextRoleObj) throw new Error(`Target role ${targetRoleId} not found`);
  const nextRole = nextRoleObj.title;

  const isRoleSwitch = profile.targetRoleId !== targetRoleId;
  const isPlanSwitch = learningPlanOverride && learningPlanOverride !== profile.learningPlan;

  const transitionHistory: CareerTransitionRecord[] = [...(profile.transitionHistory ?? [])];
  if (isRoleSwitch) {
    const prevAnalysis = runSkillAnalyst(profile);
    transitionHistory.unshift({
      id: `tr_hist_${Date.now()}`,
      fromRoleId: profile.targetRoleId,
      fromRoleTitle: prevRole,
      toRoleId: targetRoleId,
      toRoleTitle: nextRole,
      readinessAtSwitch: prevAnalysis.overallReadiness,
      timestamp: new Date().toISOString(),
    });
  }

  const updatedProfile: LearnerProfile = {
    ...profile,
    targetRoleId,
    learningPlan: learningPlanOverride ?? profile.learningPlan,
    weeklyHours: weeklyHours !== undefined ? Math.min(40, Math.max(4, weeklyHours)) : profile.weeklyHours,
    preferredLocation: preferredLocation !== undefined ? preferredLocation.trim() || 'India' : profile.preferredLocation,
    specialization: specialization !== undefined ? specialization.trim() : profile.specialization,
    expectedAnnualSalaryInr:
      expectedAnnualSalaryInr !== undefined
        ? Math.max(0, Math.round(expectedAnnualSalaryInr))
        : profile.expectedAnnualSalaryInr,
    minimumExpectedSalaryInr:
      minimumExpectedSalaryInr !== undefined
        ? Math.max(0, Math.round(minimumExpectedSalaryInr))
        : profile.minimumExpectedSalaryInr,
    skills: skillsOverride ?? profile.skills,
    transitionHistory: transitionHistory.slice(0, 15),
    updatedAt: new Date().toISOString(),
  };
  saveProfile(updatedProfile);

  const mode = getActiveAIMode();
  const t1 = performance.now();
  const matches = runCareerMatcher(updatedProfile);
  logTrace(
    profileId,
    corr,
    'Career Matcher',
    'recompute_role_fit',
    `Target: ${prevRole} -> ${nextRole}`,
    `New role readiness: ${matches.find((m) => m.roleId === targetRoleId)?.readinessPct ?? 0}%`,
    performance.now() - t1,
    mode
  );

  const t2 = performance.now();
  const analysis = runSkillAnalyst(updatedProfile);
  logTrace(
    profileId,
    corr,
    'Skill Analyst',
    'recompute_gaps',
    `${updatedProfile.skills.length} skills vs ${nextRole}`,
    `${analysis.gaps.length} gaps, top: ${analysis.gaps[0]?.skillName ?? 'None'}`,
    performance.now() - t2,
    mode
  );

  const t3 = performance.now();
  const previousSteps = getRoadmapByProfileId(profileId);
  const trigger: ReplanDiff['trigger'] = isPlanSwitch && !isRoleSwitch ? 'plan_change' : 'goal_change';
  const triggerDetail = isRoleSwitch
    ? `Career transition: ${prevRole} -> ${nextRole}`
    : isPlanSwitch
      ? `Learning plan switched to ${updatedProfile.learningPlan.replace('_', ' ')}`
      : `Study cadence updated to ${updatedProfile.weeklyHours} hrs/week`;

  const { steps, diff } = runCuratorAgent(updatedProfile, analysis, {
    previousSteps,
    trigger,
    triggerDetail,
    previousGoalRole: prevRole,
    newGoalRole: nextRole,
  });
  saveRoadmap(profileId, steps);
  saveReplanDiff(diff);
  logTrace(
    profileId,
    corr,
    'Curator',
    'replan_for_goal',
    `${previousSteps.length} old steps`,
    `${steps.length} new steps (+${diff.added.length} added, -${diff.removed.length} removed, ${diff.reordered.length} reordered)`,
    performance.now() - t3,
    mode,
    'replan_triggered'
  );

  const t4 = performance.now();
  const progress = runProgressTracker(updatedProfile, steps);
  logTrace(
    profileId,
    corr,
    'Progress Tracker',
    'update_forecast',
    `${progress.remainingHours}h @ ${progress.weeklyHours}h/wk`,
    `New forecast: ${progress.forecastedReadyDate}`,
    performance.now() - t4,
    mode
  );

  logTrace(
    profileId,
    corr,
    'Orchestrator',
    'goal_replan_complete',
    `${prevRole} -> ${nextRole}`,
    `Replan Diff ${diff.id} persisted`,
    performance.now() - tStart,
    mode,
    'replan_triggered'
  );

  return buildTwinSnapshot(profileId)!;
}

export function simulateTransitionWorkflow(
  profileId: string,
  fromRoleId: RoleId,
  toRoleId: RoleId
): CareerTransitionSimulation {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);
  return simulateCareerTransition(profile, fromRoleId, toRoleId);
}

export function applyTransitionWorkflow(
  profileId: string,
  fromRoleId: RoleId,
  toRoleId: RoleId
): TwinSnapshot {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);

  const updatedProfile: LearnerProfile = {
    ...profile,
    currentRoleId: fromRoleId,
  };
  saveProfile(updatedProfile);
  return changeGoalWorkflow(profileId, toRoleId);
}

export function updateProgressWorkflow(
  profileId: string,
  stepId: string,
  completedOrStatus: boolean | RoadmapStepStatus
): TwinSnapshot {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);

  const corr = `corr_prog_${Date.now()}`;
  const mode = getActiveAIMode();
  const steps = getRoadmapByProfileId(profileId);
  const targetStep = steps.find((s) => s.id === stepId);
  if (!targetStep) throw new Error(`Roadmap step ${stepId} not found`);

  const nextStatus: RoadmapStepStatus =
    typeof completedOrStatus === 'boolean'
      ? completedOrStatus
        ? 'completed'
        : 'not_started'
      : completedOrStatus;
  const completed = nextStatus === 'completed';
  const wasCompleted = targetStep.completed || targetStep.status === 'completed';

  const now = new Date().toISOString();
  const updatedSteps = steps.map((s) =>
    s.id === stepId
      ? {
          ...s,
          status: nextStatus,
          completed,
          completedAt: completed ? now : null,
        }
      : s
  );
  saveRoadmap(profileId, updatedSteps);

  const existingSkill = profile.skills.find((s) => s.skillId === targetStep.skillId);
  let updatedSkills = [...profile.skills];
  if (completed && !wasCompleted) {
    if (existingSkill) {
      updatedSkills = updatedSkills.map((s) =>
        s.skillId === targetStep.skillId
          ? {
              ...s,
              level: Math.min(5, Math.round((s.level + 0.6) * 10) / 10),
              confidence: Math.min(0.92, Math.round((s.confidence + 0.08) * 100) / 100),
              source: s.source === 'assessment_verified' ? 'assessment_verified' : 'project_evidence',
            }
          : s
      );
    } else {
      updatedSkills.push({
        skillId: targetStep.skillId,
        skillName: targetStep.skillName,
        level: 1.5,
        confidence: 0.72,
        source: 'project_evidence',
        evidence: `Completed roadmap module: ${targetStep.resourceTitle}`,
      });
    }
  } else if (!completed && wasCompleted && existingSkill) {
    updatedSkills = updatedSkills.map((s) =>
      s.skillId === targetStep.skillId
        ? {
            ...s,
            level: Math.max(0, Math.round((s.level - 0.6) * 10) / 10),
          }
        : s
    );
  }

  const updatedProfile: LearnerProfile = {
    ...profile,
    skills: updatedSkills,
    updatedAt: now,
  };
  saveProfile(updatedProfile);

  const t1 = performance.now();
  const progress = runProgressTracker(updatedProfile, updatedSteps);
  logTrace(
    profileId,
    corr,
    'Progress Tracker',
    `set_step_${nextStatus}`,
    `${targetStep.skillName}: ${targetStep.resourceTitle}`,
    `${progress.completedSteps}/${progress.totalSteps} (${progress.completionPct}%), ready ${progress.forecastedReadyDate}`,
    performance.now() - t1,
    mode
  );

  const t2 = performance.now();
  const analysis = runSkillAnalyst(updatedProfile);
  logTrace(
    profileId,
    corr,
    'Skill Analyst',
    'refresh_readiness',
    `${targetStep.skillName} updated`,
    `Readiness now ${analysis.overallReadiness}%`,
    performance.now() - t2,
    mode
  );

  return buildTwinSnapshot(profileId)!;
}

export function startAssessmentWorkflow(profileId: string, skillId: string): AssessmentStartResponse {
  const corr = `corr_assess_start_${Date.now()}`;
  const t0 = performance.now();
  const payload = startSkillAssessment(skillId);
  saveAssessmentRecord(payload.assessmentId, profileId, skillId, payload);

  const practicalTitle = payload.challenge?.title ?? payload.practicalTask?.title ?? 'Applied check';
  logTrace(
    profileId,
    corr,
    'Assessor',
    'generate_domain_assessment',
    `Skill: ${payload.skillName} (${payload.domainName})`,
    `${payload.questions.length} conceptual items + ${payload.assessmentType}: '${practicalTitle}'`,
    performance.now() - t0,
    payload.aiMode
  );

  return payload;
}

export function submitAssessmentWorkflow(input: {
  profileId: string;
  assessmentId: string;
  quizAnswers: number[];
  submittedCode?: string;
  practicalAnswer?: string;
}): AssessmentSubmitResponse {
  const { profileId, assessmentId, quizAnswers, submittedCode, practicalAnswer } = input;
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);

  const record = getAssessmentRecord(assessmentId);
  if (!record) throw new Error(`Assessment ${assessmentId} not found`);

  const startPayload = record.payload as AssessmentStartResponse;
  const corr = `corr_assess_sub_${Date.now()}`;
  const mode = getActiveAIMode();

  const tEval = performance.now();
  const evalRes = evaluateProblemSubmission({
    questions: startPayload.questions,
    quizAnswers,
    challenge: startPayload.challenge,
    practicalTask: startPayload.practicalTask,
    submittedCode,
    practicalAnswer,
  });

  const attemptNumber = getNextAttemptNumber(profileId);
  const submissionTitle =
    startPayload.challenge?.title ??
    startPayload.practicalTask?.title ??
    `${startPayload.skillName} Assessment`;
  const problemStatement =
    startPayload.challenge?.description ??
    startPayload.practicalTask?.scenarioPrompt ??
    `Demonstrate applied competency in ${startPayload.skillName}.`;

  const evaluationReport = runDeterministicEvaluationPipeline({
    attemptId: assessmentId,
    profileId,
    skillId: startPayload.skillId,
    skillName: startPayload.skillName,
    submissionType: 'assessment',
    submissionTitle,
    attemptNumber,
    problemStatement,
    submittedCode,
    practicalAnswer,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    questions: startPayload.questions,
    quizAnswers,
    challenge: startPayload.challenge,
    practicalTask: startPayload.practicalTask,
    testResults: evalRes.testResults,
    executionMs: evalRes.executionMs,
  });

  logTrace(
    profileId,
    corr,
    'Assessor',
    'evaluate_domain_submission',
    `${startPayload.skillName} (${startPayload.assessmentType})`,
    `Quiz ${evalRes.quizScore}%, Practical ${evalRes.practicalScore}%, Combined ${evalRes.combinedScore}%, Weighted 6-Criteria ${evaluationReport.overallScore}/100 (${evaluationReport.performanceClassification})`,
    performance.now() - tEval,
    mode,
    evalRes.combinedScore < 50 ? 'replan_triggered' : 'ok'
  );

  const skillDef = SKILLS_CATALOG.find((s) => s.id === startPayload.skillId);
  const currentEntry = profile.skills.find((s) => s.skillId === startPayload.skillId);
  const currentLevel = currentEntry?.level ?? 0;

  let newLevel = currentLevel;
  let newConfidence = currentEntry?.confidence ?? 0.5;
  if (evalRes.combinedScore >= 80) {
    newLevel = Math.max(currentLevel, 4);
    newConfidence = 0.95;
  } else if (evalRes.combinedScore >= 50) {
    newLevel = Math.max(currentLevel, 3);
    newConfidence = 0.86;
  } else {
    newLevel = Math.min(currentLevel, 1.0);
    newConfidence = 0.92;
  }

  const updatedSkills = currentEntry
    ? profile.skills.map((s) =>
        s.skillId === startPayload.skillId
          ? {
              ...s,
              level: newLevel,
              confidence: newConfidence,
              source: 'assessment_verified' as const,
              evidence: `Verified by Assessor (${evalRes.combinedScore}%)`,
            }
          : s
      )
    : [
        ...profile.skills,
        {
          skillId: startPayload.skillId,
          skillName: skillDef?.name ?? startPayload.skillName,
          level: newLevel,
          confidence: newConfidence,
          source: 'assessment_verified' as const,
          evidence: `Verified by Assessor (${evalRes.combinedScore}%)`,
        },
      ];

  const updatedProfile: LearnerProfile = {
    ...profile,
    skills: updatedSkills,
    updatedAt: new Date().toISOString(),
  };
  saveProfile(updatedProfile);

  const tAnalyst = performance.now();
  const analysis = runSkillAnalyst(updatedProfile);
  logTrace(
    profileId,
    corr,
    'Skill Analyst',
    'recompute_after_assessment',
    `${startPayload.skillName} level -> ${newLevel} (assessment_verified)`,
    `Readiness ${analysis.overallReadiness}%, ${analysis.gaps.length} gaps`,
    performance.now() - tAnalyst,
    mode
  );

  const replanTriggered = evalRes.combinedScore < 50;
  let roadmap = getRoadmapByProfileId(profileId);
  let replanDiff: ReplanDiff | null = null;

  if (replanTriggered) {
    const tCurator = performance.now();
    const reason = `Remediation triggered: ${startPayload.skillName} assessment scored ${evalRes.combinedScore}% (< 50% threshold)`;
    const curated = runCuratorAgent(updatedProfile, analysis, {
      previousSteps: roadmap,
      remediationSkillIds: [startPayload.skillId],
      remediationReason: reason,
      trigger: 'assessment_failed',
      triggerDetail: reason,
    });
    roadmap = curated.steps;
    replanDiff = curated.diff;
    saveRoadmap(profileId, roadmap);
    saveReplanDiff(replanDiff);

    logTrace(
      profileId,
      corr,
      'Curator',
      'dynamic_remediation_replan',
      `Failed ${startPayload.skillName} (${evalRes.combinedScore}%)`,
      `Inserted/prioritized ${replanDiff.added.length + replanDiff.reordered.length} remediation steps`,
      performance.now() - tCurator,
      mode,
      'replan_triggered'
    );

    logTrace(
      profileId,
      corr,
      'Orchestrator',
      'assessment_replan_routed',
      `Score ${evalRes.combinedScore}% < 50%`,
      `Roadmap dynamically rebuilt with Diff ${replanDiff.id}`,
      4,
      mode,
      'replan_triggered'
    );
  }

  saveEvaluationReport({
    report: evaluationReport,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    combinedScore: evalRes.combinedScore,
    passed: evalRes.passed,
    replanTriggered,
    updatedSkillLevel: newLevel,
  });

  const progress = runProgressTracker(updatedProfile, roadmap);
  const response: AssessmentSubmitResponse = {
    assessmentId,
    profileId,
    skillId: startPayload.skillId,
    skillName: startPayload.skillName,
    quizScore: evalRes.quizScore,
    practicalScore: evalRes.practicalScore,
    combinedScore: evalRes.combinedScore,
    passed: evalRes.passed,
    testResults: evalRes.testResults,
    practicalFeedback: evalRes.practicalFeedback,
    stdout: evalRes.stdout,
    updatedSkillLevel: newLevel,
    replanTriggered,
    replanDiff,
    analysis,
    roadmap,
    progress,
    evaluationReport,
  };

  updateAssessmentResult(assessmentId, response);
  return response;
}

export async function submitAssessmentWithAiWorkflow(input: {
  profileId: string;
  assessmentId: string;
  quizAnswers: number[];
  submittedCode?: string;
  practicalAnswer?: string;
}): Promise<AssessmentSubmitResponse> {
  const response = submitAssessmentWorkflow(input);
  if (getActiveAIMode() !== 'gemini' || !response.evaluationReport) {
    return response;
  }

  const record = getAssessmentRecord(input.assessmentId);
  const startPayload = record?.payload as AssessmentStartResponse | undefined;
  const problemStatement =
    startPayload?.challenge?.description ??
    startPayload?.practicalTask?.scenarioPrompt ??
    `Demonstrate applied competency in ${response.skillName}.`;

  const enrichedReport = await runFullEvaluationPipeline(
    {
      attemptId: response.assessmentId,
      profileId: response.profileId,
      skillId: response.skillId,
      skillName: response.skillName,
      submissionType: 'assessment',
      submissionTitle: response.evaluationReport.submissionTitle,
      attemptNumber: response.evaluationReport.attemptNumber,
      timestamp: response.evaluationReport.timestamp,
      problemStatement,
      submittedCode: input.submittedCode,
      practicalAnswer: input.practicalAnswer,
      quizScore: response.quizScore,
      practicalScore: response.practicalScore,
      questions: startPayload?.questions,
      quizAnswers: input.quizAnswers,
      challenge: startPayload?.challenge,
      practicalTask: startPayload?.practicalTask,
      testResults: response.testResults,
    },
    { useAi: true }
  );

  saveEvaluationReport({
    report: enrichedReport,
    quizScore: response.quizScore,
    practicalScore: response.practicalScore,
    combinedScore: response.combinedScore,
    passed: response.passed,
    replanTriggered: response.replanTriggered,
    updatedSkillLevel: response.updatedSkillLevel,
  });

  const enrichedResponse: AssessmentSubmitResponse = {
    ...response,
    evaluationReport: enrichedReport,
  };
  updateAssessmentResult(input.assessmentId, enrichedResponse);
  return enrichedResponse;
}

export async function evaluateProjectSubmissionWorkflow(input: {
  profileId: string;
  skillId: string;
  title: string;
  problemStatement: string;
  submittedCode: string;
  testNotes?: string;
}): Promise<{ report: EvaluationReport; twin: TwinSnapshot }> {
  const profile = getProfileById(input.profileId);
  if (!profile) throw new Error(`Profile ${input.profileId} not found`);

  const code = input.submittedCode.trim();
  const title = input.title.trim();
  const problemStatement = input.problemStatement.trim();
  if (!code || !title || !problemStatement) {
    throw new Error('Submission title, problem statement, and code are required.');
  }

  const skillDef = SKILLS_CATALOG.find((s) => s.id === input.skillId);
  const skillName = skillDef?.name ?? input.skillId;
  const attemptId = `eval_proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const attemptNumber = getNextAttemptNumber(input.profileId);
  const corr = `corr_proj_eval_${Date.now()}`;
  const t0 = performance.now();

  const report = await runFullEvaluationPipeline(
    {
      attemptId,
      profileId: input.profileId,
      skillId: input.skillId,
      skillName,
      submissionType: 'project_code',
      submissionTitle: title,
      attemptNumber,
      problemStatement,
      submittedCode: code,
      testNotes: input.testNotes,
      quizScore: 0,
      practicalScore: 0,
    },
    { useAi: true }
  );

  const passed = report.overallScore >= 50;
  const currentEntry = profile.skills.find((s) => s.skillId === input.skillId);
  const currentLevel = currentEntry?.level ?? 0;
  const updatedSkillLevel =
    report.overallScore >= 85
      ? Math.max(currentLevel, 4)
      : report.overallScore >= 70
        ? Math.max(currentLevel, 3)
        : currentLevel;

  saveEvaluationReport({
    report,
    quizScore: report.overallScore,
    practicalScore: report.overallScore,
    combinedScore: Math.round(report.overallScore),
    passed,
    replanTriggered: report.overallScore < 50,
    updatedSkillLevel,
  });

  if (updatedSkillLevel > currentLevel) {
    const updatedSkills = currentEntry
      ? profile.skills.map((s) =>
          s.skillId === input.skillId
            ? {
                ...s,
                level: updatedSkillLevel,
                confidence: Math.max(s.confidence, 0.85),
                source: 'project_evidence' as const,
                evidence: `Project evaluation '${title}' (${report.overallScore}/100)`,
              }
            : s
        )
      : [
          ...profile.skills,
          {
            skillId: input.skillId,
            skillName,
            level: updatedSkillLevel,
            confidence: 0.85,
            source: 'project_evidence' as const,
            evidence: `Project evaluation '${title}' (${report.overallScore}/100)`,
          },
        ];
    saveProfile({
      ...profile,
      skills: updatedSkills,
      updatedAt: new Date().toISOString(),
    });
  }

  logTrace(
    input.profileId,
    corr,
    'Assessor',
    'evaluate_project_code',
    `${title} (${skillName})`,
    `Overall ${report.overallScore}/100 (${report.performanceClassification}) across 6 criteria`,
    performance.now() - t0,
    report.aiMode,
    report.overallScore < 50 ? 'replan_triggered' : 'ok'
  );

  return {
    report,
    twin: buildTwinSnapshot(input.profileId)!,
  };
}

export function getEvaluationHistoryWorkflow(profileId: string): EvaluationHistoryResponse {
  const attempts = getEvaluationAttemptsByProfileId(profileId);
  const totalAttempts = attempts.length;
  const bestAttempt =
    attempts.length > 0
      ? attempts.reduce((best, cur) => (cur.overallScore > best.overallScore ? cur : best), attempts[0])
      : null;
  const latestAttempt = attempts[0] ?? null;
  const averageScore =
    attempts.length > 0
      ? Math.round((attempts.reduce((s, a) => s + a.overallScore, 0) / attempts.length) * 10) / 10
      : 0;

  let improvementPct: number | null = null;
  if (attempts.length >= 2) {
    const earliest = attempts[attempts.length - 1];
    const latest = attempts[0];
    improvementPct = Math.round((latest.overallScore - earliest.overallScore) * 10) / 10;
  }

  return {
    profileId,
    attempts,
    totalAttempts,
    bestAttempt,
    latestAttempt,
    averageScore,
    improvementPct,
  };
}

export function getEvaluationLeaderboardWorkflow(
  currentProfileId?: string
): EvaluationLeaderboardResponse {
  const allAttempts = getAllEvaluationAttempts();
  const profiles = listProfiles();
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const roleMap = new Map(TARGET_ROLES.map((r) => [r.id, r]));
  const domainMap = new Map(CAREER_DOMAINS.map((d) => [d.id, d.name]));

  const byProfile = new Map<string, typeof allAttempts>();
  for (const att of allAttempts) {
    const arr = byProfile.get(att.profileId) ?? [];
    arr.push(att);
    byProfile.set(att.profileId, arr);
  }

  const rawEntries: Array<Omit<LeaderboardEntry, 'rank'>> = [];

  for (const [profileId, attempts] of byProfile.entries()) {
    const profile = profileMap.get(profileId);
    if (!profile || attempts.length === 0) continue;

    // Sort newest first by attemptNumber / timestamp
    const orderedDesc = [...attempts].sort(
      (a, b) => b.attemptNumber - a.attemptNumber || b.timestamp.localeCompare(a.timestamp)
    );
    const recent = orderedDesc[0];
    const earliest = orderedDesc[orderedDesc.length - 1];
    const best = orderedDesc.reduce(
      (acc, cur) => (cur.overallScore > acc.overallScore ? cur : acc),
      orderedDesc[0]
    );

    const avgScore =
      Math.round((orderedDesc.reduce((s, a) => s + a.overallScore, 0) / orderedDesc.length) * 10) / 10;
    const improvementPct =
      orderedDesc.length >= 2
        ? Math.round((recent.overallScore - earliest.overallScore) * 10) / 10
        : null;

    const categoryAverages = {} as Record<EvaluationCategoryKey, number>;
    for (const crit of EVALUATION_CRITERIA) {
      const vals = orderedDesc
        .map((a) => a.categories.find((c) => c.key === crit.key)?.score)
        .filter((v): v is number => typeof v === 'number');
      categoryAverages[crit.key] =
        vals.length > 0
          ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
          : 0;
    }

    const role = roleMap.get(profile.targetRoleId);
    const domainName =
      domainMap.get(role?.domainId ?? profile.currentDomainId) ?? 'Information Technology';

    rawEntries.push({
      profileId,
      name: profile.name,
      targetRoleTitle: role?.title ?? profile.targetRoleId,
      domainName,
      isCurrentUser: Boolean(currentProfileId && profileId === currentProfileId),
      attemptCount: orderedDesc.length,
      bestScore: best.overallScore,
      recentScore: recent.overallScore,
      averageScore: avgScore,
      improvementPct,
      bestAttemptClassification: best.performanceClassification,
      bestAttemptTimestamp: best.timestamp,
      recentAttemptTimestamp: recent.timestamp,
      categoryAverages,
    });
  }

  rawEntries.sort(
    (a, b) =>
      b.bestScore - a.bestScore ||
      b.averageScore - a.averageScore ||
      b.recentScore - a.recentScore
  );

  const entries: LeaderboardEntry[] = rawEntries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  return {
    entries,
    totalEvaluatedLearners: entries.length,
    totalRecordedAttempts: allAttempts.length,
    categoryLabels: EVALUATION_CRITERIA.map((c) => ({
      key: c.key,
      label: c.label,
      weightPct: c.weightPct,
    })),
  };
}

export async function mentorChatWorkflow(
  profileId: string,
  userMessage: string
): Promise<{ message: MentorMessage; twin: TwinSnapshot }> {
  const corr = `corr_mentor_${Date.now()}`;
  const priorHistory = getMentorMessages(profileId);

  const toolbox: MentorToolbox = {
    getTwin: () => buildTwinSnapshot(profileId)!,
    setGoal: (targetRoleId, weeklyHours) =>
      changeGoalWorkflow(profileId, targetRoleId, weeklyHours),
    explainGap: (skillQuery) => {
      const twin = buildTwinSnapshot(profileId)!;
      const query = (skillQuery || '').toLowerCase();
      const targetGap =
        (query
          ? twin.analysis.allSkillComparisons.find(
              (g) => g.skillId === query || g.skillName.toLowerCase().includes(query)
            )
          : undefined) ?? twin.analysis.gaps[0];

      if (!targetGap) {
        return {
          skillName: 'All Target Skills',
          currentLevel: 4,
          targetLevel: 4,
          gap: 0,
          missingPrerequisites: [],
          explanation: `You currently meet all core requirements for **${twin.analysis.targetRoleTitle}**! Consider completing a domain assessment to verify mastery.`,
        };
      }

      const prereqNames = targetGap.prerequisites.map(
        (pid) => SKILLS_CATALOG.find((s) => s.id === pid)?.name ?? pid
      );
      const missingNames = targetGap.missingPrerequisites.map(
        (pid) => SKILLS_CATALOG.find((s) => s.id === pid)?.name ?? pid
      );

      const explanation =
        missingNames.length > 0
          ? `**${targetGap.skillName}** is currently at level **${targetGap.currentLevel}/${targetGap.targetLevel}** (gap **${targetGap.gap}**, importance **${targetGap.weight}/5**). It depends on **${prereqNames.join(', ')}**, and you currently have missing/low foundations in **${missingNames.join(', ')}** — which is why Curator placed those prerequisites earlier in your roadmap.`
          : `**${targetGap.skillName}** is at level **${targetGap.currentLevel}/${targetGap.targetLevel}** (gap **${targetGap.gap}**, importance **${targetGap.weight}/5**). Your prerequisites (${prereqNames.length > 0 ? prereqNames.join(', ') : 'none'}) are satisfied, so you can tackle the next **${targetGap.skillName}** module in your roadmap immediately.`;

      return {
        skillName: targetGap.skillName,
        currentLevel: targetGap.currentLevel,
        targetLevel: targetGap.targetLevel,
        gap: targetGap.gap,
        missingPrerequisites: missingNames,
        explanation,
      };
    },
    requestReplan: (reason, focusSkillId) => {
      const profile = getProfileById(profileId)!;
      const analysis = runSkillAnalyst(profile);
      const previousSteps = getRoadmapByProfileId(profileId);
      const { steps, diff } = runCuratorAgent(profile, analysis, {
        previousSteps,
        remediationSkillIds: focusSkillId ? [focusSkillId] : [],
        remediationReason: reason,
        trigger: 'manual_replan',
        triggerDetail: reason,
      });
      saveRoadmap(profileId, steps);
      saveReplanDiff(diff);
      return buildTwinSnapshot(profileId)!;
    },
  };

  const t0 = performance.now();
  // Only persist conversation messages once Gemini succeeds so failed turns don't pollute history
  const mentorRes = await runMentorAgent(userMessage, toolbox, priorHistory);
  const now = new Date().toISOString();

  saveMentorMessage({
    id: `msg_u_${Date.now()}`,
    profileId,
    role: 'user',
    content: userMessage,
    toolExecutions: [],
    invokedAgents: [],
    aiMode: 'gemini',
    createdAt: now,
  });

  logTrace(
    profileId,
    corr,
    'Orchestrator',
    'route_mentor_intent',
    `"${userMessage.slice(0, 50)}"`,
    `Invoked agents: ${mentorRes.invokedAgents.join(', ')}`,
    performance.now() - t0,
    mentorRes.aiMode,
    'ok'
  );

  logTrace(
    profileId,
    corr,
    'Mentor',
    'conversational_tool_turn',
    `"${userMessage.slice(0, 60)}"`,
    `Tools: [${mentorRes.toolExecutions.map((t) => t.toolName).join(', ') || 'direct_reasoning'}]`,
    performance.now() - t0,
    mentorRes.aiMode,
    'ok'
  );

  const assistantMsg: MentorMessage = {
    id: `msg_a_${Date.now() + 1}`,
    role: 'assistant',
    content: mentorRes.reply,
    toolExecutions: mentorRes.toolExecutions,
    invokedAgents: mentorRes.invokedAgents,
    aiMode: mentorRes.aiMode,
    createdAt: new Date().toISOString(),
  };
  saveMentorMessage({ ...assistantMsg, profileId });

  return {
    message: assistantMsg,
    twin: buildTwinSnapshot(profileId)!,
  };
}

export function updateResumeProfileWorkflow(input: {
  profileId: string;
  name?: string;
  email?: string;
  currentTitle?: string;
  currentDomainId?: CareerDomainId;
  specialization?: string;
  preferredLocation?: string;
  experienceYears?: number;
  education?: EducationEntry[];
  certifications?: string[];
  projects?: ProjectEntry[];
  rawResumeText?: string;
}): TwinSnapshot {
  const profile = getProfileById(input.profileId);
  if (!profile) throw new Error(`Profile ${input.profileId} not found`);

  const corr = `corr_resume_${Date.now()}`;
  const t0 = performance.now();

  const updatedProfile: LearnerProfile = {
    ...profile,
    name: input.name?.trim() || profile.name,
    email: input.email?.trim() || profile.email,
    currentTitle: input.currentTitle?.trim() || profile.currentTitle,
    currentDomainId: input.currentDomainId ?? profile.currentDomainId,
    specialization: input.specialization !== undefined ? input.specialization.trim() : profile.specialization,
    preferredLocation: input.preferredLocation !== undefined ? input.preferredLocation.trim() || 'India' : profile.preferredLocation,
    experienceYears:
      input.experienceYears !== undefined ? Math.max(0, Number(input.experienceYears)) : profile.experienceYears,
    education: input.education ?? profile.education,
    certifications: input.certifications ?? profile.certifications,
    projects: input.projects ?? profile.projects,
    rawResumeText: input.rawResumeText !== undefined ? input.rawResumeText : profile.rawResumeText,
    updatedAt: new Date().toISOString(),
  };

  saveProfile(updatedProfile);
  logTrace(
    profile.id,
    corr,
    'Profile Agent',
    'sync_resume_studio',
    `${updatedProfile.projects.length} projects, ${updatedProfile.certifications.length} certs`,
    `Synced structured resume for ${updatedProfile.name}`,
    performance.now() - t0,
    getActiveAIMode()
  );

  return buildTwinSnapshot(profile.id)!;
}

export function getOpportunitiesOverviewWorkflow(profileId: string): OpportunitiesOverview {
  const profile = getProfileById(profileId);
  if (!profile) throw new Error(`Profile ${profileId} not found`);

  const channelData = buildVerifiedSearchChannels(profile);
  const applications = getApplicationsByProfileId(profileId);

  return {
    profileId: profile.id,
    targetRoleId: profile.targetRoleId,
    targetRoleTitle: channelData.targetRoleTitle,
    targetDomainId: channelData.targetDomainId,
    targetRoleSalaryRange: channelData.targetRoleSalaryRange,
    preferredLocation: channelData.preferredLocation,
    expectedAnnualSalaryInr: profile.expectedAnnualSalaryInr ?? 1200000,
    minimumExpectedSalaryInr: profile.minimumExpectedSalaryInr ?? 800000,
    liveFeedConnected: false,
    sourceNotice: channelData.sourceNotice,
    channels: channelData.channels,
    applications,
  };
}

export function upsertApplicationWorkflow(input: {
  profileId: string;
  opportunityId: string;
  opportunityType: OpportunityType;
  title: string;
  company: string;
  domainId: CareerDomainId;
  compensationLabel: string;
  currency?: 'INR' | 'USD' | 'OTHER';
  sourceUrl?: string;
  status: ApplicationStatus;
  notes?: string;
}): { application: JobApplication; overview: OpportunitiesOverview } {
  const profile = getProfileById(input.profileId);
  if (!profile) throw new Error(`Profile ${input.profileId} not found`);

  const now = new Date().toISOString();
  const existing = getApplicationsByProfileId(input.profileId).find(
    (a) => a.opportunityId === input.opportunityId
  );

  const saved = upsertApplication({
    id: existing?.id ?? `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    profileId: input.profileId,
    opportunityId: input.opportunityId,
    opportunityType: input.opportunityType,
    title: input.title,
    company: input.company,
    domainId: input.domainId,
    compensationLabel: input.compensationLabel,
    currency: input.currency ?? existing?.currency ?? 'INR',
    sourceUrl: input.sourceUrl ?? existing?.sourceUrl ?? '',
    status: input.status,
    notes: input.notes ?? existing?.notes ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  logTrace(
    input.profileId,
    `corr_app_${Date.now()}`,
    'Career Matcher',
    'track_opportunity_application',
    `${input.company} — ${input.title}`,
    `Application status: ${saved.status}`,
    4,
    getActiveAIMode()
  );

  return {
    application: saved,
    overview: getOpportunitiesOverviewWorkflow(input.profileId),
  };
}

export function deleteApplicationWorkflow(
  profileId: string,
  applicationId: string
): OpportunitiesOverview {
  deleteApplicationById(profileId, applicationId);
  return getOpportunitiesOverviewWorkflow(profileId);
}

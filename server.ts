import './server/loadEnv.ts';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { validateSalaryExpectations } from './src/shared/currency.ts';
import {
  CAREER_DOMAINS,
  LEARNING_RESOURCES,
  SAMPLE_RESUMES,
  SKILLS_CATALOG,
  TARGET_ROLES,
} from './src/shared/seedData.ts';
import type {
  ApplicationStatus,
  CareerDomainId,
  CohortOverview,
  LearningPlanMode,
  OpportunityType,
  RoadmapStepStatus,
  RoleId,
  YouTubeSearchResult,
} from './src/shared/types.ts';
import { runCareerMatcher } from './server/agents/careerMatcher.ts';
import {
  explainOpportunityWithGemini,
  improveResumeWithGemini,
} from './server/agents/mentorAgent.ts';
import { compareEvaluationAttempts } from './server/agents/evaluationEngine.ts';
import {
  applyTransitionWorkflow,
  buildTwinSnapshot,
  changeGoalWorkflow,
  createProfileWorkflow,
  deleteApplicationWorkflow,
  ensureSeededDemoTwin,
  evaluateProjectSubmissionWorkflow,
  getEvaluationHistoryWorkflow,
  getEvaluationLeaderboardWorkflow,
  getOpportunitiesOverviewWorkflow,
  loginUserWorkflow,
  mentorChatWorkflow,
  registerUserWorkflow,
  simulateTransitionWorkflow,
  startAssessmentWorkflow,
  submitAssessmentWithAiWorkflow,
  updateProgressWorkflow,
  updateResumeProfileWorkflow,
  upsertApplicationWorkflow,
} from './server/agents/orchestrator.ts';
import { runProfileAgent } from './server/agents/profileAgent.ts';
import { runSkillAnalyst } from './server/agents/skillAnalyst.ts';
import {
  getCohortLearners,
  getEvaluationAttemptById,
  getProfileById,
  getReplanDiffs,
  getRoadmapByProfileId,
  getTracesByProfileId,
  listProfiles,
} from './server/db.ts';
import { GeminiServiceError, getActiveAIMode } from './server/gemini.ts';

function computeCohortOverview(): CohortOverview {
  const learners = getCohortLearners();
  const totalLearners = learners.length;
  const avgReadinessPct =
    totalLearners > 0
      ? Math.round(learners.reduce((s, l) => s + l.readinessPct, 0) / totalLearners)
      : 0;
  const atRiskCount = learners.filter((l) => l.riskLevel === 'At Risk').length;
  const watchCount = learners.filter((l) => l.riskLevel === 'Watch').length;
  const onTrackCount = learners.filter((l) => l.riskLevel === 'On Track').length;

  const bottleneckMap = new Map<string, number>();
  for (const l of learners) {
    for (const skillName of l.missingSkills) {
      bottleneckMap.set(skillName, (bottleneckMap.get(skillName) ?? 0) + 1);
    }
  }

  const bottleneckSkills = [...bottleneckMap.entries()]
    .map(([skillName, affectedLearners]) => ({ skillName, affectedLearners }))
    .sort((a, b) => b.affectedLearners - a.affectedLearners)
    .slice(0, 10);

  const domainDistribution = CAREER_DOMAINS.map((dom) => {
    const group = learners.filter((l) => l.domainId === dom.id);
    const avg =
      group.length > 0
        ? Math.round(group.reduce((s, x) => s + x.readinessPct, 0) / group.length)
        : 0;
    return {
      domainId: dom.id,
      domainName: dom.name,
      count: group.length,
      avgReadiness: avg,
    };
  });

  const domainNameMap = new Map(CAREER_DOMAINS.map((d) => [d.id, d.name]));

  const industryDemand = TARGET_ROLES.slice()
    .sort((a, b) => b.demandGrowthPct - a.demandGrowthPct)
    .slice(0, 12)
    .map((role) => ({
      domainName: domainNameMap.get(role.domainId) ?? role.domainId,
      roleTitle: role.title,
      demandLevel: role.demandLevel,
      growthPct: role.demandGrowthPct,
      avgSalaryRange: role.avgSalaryRange,
    }));

  return {
    isSyntheticDemo: true,
    notice:
      'Demonstration Dataset: Cohort figures and demand projections below represent pre-seeded synthetic learners across 12 career sectors for institutional workflow testing.',
    totalLearners,
    avgReadinessPct,
    atRiskCount,
    watchCount,
    onTrackCount,
    bottleneckSkills,
    domainDistribution,
    industryDemand,
    learners,
  };
}

function registerApiRoutes(router: express.Router): void {
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      product: 'SKILLORA',
      aiMode: getActiveAIMode(),
      youtubeApiConfigured: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
      catalogStats: {
        domains: CAREER_DOMAINS.length,
        roles: TARGET_ROLES.length,
        skills: SKILLS_CATALOG.length,
        resources: LEARNING_RESOURCES.length,
      },
    });
  });

  router.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password, targetRoleId, currentDomainId, specialization, preferredLocation } =
        req.body ?? {};
      const result = await registerUserWorkflow({
        name: String(name ?? ''),
        email: String(email ?? ''),
        password: String(password ?? ''),
        targetRoleId: targetRoleId ? (String(targetRoleId) as RoleId) : undefined,
        currentDomainId: currentDomainId ? (String(currentDomainId) as CareerDomainId) : undefined,
        specialization: typeof specialization === 'string' ? specialization : undefined,
        preferredLocation: typeof preferredLocation === 'string' ? preferredLocation : undefined,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed' });
    }
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      const result = loginUserWorkflow({
        email: String(email ?? ''),
        password: String(password ?? ''),
      });
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Sign-in failed' });
    }
  });

  router.get('/domains', (_req, res) => {
    res.json({
      domains: CAREER_DOMAINS,
      roles: TARGET_ROLES,
    });
  });

  router.get('/catalog', (_req, res) => {
    res.json({
      domains: CAREER_DOMAINS,
      roles: TARGET_ROLES,
      skills: SKILLS_CATALOG,
      resources: LEARNING_RESOURCES,
      sampleResumes: SAMPLE_RESUMES,
      aiMode: getActiveAIMode(),
    });
  });

  router.get('/demo-twin', (_req, res) => {
    const twin = ensureSeededDemoTwin();
    res.json(twin);
  });

  router.get('/profiles', (_req, res) => {
    ensureSeededDemoTwin();
    res.json({ profiles: listProfiles() });
  });

  router.post('/profile/parse-resume', async (req: Request, res: Response) => {
    try {
      const rawText = String(req.body?.resumeText ?? req.body?.rawText ?? '');
      if (!rawText.trim()) {
        res.status(400).json({ error: 'resumeText is required' });
        return;
      }
      const parsed = await runProfileAgent(rawText);
      res.json(parsed);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to parse resume' });
    }
  });

  router.post('/profile', async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.name && !body.rawResumeText) {
        res.status(400).json({ error: 'name or rawResumeText is required' });
        return;
      }
      const salaryCheck = validateSalaryExpectations(
        Number(body.expectedAnnualSalaryInr ?? 1200000),
        Number(body.minimumExpectedSalaryInr ?? 800000)
      );
      if (!salaryCheck.valid) {
        res.status(400).json({ error: salaryCheck.error });
        return;
      }
      const twin = await createProfileWorkflow({
        id: body.id,
        name: String(body.name || 'Candidate'),
        email: body.email,
        currentTitle: body.currentTitle,
        currentDomainId: body.currentDomainId,
        currentRoleId: body.currentRoleId,
        specialization: body.specialization,
        preferredLocation: body.preferredLocation,
        careerInterests: Array.isArray(body.careerInterests) ? body.careerInterests : undefined,
        experienceYears: body.experienceYears,
        education: Array.isArray(body.education) ? body.education : undefined,
        targetRoleId: (body.targetRoleId || 'fullstack_developer') as RoleId,
        learningPlan: body.learningPlan as LearningPlanMode | undefined,
        weeklyHours: body.weeklyHours,
        expectedAnnualSalaryInr: salaryCheck.expected,
        minimumExpectedSalaryInr: salaryCheck.minimum,
        rawResumeText: body.rawResumeText,
        skills: body.skills,
        certifications: body.certifications,
        projects: body.projects,
      });
      res.status(201).json(twin);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create profile' });
    }
  });

  router.post('/profile/resume-update', (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.profileId) {
        res.status(400).json({ error: 'profileId is required' });
        return;
      }
      const twin = updateResumeProfileWorkflow({
        profileId: String(body.profileId),
        name: typeof body.name === 'string' ? body.name : undefined,
        email: typeof body.email === 'string' ? body.email : undefined,
        currentTitle: typeof body.currentTitle === 'string' ? body.currentTitle : undefined,
        currentDomainId: body.currentDomainId as CareerDomainId | undefined,
        specialization: typeof body.specialization === 'string' ? body.specialization : undefined,
        preferredLocation: typeof body.preferredLocation === 'string' ? body.preferredLocation : undefined,
        experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : undefined,
        education: Array.isArray(body.education) ? body.education : undefined,
        certifications: Array.isArray(body.certifications) ? body.certifications : undefined,
        projects: Array.isArray(body.projects) ? body.projects : undefined,
        rawResumeText: typeof body.rawResumeText === 'string' ? body.rawResumeText : undefined,
      });
      res.json(twin);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update resume profile' });
    }
  });

  router.post('/resume/improve', async (req: Request, res: Response) => {
    try {
      const { profileId, targetSection, currentText, projectTitle } = req.body ?? {};
      if (!profileId || !targetSection || typeof currentText !== 'string') {
        res.status(400).json({ error: 'profileId, targetSection, and currentText are required' });
        return;
      }
      const twin = buildTwinSnapshot(String(profileId));
      if (!twin) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      const result = await improveResumeWithGemini({
        twin,
        targetSection: targetSection as 'summary' | 'project' | 'tailor',
        currentText,
        projectTitle: typeof projectTitle === 'string' ? projectTitle : undefined,
      });
      res.json(result);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : 'Resume enhancement failed' });
    }
  });

  router.get('/profile/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    if (id === 'twin_demo_maya') ensureSeededDemoTwin();
    const twin = buildTwinSnapshot(id);
    if (!twin) {
      res.status(404).json({ error: `Profile ${id} not found` });
      return;
    }
    res.json(twin);
  });

  router.post('/goal', (req: Request, res: Response) => {
    try {
      const {
        profileId,
        targetRoleId,
        weeklyHours,
        skills,
        learningPlan,
        expectedAnnualSalaryInr,
        minimumExpectedSalaryInr,
        preferredLocation,
        specialization,
      } = req.body ?? {};
      if (!profileId || !targetRoleId) {
        res.status(400).json({ error: 'profileId and targetRoleId are required' });
        return;
      }
      const existing = getProfileById(String(profileId));
      const nextExpected =
        expectedAnnualSalaryInr !== undefined
          ? Number(expectedAnnualSalaryInr)
          : (existing?.expectedAnnualSalaryInr ?? 1200000);
      const nextMinimum =
        minimumExpectedSalaryInr !== undefined
          ? Number(minimumExpectedSalaryInr)
          : (existing?.minimumExpectedSalaryInr ?? 800000);
      const salaryCheck = validateSalaryExpectations(nextExpected, nextMinimum);
      if (!salaryCheck.valid) {
        res.status(400).json({ error: salaryCheck.error });
        return;
      }
      const twin = changeGoalWorkflow(
        String(profileId),
        targetRoleId as RoleId,
        weeklyHours !== undefined ? Number(weeklyHours) : undefined,
        Array.isArray(skills) ? skills : undefined,
        learningPlan as LearningPlanMode | undefined,
        salaryCheck.expected,
        salaryCheck.minimum,
        typeof preferredLocation === 'string' ? preferredLocation : undefined,
        typeof specialization === 'string' ? specialization : undefined
      );
      res.json(twin);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update goal' });
    }
  });

  router.post('/transition/simulate', (req: Request, res: Response) => {
    try {
      const { profileId, fromRoleId, toRoleId } = req.body ?? {};
      if (!profileId || !fromRoleId || !toRoleId) {
        res.status(400).json({ error: 'profileId, fromRoleId, and toRoleId are required' });
        return;
      }
      const sim = simulateTransitionWorkflow(
        String(profileId),
        String(fromRoleId) as RoleId,
        String(toRoleId) as RoleId
      );
      res.json(sim);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to simulate transition' });
    }
  });

  router.post('/transition/apply', (req: Request, res: Response) => {
    try {
      const { profileId, fromRoleId, toRoleId } = req.body ?? {};
      if (!profileId || !fromRoleId || !toRoleId) {
        res.status(400).json({ error: 'profileId, fromRoleId, and toRoleId are required' });
        return;
      }
      const twin = applyTransitionWorkflow(
        String(profileId),
        String(fromRoleId) as RoleId,
        String(toRoleId) as RoleId
      );
      res.json(twin);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to apply career transition' });
    }
  });

  router.get('/analysis/:id', (req: Request, res: Response) => {
    const profile = getProfileById(String(req.params.id));
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(runSkillAnalyst(profile));
  });

  router.get('/match/:id', (req: Request, res: Response) => {
    const profile = getProfileById(String(req.params.id));
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({ profileId: profile.id, matches: runCareerMatcher(profile) });
  });

  router.get('/roadmap/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    const profile = getProfileById(id);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({
      profileId: id,
      steps: getRoadmapByProfileId(id),
      diffs: getReplanDiffs(id),
    });
  });

  router.post('/progress', (req: Request, res: Response) => {
    try {
      const { profileId, stepId, completed, status } = req.body ?? {};
      if (!profileId || !stepId || (typeof completed !== 'boolean' && !status)) {
        res.status(400).json({
          error: 'profileId, stepId, and either status (not_started|in_progress|completed) or completed (boolean) are required',
        });
        return;
      }
      const val: boolean | RoadmapStepStatus =
        typeof status === 'string' && ['not_started', 'in_progress', 'completed'].includes(status)
          ? (status as RoadmapStepStatus)
          : Boolean(completed);
      const twin = updateProgressWorkflow(String(profileId), String(stepId), val);
      res.json(twin);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to update progress' });
    }
  });

  router.post('/assessment/start', (req: Request, res: Response) => {
    try {
      const { profileId, skillId } = req.body ?? {};
      if (!profileId || !skillId) {
        res.status(400).json({ error: 'profileId and skillId are required' });
        return;
      }
      if (!getProfileById(String(profileId))) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      const result = startAssessmentWorkflow(String(profileId), String(skillId));
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to start assessment' });
    }
  });

  router.post('/assessment/submit-problem', async (req: Request, res: Response) => {
    try {
      const { profileId, assessmentId, quizAnswers, submittedCode, practicalAnswer } = req.body ?? {};
      if (!profileId || !assessmentId) {
        res.status(400).json({ error: 'profileId and assessmentId are required' });
        return;
      }
      const result = await submitAssessmentWithAiWorkflow({
        profileId: String(profileId),
        assessmentId: String(assessmentId),
        quizAnswers: Array.isArray(quizAnswers) ? quizAnswers.map(Number) : [],
        submittedCode: submittedCode !== undefined ? String(submittedCode) : undefined,
        practicalAnswer: practicalAnswer !== undefined ? String(practicalAnswer) : undefined,
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to evaluate assessment' });
    }
  });

  router.post('/evaluations/submit', async (req: Request, res: Response) => {
    try {
      const { profileId, skillId, title, problemStatement, submittedCode, testNotes } = req.body ?? {};
      if (!profileId || !skillId || !title || !problemStatement || !submittedCode) {
        res.status(400).json({
          error: 'profileId, skillId, title, problemStatement, and submittedCode are required',
        });
        return;
      }
      const result = await evaluateProjectSubmissionWorkflow({
        profileId: String(profileId),
        skillId: String(skillId),
        title: String(title),
        problemStatement: String(problemStatement),
        submittedCode: String(submittedCode),
        testNotes: typeof testNotes === 'string' ? testNotes : undefined,
      });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to evaluate project submission',
      });
    }
  });

  router.get('/evaluations/history/:profileId', (req: Request, res: Response) => {
    try {
      const profileId = String(req.params.profileId);
      if (profileId === 'twin_demo_maya') ensureSeededDemoTwin();
      if (!getProfileById(profileId)) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      res.json(getEvaluationHistoryWorkflow(profileId));
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to load evaluation history',
      });
    }
  });

  router.get('/evaluations/compare', (req: Request, res: Response) => {
    try {
      const baselineId = String(req.query.baselineId ?? '');
      const targetId = String(req.query.targetId ?? '');
      if (!baselineId || !targetId) {
        res.status(400).json({ error: 'baselineId and targetId query parameters are required' });
        return;
      }
      const baseline = getEvaluationAttemptById(baselineId);
      const target = getEvaluationAttemptById(targetId);
      if (!baseline || !target) {
        res.status(404).json({ error: 'One or both evaluation attempts were not found' });
        return;
      }
      res.json(compareEvaluationAttempts(baseline, target));
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to compare evaluation attempts',
      });
    }
  });

  router.get('/evaluations/leaderboard', (req: Request, res: Response) => {
    try {
      ensureSeededDemoTwin();
      const profileId = req.query.profileId ? String(req.query.profileId) : undefined;
      res.json(getEvaluationLeaderboardWorkflow(profileId));
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to load evaluation leaderboard',
      });
    }
  });

  router.post('/mentor', async (req: Request, res: Response) => {
    try {
      const { profileId, message } = req.body ?? {};
      if (!profileId || !message) {
        res.status(400).json({ error: 'profileId and message are required' });
        return;
      }
      if (!getProfileById(String(profileId))) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      const result = await mentorChatWorkflow(String(profileId), String(message));
      res.json(result);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : 'Mentor request failed' });
    }
  });

  router.get('/resources/youtube', async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '').trim();
    if (!q) {
      res.status(400).json({ error: 'Search query q is required' });
      return;
    }
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} tutorial course`)}`;
    const ytKey = process.env.YOUTUBE_API_KEY?.trim();

    if (!ytKey) {
      const payload: YouTubeSearchResult = {
        mode: 'verified_search_link',
        query: q,
        searchUrl,
        videos: [],
        notice:
          'YOUTUBE_API_KEY is not configured. Use the verified YouTube search link below to open live tutorials directly on YouTube (no fabricated video links).',
      };
      res.json(payload);
      return;
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(
        `${q} tutorial course`
      )}&key=${encodeURIComponent(ytKey)}`;
      const ytRes = await fetch(url);
      if (!ytRes.ok) {
        throw new Error(`YouTube API returned status ${ytRes.status}`);
      }
      const ytJson = (await ytRes.json()) as {
        items?: Array<{
          id?: { videoId?: string };
          snippet?: { title?: string; channelTitle?: string; publishedAt?: string };
        }>;
      };
      const videos = (ytJson.items ?? [])
        .filter((it) => it.id?.videoId)
        .map((it) => ({
          videoId: it.id!.videoId!,
          title: it.snippet?.title ?? 'YouTube Tutorial',
          channelTitle: it.snippet?.channelTitle ?? 'YouTube',
          url: `https://www.youtube.com/watch?v=${it.id!.videoId!}`,
          publishedAt: it.snippet?.publishedAt ?? '',
        }));

      const payload: YouTubeSearchResult = {
        mode: 'youtube_api',
        query: q,
        searchUrl,
        videos,
        notice: `Live YouTube Data API results for "${q}".`,
      };
      res.json(payload);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'YouTube API search failed',
        searchUrl,
      });
    }
  });

  router.get('/trace/:id', (req: Request, res: Response) => {
    const id = String(req.params.id);
    res.json({
      profileId: id,
      traces: getTracesByProfileId(id),
      diffs: getReplanDiffs(id),
    });
  });

  router.get('/admin/cohort', (_req, res) => {
    res.json(computeCohortOverview());
  });

  router.get('/opportunities', (req: Request, res: Response) => {
    try {
      const profileId = String(req.query.profileId || 'twin_demo_maya');
      if (profileId === 'twin_demo_maya') ensureSeededDemoTwin();
      res.json(getOpportunitiesOverviewWorkflow(profileId));
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'Opportunities unavailable' });
    }
  });

  router.post('/opportunities/explain', async (req: Request, res: Response) => {
    try {
      const { profileId, channelTitle, platform, opportunityType } = req.body ?? {};
      if (!profileId || !channelTitle || !platform) {
        res.status(400).json({ error: 'profileId, channelTitle, and platform are required' });
        return;
      }
      const twin = buildTwinSnapshot(String(profileId));
      if (!twin) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      const insight = await explainOpportunityWithGemini({
        twin,
        channelTitle: String(channelTitle),
        platform: String(platform),
        opportunityType: opportunityType === 'internship' ? 'internship' : 'job',
      });
      res.json(insight);
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        res.status(err.status).json({ error: err.message, code: err.code });
        return;
      }
      res.status(500).json({ error: err instanceof Error ? err.message : 'Opportunity insight failed' });
    }
  });

  router.post('/applications', (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      if (!body.profileId || !body.opportunityId || !body.title || !body.company) {
        res.status(400).json({ error: 'profileId, opportunityId, title, and company are required' });
        return;
      }
      const result = upsertApplicationWorkflow({
        profileId: String(body.profileId),
        opportunityId: String(body.opportunityId),
        opportunityType: (body.opportunityType || 'job') as OpportunityType,
        title: String(body.title),
        company: String(body.company),
        domainId: (body.domainId || 'information_technology') as CareerDomainId,
        compensationLabel: String(body.compensationLabel || 'Not specified'),
        currency: body.currency === 'USD' || body.currency === 'OTHER' ? body.currency : 'INR',
        sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : '',
        status: (body.status || 'Applied') as ApplicationStatus,
        notes: typeof body.notes === 'string' ? body.notes : undefined,
      });
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to save application' });
    }
  });

  router.delete('/applications/:id', (req: Request, res: Response) => {
    try {
      const profileId = String(req.query.profileId || req.body?.profileId || 'twin_demo_maya');
      const overview = deleteApplicationWorkflow(profileId, String(req.params.id));
      res.json({ overview });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to delete application' });
    }
  });
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  ensureSeededDemoTwin();

  const apiRouter = express.Router();
  registerApiRoutes(apiRouter);
  app.use('/api', apiRouter);

  const rootApiGuard = (req: Request, _res: Response, next: NextFunction) => {
    const acceptsHtml = req.method === 'GET' && (req.headers.accept || '').includes('text/html');
    if (acceptsHtml) {
      next('router');
      return;
    }
    next();
  };
  const rootApiRouter = express.Router();
  rootApiRouter.use(rootApiGuard);
  registerApiRoutes(rootApiRouter);
  app.use(rootApiRouter);

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve('dist'));
  if (isProd) {
    const distDir = path.resolve('dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SKILLORA server listening on http://0.0.0.0:${port} (AI Mode: ${getActiveAIMode()})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

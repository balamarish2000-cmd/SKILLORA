import type {
  AIMode,
  ApplicationStatus,
  AssessmentStartResponse,
  AssessmentSubmitResponse,
  AuthUser,
  CareerDomain,
  CareerDomainId,
  CareerTransitionSimulation,
  CohortOverview,
  EducationEntry,
  EvaluationAttemptComparison,
  EvaluationHistoryResponse,
  EvaluationLeaderboardResponse,
  EvaluationReport,
  JobApplication,
  LearningPlanMode,
  LearningResource,
  MentorMessage,
  OpportunitiesOverview,
  OpportunityInsightResult,
  OpportunityType,
  ParsedSkill,
  ProjectEntry,
  ResumeImproveResult,
  RoadmapStepStatus,
  RoleId,
  SkillDefinition,
  TargetRole,
  TwinSnapshot,
  YouTubeSearchResult,
} from './shared/types';
import type { SampleResumePreset } from './shared/seedData';

export interface CatalogResponse {
  domains: CareerDomain[];
  roles: TargetRole[];
  skills: SkillDefinition[];
  resources: LearningResource[];
  sampleResumes: SampleResumePreset[];
  aiMode: AIMode;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response fallback
  }
  if (!res.ok) {
    const errMsg = typeof data?.error === 'string' ? data.error : `Request failed with status ${res.status}`;
    throw new Error(errMsg);
  }
  return data as T;
}

export const api = {
  getCatalog: () => requestJson<CatalogResponse>('/api/catalog'),
  getDemoTwin: () => requestJson<TwinSnapshot>('/api/demo-twin'),
  getProfile: (id: string) => requestJson<TwinSnapshot>(`/api/profile/${encodeURIComponent(id)}`),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    targetRoleId?: RoleId;
    currentDomainId?: CareerDomainId;
    specialization?: string;
    preferredLocation?: string;
  }) =>
    requestJson<{ user: AuthUser; twin: TwinSnapshot }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    requestJson<{ user: AuthUser; twin: TwinSnapshot }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  parseResume: (resumeText: string) =>
    requestJson<{
      name?: string;
      currentTitle?: string;
      currentDomainId?: CareerDomainId;
      experienceYears?: number;
      education?: EducationEntry[];
      skills: ParsedSkill[];
      certifications: string[];
      projects: ProjectEntry[];
      aiMode: AIMode;
    }>('/api/profile/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    }),
  createProfile: (payload: {
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
    weeklyHours: number;
    expectedAnnualSalaryInr?: number;
    minimumExpectedSalaryInr?: number;
    rawResumeText: string;
    skills?: ParsedSkill[];
    certifications?: string[];
    projects?: ProjectEntry[];
  }) =>
    requestJson<TwinSnapshot>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateResumeProfile: (payload: {
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
  }) =>
    requestJson<TwinSnapshot>('/api/profile/resume-update', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  improveResume: (payload: {
    profileId: string;
    targetSection: 'summary' | 'project' | 'tailor';
    currentText: string;
    projectTitle?: string;
  }) =>
    requestJson<ResumeImproveResult>('/api/resume/improve', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGoal: (payload: {
    profileId: string;
    targetRoleId: RoleId;
    weeklyHours?: number;
    skills?: ParsedSkill[];
    learningPlan?: LearningPlanMode;
    expectedAnnualSalaryInr?: number;
    minimumExpectedSalaryInr?: number;
    preferredLocation?: string;
    specialization?: string;
  }) =>
    requestJson<TwinSnapshot>('/api/goal', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  simulateTransition: (payload: {
    profileId: string;
    fromRoleId: RoleId;
    toRoleId: RoleId;
  }) =>
    requestJson<CareerTransitionSimulation>('/api/transition/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  applyTransition: (payload: {
    profileId: string;
    fromRoleId: RoleId;
    toRoleId: RoleId;
  }) =>
    requestJson<TwinSnapshot>('/api/transition/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProgress: (payload: {
    profileId: string;
    stepId: string;
    completed?: boolean;
    status?: RoadmapStepStatus;
  }) =>
    requestJson<TwinSnapshot>('/api/progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  startAssessment: (payload: { profileId: string; skillId: string }) =>
    requestJson<AssessmentStartResponse>('/api/assessment/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitAssessment: (payload: {
    profileId: string;
    assessmentId: string;
    quizAnswers: number[];
    submittedCode?: string;
    practicalAnswer?: string;
  }) =>
    requestJson<AssessmentSubmitResponse>('/api/assessment/submit-problem', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  evaluateProjectSubmission: (payload: {
    profileId: string;
    skillId: string;
    title: string;
    problemStatement: string;
    submittedCode: string;
    testNotes?: string;
  }) =>
    requestJson<{ report: EvaluationReport; twin: TwinSnapshot }>('/api/evaluations/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getEvaluationHistory: (profileId: string) =>
    requestJson<EvaluationHistoryResponse>(`/api/evaluations/history/${encodeURIComponent(profileId)}`),
  compareEvaluationAttempts: (baselineId: string, targetId: string) =>
    requestJson<EvaluationAttemptComparison>(
      `/api/evaluations/compare?baselineId=${encodeURIComponent(baselineId)}&targetId=${encodeURIComponent(targetId)}`
    ),
  getEvaluationLeaderboard: (profileId?: string) =>
    requestJson<EvaluationLeaderboardResponse>(
      profileId
        ? `/api/evaluations/leaderboard?profileId=${encodeURIComponent(profileId)}`
        : '/api/evaluations/leaderboard'
    ),
  sendMentorMessage: (payload: { profileId: string; message: string }) =>
    requestJson<{ message: MentorMessage; twin: TwinSnapshot }>('/api/mentor', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  searchYouTubeResources: (query: string) =>
    requestJson<YouTubeSearchResult>(`/api/resources/youtube?q=${encodeURIComponent(query)}`),
  getCohortOverview: () => requestJson<CohortOverview>('/api/admin/cohort'),
  getOpportunities: (profileId: string) =>
    requestJson<OpportunitiesOverview>(`/api/opportunities?profileId=${encodeURIComponent(profileId)}`),
  explainOpportunity: (payload: {
    profileId: string;
    channelTitle: string;
    platform: string;
    opportunityType: OpportunityType;
  }) =>
    requestJson<OpportunityInsightResult>('/api/opportunities/explain', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  saveApplication: (payload: {
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
  }) =>
    requestJson<{ application: JobApplication; overview: OpportunitiesOverview }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteApplication: (profileId: string, applicationId: string) =>
    requestJson<{ overview: OpportunitiesOverview }>(
      `/api/applications/${encodeURIComponent(applicationId)}?profileId=${encodeURIComponent(profileId)}`,
      { method: 'DELETE' }
    ),
};

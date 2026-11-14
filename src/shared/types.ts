export type AIMode = 'gemini' | 'deterministic_fallback';

export type SkillEvidenceSource =
  | 'resume_extracted'
  | 'self_reported'
  | 'assessment_verified'
  | 'project_evidence';

export type CareerDomainId =
  | 'information_technology'
  | 'medical_healthcare'
  | 'mechanical_engineering'
  | 'electronics_electrical'
  | 'robotics_automation'
  | 'civil_architecture'
  | 'science_research'
  | 'business_management'
  | 'design_creative'
  | 'education_teaching'
  | 'finance_accounting'
  | 'agriculture_environmental';

export type RoleId = string;

export type LearningPlanMode = 'fast_track' | 'balanced' | 'deep_mastery';

export type ResourceType =
  | 'course'
  | 'documentation'
  | 'tutorial'
  | 'practice'
  | 'textbook';

export type ResourceDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type RoadmapStepStatus = 'not_started' | 'in_progress' | 'completed';

export type DomainAssessmentType =
  | 'coding'
  | 'coding_challenge'
  | 'medical_case'
  | 'engineering_calc'
  | 'circuit_logic'
  | 'robotics_logic'
  | 'structural_calc'
  | 'science_experiment'
  | 'business_case'
  | 'design_critique'
  | 'education_case'
  | 'finance_case'
  | 'agriculture_case';

export type AssessmentDomainType = DomainAssessmentType;

export interface CareerDomain {
  id: CareerDomainId;
  name: string;
  shortName: string;
  description: string;
  qualificationNote?: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  domainId: CareerDomainId;
  category: string;
  prerequisites: string[];
  description: string;
  practicalIndicator: string;
  assessmentMethod: string;
}

export interface RoleSkillRequirement {
  skillId: string;
  targetLevel: number; // 1-5
  weight: number; // 1-5 importance
  requirementType: 'foundational' | 'required' | 'advanced' | 'optional';
}

export type RoleRequirement = RoleSkillRequirement;

export interface TargetRole {
  id: RoleId;
  domainId: CareerDomainId;
  title: string;
  specialization: string;
  summary: string;
  avgSalaryRange: string;
  demandLevel: 'Moderate' | 'High' | 'Very High' | 'Critical';
  demandGrowthPct: number;
  educationNote: string;
  requirements: RoleSkillRequirement[];
}

export interface LearningResource {
  id: string;
  skillId: string;
  domainId: CareerDomainId;
  title: string;
  provider: string;
  url: string;
  verified: boolean;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  hours: number;
}

export interface ParsedSkill {
  skillId: string;
  skillName: string;
  level: number; // 0-5
  confidence: number; // 0-1
  source: SkillEvidenceSource;
  evidence: string;
}

export interface EducationEntry {
  degree: string;
  field: string;
  institution: string;
  year?: string;
}

export interface ProjectEntry {
  title: string;
  summary: string;
  skills: string[];
}

export interface CareerTransitionRecord {
  id: string;
  fromRoleId: RoleId;
  fromRoleTitle: string;
  toRoleId: RoleId;
  toRoleTitle: string;
  readinessAtSwitch: number;
  timestamp: string;
}

export interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  currentTitle: string;
  currentDomainId: CareerDomainId;
  currentRoleId?: RoleId;
  specialization?: string;
  preferredLocation?: string;
  careerInterests?: string[];
  experienceYears: number;
  education: EducationEntry[];
  targetRoleId: RoleId;
  learningPlan: LearningPlanMode;
  weeklyHours: number;
  expectedAnnualSalaryInr: number;
  minimumExpectedSalaryInr: number;
  rawResumeText: string;
  skills: ParsedSkill[];
  certifications: string[];
  projects: ProjectEntry[];
  transitionHistory: CareerTransitionRecord[];
  aiMode: AIMode;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  domainId: CareerDomainId;
  category: string;
  requirementType: RoleSkillRequirement['requirementType'];
  currentLevel: number;
  targetLevel: number;
  gap: number;
  weight: number;
  confidence: number;
  source: SkillEvidenceSource | 'unassessed';
  evidence: string;
  priorityScore: number;
  status: 'met' | 'partial' | 'missing';
  prerequisites: string[];
  missingPrerequisites: string[];
}

export interface SkillAnalysis {
  profileId: string;
  targetRoleId: RoleId;
  targetRoleTitle: string;
  targetDomainId: CareerDomainId;
  overallReadiness: number; // 0-100
  averageConfidence: number; // 0-1
  strengths: SkillGapItem[];
  gaps: SkillGapItem[];
  optionalGaps: SkillGapItem[];
  allSkillComparisons: SkillGapItem[];
  generatedAt: string;
}

export interface CareerMatchItem {
  roleId: RoleId;
  roleTitle: string;
  domainId: CareerDomainId;
  domainName: string;
  readinessPct: number;
  matchedSkillsCount: number;
  totalRequiredSkills: number;
  topMissingSkills: string[];
  transferableSkills: string[];
  avgSalaryRange: string;
  demandLevel: TargetRole['demandLevel'];
  demandGrowthPct: number;
  isCurrentGoal: boolean;
  summary: string;
}

export interface RoadmapStep {
  id: string;
  order: number;
  skillId: string;
  skillName: string;
  domainId: CareerDomainId;
  category: string;
  learningObjective: string;
  currentLevel: number;
  targetLevel: number;
  resourceId: string;
  resourceTitle: string;
  provider: string;
  url: string;
  verified: boolean;
  resourceType: ResourceType;
  difficulty: ResourceDifficulty;
  hours: number;
  practicalAssignment: string;
  assessmentCheckpoint: string;
  status?: RoadmapStepStatus;
  completed: boolean;
  completedAt: string | null;
  isRemediation: boolean;
  reason: string;
  prerequisites: string[];
  gapSeverity: number;
}

export interface ReplanDiffItem {
  skillId: string;
  skillName: string;
  resourceTitle: string;
  changeType: 'added' | 'removed' | 'reordered';
  previousOrder?: number;
  newOrder?: number;
  reason: string;
}

export interface ReplanDiff {
  id: string;
  profileId: string;
  trigger:
    | 'initial_build'
    | 'goal_change'
    | 'plan_change'
    | 'assessment_failed'
    | 'assessment_passed'
    | 'skill_update'
    | 'manual_replan';
  triggerDetail: string;
  previousGoalRole?: string;
  newGoalRole?: string;
  previousPlanSummary: string[];
  newPlanSummary: string[];
  added: ReplanDiffItem[];
  removed: ReplanDiffItem[];
  reordered: ReplanDiffItem[];
  totalHoursBefore: number;
  totalHoursAfter: number;
  createdAt: string;
}

export interface ProgressMetrics {
  profileId: string;
  learningPlan: LearningPlanMode;
  totalSteps: number;
  completedSteps: number;
  inProgressSteps?: number;
  completionPct: number;
  totalHours: number;
  completedHours: number;
  remainingHours: number;
  weeklyHours: number;
  dailyHours: number;
  estimatedWeeksRemaining: number;
  forecastedReadyDate: string;
  paceStatus: 'Ahead' | 'On Track' | 'Needs Acceleration';
}

export interface CareerTransitionSimulation {
  fromRoleId: RoleId;
  fromRoleTitle: string;
  fromDomainName: string;
  toRoleId: RoleId;
  toRoleTitle: string;
  toDomainName: string;
  fromReadinessPct: number;
  toReadinessBeforeTransitionPct: number;
  transferableSkills: Array<{
    skillId: string;
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    reuseNote: string;
  }>;
  missingSkills: Array<{
    skillId: string;
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    priority: 'Foundational' | 'Core' | 'Advanced';
  }>;
  qualificationRequirements: string;
  estimatedHours: number;
  estimatedWeeks: number;
  suggestedRoadmap: RoadmapStep[];
}

export interface QuizQuestion {
  id: string;
  skillId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodingTestCase {
  id: string;
  description: string;
  inputJson: string;
  expectedJson: string;
}

export interface CodingChallenge {
  id: string;
  skillId: string;
  skillName?: string;
  language?: string;
  title: string;
  description: string;
  functionName: string;
  starterCode: string;
  solutionHint: string;
  testCases: CodingTestCase[];
}

export interface DomainPracticalTask {
  id: string;
  skillId: string;
  skillName?: string;
  domainId: CareerDomainId;
  assessmentType: DomainAssessmentType;
  title: string;
  scenarioPrompt: string;
  questionPrompt: string;
  inputMode: 'numeric' | 'single_choice' | 'scenario_choice';
  expectedNumericValue?: number;
  numericTolerance?: number;
  unitLabel?: string;
  options?: string[];
  correctOptionIndex?: number;
  referenceSampleAnswer: string;
  solutionExplanation: string;
  safetyDisclaimer?: string;
}

export interface TestCaseExecutionResult {
  testCaseId: string;
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export interface AssessmentStartResponse {
  assessmentId: string;
  skillId: string;
  skillName: string;
  domainId: CareerDomainId;
  domainName: string;
  assessmentType: DomainAssessmentType;
  safetyDisclaimer?: string;
  questions: QuizQuestion[];
  challenge: CodingChallenge | null;
  practicalTask: DomainPracticalTask | null;
  aiMode: AIMode;
}

export interface AssessmentAttempt {
  id: string;
  profileId: string;
  skillId: string;
  skillName: string;
  quizScore: number;
  practicalScore: number;
  combinedScore: number;
  passed: boolean;
  replanTriggered: boolean;
  updatedSkillLevel: number;
  timestamp: string;
}

export interface AssessmentSubmitResponse {
  assessmentId: string;
  profileId: string;
  skillId: string;
  skillName: string;
  quizScore: number;
  practicalScore: number;
  combinedScore: number;
  passed: boolean;
  testResults: TestCaseExecutionResult[];
  practicalFeedback: string;
  stdout: string[];
  updatedSkillLevel: number;
  replanTriggered: boolean;
  replanDiff: ReplanDiff | null;
  analysis: SkillAnalysis;
  roadmap: RoadmapStep[];
  progress: ProgressMetrics;
}

export interface AgentToolExecution {
  toolName: string;
  args: Record<string, unknown>;
  resultSummary: string;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecutions: AgentToolExecution[];
  invokedAgents?: string[];
  aiMode: AIMode;
  createdAt: string;
}

export interface AgentTraceEvent {
  id: string;
  profileId: string;
  agentName:
    | 'Profile Agent'
    | 'Skill Analyst'
    | 'Career Matcher'
    | 'Curator'
    | 'Assessor'
    | 'Progress Tracker'
    | 'Mentor'
    | 'Orchestrator';
  action: string;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  aiMode: AIMode;
  status: 'ok' | 'fallback' | 'replan_triggered';
  createdAt: string;
}

export interface CohortLearner {
  id: string;
  name: string;
  cohortName: string;
  domainId: CareerDomainId;
  domainName: string;
  targetRoleId: RoleId;
  targetRoleTitle: string;
  readinessPct: number;
  roadmapCompletionPct: number;
  weeklyHours: number;
  lastActiveDaysAgo: number;
  riskLevel: 'On Track' | 'Watch' | 'At Risk';
  topBottleneckSkill: string;
  missingSkills: string[];
  failedAssessmentsCount: number;
}

export interface CohortOverview {
  isSyntheticDemo: boolean;
  notice: string;
  totalLearners: number;
  avgReadinessPct: number;
  atRiskCount: number;
  watchCount: number;
  onTrackCount: number;
  bottleneckSkills: Array<{ skillName: string; affectedLearners: number }>;
  domainDistribution: Array<{
    domainId: CareerDomainId;
    domainName: string;
    count: number;
    avgReadiness: number;
  }>;
  industryDemand: Array<{
    roleTitle: string;
    domainName: string;
    demandLevel: TargetRole['demandLevel'];
    growthPct: number;
    avgSalaryRange: string;
  }>;
  learners: CohortLearner[];
}

export type OpportunityType = 'job' | 'internship';

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Withdrawn';

export interface VerifiedSearchChannel {
  id: string;
  platform: string;
  type: OpportunityType;
  channelTitle: string;
  description: string;
  searchQuery: string;
  locationLabel: string;
  url: string;
  supportsDomains: CareerDomainId[] | 'all';
}

export interface JobApplication {
  id: string;
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
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitiesOverview {
  profileId: string;
  targetRoleId: RoleId;
  targetRoleTitle: string;
  targetDomainId: CareerDomainId;
  targetRoleSalaryRange: string;
  preferredLocation: string;
  expectedAnnualSalaryInr: number;
  minimumExpectedSalaryInr: number;
  liveFeedConnected: boolean;
  sourceNotice: string;
  channels: VerifiedSearchChannel[];
  applications: JobApplication[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileId: string;
}

export interface ResumeImproveResult {
  targetSection: 'summary' | 'project' | 'tailor';
  improvedText: string;
  rationale: string;
  aiMode: 'gemini';
}

export interface OpportunityInsightResult {
  explanation: string;
  preparationSteps: string[];
  matchedSkills: string[];
  focusGaps: string[];
  aiMode: 'gemini';
}

export interface YouTubeSearchResult {
  mode: 'youtube_api' | 'verified_search_link';
  query: string;
  searchUrl: string;
  videos: Array<{
    videoId: string;
    title: string;
    channelTitle: string;
    url: string;
    publishedAt: string;
  }>;
  notice: string;
}

export interface TwinSnapshot {
  profile: LearnerProfile;
  analysis: SkillAnalysis;
  matches: CareerMatchItem[];
  roadmap: RoadmapStep[];
  progress: ProgressMetrics;
  latestDiff: ReplanDiff | null;
  diffHistory: ReplanDiff[];
  assessmentHistory: AssessmentAttempt[];
  mentorHistory: MentorMessage[];
  traces: AgentTraceEvent[];
  aiMode: AIMode;
}

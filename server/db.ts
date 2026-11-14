import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { generateCohortLearners } from '../src/shared/seedData.ts';
import type {
  AIMode,
  ActionableCategoryFeedback,
  AgentTraceEvent,
  ApplicationStatus,
  AssessmentAttempt,
  AssessmentSubmitResponse,
  CareerDomainId,
  CohortLearner,
  EvaluationAttemptRecord,
  EvaluationCategoryKey,
  EvaluationCategoryResult,
  EvaluationCheckRecord,
  EvaluationReport,
  JobApplication,
  LearnerProfile,
  LearningPlanMode,
  MentorMessage,
  OpportunityType,
  PerformanceClassification,
  ReplanDiff,
  RoadmapStep,
} from '../src/shared/types.ts';

let dbInstance: DatabaseSync | null = null;

function ensureTableColumns(
  db: DatabaseSync,
  tableName: string,
  additions: Array<[string, string]>
): void {
  const cols = db.prepare(`PRAGMA table_info('${tableName}')`).all() as Array<{ name: string }>;
  const colNames = new Set(cols.map((c) => c.name));
  for (const [col, def] of additions) {
    if (!colNames.has(col)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col} ${def}`);
    }
  }
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const rawDbPath = (process.env.DATABASE_PATH ?? '').trim();
  const dbPath = rawDbPath || './data/skillora.db';
  const dir = path.dirname(dbPath);
  if (dbPath !== ':memory:' && dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      current_title TEXT NOT NULL,
      current_domain_id TEXT NOT NULL DEFAULT 'information_technology',
      current_role_id TEXT,
      specialization TEXT NOT NULL DEFAULT '',
      preferred_location TEXT NOT NULL DEFAULT 'India',
      career_interests_json TEXT NOT NULL DEFAULT '[]',
      experience_years REAL NOT NULL,
      education_json TEXT NOT NULL DEFAULT '[]',
      target_role_id TEXT NOT NULL,
      learning_plan TEXT NOT NULL DEFAULT 'balanced',
      weekly_hours REAL NOT NULL,
      expected_annual_salary_inr INTEGER NOT NULL DEFAULT 1200000,
      minimum_expected_salary_inr INTEGER NOT NULL DEFAULT 800000,
      raw_resume_text TEXT NOT NULL,
      skills_json TEXT NOT NULL,
      certifications_json TEXT NOT NULL,
      projects_json TEXT NOT NULL,
      transition_history_json TEXT NOT NULL DEFAULT '[]',
      ai_mode TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmaps (
      profile_id TEXT PRIMARY KEY,
      steps_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS replan_diffs (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      diff_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      result_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_traces (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      input_summary TEXT NOT NULL,
      output_summary TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      ai_mode TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mentor_messages (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_executions_json TEXT NOT NULL,
      invoked_agents_json TEXT NOT NULL DEFAULT '[]',
      ai_mode TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cohort_learners (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      opportunity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      domain_id TEXT NOT NULL,
      compensation_label TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      source_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      applied_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(profile_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS evaluation_attempts (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      submission_type TEXT NOT NULL,
      submission_title TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      overall_score REAL NOT NULL,
      performance_classification TEXT NOT NULL,
      evaluation_status TEXT NOT NULL,
      quiz_score REAL NOT NULL,
      practical_score REAL NOT NULL,
      combined_score REAL NOT NULL,
      passed INTEGER NOT NULL,
      replan_triggered INTEGER NOT NULL,
      updated_skill_level REAL NOT NULL,
      ai_mode TEXT NOT NULL,
      checks_executed_json TEXT NOT NULL DEFAULT '[]',
      summary_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluation_category_scores (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      category_key TEXT NOT NULL,
      category_label TEXT NOT NULL,
      weight_pct REAL NOT NULL,
      score REAL NOT NULL,
      weighted_contribution REAL NOT NULL,
      performance_label TEXT NOT NULL,
      applicable INTEGER NOT NULL DEFAULT 1,
      strengths_json TEXT NOT NULL,
      weaknesses_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      feedback_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(attempt_id) REFERENCES evaluation_attempts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_eval_attempts_profile ON evaluation_attempts(profile_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_eval_cat_attempt ON evaluation_category_scores(attempt_id);
  `);

  ensureTableColumns(db, 'profiles', [
    ['current_domain_id', "TEXT NOT NULL DEFAULT 'information_technology'"],
    ['current_role_id', 'TEXT'],
    ['specialization', "TEXT NOT NULL DEFAULT ''"],
    ['preferred_location', "TEXT NOT NULL DEFAULT 'India'"],
    ['career_interests_json', "TEXT NOT NULL DEFAULT '[]'"],
    ['education_json', "TEXT NOT NULL DEFAULT '[]'"],
    ['learning_plan', "TEXT NOT NULL DEFAULT 'balanced'"],
    ['expected_annual_salary_inr', 'INTEGER NOT NULL DEFAULT 1200000'],
    ['minimum_expected_salary_inr', 'INTEGER NOT NULL DEFAULT 800000'],
    ['transition_history_json', "TEXT NOT NULL DEFAULT '[]'"],
  ]);

  ensureTableColumns(db, 'mentor_messages', [
    ['invoked_agents_json', "TEXT NOT NULL DEFAULT '[]'"],
  ]);

  ensureTableColumns(db, 'applications', [
    ['currency', "TEXT NOT NULL DEFAULT 'INR'"],
    ['source_url', "TEXT NOT NULL DEFAULT ''"],
  ]);

  // Seed or upgrade synthetic cohort learners across all 12 domains
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM cohort_learners').get() as { cnt: number };
  let needsCohortReseed = countRow.cnt === 0;
  if (!needsCohortReseed) {
    const sampleRow = db.prepare('SELECT data_json FROM cohort_learners LIMIT 1').get() as
      | { data_json: string }
      | undefined;
    if (sampleRow) {
      try {
        const parsed = JSON.parse(sampleRow.data_json) as Partial<CohortLearner>;
        if (!parsed.domainId || countRow.cnt < 48) {
          needsCohortReseed = true;
        }
      } catch {
        needsCohortReseed = true;
      }
    }
  }

  if (needsCohortReseed) {
    db.exec('DELETE FROM cohort_learners');
    const learners = generateCohortLearners();
    const stmt = db.prepare('INSERT INTO cohort_learners (id, data_json) VALUES (?, ?)');
    for (const learner of learners) {
      stmt.run(learner.id, JSON.stringify(learner));
    }
  }

  dbInstance = db;
  return db;
}

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  profileId: string;
  createdAt: string;
}

export function createUserRecord(user: StoredUserRecord): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, profile_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name, user.email.toLowerCase(), user.passwordHash, user.profileId, user.createdAt);
}

export function getUserByEmail(email: string): StoredUserRecord | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    profileId: String(row.profile_id),
    createdAt: String(row.created_at),
  };
}

export function saveProfile(profile: LearnerProfile): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO profiles (
      id, name, email, current_title, current_domain_id, current_role_id,
      specialization, preferred_location, career_interests_json,
      experience_years, education_json, target_role_id, learning_plan,
      weekly_hours, expected_annual_salary_inr, minimum_expected_salary_inr,
      raw_resume_text, skills_json, certifications_json,
      projects_json, transition_history_json, ai_mode, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      current_title = excluded.current_title,
      current_domain_id = excluded.current_domain_id,
      current_role_id = excluded.current_role_id,
      specialization = excluded.specialization,
      preferred_location = excluded.preferred_location,
      career_interests_json = excluded.career_interests_json,
      experience_years = excluded.experience_years,
      education_json = excluded.education_json,
      target_role_id = excluded.target_role_id,
      learning_plan = excluded.learning_plan,
      weekly_hours = excluded.weekly_hours,
      expected_annual_salary_inr = excluded.expected_annual_salary_inr,
      minimum_expected_salary_inr = excluded.minimum_expected_salary_inr,
      raw_resume_text = excluded.raw_resume_text,
      skills_json = excluded.skills_json,
      certifications_json = excluded.certifications_json,
      projects_json = excluded.projects_json,
      transition_history_json = excluded.transition_history_json,
      ai_mode = excluded.ai_mode,
      updated_at = excluded.updated_at
  `).run(
    profile.id,
    profile.name,
    profile.email,
    profile.currentTitle,
    profile.currentDomainId ?? 'information_technology',
    profile.currentRoleId ?? null,
    profile.specialization ?? '',
    profile.preferredLocation ?? 'India',
    JSON.stringify(profile.careerInterests ?? []),
    profile.experienceYears,
    JSON.stringify(profile.education ?? []),
    profile.targetRoleId,
    profile.learningPlan ?? 'balanced',
    profile.weeklyHours,
    Math.round(profile.expectedAnnualSalaryInr ?? 1200000),
    Math.round(profile.minimumExpectedSalaryInr ?? 800000),
    profile.rawResumeText,
    JSON.stringify(profile.skills),
    JSON.stringify(profile.certifications),
    JSON.stringify(profile.projects),
    JSON.stringify(profile.transitionHistory ?? []),
    profile.aiMode,
    profile.createdAt,
    profile.updatedAt
  );
}

export function getProfileById(id: string): LearnerProfile | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const rawSkills = JSON.parse(String(row.skills_json)) as Array<Record<string, unknown>>;
  const normalizedSkills = rawSkills.map((s) => ({
    skillId: String(s.skillId),
    skillName: String(s.skillName),
    level: Number(s.level ?? 0),
    confidence: Number(s.confidence ?? 0.7),
    source: (s.source as LearnerProfile['skills'][number]['source']) || 'resume_extracted',
    evidence: String(s.evidence ?? 'Parsed skill entry'),
  }));

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    currentTitle: String(row.current_title),
    currentDomainId: (row.current_domain_id ? String(row.current_domain_id) : 'information_technology') as CareerDomainId,
    currentRoleId: row.current_role_id ? String(row.current_role_id) : undefined,
    specialization: row.specialization ? String(row.specialization) : '',
    preferredLocation: row.preferred_location ? String(row.preferred_location) : 'India',
    careerInterests: row.career_interests_json ? JSON.parse(String(row.career_interests_json)) : [],
    experienceYears: Number(row.experience_years),
    education: row.education_json ? JSON.parse(String(row.education_json)) : [],
    targetRoleId: String(row.target_role_id) as LearnerProfile['targetRoleId'],
    learningPlan: (row.learning_plan ? String(row.learning_plan) : 'balanced') as LearningPlanMode,
    weeklyHours: Number(row.weekly_hours),
    expectedAnnualSalaryInr: Number(row.expected_annual_salary_inr ?? 1200000),
    minimumExpectedSalaryInr: Number(row.minimum_expected_salary_inr ?? 800000),
    rawResumeText: String(row.raw_resume_text),
    skills: normalizedSkills,
    certifications: JSON.parse(String(row.certifications_json)),
    projects: JSON.parse(String(row.projects_json)),
    transitionHistory: row.transition_history_json ? JSON.parse(String(row.transition_history_json)) : [],
    aiMode: String(row.ai_mode) as LearnerProfile['aiMode'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listProfiles(): LearnerProfile[] {
  const db = getDb();
  const rows = db.prepare('SELECT id FROM profiles ORDER BY updated_at DESC').all() as Array<{ id: string }>;
  return rows.map((r) => getProfileById(r.id)).filter((p): p is LearnerProfile => p !== null);
}

export function saveRoadmap(profileId: string, steps: RoadmapStep[]): void {
  const db = getDb();
  const now = new Date().toISOString();
  const normalized = steps.map((s) => ({
    ...s,
    status: s.status ?? (s.completed ? 'completed' : 'not_started'),
    completed: s.status === 'completed' || s.completed,
  }));
  db.prepare(`
    INSERT INTO roadmaps (profile_id, steps_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(profile_id) DO UPDATE SET
      steps_json = excluded.steps_json,
      updated_at = excluded.updated_at
  `).run(profileId, JSON.stringify(normalized), now);
}

export function getRoadmapByProfileId(profileId: string): RoadmapStep[] {
  const db = getDb();
  const row = db.prepare('SELECT steps_json FROM roadmaps WHERE profile_id = ?').get(profileId) as
    | { steps_json: string }
    | undefined;
  if (!row) return [];
  const parsed = JSON.parse(row.steps_json) as RoadmapStep[];
  return parsed.map((s) => ({
    ...s,
    status: s.status ?? (s.completed ? 'completed' : 'not_started'),
  }));
}

export function saveReplanDiff(diff: ReplanDiff): void {
  const db = getDb();
  db.prepare('INSERT INTO replan_diffs (id, profile_id, diff_json, created_at) VALUES (?, ?, ?, ?)').run(
    diff.id,
    diff.profileId,
    JSON.stringify(diff),
    diff.createdAt
  );
}

export function getReplanDiffs(profileId: string): ReplanDiff[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT diff_json FROM replan_diffs WHERE profile_id = ? ORDER BY created_at DESC LIMIT 25')
    .all(profileId) as Array<{ diff_json: string }>;
  return rows.map((r) => JSON.parse(r.diff_json) as ReplanDiff);
}

export function saveAssessmentRecord(
  id: string,
  profileId: string,
  skillId: string,
  payload: unknown
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO assessments (id, profile_id, skill_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, profileId, skillId, JSON.stringify(payload), new Date().toISOString());
}

export function getAssessmentRecord(id: string): { id: string; profileId: string; skillId: string; payload: unknown } | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    skillId: String(row.skill_id),
    payload: JSON.parse(String(row.payload_json)),
  };
}

export function updateAssessmentResult(id: string, result: unknown): void {
  const db = getDb();
  db.prepare('UPDATE assessments SET result_json = ? WHERE id = ?').run(JSON.stringify(result), id);
}

export function getNextAttemptNumber(profileId: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COALESCE(MAX(attempt_number), 0) as max_num FROM evaluation_attempts WHERE profile_id = ?')
    .get(profileId) as { max_num: number } | undefined;
  return Number(row?.max_num ?? 0) + 1;
}

export function saveEvaluationReport(params: {
  report: EvaluationReport;
  quizScore: number;
  practicalScore: number;
  combinedScore: number;
  passed: boolean;
  replanTriggered: boolean;
  updatedSkillLevel: number;
}): void {
  const db = getDb();
  const { report } = params;

  db.prepare(`
    INSERT INTO evaluation_attempts (
      id, profile_id, skill_id, skill_name, submission_type, submission_title,
      attempt_number, overall_score, performance_classification, evaluation_status,
      quiz_score, practical_score, combined_score, passed, replan_triggered,
      updated_skill_level, ai_mode, checks_executed_json, summary_note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      overall_score = excluded.overall_score,
      performance_classification = excluded.performance_classification,
      evaluation_status = excluded.evaluation_status,
      ai_mode = excluded.ai_mode,
      checks_executed_json = excluded.checks_executed_json,
      summary_note = excluded.summary_note
  `).run(
    report.attemptId,
    report.profileId,
    report.skillId,
    report.skillName,
    report.submissionType,
    report.submissionTitle,
    report.attemptNumber,
    report.overallScore,
    report.performanceClassification,
    report.evaluationStatus,
    params.quizScore,
    params.practicalScore,
    params.combinedScore,
    params.passed ? 1 : 0,
    params.replanTriggered ? 1 : 0,
    params.updatedSkillLevel,
    report.aiMode,
    JSON.stringify(report.checksExecuted),
    report.summaryNote,
    report.timestamp
  );

  db.prepare('DELETE FROM evaluation_category_scores WHERE attempt_id = ?').run(report.attemptId);

  const insertCat = db.prepare(`
    INSERT INTO evaluation_category_scores (
      id, attempt_id, profile_id, category_key, category_label, weight_pct, score,
      weighted_contribution, performance_label, applicable, strengths_json,
      weaknesses_json, recommendations_json, feedback_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of report.categories) {
    insertCat.run(
      `cat_${report.attemptId}_${cat.key}`,
      report.attemptId,
      report.profileId,
      cat.key,
      cat.label,
      cat.weightPct,
      cat.score,
      cat.weightedContribution,
      cat.performanceLabel,
      cat.applicable ? 1 : 0,
      JSON.stringify(cat.strengths),
      JSON.stringify(cat.weaknesses),
      JSON.stringify(cat.recommendations),
      JSON.stringify(cat.feedback),
      report.timestamp
    );
  }
}

function hydrateCategoryRows(rows: Array<Record<string, unknown>>): EvaluationCategoryResult[] {
  return rows.map((r) => ({
    key: String(r.category_key) as EvaluationCategoryKey,
    label: String(r.category_label),
    weightPct: Number(r.weight_pct),
    score: Number(r.score),
    weightedContribution: Number(r.weighted_contribution),
    performanceLabel: String(r.performance_label) as PerformanceClassification,
    applicable: Number(r.applicable) === 1,
    strengths: JSON.parse(String(r.strengths_json)) as string[],
    weaknesses: JSON.parse(String(r.weaknesses_json)) as string[],
    recommendations: JSON.parse(String(r.recommendations_json)) as string[],
    feedback: JSON.parse(String(r.feedback_json)) as ActionableCategoryFeedback,
  }));
}

function hydrateEvaluationAttemptRow(
  row: Record<string, unknown>,
  categories: EvaluationCategoryResult[]
): EvaluationAttemptRecord {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    skillId: String(row.skill_id),
    skillName: String(row.skill_name),
    submissionType: (String(row.submission_type) === 'project_code' ? 'project_code' : 'assessment'),
    submissionTitle: String(row.submission_title),
    attemptNumber: Number(row.attempt_number),
    overallScore: Number(row.overall_score),
    performanceClassification: String(row.performance_classification) as PerformanceClassification,
    evaluationStatus: String(row.evaluation_status) as EvaluationReport['evaluationStatus'],
    quizScore: Number(row.quiz_score),
    practicalScore: Number(row.practical_score),
    combinedScore: Number(row.combined_score),
    passed: Number(row.passed) === 1,
    replanTriggered: Number(row.replan_triggered) === 1,
    updatedSkillLevel: Number(row.updated_skill_level),
    aiMode: String(row.ai_mode) as AIMode,
    timestamp: String(row.created_at),
    categories,
    checksExecuted: JSON.parse(String(row.checks_executed_json || '[]')) as EvaluationCheckRecord[],
    summaryNote: String(row.summary_note || ''),
  };
}

export function getEvaluationAttemptsByProfileId(profileId: string): EvaluationAttemptRecord[] {
  const db = getDb();
  const attemptRows = db
    .prepare(
      'SELECT * FROM evaluation_attempts WHERE profile_id = ? ORDER BY attempt_number DESC, created_at DESC LIMIT 50'
    )
    .all(profileId) as Array<Record<string, unknown>>;

  if (attemptRows.length === 0) return [];

  const catRows = db
    .prepare('SELECT * FROM evaluation_category_scores WHERE profile_id = ?')
    .all(profileId) as Array<Record<string, unknown>>;

  const catsByAttempt = new Map<string, Array<Record<string, unknown>>>();
  for (const cr of catRows) {
    const aid = String(cr.attempt_id);
    const list = catsByAttempt.get(aid) ?? [];
    list.push(cr);
    catsByAttempt.set(aid, list);
  }

  return attemptRows.map((row) => {
    const aid = String(row.id);
    const categories = hydrateCategoryRows(catsByAttempt.get(aid) ?? []);
    return hydrateEvaluationAttemptRow(row, categories);
  });
}

export function getEvaluationAttemptById(attemptId: string): EvaluationAttemptRecord | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM evaluation_attempts WHERE id = ?')
    .get(attemptId) as Record<string, unknown> | undefined;
  if (!row) return null;

  const catRows = db
    .prepare('SELECT * FROM evaluation_category_scores WHERE attempt_id = ?')
    .all(attemptId) as Array<Record<string, unknown>>;

  return hydrateEvaluationAttemptRow(row, hydrateCategoryRows(catRows));
}

export function getAllEvaluationAttempts(): EvaluationAttemptRecord[] {
  const db = getDb();
  const attemptRows = db
    .prepare('SELECT * FROM evaluation_attempts ORDER BY created_at DESC LIMIT 500')
    .all() as Array<Record<string, unknown>>;

  if (attemptRows.length === 0) return [];

  const catRows = db
    .prepare('SELECT * FROM evaluation_category_scores')
    .all() as Array<Record<string, unknown>>;

  const catsByAttempt = new Map<string, Array<Record<string, unknown>>>();
  for (const cr of catRows) {
    const aid = String(cr.attempt_id);
    const list = catsByAttempt.get(aid) ?? [];
    list.push(cr);
    catsByAttempt.set(aid, list);
  }

  return attemptRows.map((row) => {
    const aid = String(row.id);
    return hydrateEvaluationAttemptRow(row, hydrateCategoryRows(catsByAttempt.get(aid) ?? []));
  });
}

export function getAssessmentHistoryByProfileId(profileId: string): AssessmentAttempt[] {
  const db = getDb();
  const evalAttempts = getEvaluationAttemptsByProfileId(profileId);
  const evalMap = new Map(evalAttempts.map((e) => [e.id, e]));

  const rows = db
    .prepare(
      'SELECT id, result_json, created_at FROM assessments WHERE profile_id = ? AND result_json IS NOT NULL ORDER BY created_at DESC LIMIT 30'
    )
    .all(profileId) as Array<{ id: string; result_json: string; created_at: string }>;

  const history: AssessmentAttempt[] = [];
  const seenIds = new Set<string>();

  for (const r of rows) {
    try {
      const parsed = JSON.parse(r.result_json) as AssessmentSubmitResponse;
      const ev = evalMap.get(r.id);
      const report: EvaluationReport | undefined = ev
        ? {
            attemptId: ev.id,
            profileId: ev.profileId,
            skillId: ev.skillId,
            skillName: ev.skillName,
            submissionType: ev.submissionType,
            submissionTitle: ev.submissionTitle,
            attemptNumber: ev.attemptNumber,
            timestamp: ev.timestamp,
            overallScore: ev.overallScore,
            performanceClassification: ev.performanceClassification,
            evaluationStatus: ev.evaluationStatus,
            aiMode: ev.aiMode,
            categories: ev.categories,
            checksExecuted: ev.checksExecuted,
            summaryNote: ev.summaryNote,
          }
        : parsed.evaluationReport;

      seenIds.add(r.id);
      history.push({
        id: r.id,
        profileId: parsed.profileId,
        skillId: parsed.skillId,
        skillName: parsed.skillName,
        quizScore: parsed.quizScore,
        practicalScore: parsed.practicalScore,
        combinedScore: parsed.combinedScore,
        passed: parsed.passed,
        replanTriggered: parsed.replanTriggered,
        updatedSkillLevel: parsed.updatedSkillLevel,
        timestamp: r.created_at,
        attemptNumber: ev?.attemptNumber ?? report?.attemptNumber,
        overallScore: ev?.overallScore ?? report?.overallScore,
        performanceClassification:
          ev?.performanceClassification ?? report?.performanceClassification,
        evaluationReport: report,
      });
    } catch {
      // skip malformed record
    }
  }

  for (const ev of evalAttempts) {
    if (!seenIds.has(ev.id)) {
      history.push({
        id: ev.id,
        profileId: ev.profileId,
        skillId: ev.skillId,
        skillName: ev.skillName,
        quizScore: ev.quizScore,
        practicalScore: ev.practicalScore,
        combinedScore: ev.combinedScore,
        passed: ev.passed,
        replanTriggered: ev.replanTriggered,
        updatedSkillLevel: ev.updatedSkillLevel,
        timestamp: ev.timestamp,
        attemptNumber: ev.attemptNumber,
        overallScore: ev.overallScore,
        performanceClassification: ev.performanceClassification,
        evaluationReport: {
          attemptId: ev.id,
          profileId: ev.profileId,
          skillId: ev.skillId,
          skillName: ev.skillName,
          submissionType: ev.submissionType,
          submissionTitle: ev.submissionTitle,
          attemptNumber: ev.attemptNumber,
          timestamp: ev.timestamp,
          overallScore: ev.overallScore,
          performanceClassification: ev.performanceClassification,
          evaluationStatus: ev.evaluationStatus,
          aiMode: ev.aiMode,
          categories: ev.categories,
          checksExecuted: ev.checksExecuted,
          summaryNote: ev.summaryNote,
        },
      });
    }
  }

  return history.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 30);
}

export function insertTraceEvent(event: AgentTraceEvent & { correlationId?: string }): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO agent_traces (
      id, profile_id, correlation_id, agent_name, action, input_summary,
      output_summary, duration_ms, ai_mode, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.profileId,
    event.correlationId ?? `corr_${Date.now()}`,
    event.agentName,
    event.action,
    event.inputSummary,
    event.outputSummary,
    event.durationMs,
    event.aiMode,
    event.status,
    event.createdAt
  );
}

export function getTracesByProfileId(profileId: string): AgentTraceEvent[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM agent_traces WHERE profile_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(profileId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    profileId: String(r.profile_id),
    agentName: String(r.agent_name) as AgentTraceEvent['agentName'],
    action: String(r.action),
    inputSummary: String(r.input_summary),
    outputSummary: String(r.output_summary),
    durationMs: Number(r.duration_ms),
    aiMode: String(r.ai_mode) as AgentTraceEvent['aiMode'],
    status: String(r.status) as AgentTraceEvent['status'],
    createdAt: String(r.created_at),
  }));
}

export function saveMentorMessage(msg: MentorMessage & { profileId: string }): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO mentor_messages (
      id, profile_id, role, content, tool_executions_json, invoked_agents_json, ai_mode, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    msg.id,
    msg.profileId,
    msg.role,
    msg.content,
    JSON.stringify(msg.toolExecutions),
    JSON.stringify(msg.invokedAgents ?? []),
    msg.aiMode,
    msg.createdAt
  );
}

export function getMentorMessages(profileId: string): MentorMessage[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM mentor_messages WHERE profile_id = ? ORDER BY created_at ASC LIMIT 60')
    .all(profileId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    role: String(r.role) as MentorMessage['role'],
    content: String(r.content),
    toolExecutions: JSON.parse(String(r.tool_executions_json)),
    invokedAgents: r.invoked_agents_json ? JSON.parse(String(r.invoked_agents_json)) : [],
    aiMode: String(r.ai_mode) as MentorMessage['aiMode'],
    createdAt: String(r.created_at),
  }));
}

export function getCohortLearners(): CohortLearner[] {
  const db = getDb();
  const rows = db.prepare('SELECT data_json FROM cohort_learners').all() as Array<{ data_json: string }>;
  return rows.map((r) => JSON.parse(r.data_json) as CohortLearner);
}

export function upsertApplication(app: JobApplication): JobApplication {
  const db = getDb();
  db.prepare(`
    INSERT INTO applications (
      id, profile_id, opportunity_id, opportunity_type, title, company,
      domain_id, compensation_label, currency, source_url, status, notes, applied_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(profile_id, opportunity_id) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      status = excluded.status,
      notes = excluded.notes,
      compensation_label = excluded.compensation_label,
      currency = excluded.currency,
      source_url = excluded.source_url,
      updated_at = excluded.updated_at
  `).run(
    app.id,
    app.profileId,
    app.opportunityId,
    app.opportunityType,
    app.title,
    app.company,
    app.domainId,
    app.compensationLabel,
    app.currency ?? 'INR',
    app.sourceUrl ?? '',
    app.status,
    app.notes,
    app.createdAt,
    app.updatedAt
  );

  const row = db
    .prepare('SELECT * FROM applications WHERE profile_id = ? AND opportunity_id = ?')
    .get(app.profileId, app.opportunityId) as Record<string, unknown>;

  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    opportunityId: String(row.opportunity_id),
    opportunityType: String(row.opportunity_type) as OpportunityType,
    title: String(row.title),
    company: String(row.company),
    domainId: String(row.domain_id) as CareerDomainId,
    compensationLabel: String(row.compensation_label),
    currency: (row.currency ? String(row.currency) : 'INR') as JobApplication['currency'],
    sourceUrl: row.source_url ? String(row.source_url) : '',
    status: String(row.status) as ApplicationStatus,
    notes: String(row.notes),
    createdAt: String(row.applied_at),
    updatedAt: String(row.updated_at),
  };
}

export function getApplicationsByProfileId(profileId: string): JobApplication[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM applications WHERE profile_id = ? ORDER BY updated_at DESC')
    .all(profileId) as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    profileId: String(row.profile_id),
    opportunityId: String(row.opportunity_id),
    opportunityType: String(row.opportunity_type) as OpportunityType,
    title: String(row.title),
    company: String(row.company),
    domainId: String(row.domain_id) as CareerDomainId,
    compensationLabel: String(row.compensation_label),
    currency: (row.currency ? String(row.currency) : 'INR') as JobApplication['currency'],
    sourceUrl: row.source_url ? String(row.source_url) : '',
    status: String(row.status) as ApplicationStatus,
    notes: String(row.notes),
    createdAt: String(row.applied_at),
    updatedAt: String(row.updated_at),
  }));
}

export function deleteApplicationById(profileId: string, applicationId: string): boolean {
  const db = getDb();
  const res = db
    .prepare('DELETE FROM applications WHERE id = ? AND profile_id = ?')
    .run(applicationId, profileId);
  return Number(res.changes ?? 0) > 0;
}

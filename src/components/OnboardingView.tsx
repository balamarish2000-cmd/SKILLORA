import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  Plus,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import { api } from '../api';
import { formatINRLpa, validateSalaryExpectations } from '../shared/currency';
import type { SampleResumePreset } from '../shared/seedData';
import type {
  AIMode,
  AuthUser,
  CareerDomain,
  CareerDomainId,
  LearningPlanMode,
  ParsedSkill,
  ProjectEntry,
  RoleId,
  SkillDefinition,
  TargetRole,
  TwinSnapshot,
} from '../shared/types';

interface OnboardingViewProps {
  domains: CareerDomain[];
  roles: TargetRole[];
  skillsCatalog: SkillDefinition[];
  sampleResumes: SampleResumePreset[];
  initialTab?: OnboardingTab;
  initialAuthMode?: 'register' | 'login';
  onTwinCreated: (twin: TwinSnapshot, authUser?: AuthUser | null) => void;
}

const LEARNING_PLANS: Array<{ id: LearningPlanMode; label: string; desc: string }> = [
  { id: 'fast_track', label: 'Fast Track', desc: 'Core essentials only' },
  { id: 'balanced', label: 'Balanced', desc: 'Core + foundational rigor' },
  { id: 'deep_mastery', label: 'Deep Mastery', desc: 'Full depth + optional skills' },
];

export type OnboardingTab = 'account' | 'resume_builder';

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  domains,
  roles,
  skillsCatalog,
  sampleResumes,
  initialTab = 'resume_builder',
  initialAuthMode = 'register',
  onTwinCreated,
}) => {
  const [activeTab, setActiveTab] = useState<OnboardingTab>(initialTab);
  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialAuthMode);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setAuthMode(initialAuthMode);
  }, [initialAuthMode]);

  // Auth form state
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSpecialization, setAuthSpecialization] = useState('');
  const [authLocation, setAuthLocation] = useState('Bengaluru, India');
  const [authTargetRoleId, setAuthTargetRoleId] = useState<RoleId>('fullstack_developer');
  const [authDomainId, setAuthDomainId] = useState<CareerDomainId>('information_technology');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Resume / Profile builder state
  const defaultSample = sampleResumes[0];
  const [name, setName] = useState(defaultSample?.name ?? '');
  const [email, setEmail] = useState(defaultSample?.email ?? '');
  const [currentTitle, setCurrentTitle] = useState(defaultSample?.currentTitle ?? '');
  const [currentDomainId, setCurrentDomainId] = useState<CareerDomainId>(
    defaultSample?.domainId ?? 'information_technology'
  );
  const [currentRoleId, setCurrentRoleId] = useState<RoleId | undefined>(
    defaultSample?.currentRoleId
  );
  const [specialization, setSpecialization] = useState('Full-Stack & Data Systems');
  const [preferredLocation, setPreferredLocation] = useState('Bengaluru / Remote');
  const [careerInterestsText, setCareerInterestsText] = useState('AI Systems, Product Engineering');
  const [experienceYears, setExperienceYears] = useState<number>(
    defaultSample?.experienceYears ?? 2
  );
  const [educationDegree, setEducationDegree] = useState(
    defaultSample?.educationDegree ?? 'B.Tech'
  );
  const [educationField, setEducationField] = useState(
    defaultSample?.educationField ?? ''
  );
  const [educationInstitution, setEducationInstitution] = useState(
    defaultSample?.educationInstitution ?? ''
  );
  const [targetRoleId, setTargetRoleId] = useState<RoleId>(
    defaultSample?.defaultTargetRole ?? 'fullstack_developer'
  );
  const [learningPlan, setLearningPlan] = useState<LearningPlanMode>('balanced');
  const [weeklyHours, setWeeklyHours] = useState<number>(defaultSample?.weeklyHours ?? 12);
  const [expectedAnnualSalaryInr, setExpectedAnnualSalaryInr] = useState<number>(1200000);
  const [minimumExpectedSalaryInr, setMinimumExpectedSalaryInr] = useState<number>(800000);
  const [resumeText, setResumeText] = useState(defaultSample?.resumeText ?? '');

  const [parsedSkills, setParsedSkills] = useState<ParsedSkill[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [parseAiMode, setParseAiMode] = useState<AIMode | null>(null);
  const [hasParsed, setHasParsed] = useState(false);

  const [addSkillId, setAddSkillId] = useState(skillsCatalog[0]?.id ?? 'javascript');
  const [isParsing, setIsParsing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedRoles = useMemo(
    () =>
      domains.map((dom) => ({
        domain: dom,
        roles: roles.filter((r) => r.domainId === dom.id),
      })),
    [domains, roles]
  );

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthSubmitting(true);
    try {
      if (authMode === 'register') {
        const res = await api.register({
          name: authName.trim(),
          email: authEmail.trim(),
          password: authPassword,
          targetRoleId: authTargetRoleId,
          currentDomainId: authDomainId,
          specialization: authSpecialization.trim(),
          preferredLocation: authLocation.trim(),
        });
        onTwinCreated(res.twin, res.user);
      } else {
        const res = await api.login({
          email: authEmail.trim(),
          password: authPassword,
        });
        onTwinCreated(res.twin, res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLoadSample = (preset: SampleResumePreset) => {
    setName(preset.name);
    setEmail(preset.email);
    setCurrentTitle(preset.currentTitle);
    setCurrentDomainId(preset.domainId);
    setCurrentRoleId(preset.currentRoleId);
    setSpecialization(preset.subtitle);
    setExperienceYears(preset.experienceYears);
    setEducationDegree(preset.educationDegree);
    setEducationField(preset.educationField);
    setEducationInstitution(preset.educationInstitution);
    setTargetRoleId(preset.defaultTargetRole);
    setWeeklyHours(preset.weeklyHours);
    setResumeText(preset.resumeText);
    setHasParsed(false);
    setParsedSkills([]);
    setCertifications([]);
    setProjects([]);
    setError(null);
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const content = await file.text();
      if (!content.trim()) {
        setError('Uploaded file appears empty. Please upload a .txt, .md, or .json resume file.');
        return;
      }
      setResumeText(content);
      setHasParsed(false);
    } catch {
      setError('Could not read selected file. Please paste plain text or upload .txt/.md/.json.');
    } finally {
      e.target.value = '';
    }
  };

  const handleParseResume = async () => {
    if (!resumeText.trim()) {
      setError('Please paste resume text or JSON before parsing.');
      return;
    }
    setError(null);
    setIsParsing(true);
    try {
      const res = await api.parseResume(resumeText);
      if (res.name && !name.trim()) setName(res.name);
      if (res.currentTitle && !currentTitle.trim()) setCurrentTitle(res.currentTitle);
      if (res.currentDomainId) setCurrentDomainId(res.currentDomainId);
      if (res.experienceYears !== undefined) setExperienceYears(res.experienceYears);
      if (res.education && res.education.length > 0) {
        setEducationDegree(res.education[0].degree);
        setEducationField(res.education[0].field);
        setEducationInstitution(res.education[0].institution);
      }
      setParsedSkills(res.skills);
      setCertifications(res.certifications);
      setProjects(res.projects);
      setParseAiMode(res.aiMode);
      setHasParsed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSkillLevelChange = (skillId: string, newLevel: number) => {
    setParsedSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId ? { ...s, level: newLevel, source: 'self_reported' } : s
      )
    );
  };

  const handleRemoveSkill = (skillId: string) => {
    setParsedSkills((prev) => prev.filter((s) => s.skillId !== skillId));
  };

  const handleAddManualSkill = () => {
    const def = skillsCatalog.find((s) => s.id === addSkillId);
    if (!def) return;
    if (parsedSkills.some((s) => s.skillId === def.id)) return;
    setParsedSkills((prev) => [
      ...prev,
      {
        skillId: def.id,
        skillName: def.name,
        level: 2.5,
        confidence: 0.75,
        source: 'self_reported',
        evidence: 'Self-reported during SKILLORA onboarding',
      },
    ]);
  };

  const handleCreateTwin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Learner name is required.');
      return;
    }
    if (!resumeText.trim() && parsedSkills.length === 0) {
      setError('Provide resume text or add at least one skill.');
      return;
    }

    const salaryCheck = validateSalaryExpectations(
      expectedAnnualSalaryInr,
      minimumExpectedSalaryInr
    );
    if (!salaryCheck.valid) {
      setError(salaryCheck.error ?? 'Invalid salary expectation values.');
      return;
    }

    setError(null);
    setIsCreating(true);
    try {
      const interests = careerInterestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const twin = await api.createProfile({
        name: name.trim(),
        email: email.trim() || 'learner@skillora.demo',
        currentTitle: currentTitle.trim() || 'Professional',
        currentDomainId,
        currentRoleId,
        specialization: specialization.trim() || undefined,
        preferredLocation: preferredLocation.trim() || 'India',
        careerInterests: interests,
        experienceYears,
        education:
          educationField.trim() || educationInstitution.trim()
            ? [
                {
                  degree: educationDegree.trim() || 'B.Tech',
                  field: educationField.trim() || 'General Studies',
                  institution: educationInstitution.trim() || 'University',
                },
              ]
            : [],
        targetRoleId,
        learningPlan,
        weeklyHours,
        expectedAnnualSalaryInr: salaryCheck.expected,
        minimumExpectedSalaryInr: salaryCheck.minimum,
        rawResumeText: resumeText,
        skills: hasParsed ? parsedSkills : undefined,
        certifications: hasParsed ? certifications : undefined,
        projects: hasParsed ? projects : undefined,
      });
      onTwinCreated(twin, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create career profile');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-pp-text">
            SKILLORA Account &amp; Profile Builder
          </h1>
          <p className="mt-1 text-sm text-pp-text-muted">
            Create an individual account (starting honestly at 0% progress) or build a profile directly from your resume across all {domains.length || 12} sectors.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-xl border border-pp-border self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('resume_builder');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'resume_builder'
                ? 'bg-pp-card text-pp-accent border border-pp-border'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume &amp; Profile Builder</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('account');
              setError(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-pp-card text-pp-accent border border-pp-border'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {activeTab === 'account' ? (
        <div className="max-w-xl mx-auto bg-pp-card border border-pp-border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-pp-border pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-pp-text">
                {authMode === 'register' ? 'Create SKILLORA Account' : 'Sign In to SKILLORA'}
              </h2>
              <p className="text-xs text-pp-text-muted mt-0.5">
                {authMode === 'register'
                  ? 'New accounts start cleanly at 0% roadmap completion with zero pre-filled assessments.'
                  : 'Access your saved career profile, roadmap progress, and application tracker.'}
              </p>
            </div>
            <div className="inline-flex gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  authMode === 'register' ? 'bg-pp-card text-pp-accent' : 'text-pp-text-muted'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  authMode === 'login' ? 'bg-pp-card text-pp-accent' : 'text-pp-text-muted'
                }`}
              >
                Sign In
              </button>
            </div>
          </div>

          <form onSubmit={(e) => void handleAuthSubmit(e)} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-pp-text-muted mb-1">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-pp-text-muted mb-1">
                Password (min 6 characters)
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>

            {authMode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-domain" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Current Sector
                    </label>
                    <select
                      id="auth-domain"
                      value={authDomainId}
                      onChange={(e) => setAuthDomainId(e.target.value as CareerDomainId)}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    >
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="auth-location" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Preferred Location
                    </label>
                    <input
                      id="auth-location"
                      type="text"
                      value={authLocation}
                      onChange={(e) => setAuthLocation(e.target.value)}
                      placeholder="Bengaluru / Remote"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-specialization" className="block text-xs font-medium text-pp-text-muted mb-1">
                    Specialization / Focus
                  </label>
                  <input
                    id="auth-specialization"
                    type="text"
                    value={authSpecialization}
                    onChange={(e) => setAuthSpecialization(e.target.value)}
                    placeholder="e.g. Cloud Backend, Clinical Research, Embedded Systems"
                    className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="auth-role" className="block text-xs font-medium text-pp-text-muted mb-1">
                    Target Career Goal
                  </label>
                  <select
                    id="auth-role"
                    value={authTargetRoleId}
                    onChange={(e) => setAuthTargetRoleId(e.target.value as RoleId)}
                    className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                  >
                    {groupedRoles.map(({ domain, roles: domRoles }) => (
                      <optgroup key={domain.id} label={domain.name}>
                        {domRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.avgSalaryRange})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors cursor-pointer disabled:opacity-60"
            >
              {authSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authMode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>
                {authSubmitting
                  ? 'Processing...'
                  : authMode === 'register'
                    ? 'Create Account & Launch Workspace'
                    : 'Sign In to Workspace'}
              </span>
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* 5 Cross-Domain Presets */}
          <div className="bg-pp-card border border-pp-border rounded-xl p-5">
            <div className="text-xs font-semibold text-pp-text-muted mb-3">
              Quick-Load Cross-Sector Candidate Presets ({sampleResumes.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sampleResumes.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadSample(preset)}
                  className="text-left p-3.5 rounded-lg border border-pp-border bg-pp-surface hover:border-pp-accent transition-colors cursor-pointer"
                >
                  <div className="text-sm font-semibold text-pp-text">{preset.label}</div>
                  <div className="mt-1 text-xs text-pp-text-muted leading-snug">{preset.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateTwin} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Resume Text, File Upload & Parse */}
            <div className="lg:col-span-7 bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="resume-textarea" className="text-sm font-semibold text-pp-text flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pp-accent" />
                  <span>Resume Text, JSON, or File Upload</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors cursor-pointer whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5 text-pp-accent" />
                    <span>Upload .txt/.md/.json</span>
                    <input
                      type="file"
                      accept=".txt,.md,.json,text/plain,application/json"
                      onChange={(e) => void handleResumeFileUpload(e)}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleParseResume}
                    disabled={isParsing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-pp-accent bg-pp-accent-soft border border-pp-accent/30 rounded-lg hover:bg-pp-elevated transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isParsing ? 'Parsing...' : 'Parse Resume with Profile Agent'}</span>
                  </button>
                </div>
              </div>

              <textarea
                id="resume-textarea"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
                placeholder="Paste resume text or JSON ({ name, education, skills: [...] })..."
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3.5 py-3 font-mono text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />

              {/* Extracted Skills Editor */}
              <div className="pt-2 border-t border-pp-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-sm font-semibold text-pp-text">
                    Extracted Skill Matrix ({parsedSkills.length})
                  </div>
                  {parseAiMode && (
                    <div className="text-xs text-pp-text-muted">
                      Mode: {parseAiMode === 'gemini' ? 'Gemini AI Structured Parse' : 'Deterministic Catalog Parser'}
                    </div>
                  )}
                </div>

                {!hasParsed ? (
                  <p className="text-xs text-pp-text-muted">
                    Click &quot;Parse Resume with Profile Agent&quot; to inspect and calibrate extracted skills before creating, or submit directly to auto-parse.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-60 overflow-y-auto divide-y divide-pp-border border border-pp-border rounded-lg bg-pp-surface/50">
                      {parsedSkills.map((skill) => (
                        <div key={skill.skillId} className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-pp-text truncate">
                              {skill.skillName}
                              <span className="ml-2 text-[11px] font-normal text-pp-text-muted">
                                · {skill.source.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-pp-text-muted truncate">{skill.evidence}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <label className="text-xs text-pp-text-muted flex items-center gap-1.5">
                              <span>Level</span>
                              <input
                                type="number"
                                min={0}
                                max={5}
                                step={0.5}
                                value={skill.level}
                                onChange={(e) =>
                                  handleSkillLevelChange(skill.skillId, Number(e.target.value))
                                }
                                aria-label={`${skill.skillName} level`}
                                className="w-16 rounded border border-pp-border bg-pp-surface px-2 py-1 font-mono text-xs text-pp-text tabular-nums"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill.skillId)}
                              aria-label={`Remove ${skill.skillName}`}
                              className="p-1 text-pp-text-muted hover:text-pp-error cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add skill row */}
                    <div className="flex items-center gap-2">
                      <select
                        value={addSkillId}
                        onChange={(e) => setAddSkillId(e.target.value)}
                        aria-label="Select skill to add"
                        className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text"
                      >
                        {skillsCatalog.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.category})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddManualSkill}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-pp-text bg-pp-elevated border border-pp-border hover:border-pp-accent rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Skill</span>
                      </button>
                    </div>

                    {(certifications.length > 0 || projects.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-pp-text-muted">
                        <div>
                          <div className="font-semibold text-pp-text mb-1">
                            Certifications ({certifications.length})
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {certifications.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-pp-text mb-1">
                            Projects ({projects.length})
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {projects.map((p, idx) => (
                              <li key={idx}>{p.title}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Goal, Specialization, Location, Education & Learning Plan */}
            <div className="lg:col-span-5 bg-pp-card border border-pp-border rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <h2 className="font-display text-base font-semibold text-pp-text">
                  Learner Profile, Preferences &amp; Career Target
                </h2>

                <div>
                  <label htmlFor="learner-name" className="block text-xs font-medium text-pp-text-muted mb-1">
                    Full Name
                  </label>
                  <input
                    id="learner-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="learner-email" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Email
                    </label>
                    <input
                      id="learner-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="learner-exp" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Experience (Years)
                    </label>
                    <input
                      id="learner-exp"
                      type="number"
                      min={0}
                      max={40}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-sm text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="current-domain" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Current Sector
                    </label>
                    <select
                      id="current-domain"
                      value={currentDomainId}
                      onChange={(e) => setCurrentDomainId(e.target.value as CareerDomainId)}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    >
                      {domains.map((dom) => (
                        <option key={dom.id} value={dom.id}>
                          {dom.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="current-title" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Current Role / Title
                    </label>
                    <input
                      id="current-title"
                      type="text"
                      value={currentTitle}
                      onChange={(e) => setCurrentTitle(e.target.value)}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="onb-specialization" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Specialization
                    </label>
                    <input
                      id="onb-specialization"
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Data Systems, Robotics"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="onb-location" className="flex items-center gap-1 text-xs font-medium text-pp-text-muted mb-1">
                      <MapPin className="w-3 h-3 text-pp-accent" />
                      <span>Preferred Location</span>
                    </label>
                    <input
                      id="onb-location"
                      type="text"
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                      placeholder="Bengaluru / Hyderabad / Remote"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="onb-interests" className="block text-xs font-medium text-pp-text-muted mb-1">
                    Career Interests (comma-separated)
                  </label>
                  <input
                    id="onb-interests"
                    type="text"
                    value={careerInterestsText}
                    onChange={(e) => setCareerInterestsText(e.target.value)}
                    placeholder="AI Engineering, Cloud Architecture, Product Analytics"
                    className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="edu-degree" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Degree
                    </label>
                    <input
                      id="edu-degree"
                      type="text"
                      value={educationDegree}
                      onChange={(e) => setEducationDegree(e.target.value)}
                      placeholder="B.Tech"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-2.5 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="edu-field" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Field of Study
                    </label>
                    <input
                      id="edu-field"
                      type="text"
                      value={educationField}
                      onChange={(e) => setEducationField(e.target.value)}
                      placeholder="Computer Science"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-2.5 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="edu-inst" className="block text-xs font-medium text-pp-text-muted mb-1">
                      Institution
                    </label>
                    <input
                      id="edu-inst"
                      type="text"
                      value={educationInstitution}
                      onChange={(e) => setEducationInstitution(e.target.value)}
                      placeholder="University"
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-2.5 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="target-role" className="block text-xs font-medium text-pp-text-muted mb-1">
                    Target Career Goal ({roles.length} Roles Across {domains.length} Sectors)
                  </label>
                  <select
                    id="target-role"
                    value={targetRoleId}
                    onChange={(e) => setTargetRoleId(e.target.value as RoleId)}
                    className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                  >
                    {groupedRoles.map(({ domain, roles: domRoles }) => (
                      <optgroup key={domain.id} label={domain.name}>
                        {domRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.title} ({role.avgSalaryRange})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* INR Compensation Expectations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="onb-expected-inr" className="flex items-center gap-1 text-xs font-medium text-pp-text-muted mb-1">
                      <IndianRupee className="w-3 h-3 text-pp-accent" />
                      <span>Expected Annual CTC (₹)</span>
                    </label>
                    <input
                      id="onb-expected-inr"
                      type="number"
                      min={0}
                      step={50000}
                      value={expectedAnnualSalaryInr}
                      onChange={(e) => setExpectedAnnualSalaryInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-xs text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                    />
                    <div className="mt-1 text-[11px] font-mono text-pp-accent tabular-nums">
                      {formatINRLpa(expectedAnnualSalaryInr)}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="onb-minimum-inr" className="flex items-center gap-1 text-xs font-medium text-pp-text-muted mb-1">
                      <IndianRupee className="w-3 h-3 text-pp-text-muted" />
                      <span>Minimum Expected (₹)</span>
                    </label>
                    <input
                      id="onb-minimum-inr"
                      type="number"
                      min={0}
                      step={50000}
                      value={minimumExpectedSalaryInr}
                      onChange={(e) => setMinimumExpectedSalaryInr(Number(e.target.value))}
                      className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-xs text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                    />
                    <div className="mt-1 text-[11px] font-mono text-pp-text-muted tabular-nums">
                      Floor: {formatINRLpa(minimumExpectedSalaryInr)}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-pp-text-muted mb-1.5">
                    Learning Plan Intensity
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-pp-surface rounded-lg border border-pp-border">
                    {LEARNING_PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setLearningPlan(plan.id)}
                        className={`px-2.5 py-2 text-left rounded-md transition-colors cursor-pointer ${
                          learningPlan === plan.id
                            ? 'bg-pp-card text-pp-accent border border-pp-accent/40'
                            : 'text-pp-text-muted hover:text-pp-text border border-transparent'
                        }`}
                      >
                        <div className="text-xs font-semibold">{plan.label}</div>
                        <div className="text-[10px] text-pp-text-muted">{plan.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="weekly-hours" className="text-xs font-medium text-pp-text-muted">
                      Weekly Study Commitment
                    </label>
                    <span className="font-mono text-xs font-semibold text-pp-accent tabular-nums">
                      {weeklyHours} hrs/wk ({Math.round((weeklyHours / 7) * 10) / 10} hrs/day)
                    </span>
                  </div>
                  <input
                    id="weekly-hours"
                    type="range"
                    min={4}
                    max={40}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full accent-pp-accent cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors cursor-pointer disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isCreating ? 'Building Profile...' : 'Build SKILLORA Profile & Roadmap'}</span>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

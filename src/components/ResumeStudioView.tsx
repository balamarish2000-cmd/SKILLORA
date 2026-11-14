import React, { useEffect, useMemo, useState } from 'react';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../api';
import { formatINRLpa } from '../shared/currency';
import type {
  CareerDomain,
  CareerDomainId,
  EducationEntry,
  ProjectEntry,
  ResumeImproveResult,
  TwinSnapshot,
} from '../shared/types';

interface ResumeStudioViewProps {
  twin: TwinSnapshot;
  domains: CareerDomain[];
  onTwinUpdated: (nextTwin: TwinSnapshot) => void;
}

export const ResumeStudioView: React.FC<ResumeStudioViewProps> = ({
  twin,
  domains,
  onTwinUpdated,
}) => {
  const { profile, analysis } = twin;

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentTitle, setCurrentTitle] = useState(profile.currentTitle);
  const [currentDomainId, setCurrentDomainId] = useState<CareerDomainId>(profile.currentDomainId);
  const [specialization, setSpecialization] = useState(profile.specialization ?? '');
  const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation ?? 'India');
  const [experienceYears, setExperienceYears] = useState<number>(profile.experienceYears);
  const [education, setEducation] = useState<EducationEntry[]>(profile.education);
  const [certifications, setCertifications] = useState<string[]>(profile.certifications);
  const [projects, setProjects] = useState<ProjectEntry[]>(profile.projects);
  const [summary, setSummary] = useState<string>(() => {
    const topSkills = profile.skills
      .slice()
      .sort((a, b) => b.level - a.level)
      .slice(0, 4)
      .map((s) => s.skillName)
      .join(', ');
    return `${profile.currentTitle} with ${profile.experienceYears}+ years of applied experience in ${topSkills || 'core domain execution'}, preparing for ${analysis.targetRoleTitle} roles (${analysis.overallReadiness}% verified SKILLORA readiness).`;
  });

  const [newCert, setNewCert] = useState('');
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSummary, setNewProjSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [aiLoadingSection, setAiLoadingSection] = useState<'summary' | 'project' | 'tailor' | null>(
    null
  );
  const [aiSuggestion, setAiSuggestion] = useState<ResumeImproveResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setCurrentTitle(profile.currentTitle);
    setCurrentDomainId(profile.currentDomainId);
    setSpecialization(profile.specialization ?? '');
    setPreferredLocation(profile.preferredLocation ?? 'India');
    setExperienceYears(profile.experienceYears);
    setEducation(profile.education);
    setCertifications(profile.certifications);
    setProjects(profile.projects);
  }, [
    profile.id,
    profile.name,
    profile.email,
    profile.currentTitle,
    profile.currentDomainId,
    profile.specialization,
    profile.preferredLocation,
    profile.experienceYears,
    profile.education,
    profile.certifications,
    profile.projects,
  ]);

  const sortedSkills = useMemo(
    () => profile.skills.slice().sort((a, b) => b.level - a.level),
    [profile.skills]
  );

  const handleRequestAiPolish = async (targetSection: 'summary' | 'project' | 'tailor') => {
    setError(null);
    setNotice(null);
    setAiLoadingSection(targetSection);
    try {
      const textToImprove =
        targetSection === 'project'
          ? projects[0]?.summary ?? summary
          : summary;
      const result = await api.improveResume({
        profileId: profile.id,
        targetSection,
        currentText: textToImprove,
        projectTitle: targetSection === 'project' ? projects[0]?.title : undefined,
      });
      setAiSuggestion(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gemini Resume Polish requires a live GEMINI_API_KEY.'
      );
    } finally {
      setAiLoadingSection(null);
    }
  };

  const handleApproveSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.targetSection === 'project' && projects.length > 0) {
      setProjects((prev) =>
        prev.map((p, idx) => (idx === 0 ? { ...p, summary: aiSuggestion.improvedText } : p))
      );
      setNotice('Approved and applied Gemini polish to your lead project description.');
    } else {
      setSummary(aiSuggestion.improvedText);
      setNotice('Approved and applied Gemini polish to your professional summary.');
    }
    setAiSuggestion(null);
  };

  const handleAddCert = () => {
    const val = newCert.trim();
    if (!val) return;
    setCertifications((prev) => [...prev, val]);
    setNewCert('');
  };

  const handleAddProject = () => {
    const title = newProjTitle.trim();
    const projSummary = newProjSummary.trim();
    if (!title || !projSummary) return;
    setProjects((prev) => [...prev, { title, summary: projSummary, skills: [] }]);
    setNewProjTitle('');
    setNewProjSummary('');
  };

  const handleAddEducation = () => {
    setEducation((prev) => [
      ...prev,
      { degree: 'B.Tech', field: 'Engineering & Technology', institution: 'Institute of Technology' },
    ]);
  };

  const plainTextResume = useMemo(() => {
    const lines: string[] = [
      name.toUpperCase(),
      `${currentTitle}${specialization ? ` · ${specialization}` : ''} · Target: ${analysis.targetRoleTitle}`,
      `${email} · ${preferredLocation} · ${experienceYears} yrs experience · Target CTC: ${formatINRLpa(profile.expectedAnnualSalaryInr)}`,
      '',
      'PROFESSIONAL SUMMARY',
      summary,
      '',
      'SKILLS & COMPETENCIES',
      ...sortedSkills.map(
        (s) =>
          `- ${s.skillName} (${s.level}/5${s.source === 'assessment_verified' ? ' · Assessment Verified' : ''})`
      ),
    ];

    if (projects.length > 0) {
      lines.push('', 'KEY PROJECTS & DELIVERABLES');
      for (const p of projects) {
        lines.push(`- ${p.title}: ${p.summary}`);
      }
    }

    if (education.length > 0) {
      lines.push('', 'EDUCATION');
      for (const edu of education) {
        lines.push(`- ${edu.degree} in ${edu.field}, ${edu.institution}`);
      }
    }

    if (certifications.length > 0) {
      lines.push('', 'CERTIFICATIONS');
      for (const c of certifications) {
        lines.push(`- ${c}`);
      }
    }

    return lines.join('\n');
  }, [
    name,
    currentTitle,
    specialization,
    analysis.targetRoleTitle,
    email,
    preferredLocation,
    experienceYears,
    profile.expectedAnnualSalaryInr,
    summary,
    sortedSkills,
    projects,
    education,
    certifications,
  ]);

  const handleSaveToTwin = async () => {
    setError(null);
    setNotice(null);
    setIsSaving(true);
    try {
      const updated = await api.updateResumeProfile({
        profileId: profile.id,
        name,
        email,
        currentTitle,
        currentDomainId,
        specialization: specialization.trim(),
        preferredLocation: preferredLocation.trim(),
        experienceYears,
        education,
        certifications,
        projects,
        rawResumeText: plainTextResume,
      });
      onTwinUpdated(updated);
      setNotice('Saved structured resume edits and synced to your SKILLORA profile.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resume profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainTextResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard unavailable in this browser context. Use Download .txt or .docx instead.');
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([plainTextResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_skillora_resume.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    setError(null);
    try {
      const children: Paragraph[] = [
        new Paragraph({
          text: name,
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${currentTitle}${specialization ? ` · ${specialization}` : ''} · Target Role: ${analysis.targetRoleTitle}`,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          text: `${email} | ${preferredLocation} | ${experienceYears} yrs experience | Target CTC: ${formatINRLpa(profile.expectedAnnualSalaryInr)}`,
        }),
        new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: summary }),
        new Paragraph({ text: 'SKILLS & PROVENANCE', heading: HeadingLevel.HEADING_2 }),
        ...sortedSkills.map(
          (sk) =>
            new Paragraph({
              text: `• ${sk.skillName} — ${sk.level}/5 (${sk.source === 'assessment_verified' ? 'Assessment Verified' : sk.source.replace(/_/g, ' ')})`,
            })
        ),
      ];

      if (projects.length > 0) {
        children.push(
          new Paragraph({ text: 'PROJECTS & DELIVERABLES', heading: HeadingLevel.HEADING_2 })
        );
        for (const p of projects) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${p.title}: `, bold: true }),
                new TextRun({ text: p.summary }),
              ],
            })
          );
        }
      }

      if (education.length > 0) {
        children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }));
        for (const edu of education) {
          children.push(
            new Paragraph({
              text: `• ${edu.degree} in ${edu.field} — ${edu.institution}`,
            })
          );
        }
      }

      if (certifications.length > 0) {
        children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_2 }));
        for (const c of certifications) {
          children.push(new Paragraph({ text: `• ${c}` }));
        }
      }

      const doc = new Document({
        sections: [{ children }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, '_')}_skillora_resume.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate .docx document');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="text-xs text-pp-text-muted">
            SKILLORA Resume Studio · Synced with {analysis.targetRoleTitle} ({analysis.overallReadiness}% Role Fit)
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Resume Studio
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={aiLoadingSection !== null}
            onClick={() => void handleRequestAiPolish('tailor')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-pp-amber bg-pp-amber-soft border border-pp-border rounded-lg hover:bg-pp-elevated transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {aiLoadingSection === 'tailor' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Tailor to {analysis.targetRoleTitle}</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSaveToTwin()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Syncing...' : 'Save & Sync Profile'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm no-print">
          {error}
        </div>
      )}

      {notice && (
        <div className="bg-pp-success-soft border border-pp-success/40 text-pp-success rounded-xl px-4 py-3 text-sm flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Explicit Approval Draft Card for Gemini Resume Polish */}
      {aiSuggestion && (
        <div className="bg-pp-card border-2 border-pp-accent rounded-xl p-5 space-y-3 no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-pp-accent">
              <Sparkles className="w-4 h-4" />
              <span>
                Gemini AI Draft Suggestion ({aiSuggestion.targetSection.toUpperCase()}) — Review Before Applying
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiSuggestion(null)}
              aria-label="Discard suggestion"
              className="p-1 text-pp-text-muted hover:text-pp-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-pp-text bg-pp-surface border border-pp-border rounded-lg p-3.5 leading-relaxed">
            {aiSuggestion.improvedText}
          </p>
          <p className="text-xs text-pp-text-muted">{aiSuggestion.rationale}</p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApproveSuggestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve &amp; Apply</span>
            </button>
            <button
              type="button"
              onClick={() => setAiSuggestion(null)}
              className="px-3.5 py-2 text-xs font-semibold text-pp-text-muted bg-pp-surface border border-pp-border rounded-lg hover:text-pp-text cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Structured Editor */}
        <div className="lg:col-span-6 space-y-5 no-print">
          <div className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-pp-accent" />
              <span>Candidate Header &amp; Career Summary</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rs-name" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Full Name
                </label>
                <input
                  id="rs-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rs-email" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Email
                </label>
                <input
                  id="rs-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="rs-title" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Professional Headline
                </label>
                <input
                  id="rs-title"
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rs-exp" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Experience (Yrs)
                </label>
                <input
                  id="rs-exp"
                  type="number"
                  min={0}
                  max={45}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 font-mono text-sm text-pp-text tabular-nums focus:border-pp-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="rs-spec" className="block text-xs font-medium text-pp-text-muted mb-1">
                  Specialization
                </label>
                <input
                  id="rs-spec"
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Data & Analytics"
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="rs-loc" className="flex items-center gap-1 text-xs font-medium text-pp-text-muted mb-1">
                  <MapPin className="w-3 h-3 text-pp-accent" />
                  <span>Preferred Location</span>
                </label>
                <input
                  id="rs-loc"
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  placeholder="Bengaluru / Remote"
                  className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rs-domain" className="block text-xs font-medium text-pp-text-muted mb-1">
                Primary Sector
              </label>
              <select
                id="rs-domain"
                value={currentDomainId}
                onChange={(e) => setCurrentDomainId(e.target.value as CareerDomainId)}
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="rs-summary" className="text-xs font-medium text-pp-text-muted">
                  Professional Career Summary
                </label>
                <button
                  type="button"
                  disabled={aiLoadingSection !== null}
                  onClick={() => void handleRequestAiPolish('summary')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pp-accent hover:underline cursor-pointer disabled:opacity-50"
                >
                  {aiLoadingSection === 'summary' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Polish with Gemini AI</span>
                </button>
              </div>
              <textarea
                id="rs-summary"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs leading-relaxed text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Projects */}
          <div className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-pp-text">
                Projects &amp; Quantified Impact ({projects.length})
              </h2>
              {projects.length > 0 && (
                <button
                  type="button"
                  disabled={aiLoadingSection !== null}
                  onClick={() => void handleRequestAiPolish('project')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pp-accent hover:underline cursor-pointer disabled:opacity-50"
                >
                  {aiLoadingSection === 'project' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Polish Lead Project</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="bg-pp-surface border border-pp-border rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-pp-text">{proj.title}</div>
                    <div className="mt-0.5 text-xs text-pp-text-muted leading-relaxed">{proj.summary}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjects((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label={`Delete project ${proj.title}`}
                    className="p-1 text-pp-text-muted hover:text-pp-error cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-pp-border">
              <input
                type="text"
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                placeholder="Project title (e.g. Real-Time Inventory Telemetry API)"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjSummary}
                  onChange={(e) => setNewProjSummary(e.target.value)}
                  placeholder="Impact summary & tools used..."
                  className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-pp-text bg-pp-elevated border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Education & Certifications */}
          <div className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-pp-accent" />
                <span>Education &amp; Certifications</span>
              </h2>
              <button
                type="button"
                onClick={handleAddEducation}
                className="text-xs font-semibold text-pp-accent hover:underline cursor-pointer"
              >
                + Add Education
              </button>
            </div>

            <div className="space-y-2.5">
              {education.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={edu.degree}
                    aria-label="Degree"
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, degree: e.target.value } : item))
                      )
                    }
                    className="col-span-3 rounded-lg border border-pp-border bg-pp-surface px-2.5 py-1.5 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={edu.field}
                    aria-label="Field of study"
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, field: e.target.value } : item))
                      )
                    }
                    className="col-span-4 rounded-lg border border-pp-border bg-pp-surface px-2.5 py-1.5 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={edu.institution}
                    aria-label="Institution"
                    onChange={(e) =>
                      setEducation((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, institution: e.target.value } : item))
                      )
                    }
                    className="col-span-4 rounded-lg border border-pp-border bg-pp-surface px-2.5 py-1.5 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEducation((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove education row"
                    className="col-span-1 p-1 text-pp-text-muted hover:text-pp-error cursor-pointer flex justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-pp-border space-y-2.5">
              <div className="text-xs font-semibold text-pp-text-muted">
                Certifications ({certifications.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pp-surface border border-pp-border text-xs text-pp-text"
                  >
                    <span>{cert}</span>
                    <button
                      type="button"
                      onClick={() => setCertifications((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove ${cert}`}
                      className="text-pp-text-muted hover:text-pp-error cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  placeholder="Add certification (e.g. AWS Solutions Architect)"
                  className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-pp-text bg-pp-elevated border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live ATS Document Preview + Exports */}
        <div className="lg:col-span-6 bg-pp-card border border-pp-border rounded-xl p-6 flex flex-col justify-between space-y-5 self-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-pp-border no-print">
              <div>
                <div className="text-xs font-mono text-pp-accent font-semibold">
                  LIVE ATS DOCUMENT PREVIEW
                </div>
                <div className="text-xs text-pp-text-muted mt-0.5">
                  Export as .docx, .txt, or Print / Save PDF
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-pp-accent" />
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-pp-accent" />
                  <span>Export .txt</span>
                </button>
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={() => void handleDownloadDocx()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-pp-amber" />
                  <span>{isExportingDocx ? 'Building...' : 'Export .docx'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-pp-accent" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>

            {/* Structured printable sheet */}
            <div
              id="skillora-resume-print-sheet"
              className="bg-pp-surface border border-pp-border rounded-xl p-6 space-y-5"
            >
              <div className="border-b border-pp-border pb-4">
                <h3 className="font-display text-xl font-bold text-pp-text">{name}</h3>
                <div className="mt-1 text-xs font-medium text-pp-accent">
                  {currentTitle}
                  {specialization ? ` · ${specialization}` : ''} · Target Role: {analysis.targetRoleTitle}
                </div>
                <div className="mt-1.5 text-xs text-pp-text-muted font-mono tabular-nums">
                  {email} · {preferredLocation} · {experienceYears} yrs exp · Target CTC: {formatINRLpa(profile.expectedAnnualSalaryInr)}
                </div>
              </div>

              <div>
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pp-text-muted">
                  Summary
                </h4>
                <p className="mt-1.5 text-xs text-pp-text leading-relaxed">{summary}</p>
              </div>

              <div>
                <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pp-text-muted">
                  Skills &amp; Provenance ({sortedSkills.length})
                </h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sortedSkills.map((sk) => (
                    <div
                      key={sk.skillId}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-pp-card border border-pp-border text-xs"
                    >
                      <span className="text-pp-text truncate">{sk.skillName}</span>
                      <span
                        className={`font-mono font-semibold tabular-nums shrink-0 ${
                          sk.source === 'assessment_verified' ? 'text-pp-success' : 'text-pp-accent'
                        }`}
                      >
                        {sk.level}/5
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {projects.length > 0 && (
                <div>
                  <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pp-text-muted">
                    Projects &amp; Deliverables
                  </h4>
                  <div className="mt-2 space-y-2.5">
                    {projects.map((p, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="font-semibold text-pp-text">{p.title}</div>
                        <div className="text-pp-text-muted leading-relaxed">{p.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div>
                  <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pp-text-muted">
                    Education
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-pp-text">
                    {education.map((edu, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{edu.degree}</span> in {edu.field} — {edu.institution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {certifications.length > 0 && (
                <div>
                  <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pp-text-muted">
                    Certifications
                  </h4>
                  <ul className="mt-1.5 list-disc pl-4 space-y-0.5 text-xs text-pp-text">
                    {certifications.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  GitBranch,
  GraduationCap,
  MapPin,
  Target,
  UserPlus,
} from 'lucide-react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatINRLpa } from '../shared/currency';
import type {
  CareerDomain,
  EvaluationReport,
  RoleId,
  SkillEvidenceSource,
  TwinSnapshot,
} from '../shared/types';
import { getChartPalette, useTheme } from '../theme';

interface DashboardViewProps {
  twin: TwinSnapshot;
  domains: CareerDomain[];
  onStartAssessmentForSkill: (skillId: string) => void;
  onInspectEvaluation?: (report: EvaluationReport) => void;
  onOpenRoadmap: () => void;
  onOpenMentor: () => void;
  onOpenOpportunities: () => void;
  onOpenOnboarding: () => void;
  onOpenReplanDiff: () => void;
  onOpenTransitionSimulator: () => void;
  onSwitchRole: (roleId: RoleId) => void;
}

function shortRadarLabel(name: string): string {
  const map: Record<string, string> = {
    'HTML5 & Modern CSS': 'HTML & CSS',
    'JavaScript (ES2023+)': 'JavaScript',
    'SQL & Relational Modeling': 'SQL',
    'Node.js & Express': 'Node.js',
    'REST API Design': 'REST APIs',
    'Docker & Containers': 'Docker',
    'Git & Version Control': 'Git',
    'Authentication & OAuth2': 'Auth & OAuth2',
    'Frontend Testing': 'Testing',
    'Probability & Statistics': 'Statistics',
    'Supervised & Unsupervised ML': 'Machine Learning',
    'Data Structures & Algorithms': 'DSA',
    'TCP/IP & Cloud Networking': 'Networking',
    'Human Anatomy & Structural Systems': 'Anatomy',
    'Human Physiology & Homeostasis': 'Physiology',
    'Pharmacology & Drug Mechanisms': 'Pharmacology',
    'Clinical Reasoning & Differential Analysis': 'Clinical Reasoning',
    'Patient Care & Clinical Safety Protocols': 'Patient Safety',
    'Medical Ethics & Regulatory Compliance': 'Medical Ethics',
    'Epidemiology & Biostatistics': 'Biostatistics',
    'Healthcare Systems & EHR Workflows': 'EHR Workflows',
    'Clinical Laboratory & Diagnostic Assays': 'Lab Assays',
    'Engineering Statics & Dynamics': 'Statics/Dynamics',
    'Thermodynamics & Heat Transfer': 'Thermodynamics',
    'Fluid Mechanics & Aerodynamics': 'Fluids',
    'Strength of Materials & FEA Simulation': 'Materials & FEA',
    '3D CAD Modeling & GD&T': 'CAD & GD&T',
    'Manufacturing Processes & DFM': 'Manufacturing',
    'Machine Design & Actuators': 'Machine Design',
    'DC/AC Circuit Analysis': 'Circuits',
    'Analog Electronics & Amplifiers': 'Analog',
    'Digital Logic & FPGA Design': 'Digital Logic',
    'Embedded Systems & RTOS Firmware': 'Embedded/RTOS',
    'Signal Processing & Filtering': 'Signal Proc',
    'Power Systems & Drives': 'Power Systems',
    'PCB Layout & Signal Integrity': 'PCB Design',
    'VLSI & Semiconductor Architecture': 'VLSI',
    'ROS2 Middleware & Nodes': 'ROS2',
    'Robot Kinematics & Motion Planning': 'Kinematics',
    'Control Systems & PID Tuning': 'Control/PID',
    'SLAM & Sensor Fusion': 'SLAM/Sensors',
    'PLC Programming & Industrial Automation': 'PLC/Automation',
    'Computer Vision & Perception': 'Vision',
    'Structural Analysis & Load Design': 'Structural',
    'Geotechnical & Foundation Engineering': 'Geotech',
    'AutoCAD & Revit BIM Modeling': 'AutoCAD & BIM',
    'Surveying & GIS Mapping': 'GIS/Surveying',
    'Construction Project Management': 'Construction PM',
    'Sustainable Architecture & Building Codes': 'Green Codes',
    'Experimental Design & Scientific Method': 'Exp Design',
    'Molecular Biology & Assay Protocols': 'Mol Biology',
    'Analytical Chemistry & Spectroscopy': 'Chem/Spec',
    'Bioinformatics & Genomic Computing': 'Bioinformatics',
    'Technical Writing & Peer Review': 'Sci Writing',
    'Materials Characterization & Testing': 'Materials Lab',
    'Financial Analysis & Valuation Modeling': 'Finance/Val',
    'Business Analysis & Competitive Strategy': 'Strategy',
    'Operations & Supply Chain Optimization': 'Supply Chain',
    'Agile Project & Program Delivery': 'Agile PM',
    'Product Management & Roadmapping': 'Product Mgmt',
    'Corporate Accounting & Governance': 'Accounting',
    'SQL & BI Data Visualization': 'BI & SQL',
    'Visual Hierarchy, Typography & Color': 'Visual Design',
    'UX Research & Information Architecture': 'UX Research',
    'Figma Prototyping & Design Systems': 'Figma Systems',
    'Industrial Design & Ergonomics': 'Industrial Des',
    'Interaction Design & Accessibility': 'Accessibility',
    'Brand Identity & Motion Communication': 'Brand/Motion',
    'C / C++ Systems Programming': 'C / C++ Systems',
    'Curriculum Design & Instructional Planning': 'Curriculum',
    'Active Pedagogy & Classroom Facilitation': 'Pedagogy',
    'Learning Assessment & Rubric Analytics': 'Rubric Analytics',
    'Financial Accounting & Ind AS / GAAP Reporting': 'Accounting',
    'Auditing, Internal Controls & Tax Compliance': 'Audit & Tax',
    'Corporate Treasury & Capital Budgeting': 'Treasury',
    'Portfolio Risk & Investment Analysis': 'Portfolio Risk',
    'Agronomy, Soil Science & Crop Nutrition': 'Agronomy',
    'Precision Agriculture & GIS Remote Sensing': 'Precision Ag',
    'Climate Resilience & ESG Sustainability Reporting': 'ESG & Climate',
  };
  if (map[name]) return map[name];
  const clean = name.replace(/\s*\(.*?\)/g, '');
  const trimmed = clean.length > 16 ? clean.split('&')[0].trim() : clean;
  return trimmed.length > 16 ? `${trimmed.slice(0, 15).trim()}…` : trimmed;
}

function formatSourceLabel(source: SkillEvidenceSource | 'unassessed'): string {
  switch (source) {
    case 'assessment_verified':
      return 'Assessment Verified';
    case 'resume_extracted':
      return 'Resume Extracted';
    case 'project_evidence':
      return 'Project Evidence';
    case 'self_reported':
      return 'Self-Reported';
    default:
      return 'Unassessed';
  }
}

function formatPlanLabel(plan: TwinSnapshot['profile']['learningPlan']): string {
  if (plan === 'fast_track') return 'Fast Track';
  if (plan === 'deep_mastery') return 'Deep Mastery';
  return 'Balanced';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  twin,
  domains,
  onStartAssessmentForSkill,
  onInspectEvaluation,
  onOpenRoadmap,
  onOpenMentor,
  onOpenOpportunities,
  onOpenOnboarding,
  onOpenReplanDiff,
  onOpenTransitionSimulator,
  onSwitchRole,
}) => {
  const { theme } = useTheme();
  const chartColors = getChartPalette(theme);
  const { profile, analysis, matches, progress, latestDiff, assessmentHistory, roadmap } = twin;

  const domainMap = new Map(domains.map((d) => [d.id, d.name]));
  const currentDomainName = domainMap.get(profile.currentDomainId) ?? profile.currentDomainId;
  const targetDomainName = domainMap.get(analysis.targetDomainId) ?? analysis.targetDomainId;

  const assessmentVerifiedCount = profile.skills.filter(
    (s) => s.source === 'assessment_verified'
  ).length;
  const resumeReportedCount = profile.skills.length - assessmentVerifiedCount;

  const radarData = analysis.allSkillComparisons.slice(0, 8).map((item) => ({
    skill: shortRadarLabel(item.skillName),
    current: item.currentLevel,
    target: item.targetLevel,
  }));

  const topMatches = matches.slice(0, 6);
  const nextRecommendedSteps = roadmap.filter((s) => !s.completed).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Personalized Welcome & Career Summary */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-pp-text-muted">
            <span className="font-semibold text-pp-accent">Welcome back, {profile.name}</span>
            <span aria-hidden="true">·</span>
            <span>{profile.currentTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{currentDomainName}</span>
            {profile.specialization && (
              <>
                <span aria-hidden="true">·</span>
                <span>{profile.specialization}</span>
              </>
            )}
            {profile.preferredLocation && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-pp-accent" />
                  {profile.preferredLocation}
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-pp-text">
            Target Role: {analysis.targetRoleTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-pp-text-muted">
            <span className="tabular-nums font-mono text-pp-accent font-semibold">
              Target CTC {formatINRLpa(profile.expectedAnnualSalaryInr)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Skills Provenance: {assessmentVerifiedCount} Assessment-Verified · {resumeReportedCount} Resume/Self-Reported
            </span>
            {profile.education.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-pp-accent" />
                  {profile.education[0].degree} in {profile.education[0].field}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenMentor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-pp-accent" />
            <span>Open AI Mentor</span>
          </button>
          <button
            type="button"
            onClick={onOpenOpportunities}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-pp-amber" />
            <span>Explore Opportunities</span>
          </button>
          <button
            type="button"
            onClick={onOpenRoadmap}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Open Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty/Fresh Profile Banner */}
      {profile.skills.length === 0 && (
        <div className="bg-pp-amber-soft border border-pp-amber/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-pp-text">
            <span className="font-semibold text-pp-amber">New Account Initialized:</span>{' '}
            Your profile currently has 0 parsed skills and 0 completed steps. Upload or paste your resume, add self-reported skills, or take an assessment to calibrate your readiness.
          </div>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Parse Resume or Add Skills</span>
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Role Readiness ({targetDomainName})</span>
            <Target className="w-4 h-4 text-pp-accent" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-text tabular-nums">
            {analysis.overallReadiness}%
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-pp-surface overflow-hidden">
            <div
              className="h-full bg-pp-accent transition-all"
              style={{ width: `${analysis.overallReadiness}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-pp-text-muted tabular-nums">
            {analysis.strengths.length} strengths · {analysis.gaps.length} core gaps
            {analysis.optionalGaps.length > 0 ? ` · ${analysis.optionalGaps.length} optional` : ''}
          </div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Role-Ready Forecast</span>
            <Calendar className="w-4 h-4 text-pp-success" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-pp-text tabular-nums">
            {progress.forecastedReadyDate}
          </div>
          <div className="mt-2 text-xs text-pp-text-muted tabular-nums">
            {progress.estimatedWeeksRemaining} weeks · {progress.weeklyHours}h/wk ({progress.dailyHours}h/day)
          </div>
          <div className="mt-1 text-xs font-medium text-pp-success">
            Pace: {progress.paceStatus}
          </div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Roadmap Progress ({formatPlanLabel(progress.learningPlan)})</span>
            <Clock className="w-4 h-4 text-pp-text-muted" />
          </div>
          <div className="mt-2 font-mono text-3xl font-bold text-pp-text tabular-nums">
            {progress.completionPct}%
          </div>
          <div className="mt-2 text-xs text-pp-text-muted tabular-nums">
            {progress.completedSteps}/{progress.totalSteps} completed
            {(progress.inProgressSteps ?? 0) > 0 ? ` · ${progress.inProgressSteps} started` : ''} · {progress.remainingHours}h left
          </div>
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-pp-text-muted">
            <span>Highest-Impact Gap</span>
            <AlertTriangle className="w-4 h-4 text-pp-amber" />
          </div>
          {analysis.gaps[0] ? (
            <>
              <div className="mt-2 font-display text-lg font-bold text-pp-text truncate">
                {analysis.gaps[0].skillName}
              </div>
              <div className="mt-1 font-mono text-xs text-pp-text-muted tabular-nums">
                Current {analysis.gaps[0].currentLevel} / Target {analysis.gaps[0].targetLevel} (Gap {analysis.gaps[0].gap})
              </div>
              <button
                type="button"
                onClick={() => onStartAssessmentForSkill(analysis.gaps[0].skillId)}
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-pp-accent hover:underline cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Assess {analysis.gaps[0].skillName}</span>
              </button>
            </>
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-pp-success">
              <CheckCircle2 className="w-4 h-4" />
              <span>All required skills met</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Learning Steps Strip */}
      {nextRecommendedSteps.length > 0 && (
        <div className="bg-pp-card border border-pp-border rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Recommended Next Learning Steps
              </h2>
              <p className="text-xs text-pp-text-muted">
                Prerequisite-ordered priorities from your active {formatPlanLabel(progress.learningPlan)} roadmap
              </p>
            </div>
            <div className="flex items-center gap-3">
              {latestDiff && (
                <button
                  type="button"
                  onClick={onOpenReplanDiff}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-pp-text-muted hover:text-pp-accent cursor-pointer"
                >
                  <GitBranch className="w-3.5 h-3.5 text-pp-accent" />
                  <span>Replan Diff</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenRoadmap}
                className="text-xs font-semibold text-pp-accent hover:underline cursor-pointer"
              >
                View Full Roadmap →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nextRecommendedSteps.map((step) => (
              <div
                key={step.id}
                className="rounded-lg border border-pp-border bg-pp-surface p-4 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-pp-text-muted">
                    <span className="text-pp-accent font-semibold">Step {String(step.order).padStart(2, '0')}</span>
                    <span>{step.hours}h · {step.difficulty}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-pp-text">{step.skillName}</div>
                  <div className="mt-0.5 text-xs text-pp-text-muted line-clamp-2">{step.resourceTitle}</div>
                </div>
                <div className="pt-2 border-t border-pp-border/60 flex items-center justify-between text-xs">
                  <span className="text-pp-text-muted capitalize">{(step.status ?? 'not_started').replace('_', ' ')}</span>
                  <button
                    type="button"
                    onClick={() => onStartAssessmentForSkill(step.skillId)}
                    className="font-semibold text-pp-accent hover:underline cursor-pointer"
                  >
                    Assess →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Radar Chart + Top Skill Gaps with Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-pp-card border border-pp-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Skill Proficiency Radar
              </h2>
              <p className="text-xs text-pp-text-muted">
                Current proficiency vs {analysis.targetRoleTitle} benchmark (0–5)
              </p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: chartColors.axisText, fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fill: chartColors.axisText, fontSize: 10 }}
                />
                <Radar
                  name="Target Required"
                  dataKey="target"
                  stroke={chartColors.amber}
                  fill={chartColors.amberFill}
                  fillOpacity={0.5}
                />
                <Radar
                  name="Your Profile"
                  dataKey="current"
                  stroke={chartColors.accentTeal}
                  fill={chartColors.accentTealFill}
                  fillOpacity={0.65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    color: chartColors.tooltipText,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: chartColors.axisText }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prioritized Skill Gaps Table with Provenance */}
        <div className="lg:col-span-7 bg-pp-card border border-pp-border rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Prioritized Skill Gaps &amp; Provenance
              </h2>
              <p className="text-xs text-pp-text-muted">
                Ranked by requirement weight, gap magnitude, and verification provenance
              </p>
            </div>
          </div>

          {analysis.gaps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-pp-success mb-2" />
              <div className="text-sm font-semibold text-pp-text">
                Zero remaining core skill gaps for {analysis.targetRoleTitle}
              </div>
              <p className="text-xs text-pp-text-muted mt-1">
                Validate mastery with a domain assessment or simulate a stretch career transition.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-pp-border text-xs font-medium text-pp-text-muted">
                    <th className="py-2.5 pr-3">Skill &amp; Provenance</th>
                    <th className="py-2.5 px-3 text-right">Current / Target</th>
                    <th className="py-2.5 px-3 text-right">Weight</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pp-border/70 text-sm">
                  {analysis.gaps.map((gap) => (
                    <tr key={gap.skillId} className="hover:bg-pp-surface/50 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-pp-text">{gap.skillName}</div>
                        <div className="text-xs text-pp-text-muted">
                          {gap.category} · {formatSourceLabel(gap.source)}
                          {gap.missingPrerequisites.length > 0
                            ? ` · Needs prereq: ${gap.missingPrerequisites.join(', ')}`
                            : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-pp-text">
                        {gap.currentLevel} / {gap.targetLevel}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums text-pp-text-muted">
                        {gap.weight}/5
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {gap.status === 'missing' ? (
                          <span className="inline-flex items-center gap-1 font-medium text-pp-error">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Missing</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-pp-amber">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Partial</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => onStartAssessmentForSkill(gap.skillId)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-pp-accent hover:bg-pp-accent-soft rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Assess
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assessment History + Career Transition History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-pp-card border border-pp-border rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-pp-text">
            Assessment Verification History ({assessmentHistory.length})
          </h2>
          <p className="text-xs text-pp-text-muted mt-0.5 mb-3">
            Scores ≥ 50% elevate skill provenance to Assessment Verified; scores &lt; 50% trigger remediation replans.
          </p>
          {assessmentHistory.length === 0 ? (
            <div className="text-xs text-pp-text-muted py-4">
              No assessments completed yet. Select any skill above to verify competency.
            </div>
          ) : (
            <div className="divide-y divide-pp-border/70">
              {assessmentHistory.slice(0, 5).map((att) => (
                <div key={att.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-pp-text truncate">
                      {att.attemptNumber ? `Attempt #${att.attemptNumber} · ` : ''}
                      {att.evaluationReport?.submissionTitle ?? att.skillName}
                    </div>
                    <div className="text-pp-text-muted">
                      {new Date(att.timestamp).toLocaleString()}
                      {att.performanceClassification ? ` · ${att.performanceClassification}` : ''}
                      {att.replanTriggered ? ' · Remediation replan triggered' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        (att.overallScore ?? att.combinedScore) >= 50
                          ? 'text-pp-success'
                          : 'text-pp-error'
                      }`}
                    >
                      {att.overallScore !== undefined
                        ? `${att.overallScore}/100`
                        : `${att.combinedScore}% ${att.passed ? 'PASS' : 'FAIL'}`}
                    </span>
                    {att.evaluationReport && onInspectEvaluation && (
                      <button
                        type="button"
                        onClick={() => onInspectEvaluation(att.evaluationReport!)}
                        className="px-2 py-1 text-[11px] font-semibold text-pp-accent hover:bg-pp-surface rounded border border-pp-border transition-colors cursor-pointer"
                      >
                        Breakdown
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-pp-card border border-pp-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Career Transition History ({profile.transitionHistory.length})
              </h2>
              <p className="text-xs text-pp-text-muted mt-0.5">
                Cross-sector switches and adopted target role transitions
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenTransitionSimulator}
              className="inline-flex items-center gap-1 text-xs font-semibold text-pp-accent hover:underline cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Simulate Next →</span>
            </button>
          </div>
          {profile.transitionHistory.length === 0 ? (
            <div className="text-xs text-pp-text-muted py-4">
              No transitions adopted yet. Use Transition Simulator to compare origin vs destination careers.
            </div>
          ) : (
            <div className="divide-y divide-pp-border/70">
              {profile.transitionHistory.slice(0, 5).map((tr) => (
                <div key={tr.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-pp-text">
                      {tr.fromRoleTitle} → {tr.toRoleTitle}
                    </div>
                    <div className="text-pp-text-muted">
                      {new Date(tr.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-pp-accent tabular-nums">
                    {tr.readinessAtSwitch}% starting fit
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Career Matcher Top 6 Roles Across 66 Roles */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-pp-text">
              Career Matcher — Top Matches Across {matches.length} Industry Roles
            </h2>
            <p className="text-xs text-pp-text-muted">
              Weighted readiness &amp; transferable skills across all 12 sectors. Switch any goal to trigger an instant Replan Diff.
            </p>
          </div>
          <Compass className="w-5 h-5 text-pp-accent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topMatches.map((match) => (
            <div
              key={match.roleId}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                match.isCurrentGoal
                  ? 'border-pp-accent bg-pp-accent-soft/40'
                  : 'border-pp-border bg-pp-surface/50 hover:border-pp-accent/50'
              }`}
            >
              <div>
                <div className="text-[11px] text-pp-text-muted mb-0.5">
                  {match.domainName}
                  {match.isCurrentGoal ? ' · Active Goal' : ''}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold text-pp-text">
                    {match.roleTitle}
                  </h3>
                  <span className="font-mono text-sm font-bold text-pp-accent tabular-nums">
                    {match.readinessPct}%
                  </span>
                </div>
                <div className="mt-1 text-xs text-pp-text-muted tabular-nums">
                  {match.matchedSkillsCount}/{match.totalRequiredSkills} required skills met
                </div>
                <p className="mt-2 text-xs text-pp-text-muted leading-relaxed">{match.summary}</p>
                {match.transferableSkills.length > 0 && (
                  <div className="mt-2 text-xs text-pp-success">
                    Transferable: {match.transferableSkills.slice(0, 3).join(', ')}
                  </div>
                )}
                {match.topMissingSkills.length > 0 && (
                  <div className="mt-1 text-xs text-pp-text-muted">
                    Key gaps: {match.topMissingSkills.join(', ')}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-pp-border/70">
                {match.isCurrentGoal ? (
                  <span className="text-xs font-semibold text-pp-accent">Current Active Target</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSwitchRole(match.roleId)}
                    className="text-xs font-semibold text-pp-text hover:text-pp-accent transition-colors cursor-pointer"
                  >
                    Switch Target to {match.roleTitle} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

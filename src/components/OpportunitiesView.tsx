import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Info,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { formatINRLpa } from '../shared/currency';
import type {
  ApplicationStatus,
  CareerDomain,
  CareerDomainId,
  JobApplication,
  OpportunitiesOverview,
  OpportunityInsightResult,
  OpportunityType,
  TwinSnapshot,
  VerifiedSearchChannel,
} from '../shared/types';

interface OpportunitiesViewProps {
  twin: TwinSnapshot;
  domains: CareerDomain[];
}

type OppTab = 'jobs' | 'internships' | 'tracker';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Interviewing',
  'Offer',
  'Withdrawn',
];

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({ twin, domains }) => {
  const [tab, setTab] = useState<OppTab>('jobs');
  const [overview, setOverview] = useState<OpportunitiesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Gemini Match & Prep insight modal/panel state
  const [insightChannelId, setInsightChannelId] = useState<string | null>(null);
  const [insightLoadingId, setInsightLoadingId] = useState<string | null>(null);
  const [insightsById, setInsightsById] = useState<Record<string, OpportunityInsightResult>>({});

  // Track external real job/internship form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customTitle, setCustomTitle] = useState(twin.analysis.targetRoleTitle);
  const [customCompany, setCustomCompany] = useState('');
  const [customType, setCustomType] = useState<OpportunityType>('job');
  const [customDomainId, setCustomDomainId] = useState<CareerDomainId>(
    twin.analysis.targetDomainId
  );
  const [customComp, setCustomComp] = useState('');
  const [customCurrency, setCustomCurrency] = useState<'INR' | 'USD' | 'OTHER'>('INR');
  const [customUrl, setCustomUrl] = useState('');
  const [customStatus, setCustomStatus] = useState<ApplicationStatus>('Applied');
  const [customNotes, setCustomNotes] = useState('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const domainMap = useMemo(() => new Map(domains.map((d) => [d.id, d.shortName])), [domains]);

  const loadOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOpportunities(twin.profile.id);
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCustomTitle(twin.analysis.targetRoleTitle);
    setCustomDomainId(twin.analysis.targetDomainId);
    void loadOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    twin.profile.id,
    twin.profile.targetRoleId,
    twin.profile.preferredLocation,
    twin.profile.expectedAnnualSalaryInr,
    twin.profile.minimumExpectedSalaryInr,
  ]);

  const filteredChannels = useMemo(() => {
    if (!overview) return [];
    const targetType: OpportunityType = tab === 'internships' ? 'internship' : 'job';
    const q = search.trim().toLowerCase();
    return overview.channels.filter((ch) => {
      if (ch.type !== targetType) return false;
      if (!q) return true;
      return (
        ch.platform.toLowerCase().includes(q) ||
        ch.channelTitle.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q)
      );
    });
  }, [overview, tab, search]);

  const handleExplainChannel = async (channel: VerifiedSearchChannel) => {
    setError(null);
    setInsightLoadingId(channel.id);
    try {
      const res = await api.explainOpportunity({
        profileId: twin.profile.id,
        channelTitle: channel.channelTitle,
        platform: channel.platform,
        opportunityType: channel.type,
      });
      setInsightsById((prev) => ({ ...prev, [channel.id]: res }));
      setInsightChannelId(channel.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gemini Opportunity Insight requires a live GEMINI_API_KEY.'
      );
    } finally {
      setInsightLoadingId(null);
    }
  };

  const handleCreateTrackedApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customCompany.trim()) {
      setError('Role title and company/organization are required.');
      return;
    }
    setError(null);
    setIsSavingCustom(true);
    try {
      const res = await api.saveApplication({
        profileId: twin.profile.id,
        opportunityId: `ext_${Date.now()}`,
        opportunityType: customType,
        title: customTitle.trim(),
        company: customCompany.trim(),
        domainId: customDomainId,
        compensationLabel: customComp.trim() || 'Not disclosed',
        currency: customCurrency,
        sourceUrl: customUrl.trim(),
        status: customStatus,
        notes: customNotes.trim(),
      });
      setOverview(res.overview);
      setCustomCompany('');
      setCustomComp('');
      setCustomUrl('');
      setCustomNotes('');
      setShowAddForm(false);
      setTab('tracker');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tracked application');
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleUpdateTrackedApp = async (
    app: JobApplication,
    status: ApplicationStatus
  ) => {
    setBusyId(app.id);
    try {
      const res = await api.saveApplication({
        profileId: twin.profile.id,
        opportunityId: app.opportunityId,
        opportunityType: app.opportunityType,
        title: app.title,
        company: app.company,
        domainId: app.domainId,
        compensationLabel: app.compensationLabel,
        currency: app.currency,
        sourceUrl: app.sourceUrl,
        status,
        notes: app.notes,
      });
      setOverview(res.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteApp = async (applicationId: string) => {
    setBusyId(applicationId);
    try {
      const res = await api.deleteApplication(twin.profile.id, applicationId);
      setOverview(res.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove application');
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !overview) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-12 flex items-center justify-center gap-2 text-sm text-pp-text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
        <span>Building verified career &amp; internship search portals for {twin.analysis.targetRoleTitle}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted tabular-nums flex flex-wrap items-center gap-2">
            <span>{twin.analysis.targetRoleTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-pp-accent" />
              {overview?.preferredLocation || twin.profile.preferredLocation || 'India'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Market {overview?.targetRoleSalaryRange}</span>
            <span aria-hidden="true">·</span>
            <span>Target {formatINRLpa(twin.profile.expectedAnnualSalaryInr)}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Opportunities &amp; Application Tracker
          </h1>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-pp-surface rounded-xl border border-pp-border self-start max-w-full">
          <button
            type="button"
            onClick={() => setTab('jobs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'jobs'
                ? 'bg-pp-card text-pp-accent border border-pp-border'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Portals</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('internships')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'internships'
                ? 'bg-pp-card text-pp-accent border border-pp-border'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Internship Portals</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('tracker')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'tracker'
                ? 'bg-pp-card text-pp-accent border border-pp-border'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Application Tracker ({overview?.applications.length ?? 0})</span>
          </button>
        </div>
      </div>

      {/* Honest Data Integrity Notice */}
      {overview?.sourceNotice && (
        <div className="bg-pp-surface border border-pp-border rounded-xl px-4 py-3 text-xs text-pp-text-muted flex items-start gap-2.5">
          <Info className="w-4 h-4 text-pp-accent shrink-0 mt-0.5" />
          <span>{overview.sourceNotice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Role Readiness & Track External Application Trigger */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-pp-text">
            Your {twin.analysis.targetRoleTitle} Readiness: <span className="text-pp-accent font-mono">{twin.analysis.overallReadiness}%</span>
          </div>
          <div className="text-pp-text-muted">
            Matched strengths: <span className="text-pp-success">{twin.analysis.strengths.slice(0, 4).map((s) => s.skillName).join(', ') || 'None yet'}</span>
          </div>
          <div className="text-pp-text-muted">
            Skills to strengthen: <span className="text-pp-amber">{twin.analysis.gaps.slice(0, 4).map((g) => g.skillName).join(', ') || 'Core competencies met'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close Tracker Form' : 'Track External Application'}</span>
        </button>
      </div>

      {/* Track Real External Application Form */}
      {showAddForm && (
        <form
          onSubmit={(e) => void handleCreateTrackedApplication(e)}
          className="bg-pp-card border border-pp-accent/40 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-pp-text">
            Save a Real External Job or Internship to Your Tracker
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label htmlFor="app-title" className="block text-xs font-medium text-pp-text-muted mb-1">
                Role Title *
              </label>
              <input
                id="app-title"
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Junior Backend Engineer"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="app-company" className="block text-xs font-medium text-pp-text-muted mb-1">
                Company / Organization *
              </label>
              <input
                id="app-company"
                type="text"
                required
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="Employer name from portal"
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="app-url" className="block text-xs font-medium text-pp-text-muted mb-1">
                Official Posting URL
              </label>
              <input
                id="app-url"
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="app-type" className="block text-xs font-medium text-pp-text-muted mb-1">
                Type
              </label>
              <select
                id="app-type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value as OpportunityType)}
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text"
              >
                <option value="job">Full-Time Job</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label htmlFor="app-comp" className="block text-xs font-medium text-pp-text-muted mb-1">
                Compensation / Stipend
              </label>
              <div className="flex gap-1.5">
                <select
                  aria-label="Compensation currency"
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value as 'INR' | 'USD' | 'OTHER')}
                  className="rounded-lg border border-pp-border bg-pp-surface px-2 py-2 text-xs text-pp-text"
                >
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  id="app-comp"
                  type="text"
                  value={customComp}
                  onChange={(e) => setCustomComp(e.target.value)}
                  placeholder="e.g. ₹10 LPA or ₹25,000/mo"
                  className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="app-status" className="block text-xs font-medium text-pp-text-muted mb-1">
                Pipeline Status
              </label>
              <select
                id="app-status"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value as ApplicationStatus)}
                className="w-full rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text"
              >
                {APPLICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              aria-label="Application notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Optional notes (referral contact, interview date, tailored resume version)..."
              className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs text-pp-text focus:border-pp-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSavingCustom}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isSavingCustom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save to SQLite Tracker</span>
            </button>
          </div>
        </form>
      )}

      {tab !== 'tracker' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-pp-card border border-pp-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-pp-text-muted absolute left-3 top-2.5" />
              <input
                type="search"
                aria-label="Filter verified portals"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter platforms (LinkedIn, Naukri, Internshala)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-pp-border bg-pp-surface text-xs text-pp-text focus:border-pp-accent focus:outline-none"
              />
            </div>
            <div className="text-xs font-mono text-pp-text-muted tabular-nums">
              {filteredChannels.length} verified live search portals
            </div>
          </div>

          {/* Verified Search Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChannels.map((ch) => {
              const insight = insightsById[ch.id];
              const isInsightLoading = insightLoadingId === ch.id;
              return (
                <div
                  key={ch.id}
                  className="bg-pp-card border border-pp-border rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-pp-accent/60 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-pp-accent">{ch.platform}</span>
                      <span className="text-pp-text-muted inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {ch.locationLabel}
                      </span>
                    </div>

                    <h2 className="font-display text-base font-bold text-pp-text">
                      {ch.channelTitle}
                    </h2>

                    <p className="text-xs text-pp-text-muted leading-relaxed">{ch.description}</p>

                    <div className="rounded-lg bg-pp-surface border border-pp-border px-3 py-2 text-[11px] font-mono text-pp-text-muted">
                      Query: <span className="text-pp-text">{ch.searchQuery}</span>
                    </div>

                    {insightChannelId === ch.id && insight && (
                      <div className="rounded-lg bg-pp-accent-soft/40 border border-pp-accent/30 p-3.5 text-xs space-y-2">
                        <div className="font-semibold text-pp-accent">
                          Gemini Fit &amp; Prep Plan
                        </div>
                        <p className="text-pp-text leading-relaxed">{insight.explanation}</p>
                        {insight.preparationSteps.length > 0 && (
                          <ul className="list-disc pl-4 space-y-0.5 text-pp-text-muted">
                            {insight.preparationSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-pp-border flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      disabled={isInsightLoading}
                      onClick={() => void handleExplainChannel(ch)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-text bg-pp-surface border border-pp-border rounded-lg hover:border-pp-accent transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isInsightLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-pp-accent" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-pp-amber" />
                      )}
                      <span>AI Match &amp; Prep Plan</span>
                    </button>

                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Open Verified Search</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Application Tracker Tab */
        <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-pp-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-pp-text">
                Persisted Application Pipeline ({overview?.applications.length ?? 0})
              </h2>
              <p className="text-xs text-pp-text-muted">
                All applications you add from real job boards persist in SQLite across sessions.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-pp-text-muted tabular-nums">
              <span>
                Active:{' '}
                {(overview?.applications ?? []).filter((a) => a.status !== 'Withdrawn').length}
              </span>
              <span className="text-pp-success">
                Interviews/Offers:{' '}
                {
                  (overview?.applications ?? []).filter(
                    (a) => a.status === 'Interviewing' || a.status === 'Offer'
                  ).length
                }
              </span>
            </div>
          </div>

          {!overview || overview.applications.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-pp-text">No tracked applications yet.</p>
              <p className="text-xs text-pp-text-muted">
                Open a verified job or internship portal above, then click &quot;Track External Application&quot; to log real roles you apply to.
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log External Application</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-pp-border">
              {overview.applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-pp-text-muted">
                      <span className="uppercase font-mono text-[11px] text-pp-accent font-semibold">
                        {app.opportunityType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{domainMap.get(app.domainId) ?? app.domainId}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-pp-text font-semibold">
                        {app.compensationLabel}
                      </span>
                      {app.currency && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px]">{app.currency}</span>
                        </>
                      )}
                    </div>
                    <div className="font-display text-sm font-bold text-pp-text">
                      {app.title} — <span className="font-medium text-pp-text-muted">{app.company}</span>
                    </div>
                    {app.notes && (
                      <div className="text-xs text-pp-text-muted">{app.notes}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-pp-text-muted tabular-nums">
                      <span>Updated {new Date(app.updatedAt).toLocaleString()}</span>
                      {app.sourceUrl && (
                        <a
                          href={app.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-pp-accent hover:underline font-sans"
                        >
                          <span>View Posting</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <select
                      aria-label={`Status for ${app.title}`}
                      disabled={busyId === app.id}
                      value={app.status}
                      onChange={(e) =>
                        void handleUpdateTrackedApp(app, e.target.value as ApplicationStatus)
                      }
                      className="rounded-lg border border-pp-border bg-pp-surface px-3 py-1.5 text-xs font-semibold text-pp-text focus:border-pp-accent focus:outline-none"
                    >
                      {APPLICATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={busyId === app.id}
                      onClick={() => void handleDeleteApp(app.id)}
                      aria-label={`Remove ${app.title} from tracker`}
                      className="p-2 text-pp-text-muted hover:text-pp-error rounded-lg border border-pp-border bg-pp-surface cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

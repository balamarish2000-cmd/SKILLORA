import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, Loader2, Search, Video } from 'lucide-react';
import { api } from '../api';
import type {
  CareerDomain,
  CareerDomainId,
  LearningResource,
  ResourceDifficulty,
  ResourceType,
  SkillDefinition,
  YouTubeSearchResult,
} from '../shared/types';

interface ResourceLibraryViewProps {
  domains: CareerDomain[];
  skills: SkillDefinition[];
  resources: LearningResource[];
}

export const ResourceLibraryView: React.FC<ResourceLibraryViewProps> = ({
  domains,
  skills,
  resources,
}) => {
  const [domainFilter, setDomainFilter] = useState<'all' | CareerDomainId>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | ResourceDifficulty>('all');
  const [search, setSearch] = useState('');

  const [ytQuery, setYtQuery] = useState('React TypeScript full course');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytResult, setYtResult] = useState<YouTubeSearchResult | null>(null);

  const domainMap = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains]);
  const skillMap = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((res) => {
      if (domainFilter !== 'all' && res.domainId !== domainFilter) return false;
      if (typeFilter !== 'all' && res.type !== typeFilter) return false;
      if (difficultyFilter !== 'all' && res.difficulty !== difficultyFilter) return false;
      if (!q) return true;
      const skillName = skillMap.get(res.skillId)?.name.toLowerCase() ?? '';
      return (
        res.title.toLowerCase().includes(q) ||
        res.provider.toLowerCase().includes(q) ||
        skillName.includes(q)
      );
    });
  }, [resources, domainFilter, typeFilter, difficultyFilter, search, skillMap]);

  const handleYouTubeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = ytQuery.trim();
    if (!q) return;
    setYtLoading(true);
    setYtError(null);
    try {
      const res = await api.searchYouTubeResources(q);
      setYtResult(res);
    } catch (err) {
      setYtError(err instanceof Error ? err.message : 'YouTube lookup failed');
    } finally {
      setYtLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted">
            SKILLORA Curated Learning Hub · {resources.length} Verified Links across {domains.length} Sectors
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Educational Resource Hub
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-pp-text-muted absolute left-3 top-2.5" />
          <input
            type="search"
            aria-label="Search learning resources"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, textbooks, providers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-pp-border bg-pp-surface text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Live YouTube Tutorial Lookup Card */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-pp-text flex items-center gap-2">
              <Video className="w-4 h-4 text-pp-accent" />
              <span>YouTube Tutorial Search</span>
            </h2>
            <p className="text-xs text-pp-text-muted mt-0.5">
              Fetches live results via YouTube Data API when <code className="font-mono">YOUTUBE_API_KEY</code> is configured, or generates a verified live YouTube search link without inventing videos.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void handleYouTubeSearch(e)} className="flex flex-col sm:flex-row gap-2.5">
          <label htmlFor="yt-search-input" className="sr-only">
            Search YouTube tutorials
          </label>
          <input
            id="yt-search-input"
            type="text"
            value={ytQuery}
            onChange={(e) => setYtQuery(e.target.value)}
            placeholder="Search any skill or topic (e.g. Pharmacology, CAD Modeling, SQL Joins)..."
            className="flex-1 rounded-lg border border-pp-border bg-pp-surface px-3.5 py-2 text-sm text-pp-text focus:border-pp-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={ytLoading || !ytQuery.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-pp-accent-fg bg-pp-accent hover:bg-pp-accent-hover rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {ytLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search YouTube</span>
          </button>
        </form>

        {ytError && (
          <div role="alert" className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-lg px-3.5 py-2.5 text-xs">
            {ytError}
          </div>
        )}

        {ytResult && (
          <div className="bg-pp-surface border border-pp-border rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-pp-text-muted">{ytResult.notice}</span>
              <a
                href={ytResult.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pp-accent bg-pp-accent-soft border border-pp-accent/30 hover:bg-pp-elevated rounded-lg whitespace-nowrap shrink-0"
              >
                <span>Open &quot;{ytResult.query}&quot; on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {ytResult.videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {ytResult.videos.map((vid) => (
                  <a
                    key={vid.videoId}
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-pp-card border border-pp-border hover:border-pp-accent transition-colors flex flex-col justify-between gap-2"
                  >
                    <div className="text-xs font-semibold text-pp-text line-clamp-2">{vid.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-pp-text-muted">
                      <span className="truncate">{vid.channelTitle}</span>
                      <ExternalLink className="w-3 h-3 text-pp-accent shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="lib-domain" className="sr-only">
              Filter by domain
            </label>
            <select
              id="lib-domain"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value as 'all' | CareerDomainId)}
              className="rounded-lg border border-pp-border bg-pp-surface px-3 py-1.5 text-xs text-pp-text"
            >
              <option value="all">All {domains.length || 12} Sectors</option>
              {domains.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="lib-type" className="sr-only">
              Filter by resource type
            </label>
            <select
              id="lib-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | ResourceType)}
              className="rounded-lg border border-pp-border bg-pp-surface px-3 py-1.5 text-xs text-pp-text"
            >
              <option value="all">All Resource Types</option>
              <option value="course">Course</option>
              <option value="documentation">Documentation</option>
              <option value="tutorial">Tutorial</option>
              <option value="practice">Practice / Lab</option>
              <option value="textbook">Textbook</option>
            </select>
          </div>

          <div>
            <label htmlFor="lib-difficulty" className="sr-only">
              Filter by difficulty
            </label>
            <select
              id="lib-difficulty"
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as 'all' | ResourceDifficulty)
              }
              className="rounded-lg border border-pp-border bg-pp-surface px-3 py-1.5 text-xs text-pp-text"
            >
              <option value="all">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-pp-text-muted tabular-nums">
          {filtered.length} of {resources.length} verified resources
        </div>
      </div>

      {/* Resource Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-pp-card border border-pp-border rounded-xl p-10 text-center text-sm text-pp-text-muted">
          No verified resources match these filters. Try resetting your search or sector filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 90).map((res) => {
            const skill = skillMap.get(res.skillId);
            const dom = domainMap.get(res.domainId);
            return (
              <div
                key={res.id}
                className="bg-pp-card border border-pp-border rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-pp-accent/50 transition-colors"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-pp-text-muted">
                    <span>{dom?.shortName ?? res.domainId}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{res.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{res.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{res.hours}h</span>
                  </div>

                  <h2 className="mt-2 font-display text-sm font-semibold text-pp-text leading-snug">
                    {res.title}
                  </h2>

                  <div className="mt-1.5 text-xs text-pp-text-muted flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-pp-accent shrink-0" />
                    <span className="truncate">
                      Skill: {skill?.name ?? res.skillId}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-pp-border/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs text-pp-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{res.provider}</span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-pp-accent bg-pp-accent-soft border border-pp-accent/30 hover:bg-pp-elevated rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Open Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

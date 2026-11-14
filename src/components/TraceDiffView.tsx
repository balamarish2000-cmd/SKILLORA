import React, { useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  GitBranch,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import type { ReplanDiff, TwinSnapshot } from '../shared/types';

interface ReplanDiffPanelProps {
  diff: ReplanDiff | null;
}

export const ReplanDiffPanel: React.FC<ReplanDiffPanelProps> = ({ diff }) => {
  if (!diff) {
    return (
      <div className="bg-pp-card border border-pp-border rounded-xl p-8 text-center text-sm text-pp-text-muted">
        No roadmap replan diffs recorded yet. Switch goals or complete an assessment to generate a diff.
      </div>
    );
  }

  const hoursDelta = Math.round((diff.totalHoursAfter - diff.totalHoursBefore) * 10) / 10;

  return (
    <div className="space-y-5">
      <div className="bg-pp-card border border-pp-border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-pp-text-muted">
          <span className="font-mono uppercase tracking-wide text-pp-accent font-semibold">
            {diff.trigger.replace(/_/g, ' ')}
          </span>
          <span className="font-mono tabular-nums">
            {new Date(diff.createdAt).toLocaleString()}
          </span>
        </div>
        <h3 className="mt-1.5 font-display text-lg font-bold text-pp-text">
          {diff.triggerDetail}
        </h3>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-pp-border text-xs">
          <div>
            <span className="text-pp-text-muted">Added Steps</span>
            <div className="font-mono text-base font-bold text-pp-success tabular-nums">
              +{diff.added.length}
            </div>
          </div>
          <div>
            <span className="text-pp-text-muted">Removed Steps</span>
            <div className="font-mono text-base font-bold text-pp-error tabular-nums">
              -{diff.removed.length}
            </div>
          </div>
          <div>
            <span className="text-pp-text-muted">Reordered Steps</span>
            <div className="font-mono text-base font-bold text-pp-amber tabular-nums">
              {diff.reordered.length}
            </div>
          </div>
          <div>
            <span className="text-pp-text-muted">Workload Delta</span>
            <div className="font-mono text-base font-bold text-pp-text tabular-nums">
              {hoursDelta >= 0 ? `+${hoursDelta}h` : `${hoursDelta}h`} ({diff.totalHoursAfter}h total)
            </div>
          </div>
        </div>

        {(diff.previousPlanSummary.length > 0 || diff.newPlanSummary.length > 0) && (
          <div className="mt-4 pt-4 border-t border-pp-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-semibold text-pp-text-muted mb-1.5">
                Previous Plan ({diff.previousPlanSummary.length} steps)
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-pp-text-muted">
                {diff.previousPlanSummary.slice(0, 6).map((item, idx) => (
                  <li key={idx} className="truncate">{item}</li>
                ))}
              </ol>
            </div>
            <div>
              <div className="font-semibold text-pp-accent mb-1.5">
                Updated Plan ({diff.newPlanSummary.length} steps)
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-pp-text">
                {diff.newPlanSummary.slice(0, 6).map((item, idx) => (
                  <li key={idx} className="truncate">{item}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Added */}
      {diff.added.length > 0 && (
        <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-pp-success-soft border-b border-pp-success/30 text-xs font-semibold text-pp-success flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Added Roadmap Steps ({diff.added.length})</span>
          </div>
          <div className="divide-y divide-pp-border/60">
            {diff.added.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-pp-text">
                    {item.resourceTitle}
                    <span className="ml-2 text-xs font-normal text-pp-text-muted">
                      ({item.skillName})
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-pp-text-muted">{item.reason}</div>
                </div>
                <span className="font-mono text-xs font-semibold text-pp-success shrink-0 tabular-nums">
                  New #{item.newOrder}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reordered */}
      {diff.reordered.length > 0 && (
        <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-pp-amber-soft border-b border-pp-amber/30 text-xs font-semibold text-pp-amber flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4" />
            <span>Reordered / Reprioritized Steps ({diff.reordered.length})</span>
          </div>
          <div className="divide-y divide-pp-border/60">
            {diff.reordered.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-pp-text">
                    {item.resourceTitle}
                    <span className="ml-2 text-xs font-normal text-pp-text-muted">
                      ({item.skillName})
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-pp-text-muted">{item.reason}</div>
                </div>
                <span className="font-mono text-xs font-semibold text-pp-amber shrink-0 tabular-nums">
                  #{item.previousOrder} → #{item.newOrder}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Removed */}
      {diff.removed.length > 0 && (
        <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-pp-error-soft border-b border-pp-error/30 text-xs font-semibold text-pp-error flex items-center gap-1.5">
            <Minus className="w-4 h-4" />
            <span>Removed Steps ({diff.removed.length})</span>
          </div>
          <div className="divide-y divide-pp-border/60">
            {diff.removed.map((item, i) => (
              <div key={i} className="px-5 py-3.5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-pp-text-muted line-through">
                    {item.resourceTitle}
                    <span className="ml-2 text-xs font-normal text-pp-text-muted no-underline">
                      ({item.skillName})
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-pp-text-muted">{item.reason}</div>
                </div>
                <span className="font-mono text-xs font-semibold text-pp-error shrink-0 tabular-nums">
                  Was #{item.previousOrder}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReplanDiffModalProps {
  diff: ReplanDiff | null;
  open: boolean;
  onClose: () => void;
}

export const ReplanDiffModal: React.FC<ReplanDiffModalProps> = ({ diff, open, onClose }) => {
  if (!open || !diff) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-3xl max-h-[85vh] bg-pp-surface border border-pp-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-pp-card border-b border-pp-border">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-pp-accent" />
            <h2 id="replan-modal-title" className="font-display text-base font-bold text-pp-text">
              Replan Diff Engine Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Replan Diff modal"
            className="p-1.5 text-pp-text-muted hover:text-pp-text rounded-lg hover:bg-pp-elevated cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <ReplanDiffPanel diff={diff} />
        </div>
      </div>
    </div>
  );
};

interface TraceDiffViewProps {
  twin: TwinSnapshot;
}

export const TraceDiffView: React.FC<TraceDiffViewProps> = ({ twin }) => {
  const [selectedDiffIdx, setSelectedDiffIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'trace' | 'diff'>('trace');

  const selectedDiff = twin.diffHistory[selectedDiffIdx] ?? twin.latestDiff;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-pp-text-muted">
            Orchestrator Audit Log &amp; Curator Diff History
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Live Agent Trace &amp; Replan Diff Viewer
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-pp-surface rounded-lg border border-pp-border self-start">
          <button
            type="button"
            onClick={() => setActiveTab('trace')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              activeTab === 'trace'
                ? 'bg-pp-card text-pp-accent shadow-xs'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Agent Trace ({twin.traces.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              activeTab === 'diff'
                ? 'bg-pp-card text-pp-accent shadow-xs'
                : 'text-pp-text-muted hover:text-pp-text'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Replan Diffs ({twin.diffHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'trace' ? (
        <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-pp-border bg-pp-surface text-xs font-medium text-pp-text-muted">
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Input Summary</th>
                  <th className="py-3 px-4">Output Summary</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4">Status / Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pp-border/60 text-xs">
                {twin.traces.map((tr) => (
                  <tr key={tr.id} className="hover:bg-pp-elevated/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-pp-text whitespace-nowrap">
                      {tr.agentName}
                    </td>
                    <td className="py-3 px-4 font-mono text-pp-text-muted whitespace-nowrap">
                      {tr.action}
                    </td>
                    <td className="py-3 px-4 text-pp-text-muted max-w-xs truncate" title={tr.inputSummary}>
                      {tr.inputSummary}
                    </td>
                    <td className="py-3 px-4 text-pp-text max-w-sm truncate" title={tr.outputSummary}>
                      {tr.outputSummary}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-pp-text-muted tabular-nums whitespace-nowrap">
                      {tr.durationMs} ms
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          tr.status === 'replan_triggered'
                            ? 'text-pp-amber'
                            : tr.status === 'fallback'
                              ? 'text-pp-text-muted'
                              : 'text-pp-success'
                        }`}
                      >
                        {tr.status === 'replan_triggered'
                          ? 'Replan Triggered'
                          : tr.aiMode === 'gemini'
                            ? 'Gemini OK'
                            : 'Fallback OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-pp-card border border-pp-border rounded-xl p-4 space-y-2 self-start">
            <div className="text-xs font-semibold text-pp-text-muted px-2 pb-1">
              Recorded Replan Revisions
            </div>
            {twin.diffHistory.map((d, idx) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDiffIdx(idx)}
                className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedDiffIdx === idx
                    ? 'border-pp-accent bg-pp-accent-soft'
                    : 'border-pp-border bg-pp-surface/50 hover:bg-pp-elevated'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-pp-text-muted">
                  <span className="uppercase font-semibold text-pp-accent">
                    {d.trigger.replace(/_/g, ' ')}
                  </span>
                  <span>{new Date(d.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-pp-text line-clamp-2">
                  {d.triggerDetail}
                </div>
                <div className="mt-1 font-mono text-[11px] text-pp-text-muted tabular-nums">
                  +{d.added.length} added · -{d.removed.length} removed · {d.reordered.length} moved
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8">
            <ReplanDiffPanel diff={selectedDiff} />
          </div>
        </div>
      )}
    </div>
  );
};

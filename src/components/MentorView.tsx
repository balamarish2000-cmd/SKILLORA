import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react';
import { api } from '../api';
import type { TwinSnapshot } from '../shared/types';

interface MentorViewProps {
  twin: TwinSnapshot;
  onTwinUpdated: (nextTwin: TwinSnapshot) => void;
}

const BUILTIN_QUESTIONS: Array<{ category: string; question: string }> = [
  {
    category: 'Skill Gaps',
    question: 'Why is my highest-impact skill gap prioritized first for my target role?',
  },
  {
    category: 'Roadmap',
    question: 'Break down my next 3 roadmap steps and tell me how to finish them efficiently.',
  },
  {
    category: 'Career Fit',
    question: 'Which alternative roles best fit my current skills across all 12 sectors?',
  },
  {
    category: 'Transition',
    question: 'Switch my target goal to Robotics Engineer at 15 hrs/week and explain what changes.',
  },
  {
    category: 'Assessments',
    question: 'How should I prepare to score above 70% on my next domain skill assessment?',
  },
  {
    category: 'Compensation',
    question: 'How does my current readiness align with Indian ₹ LPA salary expectations for my target role?',
  },
  {
    category: 'Resume',
    question: 'What projects or measurable proof points should I add to strengthen my resume right now?',
  },
  {
    category: 'Study Pace',
    question: 'Should I use Fast Track, Balanced, or Deep Mastery given my weekly study hours?',
  },
  {
    category: 'Cross-Sector',
    question: 'If I explore Healthcare Data Analyst or Product Manager, which of my skills transfer directly?',
  },
  {
    category: 'Interview Prep',
    question: 'Give me 3 targeted technical and scenario interview questions based on my current skill gaps.',
  },
];

export const MentorView: React.FC<MentorViewProps> = ({ twin, onTwinUpdated }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setLastFailedPrompt(null);
    setInput('');
    setIsSending(true);
    try {
      const res = await api.sendMentorMessage({
        profileId: twin.profile.id,
        message: trimmed,
      });
      onTwinUpdated(res.twin);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gemini Mentor request failed.';
      setError(msg);
      setLastFailedPrompt(trimmed);
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleCopyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs text-pp-text-muted">
            SKILLORA Live AI Mentor · Equipped with get_twin, set_goal, explain_gap, request_replan
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-pp-text">
            Gemini AI Career Mentor
          </h1>
        </div>
        <div className="text-xs font-medium text-pp-text-muted">
          AI Status:{' '}
          <span
            className={
              twin.aiMode === 'gemini' ? 'text-pp-success font-semibold' : 'text-pp-amber font-semibold'
            }
          >
            {twin.aiMode === 'gemini' ? 'Live Gemini Connected' : 'GEMINI_API_KEY Not Configured'}
          </span>
        </div>
      </div>

      {/* Honest Gemini Key Notice when unconfigured */}
      {twin.aiMode !== 'gemini' && (
        <div
          data-testid="mentor-key-warning"
          className="bg-pp-amber-soft border border-pp-amber/40 text-pp-text rounded-xl px-4 py-3.5 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-pp-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-pp-amber">
              Live Gemini API Key Required for AI Mentor Chat
            </div>
            <p className="text-pp-text-muted leading-relaxed">
              SKILLORA never fakes or simulates AI responses. Configure <code className="font-mono text-pp-text">GEMINI_API_KEY</code> in your environment secrets to enable live multi-turn Gemini career coaching and tool calls. You can still inspect the 10 built-in questions below or test the connection.
            </p>
          </div>
        </div>
      )}

      {/* 10 Built-in Interactive Questions */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-pp-text flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pp-accent" />
            <span>10 Built-In Career Questions (Click any card to ask Gemini Mentor)</span>
          </div>
          <span className="text-[11px] font-mono text-pp-text-muted tabular-nums">
            Context: {twin.profile.name} · {twin.analysis.targetRoleTitle}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {BUILTIN_QUESTIONS.map((item) => (
            <button
              key={item.question}
              type="button"
              disabled={isSending}
              onClick={() => void sendMessage(item.question)}
              className="text-left p-3 rounded-lg border border-pp-border bg-pp-surface hover:border-pp-accent transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wide text-pp-accent">
                {item.category}
              </div>
              <div className="mt-0.5 text-xs text-pp-text leading-snug">{item.question}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-pp-error-soft border border-pp-error/40 text-pp-error rounded-xl px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <span>{error}</span>
          {lastFailedPrompt && (
            <button
              type="button"
              disabled={isSending}
              onClick={() => void sendMessage(lastFailedPrompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-pp-card border border-pp-error/40 text-pp-text rounded-lg hover:border-pp-accent cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Conversation Container */}
      <div className="bg-pp-card border border-pp-border rounded-xl flex flex-col min-h-[420px] max-h-[600px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {twin.mentorHistory.length === 0 ? (
            <div className="py-10 text-center max-w-lg mx-auto space-y-2">
              <Bot className="w-8 h-8 text-pp-accent mx-auto" />
              <h2 className="font-display text-base font-semibold text-pp-text">
                Ask SKILLORA Mentor about {twin.profile.name}&apos;s Career Path
              </h2>
              <p className="text-xs text-pp-text-muted leading-relaxed">
                Your live profile ({twin.analysis.overallReadiness}% readiness for{' '}
                {twin.analysis.targetRoleTitle}, {twin.analysis.gaps.length} skill gaps,{' '}
                {twin.progress.remainingHours}h roadmap remaining) is automatically provided as context on every turn.
              </p>
            </div>
          ) : (
            twin.mentorHistory.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-pp-accent-soft border border-pp-accent/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-pp-accent" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end flex flex-col' : ''}`}>
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-pp-accent text-pp-accent-fg font-medium'
                          : 'bg-pp-surface border border-pp-border text-pp-text'
                      }`}
                    >
                      {msg.content.split(/\*\*(.*?)\*\*/g).map((part, idx) =>
                        idx % 2 === 1 ? (
                          <strong key={idx} className="font-semibold">
                            {part}
                          </strong>
                        ) : (
                          <span key={idx}>{part}</span>
                        )
                      )}
                    </div>

                    {/* Selective Agent Orchestration Trace */}
                    {!isUser && msg.invokedAgents && msg.invokedAgents.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-pp-text-muted">Agents invoked:</span>
                        {msg.invokedAgents.map((agent) => (
                          <span
                            key={agent}
                            className="px-2 py-0.5 rounded bg-pp-surface border border-pp-border font-mono text-pp-accent"
                          >
                            {agent}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tool Execution Telemetry */}
                    {msg.toolExecutions.length > 0 && (
                      <div className="space-y-1.5 w-full">
                        {msg.toolExecutions.map((tool, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 rounded-lg border border-pp-border bg-pp-surface px-3 py-2 text-xs"
                          >
                            <Wrench className="w-3.5 h-3.5 text-pp-accent shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="font-mono font-semibold text-pp-text">
                                {tool.toolName}()
                              </span>
                              <span className="mx-1.5 text-pp-text-muted">·</span>
                              <span className="text-pp-text-muted">{tool.resultSummary}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-pp-text-muted font-mono tabular-nums">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString()} · Gemini AI
                      </span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => void handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 text-pp-text-muted hover:text-pp-accent cursor-pointer font-sans"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-pp-success" />
                              <span className="text-pp-success">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy response</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-pp-surface border border-pp-border flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-pp-text-muted" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-pp-text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-pp-accent" />
              <span>Consulting Gemini AI Mentor...</span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-pp-border p-4 flex flex-col sm:flex-row sm:items-end gap-3 bg-pp-surface rounded-b-xl"
        >
          <div className="flex-1">
            <label htmlFor="mentor-input" className="sr-only">
              Ask Gemini AI Mentor
            </label>
            <textarea
              id="mentor-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Ask about skill gaps, request a roadmap replan, or explore roles (Enter to send, Shift+Enter for new line)..."
              className="w-full rounded-lg border border-pp-border bg-pp-card px-3.5 py-2.5 text-sm text-pp-text placeholder:text-pp-text-muted focus:border-pp-accent focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-pp-accent-fg bg-pp-accent rounded-lg hover:bg-pp-accent-hover transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import { type Content, type FunctionDeclaration, ThinkingLevel, Type } from '@google/genai';
import { formatINRLpa } from '../../src/shared/currency.ts';
import { TARGET_ROLES } from '../../src/shared/seedData.ts';
import type {
  AIMode,
  AgentToolExecution,
  MentorMessage,
  OpportunityInsightResult,
  ResumeImproveResult,
  RoleId,
  TwinSnapshot,
} from '../../src/shared/types.ts';
import {
  GEMINI_MODEL,
  GeminiServiceError,
  generateTextWithGemini,
  requireGeminiClient,
  withGeminiTimeout,
} from '../gemini.ts';

export interface MentorToolbox {
  getTwin: () => TwinSnapshot;
  setGoal: (targetRoleId: RoleId, weeklyHours?: number) => TwinSnapshot;
  explainGap: (skillQuery?: string) => {
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    missingPrerequisites: string[];
    explanation: string;
  };
  requestReplan: (reason: string, focusSkillId?: string) => TwinSnapshot;
}

export interface MentorResponse {
  reply: string;
  toolExecutions: AgentToolExecution[];
  invokedAgents: string[];
  aiMode: AIMode;
  updatedTwin?: TwinSnapshot;
}

const mentorToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_twin',
    description:
      'Retrieves the learner current Skill Digital Twin snapshot across any career domain including readiness score, skill gaps, roadmap progress, and forecasted ready date.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'set_goal',
    description:
      'Changes the learner target career role (across IT, Medical, Mechanical, ECE, Robotics, Civil, Science, Business, Design) and optionally weekly study hours, triggering an immediate roadmap replan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetRoleId: {
          type: Type.STRING,
          description:
            'Target role ID or title, e.g., fullstack_developer, robotics_engineer, registered_nurse, mechanical_design_engineer, product_manager, ui_ux_designer',
        },
        weeklyHours: {
          type: Type.NUMBER,
          description: 'Optional updated weekly study hours (4-40)',
        },
      },
      required: ['targetRoleId'],
    },
  },
  {
    name: 'explain_gap',
    description:
      'Explains a specific skill gap or the top priority gap, including prerequisite dependencies.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        skillQuery: {
          type: Type.STRING,
          description: 'Skill name or ID to explain (optional; defaults to top gap)',
        },
      },
    },
  },
  {
    name: 'request_replan',
    description:
      'Triggers the Curator Agent to rebuild the learner roadmap with an optional focus skill prioritized.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: 'Why the roadmap replan is requested',
        },
        focusSkillId: {
          type: Type.STRING,
          description: 'Optional skill ID to prioritize for remediation',
        },
      },
      required: ['reason'],
    },
  },
];

function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  toolbox: MentorToolbox
): {
  result: unknown;
  record: AgentToolExecution;
  agentsUsed: string[];
  updatedTwin?: TwinSnapshot;
} {
  if (name === 'get_twin') {
    const twin = toolbox.getTwin();
    const summary = {
      name: twin.profile.name,
      specialization: twin.profile.specialization || twin.profile.currentTitle,
      preferredLocation: twin.profile.preferredLocation || 'India',
      targetRole: twin.analysis.targetRoleTitle,
      targetDomain: twin.analysis.targetDomainId,
      learningPlan: twin.profile.learningPlan,
      expectedSalary: formatINRLpa(twin.profile.expectedAnnualSalaryInr ?? 1200000),
      minimumSalaryFloor: formatINRLpa(twin.profile.minimumExpectedSalaryInr ?? 800000),
      readinessPct: twin.analysis.overallReadiness,
      topStrengths: twin.analysis.strengths.slice(0, 4).map((s) => `${s.skillName} (${s.currentLevel}/5)`),
      topGaps: twin.analysis.gaps.slice(0, 4).map((g) => `${g.skillName} (gap ${g.gap}, ${g.source})`),
      remainingHours: twin.progress.remainingHours,
      completedSteps: twin.progress.completedSteps,
      totalSteps: twin.progress.totalSteps,
      forecastedReadyDate: twin.progress.forecastedReadyDate,
    };
    return {
      result: summary,
      agentsUsed: ['Skill Analyst'],
      record: {
        toolName: 'get_twin',
        args,
        resultSummary: `Readiness ${summary.readinessPct}% for ${summary.targetRole}; ${summary.remainingHours}h remaining; target ${summary.expectedSalary}`,
      },
    };
  }

  if (name === 'set_goal') {
    const rawRole = String(args.targetRoleId || 'fullstack_developer').toLowerCase();
    const matchedRole =
      TARGET_ROLES.find(
        (r) =>
          r.id === rawRole ||
          r.title.toLowerCase() === rawRole ||
          r.title.toLowerCase().includes(rawRole.replace(/_/g, ' '))
      ) ?? TARGET_ROLES[0];
    const weeklyHours = typeof args.weeklyHours === 'number' ? args.weeklyHours : undefined;
    const updated = toolbox.setGoal(matchedRole.id, weeklyHours);
    return {
      result: {
        newRole: updated.analysis.targetRoleTitle,
        readinessPct: updated.analysis.overallReadiness,
        roadmapSteps: updated.roadmap.length,
        diffAdded: updated.latestDiff?.added.length ?? 0,
        diffRemoved: updated.latestDiff?.removed.length ?? 0,
      },
      agentsUsed: ['Career Matcher', 'Skill Analyst', 'Curator', 'Progress Tracker'],
      record: {
        toolName: 'set_goal',
        args: { targetRoleId: matchedRole.id, weeklyHours },
        resultSummary: `Switched goal to ${updated.analysis.targetRoleTitle} (${updated.analysis.overallReadiness}% ready, +${updated.latestDiff?.added.length ?? 0}/-${updated.latestDiff?.removed.length ?? 0} steps)`,
      },
      updatedTwin: updated,
    };
  }

  if (name === 'explain_gap') {
    const info = toolbox.explainGap(
      typeof args.skillQuery === 'string' ? args.skillQuery : undefined
    );
    return {
      result: info,
      agentsUsed: ['Skill Analyst'],
      record: {
        toolName: 'explain_gap',
        args,
        resultSummary: `${info.skillName}: level ${info.currentLevel}/${info.targetLevel} (gap ${info.gap})`,
      },
    };
  }

  if (name === 'request_replan') {
    const reason = String(args.reason || 'Mentor-requested adaptive replan');
    const focusSkillId = typeof args.focusSkillId === 'string' ? args.focusSkillId : undefined;
    const updated = toolbox.requestReplan(reason, focusSkillId);
    return {
      result: {
        roadmapSteps: updated.roadmap.length,
        remainingHours: updated.progress.remainingHours,
        forecastedReadyDate: updated.progress.forecastedReadyDate,
      },
      agentsUsed: ['Curator', 'Progress Tracker'],
      record: {
        toolName: 'request_replan',
        args: { reason, focusSkillId },
        resultSummary: `Rebuilt roadmap (${updated.roadmap.length} steps, ${updated.progress.remainingHours}h, ready ${updated.progress.forecastedReadyDate})`,
      },
      updatedTwin: updated,
    };
  }

  return {
    result: { error: `Unknown tool: ${name}` },
    agentsUsed: [],
    record: {
      toolName: name,
      args,
      resultSummary: `Unknown tool ${name}`,
    },
  };
}

function buildConversationContents(history: MentorMessage[], latestMessage: string): Content[] {
  const recent = history.slice(-10).map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: msg.content }],
  }));
  return [...recent, { role: 'user', parts: [{ text: latestMessage }] }];
}

export async function runMentorAgent(
  message: string,
  toolbox: MentorToolbox,
  history: MentorMessage[] = []
): Promise<MentorResponse> {
  const client = requireGeminiClient();
  const toolExecutions: AgentToolExecution[] = [];
  const invokedAgentSet = new Set<string>(['Orchestrator', 'Mentor']);
  let updatedTwin: TwinSnapshot | undefined;

  const twin = toolbox.getTwin();
  const topGaps = twin.analysis.gaps
    .slice(0, 5)
    .map((g) => `${g.skillName} (${g.currentLevel}/${g.targetLevel}, source: ${g.source})`)
    .join('; ');
  const topStrengths = twin.analysis.strengths
    .slice(0, 5)
    .map((s) => `${s.skillName} (${s.currentLevel}/5, ${s.source})`)
    .join('; ');
  const nextRoadmap = twin.roadmap
    .filter((s) => !s.completed)
    .slice(0, 4)
    .map((s) => `${s.order}. ${s.skillName}: ${s.resourceTitle} (${s.hours}h)`)
    .join(' | ');

  const systemInstruction = `You are the SKILLORA AI Career Mentor, helping learners across 12 sectors (IT & Software, Medical & Healthcare, Mechanical Engineering, Electronics & Electrical, Robotics & Automation, Civil & Architecture, Science & Research, Business & Management, Design & Creative Arts, Education & Teaching, Finance & Accounting, Agriculture & Environmental Science).

Learner Profile Context:
- Name: ${twin.profile.name}
- Current Title / Specialization: ${twin.profile.currentTitle}${twin.profile.specialization ? ` (${twin.profile.specialization})` : ''}
- Preferred Location: ${twin.profile.preferredLocation || 'India'}
- Target Profession: ${twin.analysis.targetRoleTitle} (${twin.analysis.targetDomainId})
- Readiness Score: ${twin.analysis.overallReadiness}% | Roadmap Progress: ${twin.progress.completedSteps}/${twin.progress.totalSteps} steps (${twin.progress.remainingHours}h remaining, forecasted ready ${twin.progress.forecastedReadyDate})
- Weekly Availability: ${twin.profile.weeklyHours} hrs/week | Plan Mode: ${twin.profile.learningPlan}
- Compensation Expectation: ${formatINRLpa(twin.profile.expectedAnnualSalaryInr ?? 1200000)} (Min floor ${formatINRLpa(twin.profile.minimumExpectedSalaryInr ?? 800000)})
- Top Strengths: ${topStrengths || 'None recorded yet'}
- Priority Skill Gaps: ${topGaps || 'None'}
- Upcoming Roadmap Steps: ${nextRoadmap || 'No active steps remaining'}

Behavior & Honesty Rules:
- Always distinguish self-reported/resume-extracted skills from assessment-verified skills when discussing readiness.
- Call tools (get_twin, set_goal, explain_gap, request_replan) only when the user asks to inspect live metrics, change career goals/hours, examine prerequisite gaps, or replan their roadmap.
- Quote salary/compensation in Indian Rupees (₹ / LPA) unless the user asks for another currency.
- For Medical & Healthcare roles, clarify that SKILLORA provides educational preparation guidance only and never replaces clinical education or board licensure.
- Never fabricate job postings, employers, or salaries. Give practical, structured, concise advice grounded in the learner's profile.`;

  const contents = buildConversationContents(history, message);

  try {
    for (let round = 0; round < 3; round++) {
      const response = await withGeminiTimeout(
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: mentorToolDeclarations }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        40000
      );

      const functionCalls = response.functionCalls ?? [];
      const modelContent = response.candidates?.[0]?.content;

      if (functionCalls.length > 0 && modelContent) {
        contents.push(modelContent);
        const responseParts = [];
        for (const call of functionCalls) {
          const exec = executeToolCall(
            call.name ?? 'get_twin',
            (call.args ?? {}) as Record<string, unknown>,
            toolbox
          );
          toolExecutions.push(exec.record);
          for (const ag of exec.agentsUsed) invokedAgentSet.add(ag);
          if (exec.updatedTwin) updatedTwin = exec.updatedTwin;
          responseParts.push({
            functionResponse: {
              id: call.id,
              name: call.name ?? 'get_twin',
              response: { result: exec.result },
            },
          });
        }
        contents.push({ role: 'user', parts: responseParts });
        continue;
      }

      const textReply = (response.text ?? '').trim();
      if (textReply) {
        return {
          reply: textReply,
          toolExecutions,
          invokedAgents: [...invokedAgentSet],
          aiMode: 'gemini',
          updatedTwin,
        };
      }
      break;
    }

    throw new GeminiServiceError(
      'GEMINI_API_ERROR',
      'Gemini AI Mentor completed tool execution without returning a final response. Please retry.',
      502
    );
  } catch (err) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      'GEMINI_API_ERROR',
      err instanceof Error ? `Gemini AI Mentor failed: ${err.message}` : 'Gemini AI Mentor failed.',
      502
    );
  }
}

export async function improveResumeWithGemini(params: {
  twin: TwinSnapshot;
  targetSection: 'summary' | 'project' | 'tailor';
  currentText: string;
  projectTitle?: string;
}): Promise<ResumeImproveResult> {
  const { twin, targetSection, currentText, projectTitle } = params;
  const strengths = twin.analysis.strengths
    .slice(0, 5)
    .map((s) => `${s.skillName} (${s.currentLevel}/5, ${s.source})`)
    .join(', ');
  const gaps = twin.analysis.gaps
    .slice(0, 4)
    .map((g) => g.skillName)
    .join(', ');

  const prompt = `Improve the following resume ${targetSection} section for ${twin.profile.name}, targeting "${twin.analysis.targetRoleTitle}" (${twin.profile.experienceYears} yrs experience, preferred location: ${twin.profile.preferredLocation || 'India'}).
${projectTitle ? `Project Title: ${projectTitle}` : ''}
Verified/Extracted Skills: ${strengths || 'General domain background'}
Priority Growth Areas: ${gaps || 'None'}

Original Draft:
${currentText}

Rules:
- Keep every factual claim grounded in the original draft and verified skills. Do NOT invent companies, degrees, or fabricated metrics.
- Make phrasing crisp, ATS-friendly, and action-oriented.
- Return JSON with exact keys: "improvedText" (string) and "rationale" (1 short sentence).`;

  const client = requireGeminiClient();
  try {
    const response = await withGeminiTimeout(
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are the SKILLORA Resume Writing Assistant. Improve wording without fabricating facts. Return valid JSON only.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedText: { type: Type.STRING },
              rationale: { type: Type.STRING },
            },
            required: ['improvedText', 'rationale'],
          },
        },
      }),
      20000
    );

    const raw = (response.text ?? '').trim();
    const parsed = JSON.parse(raw) as { improvedText?: string; rationale?: string };
    if (!parsed.improvedText?.trim()) {
      throw new GeminiServiceError('GEMINI_API_ERROR', 'Gemini returned an empty resume suggestion.', 502);
    }

    return {
      targetSection,
      improvedText: parsed.improvedText.trim(),
      rationale: parsed.rationale?.trim() || `Tailored wording toward ${twin.analysis.targetRoleTitle}.`,
      aiMode: 'gemini',
    };
  } catch (err) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      'GEMINI_API_ERROR',
      err instanceof Error ? `Gemini resume enhancement failed: ${err.message}` : 'Gemini resume enhancement failed.',
      502
    );
  }
}

export async function explainOpportunityWithGemini(params: {
  twin: TwinSnapshot;
  channelTitle: string;
  platform: string;
  opportunityType: 'job' | 'internship';
}): Promise<OpportunityInsightResult> {
  const { twin, channelTitle, platform, opportunityType } = params;
  const matched = twin.analysis.strengths.slice(0, 5).map((s) => s.skillName);
  const focusGaps = twin.analysis.gaps.slice(0, 4).map((g) => g.skillName);

  const client = requireGeminiClient();
  const prompt = `Explain why ${twin.profile.name} (${twin.profile.currentTitle}, ${twin.analysis.overallReadiness}% readiness for ${twin.analysis.targetRoleTitle}, preferred location: ${twin.profile.preferredLocation || 'India'}) fits "${channelTitle}" (${opportunityType} search on ${platform}), and give 3 concrete preparation steps before applying.
Matched Skills: ${matched.join(', ') || 'Foundational competencies'}
Skill Gaps to Strengthen: ${focusGaps.join(', ') || 'None'}

Rules:
- Do NOT invent specific employer vacancies, job IDs, deadlines, or guaranteed salaries.
- Return valid JSON with keys: "explanation" (2-3 sentences), "preparationSteps" (array of 3 short strings).`;

  try {
    const response = await withGeminiTimeout(
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are the SKILLORA Career Opportunity Advisor. Provide honest readiness alignment and practical application preparation advice without inventing vacancies.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['explanation', 'preparationSteps'],
          },
        },
      }),
      20000
    );

    const parsed = JSON.parse((response.text ?? '').trim()) as {
      explanation?: string;
      preparationSteps?: string[];
    };

    if (!parsed.explanation?.trim()) {
      throw new GeminiServiceError('GEMINI_API_ERROR', 'Gemini returned an empty opportunity insight.', 502);
    }

    return {
      explanation: parsed.explanation.trim(),
      preparationSteps: (parsed.preparationSteps ?? []).slice(0, 4),
      matchedSkills: matched,
      focusGaps,
      aiMode: 'gemini',
    };
  } catch (err) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      'GEMINI_API_ERROR',
      err instanceof Error ? `Gemini opportunity analysis failed: ${err.message}` : 'Gemini opportunity analysis failed.',
      502
    );
  }
}

export { generateTextWithGemini };

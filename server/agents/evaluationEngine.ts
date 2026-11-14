import vm from 'node:vm';
import { ThinkingLevel, Type } from '@google/genai';
import type {
  AIMode,
  ActionableCategoryFeedback,
  CodingChallenge,
  DomainPracticalTask,
  EvaluationAttemptComparison,
  EvaluationAttemptRecord,
  EvaluationCategoryKey,
  EvaluationCategoryResult,
  EvaluationCheckRecord,
  EvaluationReport,
  PerformanceClassification,
  QuizQuestion,
  TestCaseExecutionResult,
} from '../../src/shared/types.ts';
import { GEMINI_MODEL, getActiveAIMode, getGeminiClient, withGeminiTimeout } from '../gemini.ts';

export const EVALUATION_CRITERIA: ReadonlyArray<{
  key: EvaluationCategoryKey;
  label: string;
  weightPct: number;
}> = [
  { key: 'code_quality', label: 'Code Quality', weightPct: 20 },
  { key: 'security', label: 'Security', weightPct: 20 },
  { key: 'efficiency', label: 'Efficiency', weightPct: 15 },
  { key: 'testing', label: 'Testing', weightPct: 15 },
  { key: 'accessibility', label: 'Accessibility', weightPct: 10 },
  { key: 'problem_alignment', label: 'Problem Statement Alignment', weightPct: 20 },
];

export function classifyPerformance(score: number): PerformanceClassification {
  if (score >= 85) return 'Exemplary';
  if (score >= 70) return 'Proficient';
  if (score >= 50) return 'Developing';
  return 'Needs Attention';
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeWeightedContribution(score: number, weightPct: number): number {
  return Math.round(score * (weightPct / 100) * 10) / 10;
}

export function calculateWeightedOverallScore(
  categories: ReadonlyArray<Pick<EvaluationCategoryResult, 'score' | 'weightPct'>>
): number {
  const raw = categories.reduce((sum, cat) => sum + cat.score * (cat.weightPct / 100), 0);
  return Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
}

export interface EvaluationPipelineInput {
  attemptId: string;
  profileId: string;
  skillId: string;
  skillName: string;
  submissionType: 'assessment' | 'project_code';
  submissionTitle: string;
  attemptNumber: number;
  timestamp?: string;
  problemStatement: string;
  submittedCode?: string;
  practicalAnswer?: string;
  testNotes?: string;
  quizScore: number;
  practicalScore: number;
  questions?: QuizQuestion[];
  quizAnswers?: number[];
  challenge?: CodingChallenge | null;
  practicalTask?: DomainPracticalTask | null;
  testResults?: TestCaseExecutionResult[];
  executionMs?: number;
}

interface CodeStaticMetrics {
  hasCode: boolean;
  lineCount: number;
  charCount: number;
  isJavaScriptLike: boolean;
  isHtmlOrJsx: boolean;
  isSql: boolean;
  syntaxValid: boolean | null;
  syntaxError?: string;
  maxBraceDepth: number;
  hasVarKeyword: boolean;
  hasTryCatch: boolean;
  hasInputGuards: boolean;
  hasFunctionStructure: boolean;
  hasComments: boolean;
  shortIdentifierCount: number;
  consoleLogCount: number;
  hasDebugger: boolean;
  securityFindings: Array<{
    severity: 'high' | 'medium';
    title: string;
    detail: string;
    why: string;
    fix: string;
  }>;
  nestedLoopDepth: number;
  usesHashLookup: boolean;
  usesLookupInLoop: boolean;
  hasUnboundedSqlSelectAll: boolean;
  userTestAssertionCount: number;
  accessibilityFindings: Array<{
    severity: 'high' | 'medium';
    title: string;
    detail: string;
    why: string;
    fix: string;
  }>;
  accessibilityPositives: string[];
}

function estimateMaxBraceDepth(code: string): number {
  let depth = 0;
  let max = 0;
  for (const ch of code) {
    if (ch === '{') {
      depth += 1;
      if (depth > max) max = depth;
    } else if (ch === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  return max;
}

function estimateNestedLoopDepth(code: string): number {
  const lines = code.split('\n');
  let braceDepth = 0;
  const loopBraceStack: number[] = [];
  let maxLoopDepth = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//') || line.startsWith('*')) continue;

    const opensLoop =
      /\b(for|while)\s*\(/.test(line) || /\.(forEach|map|filter|reduce)\s*\(/.test(line);
    const hasOpenBraceOnLine = line.includes('{');

    if (opensLoop) {
      const currentDepth = loopBraceStack.length + 1;
      if (currentDepth > maxLoopDepth) {
        maxLoopDepth = currentDepth;
      }
      // Only push onto the nesting stack if this loop opens a block that can enclose inner loops
      if (hasOpenBraceOnLine || /\b(for|while)\s*\(/.test(line)) {
        loopBraceStack.push(braceDepth);
      }
    }

    for (const ch of line) {
      if (ch === '{') braceDepth += 1;
      if (ch === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
        while (loopBraceStack.length > 0 && braceDepth <= loopBraceStack[loopBraceStack.length - 1]) {
          loopBraceStack.pop();
        }
      }
    }
  }
  return maxLoopDepth;
}

function inspectSubmittedCode(rawCode?: string, testNotes?: string): CodeStaticMetrics {
  const code = (rawCode ?? '').trim();
  const combinedTests = `${code}\n${testNotes ?? ''}`;
  if (!code) {
    return {
      hasCode: false,
      lineCount: 0,
      charCount: 0,
      isJavaScriptLike: false,
      isHtmlOrJsx: false,
      isSql: false,
      syntaxValid: null,
      maxBraceDepth: 0,
      hasVarKeyword: false,
      hasTryCatch: false,
      hasInputGuards: false,
      hasFunctionStructure: false,
      hasComments: false,
      shortIdentifierCount: 0,
      consoleLogCount: 0,
      hasDebugger: false,
      securityFindings: [],
      nestedLoopDepth: 0,
      usesHashLookup: false,
      usesLookupInLoop: false,
      hasUnboundedSqlSelectAll: false,
      userTestAssertionCount: 0,
      accessibilityFindings: [],
      accessibilityPositives: [],
    };
  }

  const lines = code.split('\n');
  const isHtmlOrJsx =
    /<(button|input|img|form|label|select|textarea|div|span|a|nav|main|header|section)\b/i.test(code);
  const isSql = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE)\b/i.test(code) && !/\bfunction\b/.test(code);
  const isPython = /^\s*(def |class |import |from .+ import )/m.test(code);
  const isJavaScriptLike = !isSql && !isPython && !/^\s*<!doctype html/i.test(code);

  let syntaxValid: boolean | null = null;
  let syntaxError: string | undefined;
  if (isJavaScriptLike && !isHtmlOrJsx) {
    try {
      new vm.Script(`"use strict";\n${code}`);
      syntaxValid = true;
    } catch (err) {
      syntaxValid = false;
      syntaxError = err instanceof Error ? err.message : String(err);
    }
  }

  const securityFindings: CodeStaticMetrics['securityFindings'] = [];
  if (/\beval\s*\(/.test(code) || /\bnew\s+Function\s*\(/.test(code)) {
    securityFindings.push({
      severity: 'high',
      title: 'Dynamic code execution (`eval` / `new Function`) detected',
      detail: 'Dynamic string evaluation executes arbitrary code in the application context.',
      why: 'If any user-supplied or external string reaches eval/new Function, attackers gain arbitrary code execution (XSS/RCE).',
      fix: 'Replace eval/new Function with structured JSON.parse, explicit lookup tables, or safe AST/expression parsers.',
    });
  }
  if (/\.innerHTML\s*=|dangerouslySetInnerHTML|document\.write\s*\(/.test(code)) {
    securityFindings.push({
      severity: 'high',
      title: 'Unsafe raw HTML injection sink detected',
      detail: 'Found `innerHTML`, `dangerouslySetInnerHTML`, or `document.write` in submitted code.',
      why: 'Inserting unescaped strings into the DOM opens Cross-Site Scripting (XSS) vulnerabilities.',
      fix: 'Render text via safe framework bindings or `textContent`, or sanitize strictly with an allowlist sanitizer.',
    });
  }
  if (/(SELECT|INSERT|UPDATE|DELETE)[^;\n]*(\$\{|\+\s*[a-zA-Z_$])/i.test(code)) {
    securityFindings.push({
      severity: 'high',
      title: 'Potential SQL string interpolation detected',
      detail: 'SQL query appears concatenated or template-interpolated with dynamic variables.',
      why: 'Interpolating variables into SQL strings enables SQL injection attacks that can leak or corrupt database tables.',
      fix: 'Use parameterized prepared statements (`?` or `$1` placeholders) instead of string interpolation.',
    });
  }
  if (/(apiKey|secret|password|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{8,}['"]/i.test(code)) {
    securityFindings.push({
      severity: 'high',
      title: 'Possible hardcoded credential or secret literal',
      detail: 'Detected a literal string assigned to a password/token/apiKey/secret identifier.',
      why: 'Hardcoded credentials leak via source control, client bundles, and logs.',
      fix: 'Load credentials from server-side environment variables (`process.env.*`) and rotate exposed secrets.',
    });
  }
  if (/child_process|execSync\s*\(|\bexec\s*\(/.test(code) && !/RegExp/.test(code)) {
    securityFindings.push({
      severity: 'medium',
      title: 'Shell command execution surface detected',
      detail: 'Detected `child_process` or `exec` usage; verify arguments are strictly parameterized.',
      why: 'Passing unsanitized user input to shell commands risks OS command injection.',
      fix: 'Use `execFile`/`spawn` with explicit argument arrays and avoid shell interpolation.',
    });
  }
  if (/JSON\.parse\s*\(/.test(code) && !/try\s*\{/.test(code)) {
    securityFindings.push({
      severity: 'medium',
      title: 'Unwrapped `JSON.parse` without error boundary',
      detail: '`JSON.parse(...)` is invoked outside a `try/catch` block.',
      why: 'Malformed payloads will throw an uncaught SyntaxError and crash request handling.',
      fix: 'Wrap `JSON.parse` in `try/catch` and validate the parsed structure before accessing fields.',
    });
  }

  const accessibilityFindings: CodeStaticMetrics['accessibilityFindings'] = [];
  const accessibilityPositives: string[] = [];

  if (isHtmlOrJsx) {
    const imgTags = code.match(/<img\b[^>]*>/gi) ?? [];
    const imgsMissingAlt = imgTags.filter((tag) => !/\balt\s*=/i.test(tag));
    if (imgsMissingAlt.length > 0) {
      accessibilityFindings.push({
        severity: 'high',
        title: `${imgsMissingAlt.length} <img> element(s) missing alt text`,
        detail: 'Image tags were found without an `alt` attribute.',
        why: 'Screen readers cannot describe images to blind or low-vision users without descriptive `alt` text (WCAG 1.1.1).',
        fix: 'Add meaningful `alt="..."` descriptions, or `alt=""` if the image is purely decorative.',
      });
    } else if (imgTags.length > 0) {
      accessibilityPositives.push('All <img> elements specify alt attributes');
    }

    const formControls = code.match(/<(input|select|textarea)\b[^>]*>/gi) ?? [];
    const nonHiddenControls = formControls.filter((tag) => !/type\s*=\s*['"]hidden['"]/i.test(tag));
    const hasLabelTag = /<label\b/i.test(code);
    const unlabeledControls = nonHiddenControls.filter(
      (tag) => !/(aria-label|aria-labelledby|title)\s*=/i.test(tag)
    );
    if (nonHiddenControls.length > 0 && !hasLabelTag && unlabeledControls.length > 0) {
      accessibilityFindings.push({
        severity: 'high',
        title: 'Form controls lack accessible labels',
        detail: `Found ${unlabeledControls.length} input/select/textarea control(s) without <label> or aria-label.`,
        why: 'Screen readers and voice-control tools rely on explicit labels to announce form field purpose (WCAG 1.3.1 / 4.1.2).',
        fix: 'Associate `<label htmlFor="id">` with each input `id`, or add `aria-label`.',
      });
    } else if (nonHiddenControls.length > 0) {
      accessibilityPositives.push('Form inputs are paired with label or ARIA naming');
    }

    const clickableNonNative = code.match(/<(div|span)\b[^>]*(onClick|onclick)\s*=/g) ?? [];
    if (clickableNonNative.length > 0) {
      accessibilityFindings.push({
        severity: 'high',
        title: `Interactive click handler on non-semantic <div/span> (${clickableNonNative.length})`,
        detail: 'Detected `onClick` attached to a non-interactive container element.',
        why: 'Keyboard-only and screen reader users cannot focus or activate plain `<div>` or `<span>` elements reliably (WCAG 2.1.1).',
        fix: 'Replace clickable `<div>`/`<span>` elements with native `<button type="button">` or `<a href>`.',
      });
    }

    if (/<(button|nav|main|header|fieldset|legend)\b/i.test(code)) {
      accessibilityPositives.push('Uses semantic HTML elements (<button>, <main>, <nav>, or <fieldset>)');
    }
    if (/aria-[a-z-]+\s*=|role\s*=|focus-visible|sr-only/i.test(code)) {
      accessibilityPositives.push('Includes explicit ARIA attributes or focus-visible states');
    }
  }

  const varMatches = code.match(/\bvar\s+/g) ?? [];
  const shortIds = code.match(/\b(?:const|let|var)\s+([a-zA-Z])\b/g) ?? [];
  const nonLoopShortIds = shortIds.filter((m) => !/\b(i|j|k|n|x|y)\b/.test(m));
  const assertionMatches =
    combinedTests.match(/\b(assert\.|expect\(|test\(|it\(|describe\(|console\.assert\()/g) ?? [];

  return {
    hasCode: true,
    lineCount: lines.length,
    charCount: code.length,
    isJavaScriptLike,
    isHtmlOrJsx,
    isSql,
    syntaxValid,
    syntaxError,
    maxBraceDepth: estimateMaxBraceDepth(code),
    hasVarKeyword: varMatches.length > 0,
    hasTryCatch: /\btry\s*\{/.test(code) || /\bexcept\b/.test(code),
    hasInputGuards:
      /Array\.isArray|typeof\s+[a-zA-Z_$]+|Number\.isFinite|!=\s*null|!==\s*undefined|if\s*\(\s*!|\?\./.test(code),
    hasFunctionStructure: /\bfunction\b|=>|\bclass\b|\bdef\b/.test(code),
    hasComments: /\/\/|\/\*|\#\s/.test(code),
    shortIdentifierCount: nonLoopShortIds.length,
    consoleLogCount: (code.match(/\bconsole\.log\s*\(/g) ?? []).length,
    hasDebugger: /\bdebugger\b/.test(code),
    securityFindings,
    nestedLoopDepth: estimateNestedLoopDepth(code),
    usesHashLookup: /\bnew\s+(Set|Map)\b/.test(code),
    usesLookupInLoop:
      estimateNestedLoopDepth(code) >= 1 && /\.(includes|indexOf|find|some)\s*\(/.test(code),
    hasUnboundedSqlSelectAll: /\bSELECT\s+\*\s+FROM\b/i.test(code) && !/\bLIMIT\b/i.test(code),
    userTestAssertionCount: assertionMatches.length,
    accessibilityFindings,
    accessibilityPositives,
  };
}

function extractKeywords(text: string): string[] {
  const stop = new Set([
    'with', 'that', 'this', 'from', 'into', 'your', 'have', 'will', 'must', 'should', 'when',
    'where', 'which', 'about', 'their', 'there', 'they', 'them', 'then', 'than', 'each', 'only',
    'also', 'some', 'more', 'most', 'such', 'what', 'given', 'using', 'return', 'returns', 'build',
    'create', 'implement', 'write', 'function', 'code', 'system', 'data', 'value', 'values',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
  return [...new Set(words)].slice(0, 16);
}

export function runDeterministicEvaluationPipeline(
  input: EvaluationPipelineInput
): EvaluationReport {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const codeText = (input.submittedCode ?? '').trim();
  const practicalText = (input.practicalAnswer ?? '').trim();
  const testResults = input.testResults ?? [];
  const metrics = inspectSubmittedCode(codeText, input.testNotes);
  const checksExecuted: EvaluationCheckRecord[] = [];

  // Record which automated checks actually ran
  if (testResults.length > 0) {
    const passedCount = testResults.filter((t) => t.passed).length;
    checksExecuted.push({
      name: input.challenge ? 'Sandboxed VM Test Runner' : 'Domain Quantitative / Scenario Verifier',
      executed: true,
      outcome: passedCount === testResults.length ? 'passed' : 'failed',
      detail: `${passedCount}/${testResults.length} automated verification checks passed.`,
    });
  } else {
    checksExecuted.push({
      name: 'Automated Functional Test Suite',
      executed: false,
      outcome: metrics.userTestAssertionCount > 0 ? 'passed' : 'not_executed',
      detail:
        metrics.userTestAssertionCount > 0
          ? `Detected ${metrics.userTestAssertionCount} inline test assertion(s) in submission; no external sandbox runner was attached for standalone code.`
          : 'No automated test suite was provided with this standalone submission.',
    });
  }

  if (metrics.hasCode) {
    checksExecuted.push({
      name: 'Static Code Quality & Complexity Analyzer',
      executed: true,
      outcome: metrics.syntaxValid === false ? 'failed' : 'passed',
      detail:
        metrics.syntaxValid === false
          ? `JavaScript syntax error detected: ${metrics.syntaxError}`
          : `Analyzed ${metrics.lineCount} lines (nesting depth ${metrics.maxBraceDepth}, loop depth ${metrics.nestedLoopDepth}).`,
    });
    checksExecuted.push({
      name: 'Static Security Pattern Scanner',
      executed: true,
      outcome: metrics.securityFindings.length > 0 ? 'findings' : 'passed',
      detail:
        metrics.securityFindings.length > 0
          ? `Flagged ${metrics.securityFindings.length} static security risk(s). Dynamic penetration / CVE dependency scan not executed.`
          : 'No high-risk static patterns (eval, raw HTML sinks, SQL interpolation, hardcoded credentials) found. Dynamic CVE/penetration scan not executed.',
    });
    checksExecuted.push({
      name: 'WCAG Static Markup & Accessibility Check',
      executed: metrics.isHtmlOrJsx,
      outcome: metrics.isHtmlOrJsx
        ? metrics.accessibilityFindings.length > 0
          ? 'findings'
          : 'passed'
        : 'not_applicable',
      detail: metrics.isHtmlOrJsx
        ? `Inspected HTML/JSX tags (${metrics.accessibilityFindings.length} issue(s), ${metrics.accessibilityPositives.length} positive signal(s)). Live screen-reader/contrast check not executed.`
        : 'Submission contains non-UI algorithmic/domain logic; WCAG DOM checks are N/A (not penalized as failures).',
    });
  } else {
    checksExecuted.push({
      name: 'Domain Diagnostic & Reasoning Verification',
      executed: true,
      outcome: input.practicalScore >= 50 ? 'passed' : 'failed',
      detail: `Diagnostic quiz ${input.quizScore}%, practical verification ${input.practicalScore}%. Source-code static scanners N/A for non-code submission.`,
    });
  }

  // 1. CODE QUALITY (20%)
  let cqScore = 75;
  const cqStrengths: string[] = [];
  const cqWeaknesses: string[] = [];
  const cqRecs: string[] = [];
  const cqEvidence: string[] = [];

  if (metrics.hasCode) {
    cqScore = 74;
    if (metrics.syntaxValid === false) {
      cqScore -= 40;
      cqWeaknesses.push(`Syntax parse failure: ${metrics.syntaxError}`);
      cqRecs.push('Resolve syntax errors so the module compiles and executes cleanly.');
    } else if (metrics.syntaxValid === true) {
      cqScore += 8;
      cqStrengths.push('Code parses cleanly under strict mode without syntax errors.');
    }

    if (metrics.hasFunctionStructure) {
      cqScore += 6;
      cqStrengths.push('Logic is organized inside named/modular function or class blocks.');
    } else {
      cqScore -= 10;
      cqWeaknesses.push('Logic is not encapsulated in a reusable function or module structure.');
      cqRecs.push('Extract core logic into a well-named function with explicit parameters.');
    }

    if (metrics.hasInputGuards || metrics.hasTryCatch) {
      cqScore += 6;
      cqStrengths.push('Includes defensive input guards or structured exception handling.');
    } else {
      cqScore -= 6;
      cqWeaknesses.push('No explicit null/type input guards or `try/catch` boundary detected.');
      cqRecs.push('Validate inputs (`Array.isArray`, `typeof`, null checks) at function entry.');
    }

    if (metrics.maxBraceDepth <= 3) {
      cqScore += 4;
      cqStrengths.push(`Shallow control flow nesting (max depth ${metrics.maxBraceDepth}) aids readability.`);
    } else if (metrics.maxBraceDepth >= 5) {
      cqScore -= 8;
      cqWeaknesses.push(`Deep nesting (${metrics.maxBraceDepth} levels) increases maintenance complexity.`);
      cqRecs.push('Use early returns or helper functions to flatten deeply nested blocks.');
    }

    if (metrics.hasVarKeyword) {
      cqScore -= 6;
      cqWeaknesses.push('Uses legacy `var` declarations instead of block-scoped `const`/`let`.');
      cqRecs.push('Replace `var` with `const` (default) or `let`.');
    }
    if (metrics.shortIdentifierCount > 1) {
      cqScore -= 5;
      cqWeaknesses.push(`Detected ${metrics.shortIdentifierCount} single-letter variable name(s) outside loop indices.`);
      cqRecs.push('Use descriptive camelCase identifiers that convey domain meaning.');
    }
    if (metrics.hasDebugger) {
      cqScore -= 8;
      cqWeaknesses.push('Leftover `debugger` statement found in submission.');
      cqRecs.push('Remove `debugger` statements before finalizing code.');
    }
    if (metrics.consoleLogCount > 2) {
      cqScore -= 4;
      cqWeaknesses.push(`Multiple debug \`console.log\` calls (${metrics.consoleLogCount}) found.`);
      cqRecs.push('Remove noisy debug logging or replace with structured error returns.');
    }
    if (metrics.lineCount < 3 && input.submissionType === 'project_code') {
      cqScore = Math.min(cqScore, 45);
      cqWeaknesses.push('Submission is very brief (< 3 lines), limiting structural maintainability assessment.');
    }
    cqEvidence.push(`${metrics.lineCount} lines analyzed · Max nesting depth ${metrics.maxBraceDepth}`);
  } else {
    // Non-code domain assessment
    cqScore = Math.round(input.quizScore * 0.45 + input.practicalScore * 0.55);
    if (practicalText) {
      cqStrengths.push('Submitted a structured practical response matching the domain format.');
    } else {
      cqScore = Math.min(cqScore, 35);
      cqWeaknesses.push('Practical response field was left empty.');
      cqRecs.push('Provide a clear, complete practical solution before submitting.');
    }
    if (input.quizScore >= 70) {
      cqStrengths.push(`Strong conceptual clarity (${input.quizScore}% on diagnostic standards).`);
    } else {
      cqWeaknesses.push(`Diagnostic standards quiz scored ${input.quizScore}%, indicating gaps in terminology/best practices.`);
      cqRecs.push('Review core domain methodology standards and naming conventions.');
    }
    cqEvidence.push('Evaluated via domain structure & diagnostic standards (source-code linter N/A).');
  }

  cqScore = clampScore(cqScore);
  if (cqStrengths.length === 0) cqStrengths.push('Submission received and parsed cleanly.');
  if (cqWeaknesses.length === 0) cqWeaknesses.push('No major structural or readability defects detected.');
  if (cqRecs.length === 0) cqRecs.push('Keep functions concise with JSDoc/type annotations for long-term maintainability.');

  // 2. SECURITY (20%)
  let secScore = 82;
  const secStrengths: string[] = [];
  const secWeaknesses: string[] = [];
  const secRecs: string[] = [];
  const secEvidence: string[] = [];

  if (metrics.hasCode) {
    secScore = 86;
    if (metrics.hasInputGuards || metrics.hasTryCatch) {
      secScore += 6;
      secStrengths.push('Applies explicit input validation or defensive error handling.');
    } else {
      secScore -= 8;
      secWeaknesses.push('Missing explicit input boundary/type validation on entry arguments.');
      secRecs.push('Validate untrusted parameters (type, range, null/empty) before processing.');
    }

    for (const f of metrics.securityFindings) {
      secScore -= f.severity === 'high' ? 28 : 14;
      secWeaknesses.push(`${f.title}: ${f.detail}`);
      secRecs.push(f.fix);
    }

    if (metrics.securityFindings.length === 0) {
      secStrengths.push('No dangerous execution sinks (`eval`, raw HTML injection, SQL interpolation, or hardcoded secrets) detected.');
    }
    secEvidence.push(
      `Static pattern scan completed (${metrics.securityFindings.length} finding(s)); dynamic penetration/dependency audit not executed.`
    );
  } else {
    secScore = input.practicalScore >= 50 ? 84 : 58;
    if (input.practicalScore >= 50) {
      secStrengths.push('Response followed domain safety/compliance boundaries without risky protocol deviations.');
    } else {
      secWeaknesses.push('Failed domain protocol/calculation verification, which poses operational or safety compliance risk.');
      secRecs.push('Verify threshold checks and regulatory/safety protocols prior to execution.');
    }
    secEvidence.push('Evaluated domain safety/compliance boundaries (code vulnerability scanner N/A for non-code response).');
  }
  secScore = clampScore(secScore);
  if (secStrengths.length === 0) secStrengths.push('Submission contained no hardcoded credentials.');
  if (secWeaknesses.length === 0) secWeaknesses.push('Static scan found no obvious vulnerabilities; runtime/dependency checks were out of scope.');
  if (secRecs.length === 0) secRecs.push('Maintain strict input validation and parameterized interfaces as scope grows.');

  // 3. EFFICIENCY (15%)
  let effScore = 80;
  const effStrengths: string[] = [];
  const effWeaknesses: string[] = [];
  const effRecs: string[] = [];
  const effEvidence: string[] = [];

  if (metrics.hasCode) {
    effScore = 84;
    if (metrics.usesHashLookup) {
      effScore += 8;
      effStrengths.push('Uses O(1) hash structures (`Set`/`Map`) for membership or deduplication lookups.');
    }
    if (metrics.nestedLoopDepth >= 2) {
      effScore -= 18;
      effWeaknesses.push(
        `Detected nested iteration depth of ${metrics.nestedLoopDepth}, which can degrade toward O(n²) on large inputs.`
      );
      effRecs.push('Pre-index lookup collections with a `Map` or `Set` to reduce nested scans to O(n).');
    } else if (metrics.nestedLoopDepth === 1) {
      effStrengths.push('Single-level iteration avoids quadratic nested scans.');
    }
    if (metrics.usesLookupInLoop) {
      effScore -= 10;
      effWeaknesses.push('Linear array lookup (`.includes` / `.indexOf` / `.find`) appears inside a loop.');
      effRecs.push('Convert the lookup array to a `Set` before iterating for O(1) checks.');
    }
    if (metrics.hasUnboundedSqlSelectAll) {
      effScore -= 14;
      effWeaknesses.push('SQL query uses `SELECT *` without a `LIMIT` clause.');
      effRecs.push('Select only required columns and apply `WHERE` / `LIMIT` bounds.');
    }
    if (typeof input.executionMs === 'number') {
      if (input.executionMs > 150) {
        effScore -= 12;
        effWeaknesses.push(`Sandbox execution took ${input.executionMs}ms across test cases.`);
      } else {
        effStrengths.push(`Executed test suite rapidly in ${input.executionMs}ms.`);
      }
      effEvidence.push(`Measured VM runtime: ${input.executionMs}ms`);
    }
    if (testResults.length > 0 && testResults.every((t) => !t.passed)) {
      effScore = Math.min(effScore, 55);
      effWeaknesses.push('Efficiency gains only deliver value once functional test cases pass reliably.');
    }
    effEvidence.push(`Loop nesting depth: ${metrics.nestedLoopDepth} · Hash structures used: ${metrics.usesHashLookup ? 'Yes' : 'No'}`);
  } else {
    effScore = Math.round(input.quizScore * 0.4 + input.practicalScore * 0.6);
    if (input.practicalScore >= 50) {
      effStrengths.push('Applied direct, accurate quantitative/analytical method to reach the target outcome.');
    } else {
      effWeaknesses.push('Solution method did not converge on the accurate operational target.');
      effRecs.push('Review the reference calculation/workflow to eliminate manual errors and bottlenecks.');
    }
    effEvidence.push('Assessed analytical directness (Big-O static check N/A for non-code submission).');
  }
  effScore = clampScore(effScore);
  if (effStrengths.length === 0) effStrengths.push('No excessive memory allocations or infinite-loop patterns detected.');
  if (effWeaknesses.length === 0) effWeaknesses.push('No major algorithmic bottlenecks detected for standard input sizes.');
  if (effRecs.length === 0) effRecs.push('Benchmark performance with realistic production dataset sizes.');

  // 4. TESTING (15%)
  let testScore = 0;
  const testStrengths: string[] = [];
  const testWeaknesses: string[] = [];
  const testRecs: string[] = [];
  const testEvidence: string[] = [];

  if (testResults.length > 0) {
    const passedCount = testResults.filter((t) => t.passed).length;
    const passRate = Math.round((passedCount / testResults.length) * 100);
    const runtimeErrorCount = testResults.filter((t) => Boolean(t.error)).length;

    testScore = passRate;
    if (passedCount === testResults.length) {
      testStrengths.push(`All ${testResults.length}/${testResults.length} automated test cases passed.`);
      if (input.quizScore >= 80) {
        testStrengths.push('Edge-case and conceptual verification both succeeded.');
      }
    } else {
      testWeaknesses.push(
        `Only ${passedCount}/${testResults.length} automated checks passed (${passRate}%).`
      );
      if (runtimeErrorCount > 0) {
        testWeaknesses.push(`${runtimeErrorCount} test case(s) threw runtime exceptions.`);
        testRecs.push('Fix thrown runtime errors and guard edge-case inputs (empty/null/unexpected types).');
      } else {
        testRecs.push('Inspect failing expected vs actual outputs and handle boundary conditions.');
      }
    }
    testEvidence.push(`Automated runner executed ${testResults.length} test case(s): ${passedCount} passed, ${testResults.length - passedCount} failed.`);
  } else {
    // Standalone project/code mode without attached VM test cases
    if (metrics.userTestAssertionCount >= 3) {
      testScore = 88;
      testStrengths.push(`Submission includes ${metrics.userTestAssertionCount} inline unit/assertion checks.`);
      testWeaknesses.push('Standalone assertions were detected statically; live test-suite execution was not attached.');
      testRecs.push('Run automated tests in CI/local runner covering invalid inputs and boundary errors.');
    } else if (metrics.userTestAssertionCount > 0) {
      testScore = 68;
      testStrengths.push(`Includes ${metrics.userTestAssertionCount} basic test/assertion statement(s).`);
      testWeaknesses.push('Limited test coverage: add negative, null, and edge-case assertions.');
      testRecs.push('Add unit tests covering valid paths, empty inputs, and error branches.');
    } else {
      // Honest neutral-developing score: missing tests != runtime crash, clearly distinguish missing evidence!
      testScore = 50;
      testStrengths.push('Code structure is testable via modular inputs/outputs.');
      testWeaknesses.push('No unit tests or assertions were included in this standalone submission.');
      testRecs.push('Write automated unit tests (`node:test` / `vitest`) verifying happy paths, edge cases, and invalid inputs.');
    }
    testEvidence.push(`Inline test assertions detected: ${metrics.userTestAssertionCount} (no external test runner executed).`);
  }
  testScore = clampScore(testScore);
  if (testStrengths.length === 0) testStrengths.push('Test assertions were evaluated transparently with exact expected/actual diffing.');
  if (testWeaknesses.length === 0) testWeaknesses.push('Consider adding stress tests for unexpected malformed inputs.');
  if (testRecs.length === 0) testRecs.push('Expand regression tests whenever adding new edge cases.');

  // 5. ACCESSIBILITY (10%)
  let a11yScore = 80;
  let a11yApplicable = true;
  const a11yStrengths: string[] = [];
  const a11yWeaknesses: string[] = [];
  const a11yRecs: string[] = [];
  const a11yEvidence: string[] = [];

  if (metrics.hasCode && metrics.isHtmlOrJsx) {
    a11yApplicable = true;
    a11yScore = 82 + Math.min(14, metrics.accessibilityPositives.length * 7);
    for (const p of metrics.accessibilityPositives) {
      a11yStrengths.push(p);
    }
    for (const f of metrics.accessibilityFindings) {
      a11yScore -= f.severity === 'high' ? 22 : 12;
      a11yWeaknesses.push(`${f.title}: ${f.detail}`);
      a11yRecs.push(f.fix);
    }
    a11yEvidence.push(
      `Static HTML/JSX accessibility scan checked <img> alt text, <label>/aria-label, semantic elements, and clickable non-native containers.`
    );
  } else {
    // Non-UI code or non-code calculation: do NOT confuse N/A with failure!
    a11yApplicable = false;
    a11yScore = metrics.hasCode ? (metrics.hasTryCatch || metrics.hasInputGuards ? 82 : 76) : 80;
    a11yStrengths.push(
      'Not applicable to UI DOM — submission contains pure algorithmic/backend or quantitative domain logic.'
    );
    a11yWeaknesses.push(
      'WCAG visual contrast, keyboard focus order, and screen-reader DOM checks were not applicable and not treated as failures.'
    );
    a11yRecs.push(
      'When surfacing this logic in a UI, pair results with clear text labels, semantic HTML, and accessible error alerts.'
    );
    a11yEvidence.push('No HTML/JSX markup present; neutral N/A accessibility baseline applied.');
  }
  a11yScore = clampScore(a11yScore);
  if (a11yStrengths.length === 0) a11yStrengths.push('No major static HTML accessibility violations detected.');
  if (a11yWeaknesses.length === 0) a11yWeaknesses.push('Automated static checks cannot verify visual color contrast or live screen-reader announcements.');
  if (a11yRecs.length === 0) a11yRecs.push('Verify keyboard Tab order and 4.5:1 color contrast in browser DevTools.');

  // 6. PROBLEM STATEMENT ALIGNMENT (20%)
  let alignScore = 0;
  const alignStrengths: string[] = [];
  const alignWeaknesses: string[] = [];
  const alignRecs: string[] = [];
  const alignEvidence: string[] = [];

  if (testResults.length > 0) {
    // Grounded in quiz + automated practical alignment
    alignScore = Math.round(input.practicalScore * 0.65 + input.quizScore * 0.35);
    if (input.challenge && metrics.hasCode) {
      const definesExpectedFn = new RegExp(`\\b${input.challenge.functionName}\\b`).test(codeText);
      if (definesExpectedFn) {
        alignStrengths.push(`Implements the required \`${input.challenge.functionName}\` entry-point signature.`);
      } else {
        alignScore = Math.min(alignScore, 30);
        alignWeaknesses.push(`Expected function \`${input.challenge.functionName}\` was missing or renamed.`);
        alignRecs.push(`Define and export/declare \`${input.challenge.functionName}\` matching the problem contract.`);
      }
    }
    if (input.practicalScore >= 70) {
      alignStrengths.push('Outputs match the problem statement requirements and expected test behavior.');
    } else {
      alignWeaknesses.push('Submission outputs did not satisfy all problem requirements and expected tolerances.');
      alignRecs.push('Re-read problem constraints and verify output shape/units for every test scenario.');
    }
    if (input.quizScore >= 70) {
      alignStrengths.push(`Conceptual domain reasoning (${input.quizScore}%) aligns with real-world practice.`);
    } else {
      alignWeaknesses.push(`Conceptual diagnostic score (${input.quizScore}%) shows gaps in domain requirements.`);
    }
    alignEvidence.push(`Practical alignment ${input.practicalScore}% · Diagnostic rubric ${input.quizScore}%`);
  } else {
    // Standalone problem statement alignment via keyword & structural coverage
    const keywords = extractKeywords(input.problemStatement);
    const haystack = `${codeText} ${practicalText} ${input.submissionTitle}`.toLowerCase();
    const matchedKeywords = keywords.filter((kw) => haystack.includes(kw));
    const kwCoverage =
      keywords.length > 0 ? Math.round((matchedKeywords.length / keywords.length) * 100) : 70;
    alignScore = Math.round(
      (metrics.hasCode ? 55 : 40) + Math.min(35, kwCoverage * 0.35) + (metrics.syntaxValid === false ? -25 : 10)
    );
    if (matchedKeywords.length > 0) {
      alignStrengths.push(
        `Addresses core problem concepts (${matchedKeywords.slice(0, 5).join(', ')}).`
      );
    } else {
      alignWeaknesses.push('Submission shows limited overlap with key terms from the problem statement.');
      alignRecs.push('Ensure all requirements stated in the prompt are explicitly implemented.');
    }
    if (keywords.length - matchedKeywords.length > 0) {
      const missingKw = keywords.filter((k) => !matchedKeywords.includes(k)).slice(0, 4);
      if (missingKw.length > 0) {
        alignWeaknesses.push(`Verify coverage of problem requirements involving: ${missingKw.join(', ')}.`);
      }
    }
    alignEvidence.push(
      `Requirement concept coverage: ${matchedKeywords.length}/${Math.max(1, keywords.length)} key problem terms matched.`
    );
  }
  alignScore = clampScore(alignScore);
  if (alignStrengths.length === 0) alignStrengths.push('Submission directly targets the specified skill domain.');
  if (alignWeaknesses.length === 0) alignWeaknesses.push('No major missing functional requirements detected.');
  if (alignRecs.length === 0) alignRecs.push('Document edge-case assumptions against stakeholder requirements.');

  const rawCategories: Array<{
    key: EvaluationCategoryKey;
    label: string;
    weightPct: number;
    score: number;
    applicable: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    whyItMatters: string;
    limitations: string;
    evidence: string[];
  }> = [
    {
      key: 'code_quality',
      label: 'Code Quality',
      weightPct: 20,
      score: cqScore,
      applicable: true,
      strengths: cqStrengths,
      weaknesses: cqWeaknesses,
      recommendations: cqRecs,
      whyItMatters:
        'Clean structure, clear naming, and defensive error handling reduce bug rates and make changes safe as teams scale.',
      limitations: metrics.hasCode
        ? 'Evaluated via static AST/pattern heuristics; style formatting and full project architecture were not inspected.'
        : 'Evaluated via response clarity and diagnostic standards; source-code linting was N/A.',
      evidence: cqEvidence,
    },
    {
      key: 'security',
      label: 'Security',
      weightPct: 20,
      score: secScore,
      applicable: true,
      strengths: secStrengths,
      weaknesses: secWeaknesses,
      recommendations: secRecs,
      whyItMatters:
        'Missing input validation, injection sinks, or exposed credentials create severe data breach and service integrity risks.',
      limitations: metrics.hasCode
        ? 'Static pattern scan executed on submitted snippet; full dependency CVE scanning and dynamic penetration testing were not executed.'
        : 'Evaluated domain safety/compliance boundaries; code vulnerability scanning was N/A.',
      evidence: secEvidence,
    },
    {
      key: 'efficiency',
      label: 'Efficiency',
      weightPct: 15,
      score: effScore,
      applicable: true,
      strengths: effStrengths,
      weaknesses: effWeaknesses,
      recommendations: effRecs,
      whyItMatters:
        'Algorithmic complexity and query efficiency directly determine latency, cloud cost, and scalability under production load.',
      limitations: metrics.hasCode
        ? 'Static complexity heuristics and small-input VM timing were used; large-scale load profiling was not executed.'
        : 'Evaluated analytical directness; computational profiling was N/A.',
      evidence: effEvidence,
    },
    {
      key: 'testing',
      label: 'Testing',
      weightPct: 15,
      score: testScore,
      applicable: true,
      strengths: testStrengths,
      weaknesses: testWeaknesses,
      recommendations: testRecs,
      whyItMatters:
        'Automated tests prove functional correctness across edge cases and prevent regressions during future refactoring.',
      limitations:
        testResults.length > 0
          ? `Executed ${testResults.length} sandboxed verification case(s); integration/load suites were not part of this run.`
          : 'No external automated test runner was executed on this standalone snippet.',
      evidence: testEvidence,
    },
    {
      key: 'accessibility',
      label: 'Accessibility',
      weightPct: 10,
      score: a11yScore,
      applicable: a11yApplicable,
      strengths: a11yStrengths,
      weaknesses: a11yWeaknesses,
      recommendations: a11yRecs,
      whyItMatters:
        'Accessible semantic markup, labels, and keyboard navigation ensure everyone—including screen-reader and keyboard users—can use the product (WCAG AA).',
      limitations: a11yApplicable
        ? 'Static HTML/JSX attribute checks ran; live screen-reader announcements and rendered color contrast require browser inspection.'
        : 'Submission contains no UI markup; WCAG DOM checks were N/A and scored neutrally.',
      evidence: a11yEvidence,
    },
    {
      key: 'problem_alignment',
      label: 'Problem Statement Alignment',
      weightPct: 20,
      score: alignScore,
      applicable: true,
      strengths: alignStrengths,
      weaknesses: alignWeaknesses,
      recommendations: alignRecs,
      whyItMatters:
        'Even clean code fails stakeholders if required outputs, constraints, or real-world domain requirements are missed.',
      limitations:
        'Evaluated against problem prompt requirements, expected outputs, and skill rubric criteria.',
      evidence: alignEvidence,
    },
  ];

  const categories: EvaluationCategoryResult[] = rawCategories.map((c) => ({
    key: c.key,
    label: c.label,
    weightPct: c.weightPct,
    score: c.score,
    weightedContribution: computeWeightedContribution(c.score, c.weightPct),
    performanceLabel: classifyPerformance(c.score),
    applicable: c.applicable,
    strengths: c.strengths,
    weaknesses: c.weaknesses,
    recommendations: c.recommendations,
    feedback: {
      didWell: c.strengths[0] ?? 'Demonstrated baseline engagement with the task.',
      needsImprovement: c.weaknesses[0] ?? 'No major deficiencies identified in this run.',
      whyItMatters: c.whyItMatters,
      howToFix: c.recommendations[0] ?? 'Continue refining implementation details and edge cases.',
      nextSteps: c.recommendations.slice(0, 3),
      evidence: c.evidence,
      limitations: c.limitations,
    },
  }));

  const overallScore = calculateWeightedOverallScore(categories);
  const performanceClassification = classifyPerformance(overallScore);
  const hasPartialScope = categories.some((c) => !c.applicable) || testResults.length === 0;
  const evaluationStatus: EvaluationReport['evaluationStatus'] =
    overallScore < 50
      ? 'Needs Remediation'
      : hasPartialScope
        ? 'Evaluated (Partial Scope)'
        : 'Verified & Complete';

  return {
    attemptId: input.attemptId,
    profileId: input.profileId,
    skillId: input.skillId,
    skillName: input.skillName,
    submissionType: input.submissionType,
    submissionTitle: input.submissionTitle,
    attemptNumber: input.attemptNumber,
    timestamp,
    overallScore,
    performanceClassification,
    evaluationStatus,
    aiMode: 'deterministic_fallback',
    categories,
    checksExecuted,
    summaryNote: `Weighted score (${overallScore}/100 · ${performanceClassification}) computed deterministically across 6 criteria: Code Quality (20%), Security (20%), Efficiency (15%), Testing (15%), Accessibility (10%), Problem Alignment (20%).`,
  };
}

async function enrichFeedbackWithGemini(
  report: EvaluationReport,
  input: EvaluationPipelineInput
): Promise<EvaluationReport> {
  const client = getGeminiClient();
  if (!client || getActiveAIMode() !== 'gemini') {
    return report;
  }

  const submittedSnippet = (input.submittedCode ?? input.practicalAnswer ?? '').slice(0, 2600);
  const checksSummary = report.checksExecuted
    .map((c) => `- ${c.name} [${c.executed ? 'EXECUTED' : 'NOT EXECUTED'} · ${c.outcome}]: ${c.detail}`)
    .join('\n');
  const categoryScoresSummary = report.categories
    .map(
      (c) =>
        `- ${c.key} (${c.label}, ${c.weightPct}%): score ${c.score}/100 | deterministic strengths: ${c.strengths.join('; ')} | weaknesses: ${c.weaknesses.join('; ')}`
    )
    .join('\n');

  const prompt = `You are the SKILLORA Senior Engineering & Domain Evaluator.
Provide actionable, submission-specific qualitative feedback for each of the 6 criteria below.

Submission Title: ${report.submissionTitle} (Skill: ${report.skillName})
Problem Statement: ${input.problemStatement.slice(0, 800)}
Overall Weighted Score: ${report.overallScore}/100 (${report.performanceClassification})

Checks Actually Executed (GROUND TRUTH — NEVER claim a scan or test ran if marked NOT EXECUTED):
${checksSummary}

Computed Criterion Scores & Deterministic Findings:
${categoryScoresSummary}

Submitted Work:
\`\`\`
${submittedSnippet || '(No code text; non-code practical submission)'}
\`\`\`

Rules:
1. Do NOT invent findings, vulnerabilities, or passed/failed tests not supported by the submitted work or executed checks.
2. For each category key (code_quality, security, efficiency, testing, accessibility, problem_alignment), produce concise, specific, actionable feedback fields: didWell, needsImprovement, whyItMatters, howToFix, nextSteps (2-3 items).
3. If Accessibility or static code checks were N/A, acknowledge the limitation honestly instead of inventing defects.`;

  try {
    const response = await withGeminiTimeout(
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are the SKILLORA Evaluation Analyst. Ground every statement in the actual submission and executed checks. Return valid JSON only.',
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryNote: { type: Type.STRING },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    didWell: { type: Type.STRING },
                    needsImprovement: { type: Type.STRING },
                    whyItMatters: { type: Type.STRING },
                    howToFix: { type: Type.STRING },
                    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['key', 'didWell', 'needsImprovement', 'whyItMatters', 'howToFix', 'nextSteps'],
                },
              },
            },
            required: ['summaryNote', 'categories'],
          },
        },
      }),
      15000
    );

    const raw = (response.text ?? '').trim();
    const parsed = JSON.parse(raw) as {
      summaryNote?: string;
      categories?: Array<{
        key?: string;
        didWell?: string;
        needsImprovement?: string;
        whyItMatters?: string;
        howToFix?: string;
        nextSteps?: string[];
      }>;
    };

    if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      return report;
    }

    const aiMap = new Map(parsed.categories.map((c) => [c.key, c]));
    const updatedCategories = report.categories.map((cat) => {
      const ai = aiMap.get(cat.key);
      if (!ai) return cat;
      const mergedFeedback: ActionableCategoryFeedback = {
        didWell: ai.didWell?.trim() || cat.feedback.didWell,
        needsImprovement: ai.needsImprovement?.trim() || cat.feedback.needsImprovement,
        whyItMatters: ai.whyItMatters?.trim() || cat.feedback.whyItMatters,
        howToFix: ai.howToFix?.trim() || cat.feedback.howToFix,
        nextSteps:
          Array.isArray(ai.nextSteps) && ai.nextSteps.length > 0
            ? ai.nextSteps.slice(0, 3)
            : cat.feedback.nextSteps,
        evidence: cat.feedback.evidence,
        limitations: cat.feedback.limitations,
      };
      return {
        ...cat,
        feedback: mergedFeedback,
      };
    });

    const aiMode: AIMode = 'gemini';
    return {
      ...report,
      aiMode,
      categories: updatedCategories,
      summaryNote: parsed.summaryNote?.trim() || report.summaryNote,
    };
  } catch {
    // Graceful fallback: deterministic scores & evidence-based actionable feedback remain intact
    return report;
  }
}

export async function runFullEvaluationPipeline(
  input: EvaluationPipelineInput,
  options: { useAi?: boolean } = { useAi: true }
): Promise<EvaluationReport> {
  const deterministicReport = runDeterministicEvaluationPipeline(input);
  if (options.useAi !== false && getActiveAIMode() === 'gemini') {
    return enrichFeedbackWithGemini(deterministicReport, input);
  }
  return deterministicReport;
}

export function compareEvaluationAttempts(
  baselineAttempt: EvaluationAttemptRecord,
  targetAttempt: EvaluationAttemptRecord
): EvaluationAttemptComparison {
  const overallDelta = Math.round((targetAttempt.overallScore - baselineAttempt.overallScore) * 10) / 10;
  const improvedCategories: EvaluationAttemptComparison['improvedCategories'] = [];
  const decliningCategories: EvaluationAttemptComparison['decliningCategories'] = [];
  const unchangedCategories: EvaluationAttemptComparison['unchangedCategories'] = [];

  for (const afterCat of targetAttempt.categories) {
    const beforeCat = baselineAttempt.categories.find((c) => c.key === afterCat.key);
    const beforeScore = beforeCat?.score ?? afterCat.score;
    const delta = Math.round((afterCat.score - beforeScore) * 10) / 10;

    if (delta > 0) {
      improvedCategories.push({
        key: afterCat.key,
        label: afterCat.label,
        beforeScore,
        afterScore: afterCat.score,
        delta,
      });
    } else if (delta < 0) {
      decliningCategories.push({
        key: afterCat.key,
        label: afterCat.label,
        beforeScore,
        afterScore: afterCat.score,
        delta,
      });
    } else {
      unchangedCategories.push({
        key: afterCat.key,
        label: afterCat.label,
        score: afterCat.score,
      });
    }
  }

  return {
    baselineAttempt,
    targetAttempt,
    overallDelta,
    improvedCategories: improvedCategories.sort((a, b) => b.delta - a.delta),
    decliningCategories: decliningCategories.sort((a, b) => a.delta - b.delta),
    unchangedCategories,
  };
}

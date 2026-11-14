import { GoogleGenAI, type Content } from '@google/genai';
import type { AIMode } from '../src/shared/types.ts';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export class GeminiServiceError extends Error {
  readonly code: 'GEMINI_UNCONFIGURED' | 'GEMINI_API_ERROR';
  readonly status: number;

  constructor(
    code: 'GEMINI_UNCONFIGURED' | 'GEMINI_API_ERROR',
    message: string,
    status: number
  ) {
    super(message);
    this.name = 'GeminiServiceError';
    this.code = code;
    this.status = status;
  }
}

export function hasValidGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return false;
  if (key === 'MY_GEMINI_API_KEY' || key.startsWith('MY_')) return false;
  return key.length > 12;
}

export function getActiveAIMode(): AIMode {
  return hasValidGeminiKey() ? 'gemini' : 'deterministic_fallback';
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!hasValidGeminiKey()) return null;
  const key = process.env.GEMINI_API_KEY!.trim();
  if (!cachedClient || cachedApiKey !== key) {
    cachedClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = key;
  }
  return cachedClient;
}

export function requireGeminiClient(): GoogleGenAI {
  const client = getGeminiClient();
  if (!client) {
    throw new GeminiServiceError(
      'GEMINI_UNCONFIGURED',
      'Gemini AI is unavailable because GEMINI_API_KEY is not configured on the server. Add a valid GEMINI_API_KEY in environment secrets to use AI Mentor, AI Resume Enhancement, and AI Opportunity Insights.',
      503
    );
  }
  return client;
}

export async function withGeminiTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function generateTextWithGemini(params: {
  systemInstruction: string;
  contents: string | Content[];
  timeoutMs?: number;
}): Promise<string> {
  const client = requireGeminiClient();
  try {
    const response = await withGeminiTimeout(
      client.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
        },
      }),
      params.timeoutMs ?? 15000
    );
    const text = (response.text ?? '').trim();
    if (!text) {
      throw new GeminiServiceError(
        'GEMINI_API_ERROR',
        'Gemini returned an empty response. Please retry.',
        502
      );
    }
    return text;
  } catch (err) {
    if (err instanceof GeminiServiceError) throw err;
    throw new GeminiServiceError(
      'GEMINI_API_ERROR',
      err instanceof Error ? `Gemini AI request failed: ${err.message}` : 'Gemini AI request failed.',
      502
    );
  }
}

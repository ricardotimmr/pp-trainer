import { GoogleGenAI } from '@google/genai';
import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekAnalysisSchema,
  AiGeneratedWeekPlanSchema,
  type AiGeneratedSingleWorkout,
  type AiGeneratedWeekAnalysis,
  type AiGeneratedWeekPlan,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import type { AiProvider, AiProviderResult } from './AiProvider.js';
import type { BuiltPrompt } from './PromptBuilder.js';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_OUTPUT_TOKENS = 8192;

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async generateWeekPlan(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekPlan>> {
    const raw = await this.callWithJsonFormat(prompt);
    const parsed = AiGeneratedWeekPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { data: null, rawOutput: raw, validationErrors: parsed.error.issues };
    }
    return { data: parsed.data, rawOutput: raw };
  }

  async generateSingleWorkout(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedSingleWorkout>> {
    const raw = await this.callWithJsonFormat(prompt);
    const parsed = AiGeneratedSingleWorkoutSchema.safeParse(raw);
    if (!parsed.success) {
      return { data: null, rawOutput: raw, validationErrors: parsed.error.issues };
    }
    return { data: parsed.data, rawOutput: raw };
  }

  async generateWeekAnalysis(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekAnalysis>> {
    const raw = await this.callWithJsonFormat(prompt);
    const parsed = AiGeneratedWeekAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      return { data: null, rawOutput: raw, validationErrors: parsed.error.issues };
    }
    return { data: parsed.data, rawOutput: raw };
  }

  async generateMemoryEntry(prompt: BuiltPrompt): Promise<string> {
    let text: string;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        config: {
          systemInstruction: prompt.systemRole,
          maxOutputTokens: 256,
        },
        contents: prompt.userContent,
      });
      text = response.text ?? '';
    } catch (err: unknown) {
      if (isRateLimit(err)) throw ApiError.rateLimited();
      throw ApiError.badGateway('Gemini API error');
    }
    return text.trim();
  }

  private async callWithJsonFormat(prompt: BuiltPrompt): Promise<unknown> {
    let text: string;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        config: {
          systemInstruction: prompt.systemRole,
          responseMimeType: 'application/json',
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
        contents: prompt.userContent,
      });
      text = response.text ?? '';
    } catch (err: unknown) {
      if (isRateLimit(err)) throw ApiError.rateLimited();
      const msg = err instanceof Error ? err.message : 'unknown error';
      throw ApiError.badGateway(`Gemini API error: ${msg}`);
    }

    if (!text) throw ApiError.badGateway('Gemini returned an empty response');

    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw ApiError.badGateway('Gemini returned invalid JSON');
    }
  }
}

function isRateLimit(err: unknown): boolean {
  if (err instanceof Error && err.message.includes('429')) return true;
  return false;
}

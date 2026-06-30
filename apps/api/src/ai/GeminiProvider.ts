import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
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

const DEFAULT_MODEL = 'gemini-1.5-flash';
const MAX_OUTPUT_TOKENS = 8192;

export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
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
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: prompt.systemRole,
      generationConfig: { maxOutputTokens: 256 },
    });

    let result: Awaited<ReturnType<typeof model.generateContent>>;
    try {
      result = await model.generateContent(prompt.userContent);
    } catch (err: unknown) {
      if (err instanceof GoogleGenerativeAIFetchError && err.status === 429) throw ApiError.rateLimited();
      throw ApiError.badGateway('Gemini API error');
    }

    return result.response.text().trim();
  }

  private async callWithJsonFormat(prompt: BuiltPrompt): Promise<unknown> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: prompt.systemRole,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    });

    let result: Awaited<ReturnType<typeof model.generateContent>>;
    try {
      result = await model.generateContent(prompt.userContent);
    } catch (err: unknown) {
      if (err instanceof GoogleGenerativeAIFetchError) {
        if (err.status === 429) throw ApiError.rateLimited();
        throw ApiError.badGateway(`Gemini API error: ${err.message}`);
      }
      throw ApiError.badGateway('Gemini API error');
    }

    const text = result.response.text();
    if (!text) throw ApiError.badGateway('Gemini returned an empty response');

    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw ApiError.badGateway('Gemini returned invalid JSON');
    }
  }
}

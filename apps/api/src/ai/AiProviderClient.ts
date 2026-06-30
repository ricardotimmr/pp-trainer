import type { AiGeneratedSingleWorkout, AiGeneratedWeekAnalysis, AiGeneratedWeekPlan } from '@pp-trainer/shared';

import { getApiConfig } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import type { AthleteContextForAi } from '../types/athleteContext.js';
import type { AiProvider, AiProviderResult } from './AiProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { MockProvider } from './MockProvider.js';
import { OpenAiProvider } from './OpenAiProvider.js';
import { buildSingleWorkoutPrompt, buildWeekAnalysisPrompt, buildWeekPlanPrompt } from './PromptBuilder.js';
import type { WeekAnalysisInput } from './PromptBuilder.js';

function createProvider(): AiProvider {
  const config = getApiConfig();

  if (config.ai.mock) {
    return new MockProvider();
  }

  if (config.ai.provider === 'openai') {
    if (!config.ai.openaiApiKey) {
      throw ApiError.serviceUnavailable('OPENAI_API_KEY is not configured');
    }
    return new OpenAiProvider(config.ai.openaiApiKey, config.ai.model);
  }

  if (config.ai.provider === 'gemini') {
    if (!config.ai.geminiApiKey) {
      throw ApiError.serviceUnavailable('GEMINI_API_KEY is not configured');
    }
    return new GeminiProvider(config.ai.geminiApiKey, config.ai.model);
  }

  if (!config.ai.anthropicApiKey) {
    throw ApiError.serviceUnavailable('ANTHROPIC_API_KEY is not configured');
  }
  return new AnthropicProvider(config.ai.anthropicApiKey, config.ai.model);
}

export async function generateWeekPlan(
  context: AthleteContextForAi,
  weekStartDate: string,
  userInstruction?: string,
): Promise<AiProviderResult<AiGeneratedWeekPlan>> {
  const provider = createProvider();
  const prompt = buildWeekPlanPrompt(context, weekStartDate, userInstruction);
  return provider.generateWeekPlan(prompt);
}

export async function generateMemoryEntry(
  outputType: 'week_plan' | 'single_workout',
  summary: string | null,
  structuredOutput: unknown,
): Promise<string> {
  const provider = createProvider();
  const { buildMemoryEntryPrompt } = await import('./PromptBuilder.js');
  const prompt = buildMemoryEntryPrompt(outputType, summary, structuredOutput);
  return provider.generateMemoryEntry(prompt);
}

export async function generateWeekAnalysis(
  context: AthleteContextForAi,
  weekInput: WeekAnalysisInput,
): Promise<AiProviderResult<AiGeneratedWeekAnalysis>> {
  const provider = createProvider();
  const prompt = buildWeekAnalysisPrompt(context, weekInput);
  return provider.generateWeekAnalysis(prompt);
}

export async function generateSingleWorkout(
  context: AthleteContextForAi,
  sport: string,
  objective: string,
  plannedDurationSeconds?: number,
  userInstruction?: string,
): Promise<AiProviderResult<AiGeneratedSingleWorkout>> {
  const provider = createProvider();
  const prompt = buildSingleWorkoutPrompt(context, sport, objective, plannedDurationSeconds, userInstruction);
  return provider.generateSingleWorkout(prompt);
}

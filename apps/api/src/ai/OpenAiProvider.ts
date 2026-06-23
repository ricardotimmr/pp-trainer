import OpenAI from 'openai';
import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekPlanSchema,
  type AiGeneratedSingleWorkout,
  type AiGeneratedWeekPlan,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import type { AiProvider } from './AiProvider.js';
import type { BuiltPrompt } from './PromptBuilder.js';

const DEFAULT_MODEL = 'gpt-4o';
const MAX_TOKENS = 8192;

export class OpenAiProvider implements AiProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async generateWeekPlan(prompt: BuiltPrompt): Promise<AiGeneratedWeekPlan> {
    const raw = await this.callWithJsonFormat(prompt);
    const parsed = AiGeneratedWeekPlanSchema.safeParse(raw);
    if (!parsed.success) {
      throw ApiError.unprocessable('AI returned an invalid week plan structure', parsed.error.issues);
    }
    return parsed.data;
  }

  async generateSingleWorkout(prompt: BuiltPrompt): Promise<AiGeneratedSingleWorkout> {
    const raw = await this.callWithJsonFormat(prompt);
    const parsed = AiGeneratedSingleWorkoutSchema.safeParse(raw);
    if (!parsed.success) {
      throw ApiError.unprocessable(
        'AI returned an invalid single workout structure',
        parsed.error.issues,
      );
    }
    return parsed.data;
  }

  private async callWithJsonFormat(prompt: BuiltPrompt): Promise<unknown> {
    let response: OpenAI.Chat.ChatCompletion;
    try {
      response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt.systemRole },
          { role: 'user', content: prompt.userContent },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof OpenAI.APIError) {
        if (err.status === 429) throw ApiError.rateLimited();
        if (err.status >= 500) throw ApiError.serviceUnavailable('OpenAI API unavailable');
      }
      throw ApiError.internalError('Failed to call OpenAI API');
    }

    const content = response.choices[0]?.message.content;
    if (content == null) {
      throw ApiError.unprocessable('OpenAI returned an empty response');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw ApiError.unprocessable('OpenAI returned invalid JSON');
    }
  }
}

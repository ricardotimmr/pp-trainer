import Anthropic from '@anthropic-ai/sdk';
import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekPlanSchema,
  type AiGeneratedSingleWorkout,
  type AiGeneratedWeekPlan,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import type { AiProvider, AiProviderResult } from './AiProvider.js';
import type { BuiltPrompt } from './PromptBuilder.js';

const TOOL_NAME_WEEK_PLAN = 'output_week_plan';
const TOOL_NAME_SINGLE_WORKOUT = 'output_single_workout';
const DEFAULT_MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 8192;

export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async generateWeekPlan(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekPlan>> {
    const raw = await this.callWithTool(prompt, TOOL_NAME_WEEK_PLAN, {
      name: TOOL_NAME_WEEK_PLAN,
      description: 'Output the generated training week plan as structured JSON',
      input_schema: {
        type: 'object' as const,
        properties: { result: { type: 'object' } },
        required: ['result'],
      },
    });

    const parsed = AiGeneratedWeekPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { data: null, rawOutput: raw, validationErrors: parsed.error.issues };
    }
    return { data: parsed.data, rawOutput: raw };
  }

  async generateSingleWorkout(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedSingleWorkout>> {
    const raw = await this.callWithTool(prompt, TOOL_NAME_SINGLE_WORKOUT, {
      name: TOOL_NAME_SINGLE_WORKOUT,
      description: 'Output the generated single workout as structured JSON',
      input_schema: {
        type: 'object' as const,
        properties: { result: { type: 'object' } },
        required: ['result'],
      },
    });

    const parsed = AiGeneratedSingleWorkoutSchema.safeParse(raw);
    if (!parsed.success) {
      return { data: null, rawOutput: raw, validationErrors: parsed.error.issues };
    }
    return { data: parsed.data, rawOutput: raw };
  }

  private async callWithTool(
    prompt: BuiltPrompt,
    toolName: string,
    tool: Anthropic.Tool,
  ): Promise<unknown> {
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: prompt.systemRole,
        messages: [{ role: 'user', content: prompt.userContent }],
        tools: [tool],
        tool_choice: { type: 'tool', name: toolName },
      });
    } catch (err: unknown) {
      if (err instanceof Anthropic.APIError) {
        if (err.status === 429) throw ApiError.rateLimited();
        throw ApiError.badGateway(`Anthropic API error: ${err.message}`);
      }
      throw ApiError.badGateway();
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (toolUse == null) {
      throw ApiError.badGateway('AI provider did not return a structured response');
    }

    const input = toolUse.input as Record<string, unknown>;
    return input['result'];
  }
}

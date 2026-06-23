import Anthropic from '@anthropic-ai/sdk';
import {
  AiGeneratedSingleWorkoutSchema,
  AiGeneratedWeekPlanSchema,
  type AiGeneratedSingleWorkout,
  type AiGeneratedWeekPlan,
} from '@pp-trainer/shared';

import { ApiError } from '../errors/ApiError.js';
import type { AiProvider } from './AiProvider.js';
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

  async generateWeekPlan(prompt: BuiltPrompt): Promise<AiGeneratedWeekPlan> {
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
      throw ApiError.unprocessable('AI returned an invalid week plan structure', parsed.error.issues);
    }
    return parsed.data;
  }

  async generateSingleWorkout(prompt: BuiltPrompt): Promise<AiGeneratedSingleWorkout> {
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
      throw ApiError.unprocessable(
        'AI returned an invalid single workout structure',
        parsed.error.issues,
      );
    }
    return parsed.data;
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
        if (err.status >= 500) throw ApiError.serviceUnavailable('Anthropic API unavailable');
      }
      throw ApiError.internalError('Failed to call Anthropic API');
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (toolUse == null) {
      throw ApiError.unprocessable('Anthropic did not return a tool use block');
    }

    const input = toolUse.input as Record<string, unknown>;
    return input['result'];
  }
}

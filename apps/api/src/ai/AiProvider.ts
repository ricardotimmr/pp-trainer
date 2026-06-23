import type { ZodIssue } from 'zod';

import type { AiGeneratedSingleWorkout, AiGeneratedWeekPlan } from '@pp-trainer/shared';

import type { BuiltPrompt } from './PromptBuilder.js';

export type AiProviderResult<T> = {
  data: T | null;
  rawOutput: unknown;
  validationErrors?: ZodIssue[];
};

export interface AiProvider {
  generateWeekPlan(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekPlan>>;
  generateSingleWorkout(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedSingleWorkout>>;
}

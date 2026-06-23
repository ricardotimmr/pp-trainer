import type { AiGeneratedSingleWorkout, AiGeneratedWeekPlan } from '@pp-trainer/shared';

import type { BuiltPrompt } from './PromptBuilder.js';

export interface AiProvider {
  generateWeekPlan(prompt: BuiltPrompt): Promise<AiGeneratedWeekPlan>;
  generateSingleWorkout(prompt: BuiltPrompt): Promise<AiGeneratedSingleWorkout>;
}

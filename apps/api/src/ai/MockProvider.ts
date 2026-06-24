import type { AiGeneratedSingleWorkout, AiGeneratedWeekPlan } from '@pp-trainer/shared';

import type { AiProvider, AiProviderResult } from './AiProvider.js';
import type { BuiltPrompt } from './PromptBuilder.js';

function getWeekDates(prompt: BuiltPrompt): { start: string; end: string } {
  const match = prompt.userContent.match(/week starting (\d{4}-\d{2}-\d{2})/);
  const start = match?.[1] ?? new Date().toISOString().split('T')[0];
  const endDate = new Date(start);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  return { start, end: endDate.toISOString().split('T')[0] };
}

function addDays(base: string, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export class MockProvider implements AiProvider {
  async generateWeekPlan(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekPlan>> {
    const { start, end } = getWeekDates(prompt);

    const data: AiGeneratedWeekPlan = {
      title: 'Base Endurance Week',
      weekStartDate: start,
      weekEndDate: end,
      focus: 'Aerobic base building with one quality session',
      summary: 'A balanced week mixing easy aerobic work with one tempo effort to build fitness progressively.',
      workouts: [
        {
          title: 'Easy Recovery Run',
          sport: 'running',
          workoutType: 'recovery',
          scheduledDate: addDays(start, 1),
          plannedDurationSeconds: 2700,
          intensity: 'easy',
          objective: 'Active recovery — keep heart rate low and effort comfortable',
          steps: [
            { stepIndex: 0, stepType: 'warmup', instruction: 'Easy jog to warm up', durationSeconds: 300, targetHeartRateZoneName: 'Zone 1' },
            { stepIndex: 1, stepType: 'main', instruction: 'Comfortable easy running pace throughout', durationSeconds: 2100, targetHeartRateZoneName: 'Zone 2' },
            { stepIndex: 2, stepType: 'cooldown', instruction: 'Walk or very easy jog to cool down', durationSeconds: 300 },
          ],
          coachNotes: 'This should feel effortless — if in doubt, go slower.',
        },
        {
          title: 'Tempo Run',
          sport: 'running',
          workoutType: 'tempo',
          scheduledDate: addDays(start, 3),
          plannedDurationSeconds: 3600,
          intensity: 'tempo',
          objective: 'Build lactate threshold with sustained tempo effort',
          steps: [
            { stepIndex: 0, stepType: 'warmup', instruction: 'Easy jog with light strides at the end', durationSeconds: 900, targetHeartRateZoneName: 'Zone 2' },
            { stepIndex: 1, stepType: 'main', instruction: 'Sustained tempo effort — comfortably hard, controlled breathing', durationSeconds: 1800, targetHeartRateZoneName: 'Zone 3' },
            { stepIndex: 2, stepType: 'cooldown', instruction: 'Easy jog and walk to cool down fully', durationSeconds: 900, targetHeartRateZoneName: 'Zone 1' },
          ],
        },
        {
          title: 'Long Easy Run',
          sport: 'running',
          workoutType: 'long',
          scheduledDate: addDays(start, 6),
          plannedDurationSeconds: 5400,
          intensity: 'easy',
          objective: 'Build aerobic endurance with a longer, easy effort',
          steps: [
            { stepIndex: 0, stepType: 'warmup', instruction: 'Very easy start to warm up muscles', durationSeconds: 600, targetHeartRateZoneName: 'Zone 1' },
            { stepIndex: 1, stepType: 'main', instruction: 'Maintain easy conversational pace throughout', durationSeconds: 4200, targetHeartRateZoneName: 'Zone 2' },
            { stepIndex: 2, stepType: 'cooldown', instruction: 'Slow to a walk for the final minutes', durationSeconds: 600 },
          ],
          coachNotes: 'Fuel and hydrate well on this one — bring water if the run is longer than 60 minutes.',
        },
      ],
    };

    return { data, rawOutput: data };
  }

  async generateMemoryEntry(_prompt: BuiltPrompt): Promise<string> {
    return 'Recommended a base endurance running week with three sessions: one easy recovery run, one tempo effort, and a long easy run. Total planned volume is approximately 3.1 hours. Focus is on aerobic base building ahead of the target race.';
  }

  async generateSingleWorkout(_prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedSingleWorkout>> {
    const data: AiGeneratedSingleWorkout = {
      workout: {
        title: 'Interval Training Session',
        sport: 'running',
        workoutType: 'vo2max',
        plannedDurationSeconds: 3600,
        intensity: 'vo2max',
        objective: 'Improve VO2max and running economy with short, high-intensity intervals',
        steps: [
          { stepIndex: 0, stepType: 'warmup', instruction: 'Easy jog with gradual build, finish with 4 x 20s strides', durationSeconds: 1200, targetHeartRateZoneName: 'Zone 2' },
          { stepIndex: 1, stepType: 'interval', instruction: '400m at 5K race pace with 90s jog recovery after each rep', distanceMeters: 400, repetitions: 6, targetHeartRateZoneName: 'Zone 4', restSeconds: 90 },
          { stepIndex: 2, stepType: 'cooldown', instruction: 'Easy jog followed by walking until heart rate is below Zone 1', durationSeconds: 900, targetHeartRateZoneName: 'Zone 1' },
        ],
        coachNotes: 'Focus on consistent pace across all intervals. Stop if form degrades significantly.',
      },
    };

    return { data, rawOutput: data };
  }
}

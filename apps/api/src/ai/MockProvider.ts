import type { AiGeneratedSingleWorkout, AiGeneratedWeekAnalysis, AiGeneratedWeekPlan } from '@pp-trainer/shared';

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

type WeekAnalysisPromptActivity = {
  sport?: unknown;
  durationSeconds?: unknown;
  distanceMeters?: unknown;
};

function parseWeekAnalysisActivities(prompt: BuiltPrompt): WeekAnalysisPromptActivity[] {
  const match = prompt.userContent.match(/## Completed Activities\s+```json\s+([\s\S]*?)\s+```/);
  if (!match?.[1]) return [];

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildWeekAnalysisData(
  weekStartDate: string,
  weekEndDate: string,
  activities: WeekAnalysisPromptActivity[],
): AiGeneratedWeekAnalysis {
  const breakdown = new Map<string, { sport: string; durationSeconds: number; distanceMeters?: number; activityCount: number }>();

  for (const activity of activities) {
    const sport = typeof activity.sport === 'string' ? activity.sport : 'other';
    const durationSeconds = typeof activity.durationSeconds === 'number' ? activity.durationSeconds : 0;
    const distanceMeters = typeof activity.distanceMeters === 'number' ? activity.distanceMeters : undefined;
    const current = breakdown.get(sport) ?? { sport, durationSeconds: 0, activityCount: 0 };

    current.durationSeconds += durationSeconds;
    current.activityCount += 1;
    if (distanceMeters != null) {
      current.distanceMeters = (current.distanceMeters ?? 0) + distanceMeters;
    }

    breakdown.set(sport, current);
  }

  const sportBreakdown = [...breakdown.values()].sort((a, b) => b.durationSeconds - a.durationSeconds);
  const totalDurationSeconds = sportBreakdown.reduce((sum, sport) => sum + sport.durationSeconds, 0);
  const totalDistanceMeters = sportBreakdown.reduce((sum, sport) => sum + (sport.distanceMeters ?? 0), 0);
  const activityCount = sportBreakdown.reduce((sum, sport) => sum + sport.activityCount, 0);
  const leadingSport = sportBreakdown[0]?.sport;

  if (activityCount === 0) {
    return {
      weekStartDate,
      weekEndDate,
      totalDurationSeconds: 0,
      sportBreakdown: [],
      keyObservations: [
        'No completed activities were found for this week.',
        'The week analysis is ready once imported activities are available.',
      ],
      suggestedFocus: 'Import or link completed activities before using this analysis for training decisions.',
      coachComment: 'There is not enough completed training data for a meaningful week review yet.',
    };
  }

  return {
    weekStartDate,
    weekEndDate,
    totalDurationSeconds,
    ...(totalDistanceMeters > 0 && { totalDistanceMeters }),
    sportBreakdown,
    keyObservations: [
      `${activityCount} completed activit${activityCount === 1 ? 'y' : 'ies'} were found for this week.`,
      leadingSport
        ? `${leadingSport} contributed the largest share of training time.`
        : 'Training time was spread across multiple sports.',
      'This mock analysis uses real stored activity records; only the coaching prose is simulated.',
    ],
    suggestedFocus: 'Use the completed workload as the baseline before accepting or adjusting next week’s plan.',
    coachComment: 'The activity data is available for review. A real AI provider can add deeper interpretation once connected.',
  };
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

  async generateWeekAnalysis(prompt: BuiltPrompt): Promise<AiProviderResult<AiGeneratedWeekAnalysis>> {
    const match = prompt.userContent.match(/week from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
    const weekStartDate = match?.[1] ?? new Date().toISOString().split('T')[0];
    const weekEndDate = match?.[2] ?? addDays(weekStartDate, 6);
    const activities = parseWeekAnalysisActivities(prompt);
    const data = buildWeekAnalysisData(weekStartDate, weekEndDate, activities);

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

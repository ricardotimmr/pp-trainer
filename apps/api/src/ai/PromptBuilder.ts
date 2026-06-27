import type { AthleteContextForAi } from '../types/athleteContext.js';

export type BuiltPrompt = {
  systemRole: string;
  userContent: string;
};

const COACH_SYSTEM_ROLE = `You are an expert endurance sports coach and training planner. Create personalised, periodised training plans based on the athlete's context, goals, and availability.

Always respond with valid JSON matching the schema exactly. Do not include commentary outside the JSON.

Principles:
- Respect available training days and maximum session durations
- Build training load progressively with adequate recovery
- Align workouts with the athlete's primary goals
- Use zone names from the athlete's zone sets for intensity targets
- Each workout step must have a unique stepIndex (0-based)`;

function formatContext(context: AthleteContextForAi): string {
  return JSON.stringify(context, null, 2);
}

const WEEK_PLAN_SCHEMA_HINT = `Return a JSON object:
{
  "title": string,
  "weekStartDate": "YYYY-MM-DD",
  "weekEndDate": "YYYY-MM-DD",
  "focus": string (optional),
  "summary": string (optional),
  "workouts": [
    {
      "title": string,
      "sport": string (e.g. "running", "cycling", "swimming", "strength", "mobility", "other"),
      "workoutType": string (e.g. "endurance", "interval", "recovery"),
      "scheduledDate": "YYYY-MM-DD" (optional),
      "plannedDurationSeconds": number (optional),
      "plannedDistanceMeters": number (optional),
      "intensity": string (e.g. "easy", "moderate", "hard"),
      "objective": string (optional, but required if no description),
      "description": string (optional),
      "steps": [
        {
          "stepIndex": number (0-based, unique per workout),
          "stepType": string (e.g. "warmup", "main", "interval", "recovery", "cooldown", "technique", "rest", "other"),
          "instruction": string,
          "title": string (optional),
          "durationSeconds": number (optional),
          "distanceMeters": number (optional),
          "repetitions": number (optional),
          "targetHeartRateZoneName": string (optional),
          "targetPowerZoneName": string (optional),
          "targetPaceZoneName": string (optional),
          "targetPowerLowerWatts": number (optional),
          "targetPowerUpperWatts": number (optional),
          "targetPaceLowerSecPerKm": number (optional),
          "targetPaceUpperSecPerKm": number (optional),
          "targetSwimPaceLowerSecPer100m": number (optional),
          "targetSwimPaceUpperSecPer100m": number (optional),
          "restSeconds": number (optional),
          "notes": string (optional)
        }
      ],
      "coachNotes": string (optional)
    }
  ]
}`;

const SINGLE_WORKOUT_SCHEMA_HINT = `Return a JSON object:
{
  "workout": {
    "title": string,
    "sport": string (e.g. "running", "cycling", "swimming", "strength", "mobility", "other"),
    "workoutType": string (e.g. "endurance", "interval", "recovery"),
    "plannedDurationSeconds": number (optional),
    "intensity": string (e.g. "easy", "moderate", "tempo", "threshold", "vo2max"),
    "objective": string (optional, but required if no description),
    "description": string (optional),
    "steps": [
      {
        "stepIndex": number (0-based, unique),
        "stepType": string (e.g. "warmup", "main", "interval", "recovery", "cooldown", "technique", "rest", "other"),
        "instruction": string,
        "durationSeconds": number (optional),
        "distanceMeters": number (optional),
        "repetitions": number (optional),
        "targetHeartRateZoneName": string (optional),
        "targetPowerZoneName": string (optional),
        "targetPaceZoneName": string (optional),
        "targetPowerLowerWatts": number (optional),
        "targetPowerUpperWatts": number (optional),
        "targetPaceLowerSecPerKm": number (optional),
        "targetPaceUpperSecPerKm": number (optional),
        "targetSwimPaceLowerSecPer100m": number (optional),
        "targetSwimPaceUpperSecPer100m": number (optional),
        "restSeconds": number (optional),
        "notes": string (optional)
      }
    ],
    "coachNotes": string (optional)
  }
}`;

export function buildWeekPlanPrompt(
  context: AthleteContextForAi,
  weekStartDate: string,
  additionalInstructions?: string,
): BuiltPrompt {
  const lines = [
    `Generate a training week plan for the week starting ${weekStartDate}.`,
    '',
    '## Athlete Context',
    '```json',
    formatContext(context),
    '```',
  ];

  if (additionalInstructions) {
    lines.push('', '## Additional Instructions', additionalInstructions);
  }

  lines.push('', '## Output Schema', WEEK_PLAN_SCHEMA_HINT);

  return {
    systemRole: COACH_SYSTEM_ROLE,
    userContent: lines.join('\n'),
  };
}

export function buildMemoryEntryPrompt(
  outputType: 'week_plan' | 'single_workout',
  summary: string | null,
  structuredOutput: unknown,
): BuiltPrompt {
  const typeLabel = outputType === 'week_plan' ? 'training week plan' : 'single workout';
  const summaryLine = summary != null ? `Summary: ${summary}` : '';

  return {
    systemRole: 'You are an expert endurance sports coach writing brief coaching diary entries. Be factual, concise, and coach-voice. Write in present perfect tense.',
    userContent: [
      `Write a 2–3 sentence coaching diary entry summarising this ${typeLabel} recommendation.`,
      `Focus on the key training objective, estimated load, and any notable context.`,
      `Write it as if you are the coach reflecting on what was recommended.`,
      summaryLine,
      '',
      '## Structured Output',
      '```json',
      JSON.stringify(structuredOutput, null, 2),
      '```',
      '',
      'Return only the diary entry text — no preamble, no JSON, no bullet points.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

export type WeekAnalysisInput = {
  weekStartDate: string;
  weekEndDate: string;
  activities: {
    sport: string;
    startTime: string;
    durationSeconds: number;
    distanceMeters?: number;
    averageHeartRateBpm?: number;
    averagePowerWatts?: number;
    averagePaceSecPerKm?: number;
  }[];
};

const WEEK_ANALYSIS_SCHEMA_HINT = `Return a JSON object:
{
  "weekStartDate": "YYYY-MM-DD",
  "weekEndDate": "YYYY-MM-DD",
  "totalDurationSeconds": number,
  "totalDistanceMeters": number (optional),
  "sportBreakdown": [
    {
      "sport": string,
      "durationSeconds": number,
      "distanceMeters": number (optional),
      "activityCount": number
    }
  ],
  "keyObservations": [string, string, ...] (2–4 bullet-point strings),
  "suggestedFocus": string (one sentence for the athlete's next training focus),
  "coachComment": string (1–3 sentences of coaching commentary)
}`;

export function buildWeekAnalysisPrompt(
  context: AthleteContextForAi,
  weekInput: WeekAnalysisInput,
): BuiltPrompt {
  const { weekStartDate, weekEndDate, activities } = weekInput;
  const lines = [
    `Analyse the athlete's completed training week from ${weekStartDate} to ${weekEndDate}.`,
    `${activities.length} activit${activities.length === 1 ? 'y was' : 'ies were'} completed this week.`,
    '',
    '## Completed Activities',
    '```json',
    JSON.stringify(activities, null, 2),
    '```',
    '',
    '## Athlete Context',
    '```json',
    formatContext(context),
    '```',
    '',
    '## Output Schema',
    WEEK_ANALYSIS_SCHEMA_HINT,
  ];

  return {
    systemRole: COACH_SYSTEM_ROLE,
    userContent: lines.join('\n'),
  };
}

export function buildSingleWorkoutPrompt(
  context: AthleteContextForAi,
  sport: string,
  objective: string,
  plannedDurationSeconds?: number,
  additionalInstructions?: string,
): BuiltPrompt {
  const durationHint =
    plannedDurationSeconds != null
      ? `Target duration: ${Math.round(plannedDurationSeconds / 60)} minutes.`
      : '';

  const lines = [`Generate a single ${sport} workout.`, `Objective: ${objective}`];
  if (durationHint) lines.push(durationHint);
  lines.push('', '## Athlete Context', '```json', formatContext(context), '```');

  if (additionalInstructions) {
    lines.push('', '## Additional Instructions', additionalInstructions);
  }

  lines.push('', '## Output Schema', SINGLE_WORKOUT_SCHEMA_HINT);

  return {
    systemRole: COACH_SYSTEM_ROLE,
    userContent: lines.join('\n'),
  };
}

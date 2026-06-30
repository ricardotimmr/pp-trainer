import type { AthleteContextForAi } from '../types/athleteContext.js';

export type BuiltPrompt = {
  systemRole: string;
  userContent: string;
};

// ── System roles ──────────────────────────────────────────────────────────────

const COACH_SYSTEM_ROLE = `You are an expert endurance sports coach and training planner specialising in running, cycling, swimming, and triathlon. Your role is to create personalised, science-based training plans tailored precisely to each athlete's physiology, goals, and availability.

## Output rules
- Respond with valid JSON only. No text, markdown, or commentary outside the JSON.
- Every field marked REQUIRED must be present. Omit only fields explicitly marked as optional.
- sport values must be exactly one of: "running", "cycling", "swimming", "strength", "mobility", "other"

## Periodisation
Read the athlete context carefully before choosing the week type:
- Build week: recent load is below the athlete's capacity → moderate volume increase (up to +10–15%)
- Recovery week: 3+ consecutive high-load weeks, or athlete shows fatigue signals → reduce volume ~30%, keep some intensity
- Taper: a race goal is within 2–3 weeks → reduce volume 20–30%, maintain race-pace sharpness
- Do not increase total weekly duration by more than 10–15% compared to last week's completed duration.

## Intensity distribution
- 80% of weekly training duration in low aerobic intensity (Zone 1–2): easy runs, base rides, technique swims.
- 20% in high intensity (Zone 4+ or threshold and above): intervals, threshold sets, race-pace work.
- Avoid excessive Zone 3 "grey zone" training — it accumulates fatigue without clear aerobic or neuromuscular benefit.
- Never schedule two hard sessions on consecutive days. Always follow a hard session with an easy or rest day.

## Sport-specific intensity guidelines

Running:
- Easy / long run: Zone 1–2 heart rate, fully conversational pace
- Tempo / threshold: 20–40 min continuous at lactate threshold pace, maximum once per week
- Intervals (VO2max): 3–8 min efforts at ~100–105% vVO2max, total hard volume 15–25 min, once per week
- Long run: Zone 1–2, longest session of the week, on the day with the most available time

Cycling:
- Easy ride: 55–70% FTP (Zone 2)
- Sweet spot: 85–90% FTP, 2 × 15–20 min blocks
- Threshold: 93–97% FTP, 8–15 min efforts
- VO2max: 105–120% FTP, 3–6 min efforts with equal rest

Swimming:
- Include a drill / technique block (10–20 min) in most sessions
- Pace work at CSS (critical swim speed) or slightly above
- Include kick and pull sets in easier sessions

Strength & Mobility:
- Short sessions 30–60 min, placed on easy aerobic days or as a secondary session
- Never schedule strength the day before a key run or ride

## Multi-sport balancing
- Distribute sports to match the athlete's primarySports and goal sport
- Running causes more mechanical fatigue than cycling or swimming — avoid hard running the day after a hard ride
- Swimming is low-impact and can follow any other session

## Workout step structure — MANDATORY
Every workout must contain at least 3 steps:
  1. Warm-up (stepType: "warmup") — Zone 1–2, 10–20 min
  2. One or more main set steps (stepType: "main", "interval", or "technique")
  3. Cool-down (stepType: "cooldown") — Zone 1, 5–15 min

Rules for steps:
- stepIndex is 0-based and must be unique per workout
- Interval steps with repetitions must include restSeconds
- targetHeartRateZoneName / targetPowerZoneName / targetPaceZoneName must exactly match zone names from the athlete's zone sets. If no matching zone set exists for a sport, describe intensity in the instruction field instead (e.g. "at easy conversational pace")
- durationSeconds or distanceMeters should be set on every main step — both are allowed together

## Goal alignment
- Prioritise workouts that directly serve the athlete's main_goal sport and type
- If a race is within 6 weeks, include race-pace or race-specific sessions
- Respect availability strictly: no workout on unavailable days, session duration ≤ maxDurationMinutes`;

const ANALYSIS_SYSTEM_ROLE = `You are an expert endurance sports coach analysing a completed training week. Your role is to identify patterns, assess training quality relative to the athlete's goals and load targets, and deliver specific, actionable coaching insight.

## Output rules
- Respond with valid JSON only. No text, markdown, or commentary outside the JSON.
- All fields in the schema are REQUIRED unless explicitly marked optional.
- Base analysis on the actual completed activity data — do not invent sessions that are not listed.

## Analysis principles
- Compare completed volume and sport distribution to what the athlete's weekly availability would allow
- Identify intensity distribution from heart rate and power data where available
- Note imbalances: too much of one sport, missing recovery, sessions too short or too long
- keyObservations must be specific and actionable — avoid generic phrases like "good week" or "keep it up"
- suggestedFocus must be a concrete directive for next week (e.g. "Add one 40-min threshold run" — not "run more")
- coachComment must reference the athlete's active goals to contextualise the week's training`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatContext(context: AthleteContextForAi): string {
  return JSON.stringify(context, null, 2);
}

// ── Schema hints ──────────────────────────────────────────────────────────────

const WEEK_PLAN_SCHEMA_HINT = `Return a JSON object with this exact structure:
{
  "title": string,                          // REQUIRED — short descriptive title for the week
  "weekStartDate": "YYYY-MM-DD",            // REQUIRED — must match the requested week start
  "weekEndDate": "YYYY-MM-DD",              // REQUIRED — 6 days after weekStartDate
  "focus": string,                          // REQUIRED — one-sentence theme (e.g. "Aerobic base + one threshold run")
  "summary": string,                        // REQUIRED — 2–3 sentences coaching rationale for this week
  "workouts": [                             // REQUIRED — array of 3–7 workouts
    {
      "title": string,                      // REQUIRED — descriptive workout name
      "sport": string,                      // REQUIRED — exactly one of: "running", "cycling", "swimming", "strength", "mobility", "other"
      "workoutType": string,                // REQUIRED — e.g. "endurance", "interval", "recovery", "technique"
      "scheduledDate": "YYYY-MM-DD",        // REQUIRED — must fall within the requested week, on an available day
      "plannedDurationSeconds": number,     // REQUIRED — total session duration in seconds
      "plannedDistanceMeters": number,      // optional
      "intensity": string,                  // REQUIRED — "easy", "moderate", "hard", or "very_hard"
      "objective": string,                  // REQUIRED — one sentence training objective
      "steps": [                            // REQUIRED — minimum 3 steps (warmup, main, cooldown)
        {
          "stepIndex": number,              // REQUIRED — 0-based, unique per workout
          "stepType": string,               // REQUIRED — "warmup", "main", "interval", "technique", "recovery", "cooldown", "rest", "other"
          "instruction": string,            // REQUIRED — clear athlete-facing instruction
          "title": string,                  // optional
          "durationSeconds": number,        // REQUIRED on warmup and cooldown; REQUIRED or distanceMeters on main steps
          "distanceMeters": number,         // optional
          "repetitions": number,            // optional — set when stepType is "interval"
          "targetHeartRateZoneName": string, // optional — use exact zone name from athlete's zone sets
          "targetPowerZoneName": string,    // optional — use exact zone name from athlete's zone sets
          "targetPaceZoneName": string,     // optional — use exact zone name from athlete's zone sets
          "targetPowerLowerWatts": number,  // optional
          "targetPowerUpperWatts": number,  // optional
          "targetPaceLowerSecPerKm": number, // optional
          "targetPaceUpperSecPerKm": number, // optional
          "targetSwimPaceLowerSecPer100m": number, // optional
          "targetSwimPaceUpperSecPer100m": number, // optional
          "restSeconds": number,            // REQUIRED when repetitions is set
          "notes": string                   // optional
        }
      ],
      "coachNotes": string                  // optional — internal coaching note visible to the athlete
    }
  ]
}`;

const SINGLE_WORKOUT_SCHEMA_HINT = `Return a JSON object with this exact structure:
{
  "workout": {
    "title": string,                        // REQUIRED — descriptive workout name
    "sport": string,                        // REQUIRED — exactly one of: "running", "cycling", "swimming", "strength", "mobility", "other"
    "workoutType": string,                  // REQUIRED — e.g. "endurance", "interval", "recovery", "technique"
    "plannedDurationSeconds": number,       // REQUIRED — total session duration in seconds
    "intensity": string,                    // REQUIRED — "easy", "moderate", "hard", or "very_hard"
    "objective": string,                    // REQUIRED — one sentence training objective
    "steps": [                              // REQUIRED — minimum 3 steps (warmup, main, cooldown)
      {
        "stepIndex": number,                // REQUIRED — 0-based, unique
        "stepType": string,                 // REQUIRED — "warmup", "main", "interval", "technique", "recovery", "cooldown", "rest", "other"
        "instruction": string,              // REQUIRED — clear athlete-facing instruction
        "title": string,                    // optional
        "durationSeconds": number,          // REQUIRED on warmup and cooldown; REQUIRED or distanceMeters on main steps
        "distanceMeters": number,           // optional
        "repetitions": number,              // optional — set when stepType is "interval"
        "targetHeartRateZoneName": string,  // optional — use exact zone name from athlete's zone sets
        "targetPowerZoneName": string,      // optional — use exact zone name from athlete's zone sets
        "targetPaceZoneName": string,       // optional — use exact zone name from athlete's zone sets
        "targetPowerLowerWatts": number,    // optional
        "targetPowerUpperWatts": number,    // optional
        "targetPaceLowerSecPerKm": number,  // optional
        "targetPaceUpperSecPerKm": number,  // optional
        "targetSwimPaceLowerSecPer100m": number, // optional
        "targetSwimPaceUpperSecPer100m": number, // optional
        "restSeconds": number,              // REQUIRED when repetitions is set
        "notes": string                     // optional
      }
    ],
    "coachNotes": string                    // optional
  }
}`;

const WEEK_ANALYSIS_SCHEMA_HINT = `Return a JSON object with this exact structure:
{
  "weekStartDate": "YYYY-MM-DD",            // REQUIRED
  "weekEndDate": "YYYY-MM-DD",              // REQUIRED
  "totalDurationSeconds": number,           // REQUIRED — sum of all activity durations
  "totalDistanceMeters": number,            // optional — omit if no distance data available
  "sportBreakdown": [                       // REQUIRED — one entry per sport completed
    {
      "sport": string,                      // REQUIRED
      "durationSeconds": number,            // REQUIRED
      "distanceMeters": number,             // optional
      "activityCount": number               // REQUIRED
    }
  ],
  "keyObservations": [string, string],      // REQUIRED — 2–4 specific, actionable observations (not generic praise)
  "suggestedFocus": string,                 // REQUIRED — one concrete directive for next week
  "coachComment": string                    // REQUIRED — 2–3 sentences referencing the athlete's active goals
}`;

// ── Prompt builders ───────────────────────────────────────────────────────────

export function buildWeekPlanPrompt(
  context: AthleteContextForAi,
  weekStartDate: string,
  additionalInstructions?: string,
): BuiltPrompt {
  const lines = [
    `Generate a training week plan for the week starting ${weekStartDate}.`,
    `Schedule workouts only on days marked as available in the athlete context.`,
    `Align the week type (build / recovery / taper) with the athlete's recent training history and upcoming goals.`,
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

  const lines = [
    `Generate a single ${sport} workout.`,
    `Objective: ${objective}`,
  ];
  if (durationHint) lines.push(durationHint);
  lines.push(
    `The workout must include at least 3 steps: a warm-up, one or more main set steps, and a cool-down.`,
    '',
    '## Athlete Context',
    '```json',
    formatContext(context),
    '```',
  );

  if (additionalInstructions) {
    lines.push('', '## Additional Instructions', additionalInstructions);
  }

  lines.push('', '## Output Schema', SINGLE_WORKOUT_SCHEMA_HINT);

  return {
    systemRole: COACH_SYSTEM_ROLE,
    userContent: lines.join('\n'),
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
    systemRole: ANALYSIS_SYSTEM_ROLE,
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
    systemRole:
      'You are an expert endurance sports coach writing brief coaching diary entries. Be factual, concise, and coach-voice. Write in present perfect tense.',
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

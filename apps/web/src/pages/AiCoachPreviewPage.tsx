import { useState } from 'react';
import { IntensityBadge, SportBadge, WorkoutStepList } from '../components';
import { stepTypeLabels } from '../components/data/WorkoutStepList';
import { usePrototypeAthleteContext } from '../context/prototypeAthleteContextValue';
import { PageShell } from '../layout/PageShell';
import {
  prototypeAiCoachPreview,
} from '../mock/prototypeData';
import {
  getWeeklySummary,
  getPlannedWorkouts,
  getCurrentTrainingPlan,
  getWorkoutById,
  getWorkoutSteps,
} from '../mock/prototypeData.helpers';
import {
  formatDuration,
  sportLabels,
} from '../components/prototypeFormatters';
import type { PlannedWorkout } from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';

const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d);
}

function formatWeekdayShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d);
}

function formatSwimPace(secPer100m: number): string {
  const min = Math.floor(secPer100m / 60);
  const sec = secPer100m % 60;
  return `${min}:${sec.toString().padStart(2, '0')} /100m`;
}

function formatRunPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

const WEEK_PLAN_PROMPT =
  "Build me a training week for Jun 15–21. I have an Olympic triathlon on Sep 6 and I'm in my third build week. Available Tuesday and Thursday for up to 90 min on the bike, two swim sessions of 45–60 min, an easy run mid-week and a long run Sunday. Keep total fatigue manageable.";

const SINGLE_WORKOUT_PROMPT =
  'Create a bike threshold workout for Tuesday evening. I have about 75 minutes. Focus on sustained power around FTP with a proper warm-up and cool-down. My FTP is 285W.';

function showIntensityBadge(workout: PlannedWorkout) {
  return workout.sport !== 'strength' && workout.sport !== 'mobility';
}

function getWeekDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export function AiCoachPreviewPage({ navigate }: PageComponentProps) {
  const [outputMode, setOutputMode] = useState<'week_plan' | 'single_workout'>('week_plan');
  const { mainGoal, profile, secondaryGoals, watchlistGoals } =
    usePrototypeAthleteContext();

  const preview = prototypeAiCoachPreview;
  const weeklySummary = getWeeklySummary();

  const trainingPlan = getCurrentTrainingPlan();
  const weekDates = getWeekDates(trainingPlan.startDate, trainingPlan.endDate);
  const allWorkouts = getPlannedWorkouts();
  const workoutsByDate = allWorkouts.reduce<Record<string, PlannedWorkout[]>>(
    (acc, w) => {
      if (!acc[w.scheduledDate]) acc[w.scheduledDate] = [];
      acc[w.scheduledDate].push(w);
      return acc;
    },
    {},
  );

  const singleWorkout = getWorkoutById('workout-bike-threshold-2026-06-16');
  const singleWorkoutSteps = singleWorkout ? getWorkoutSteps(singleWorkout.id) : [];

  const stepsWithDuration = singleWorkoutSteps.filter((s) => s.durationSeconds);
  const totalStepSeconds = stepsWithDuration.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0),
    0,
  );

  const age = profile.birthYear
    ? new Date().getFullYear() - profile.birthYear
    : undefined;

  return (
    <PageShell
      title="AI Coach"
      eyebrow="AI Coach · Preview"
      description={
        <span className="ai-coach__preview-notice">
          Static prototype preview — no real AI integration is active in Phase 2
        </span>
      }
    >
      <div className="ai-coach-layout">

        {/* ── Left: athlete context + request ──────────────── */}
        <aside className="ai-coach__context">

          <section className="ai-context-section">
            <p className="ai-context-section__label">Athlete</p>
            <dl className="ai-context-dl">
              <div><dt>Name</dt><dd>{profile.displayName}</dd></div>
              {age && <div><dt>Age</dt><dd>{age} yrs</dd></div>}
              {profile.bodyWeightKg && (
                <div><dt>Weight</dt><dd>{profile.bodyWeightKg} kg</dd></div>
              )}
              {profile.heightCm && (
                <div><dt>Height</dt><dd>{profile.heightCm} cm</dd></div>
              )}
            </dl>
            <div className="ai-context-sports">
              {profile.primarySports.map((sport) => (
                <SportBadge key={sport} sport={sport} />
              ))}
            </div>
          </section>

          <section className="ai-context-section">
            <p className="ai-context-section__label">Thresholds</p>
            <dl className="ai-context-dl">
              {profile.currentFtpWatts && (
                <div><dt>Bike FTP</dt><dd>{profile.currentFtpWatts} W</dd></div>
              )}
              {profile.maxHeartRateBpm && (
                <div><dt>HR max</dt><dd>{profile.maxHeartRateBpm} bpm</dd></div>
              )}
              {profile.restingHeartRateBpm && (
                <div><dt>HR rest</dt><dd>{profile.restingHeartRateBpm} bpm</dd></div>
              )}
              {profile.runningThresholdPaceSecPerKm && (
                <div>
                  <dt>Run threshold</dt>
                  <dd>{formatRunPace(profile.runningThresholdPaceSecPerKm)}</dd>
                </div>
              )}
              {profile.swimmingThresholdPaceSecPer100m && (
                <div>
                  <dt>Swim threshold</dt>
                  <dd>{formatSwimPace(profile.swimmingThresholdPaceSecPer100m)}</dd>
                </div>
              )}
            </dl>
          </section>

          {mainGoal && (
            <section className="ai-context-section">
              <p className="ai-context-section__label">Main goal</p>
              <p className="ai-context-goal__title">{mainGoal.title}</p>
              {mainGoal.targetDate && (
                <p className="ai-context-goal__date">
                  {new Intl.DateTimeFormat('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(`${mainGoal.targetDate}T12:00:00Z`))}
                </p>
              )}
            </section>
          )}

          {secondaryGoals.length > 0 && (
            <section className="ai-context-section">
              <p className="ai-context-section__label">Secondary goals</p>
              <ul className="ai-context-goal-list">
                {secondaryGoals.map((goal) => (
                  <li key={goal.id}>
                    <span>{goal.title}</span>
                    {goal.targetDate ? (
                      <em>
                        {new Intl.DateTimeFormat('en', {
                          month: 'short',
                          day: 'numeric',
                        }).format(new Date(`${goal.targetDate}T12:00:00Z`))}
                      </em>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {watchlistGoals.length > 0 && (
            <section className="ai-context-section">
              <p className="ai-context-section__label">Watchlist</p>
              <ul className="ai-context-goal-list ai-context-goal-list--muted">
                {watchlistGoals.map((goal) => (
                  <li key={goal.id}>
                    <span>{goal.title}</span>
                    <em>tracked only</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {profile.preferredTrainingDays && profile.preferredTrainingDays.length > 0 && (
            <section className="ai-context-section">
              <p className="ai-context-section__label">Weekly availability</p>
              <ul className="ai-context-availability">
                {profile.preferredTrainingDays.map((day) => (
                  <li key={day.weekday} className="ai-context-availability__day">
                    <span className="ai-context-availability__weekday">
                      {WEEKDAY_SHORT[day.weekday]}
                    </span>
                    <span className="ai-context-availability__duration">
                      {day.maxDurationMinutes} min
                    </span>
                    <span className="ai-context-availability__sports">
                      {day.preferredSports?.map((s) => sportLabels[s]).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="ai-context-section">
            <p className="ai-context-section__label">Current week load</p>
            <dl className="ai-context-dl">
              <div><dt>Sessions</dt><dd>{weeklySummary.activityCount}</dd></div>
              <div>
                <dt>Total time</dt>
                <dd>{formatDuration(weeklySummary.plannedDurationSeconds)}</dd>
              </div>
              {weeklySummary.cyclingDurationSeconds ? (
                <div><dt>Bike</dt><dd>{formatDuration(weeklySummary.cyclingDurationSeconds)}</dd></div>
              ) : null}
              {weeklySummary.runningDurationSeconds ? (
                <div><dt>Run</dt><dd>{formatDuration(weeklySummary.runningDurationSeconds)}</dd></div>
              ) : null}
              {weeklySummary.swimmingDurationSeconds ? (
                <div><dt>Swim</dt><dd>{formatDuration(weeklySummary.swimmingDurationSeconds)}</dd></div>
              ) : null}
              {weeklySummary.strengthDurationSeconds ? (
                <div><dt>Strength</dt><dd>{formatDuration(weeklySummary.strengthDurationSeconds)}</dd></div>
              ) : null}
            </dl>
          </section>

          <section className="ai-context-section ai-request-preview">
            <p className="ai-context-section__label">Request</p>
            <blockquote className="ai-request-preview__prompt">
              {outputMode === 'week_plan' ? WEEK_PLAN_PROMPT : SINGLE_WORKOUT_PROMPT}
            </blockquote>
          </section>

        </aside>

        {/* ── Right: generated output ───────────────────────── */}
        <div className="ai-coach__output">

          <div className="segmented-control" role="tablist" aria-label="Output type">
            <span
              className="segmented-control__indicator"
              aria-hidden="true"
              style={{
                left: outputMode === 'week_plan' ? '0%' : '50%',
                width: '50%',
              }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={outputMode === 'week_plan'}
              className={`segmented-control__tab${outputMode === 'week_plan' ? ' is-active' : ''}`}
              onClick={() => setOutputMode('week_plan')}
            >
              Week Plan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={outputMode === 'single_workout'}
              className={`segmented-control__tab${outputMode === 'single_workout' ? ' is-active' : ''}`}
              onClick={() => setOutputMode('single_workout')}
            >
              Single Workout
            </button>
          </div>

          {outputMode === 'week_plan' && (
            <div className="ai-output">
              <p className="ai-output__label">Generated week plan</p>
              <ol className="ai-week-plan">
                {weekDates.map((date) => {
                  const dayWorkouts = workoutsByDate[date] ?? [];
                  const isRestDay = dayWorkouts.length === 0;
                  return (
                    <li key={date} className="ai-week-row">
                      {isRestDay ? (
                        <div className="ai-week-row__inner ai-week-row__inner--rest">
                          <span className="ai-week-row__date">
                            <span className="ai-week-row__weekday">
                              {formatWeekdayShort(date)}
                            </span>
                            <span className="ai-week-row__datenum">
                              {formatShortDate(date)}
                            </span>
                          </span>
                          <span className="ai-week-row__rest">Rest day</span>
                        </div>
                      ) : (
                        dayWorkouts.map((workout) => (
                          <button
                            key={workout.id}
                            type="button"
                            className="ai-week-row__inner"
                            onClick={() => navigate(`/workouts/${workout.id}`)}
                          >
                            <span className="ai-week-row__date">
                              <span className="ai-week-row__weekday">
                                {formatWeekdayShort(date)}
                              </span>
                              <span className="ai-week-row__datenum">
                                {formatShortDate(date)}
                              </span>
                            </span>
                            <span className="ai-week-row__badges">
                              <SportBadge sport={workout.sport} />
                              {showIntensityBadge(workout) && (
                                <IntensityBadge intensity={workout.intensity} />
                              )}
                            </span>
                            <span className="ai-week-row__body">
                              <span className="ai-week-row__title">{workout.title}</span>
                              {workout.objective && (
                                <span className="ai-week-row__objective">{workout.objective}</span>
                              )}
                            </span>
                            <span className="ai-week-row__duration">
                              {formatDuration(workout.plannedDurationSeconds)}
                            </span>
                          </button>
                        ))
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {outputMode === 'single_workout' && singleWorkout && (
            <div className="ai-output">
              <p className="ai-output__label">Generated workout</p>
              <div className="ai-single-workout">
                <h2 className="ai-single-workout__title">{singleWorkout.title}</h2>
                {singleWorkout.objective && (
                  <p className="ai-single-workout__objective">{singleWorkout.objective}</p>
                )}
                <dl className="workout-detail__meta">
                  <div>
                    <dt>Duration</dt>
                    <dd>{formatDuration(singleWorkout.plannedDurationSeconds)}</dd>
                  </div>
                  <div>
                    <dt>Sport</dt>
                    <dd><SportBadge sport={singleWorkout.sport} /></dd>
                  </div>
                  <div>
                    <dt>Intensity</dt>
                    <dd><IntensityBadge intensity={singleWorkout.intensity} /></dd>
                  </div>
                </dl>

                {stepsWithDuration.length > 0 && (
                  <div
                    className="session-bar"
                    aria-hidden="true"
                    title="Session structure"
                    style={{ marginBottom: '24px' }}
                  >
                    {stepsWithDuration.map((step) => (
                      <div
                        key={step.id}
                        className={`session-bar__segment session-bar__segment--${step.stepType}`}
                        style={{ flex: step.durationSeconds }}
                        title={`${stepTypeLabels[step.stepType]}: ${formatDuration(step.durationSeconds)}`}
                      />
                    ))}
                    {totalStepSeconds < (singleWorkout.plannedDurationSeconds ?? 0) && (
                      <div
                        className="session-bar__segment session-bar__segment--other"
                        style={{
                          flex: (singleWorkout.plannedDurationSeconds ?? 0) - totalStepSeconds,
                        }}
                      />
                    )}
                  </div>
                )}

                <WorkoutStepList steps={singleWorkoutSteps} />
              </div>
            </div>
          )}

          <div className="coach-rationale">
            <p className="coach-rationale__label">Coach rationale</p>
            <p className="coach-rationale__text">{preview.summary}</p>
            <blockquote className="coach-rationale__notes">{preview.rawText}</blockquote>
            <p className="coach-rationale__caveat">
              Static mock data · AI Coach is not active in Phase 2
            </p>
          </div>

          <div className="ai-coach__actions">
            <button type="button" className="button button--primary" disabled>
              Accept {outputMode === 'week_plan' ? 'plan' : 'workout'}
            </button>
            <button type="button" className="button button--secondary" disabled>
              Reject
            </button>
            <p className="ai-coach__action-note">
              Acceptance is not persisted in Phase 2 — review only
            </p>
          </div>

        </div>
      </div>
    </PageShell>
  );
}

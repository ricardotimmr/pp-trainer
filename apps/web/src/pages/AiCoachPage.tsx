import { type FormEvent, useState } from 'react';

import type { GenerateWeekPlanRequest, GenerateWorkoutRequest } from '@pp-trainer/shared';

import { SelectMenu, SportBadge } from '../components';
import type { SelectMenuOption } from '../components';
import { generateWeekPlan, generateWorkout } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { useAiCoachSidebar } from '../hooks/useAiCoachSidebar';
import { PageShell } from '../layout/PageShell';
import { formatDuration, sportLabels } from '../components/prototypeFormatters';
import type { PageComponentProps } from '../routes/routeTypes';

const WEEKDAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const SPORT_OPTIONS: SelectMenuOption[] = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'other', label: 'Other' },
];

const INTENSITY_OPTIONS: SelectMenuOption[] = [
  { value: 'recovery', label: 'Recovery' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'vo2max', label: 'VO₂max' },
  { value: 'race', label: 'Race' },
  { value: 'strength', label: 'Strength' },
];

function formatRunPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

function formatSwimPace(secPer100m: number): string {
  const min = Math.floor(secPer100m / 60);
  const sec = secPer100m % 60;
  return `${min}:${sec.toString().padStart(2, '0')} /100m`;
}

function nextMondayIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function AiCoachPage({ navigate }: PageComponentProps) {
  const [mode, setMode] = useState<'week_plan' | 'single_workout'>('week_plan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidOutput, setInvalidOutput] = useState(false);

  // Week plan form state
  const [weekStartDate, setWeekStartDate] = useState(nextMondayIso);
  const [weekInstruction, setWeekInstruction] = useState('');

  // Single workout form state
  const [sport, setSport] = useState<string>('running');
  const [intensity, setIntensity] = useState<string>('easy');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [workoutInstruction, setWorkoutInstruction] = useState('');

  const sidebarState = useAiCoachSidebar();

  function switchMode(next: 'week_plan' | 'single_workout') {
    setMode(next);
    setError(null);
    setInvalidOutput(false);
  }

  async function handleWeekPlanSubmit(e: FormEvent) {
    e.preventDefault();
    if (!weekStartDate) return;
    setError(null);
    setInvalidOutput(false);
    setLoading(true);

    try {
      const request: GenerateWeekPlanRequest = {
        weekStartDate,
        ...(weekInstruction.trim() && { userInstruction: weekInstruction.trim() }),
      };
      const output = await generateWeekPlan(request);

      if (output.validationStatus === 'invalid') {
        setInvalidOutput(true);
        return;
      }
      navigate(`/ai-coach/preview/week-plan/${output.id}`);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Network error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkoutSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInvalidOutput(false);
    setLoading(true);

    try {
      const durationSec = durationMinutes ? parseInt(durationMinutes, 10) * 60 : undefined;
      const request: GenerateWorkoutRequest = {
        sport: sport as GenerateWorkoutRequest['sport'],
        intensity: intensity as GenerateWorkoutRequest['intensity'],
        ...(durationSec && { plannedDurationSeconds: durationSec }),
        ...(workoutInstruction.trim() && { userInstruction: workoutInstruction.trim() }),
      };
      const output = await generateWorkout(request);

      if (output.validationStatus === 'invalid') {
        setInvalidOutput(true);
        return;
      }
      navigate(`/ai-coach/preview/workout/${output.id}`);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Network error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="AI Coach"
      eyebrow="AI Coach"
      description="Generate a training plan or workout with AI"
    >
      <div className="ai-coach-layout">

        {/* ── Left: athlete context ─────────────────────────────── */}
        <aside className="ai-coach__context">

          {sidebarState.status === 'ready' && (() => {
            const { settings, mainGoal, secondaryGoals, watchlistGoals, activeDays, weekLoad } = sidebarState.data;
            const { athleteProfile } = settings;
            const { thresholds } = athleteProfile;
            const hasThresholds = Boolean(
              thresholds.currentFtpWatts || thresholds.maxHeartRateBpm
              || thresholds.restingHeartRateBpm || thresholds.runningThresholdPaceSecPerKm
              || thresholds.swimmingThresholdPaceSecPer100m,
            );

            return (
              <>
                <section className="ai-context-section">
                  <p className="ai-context-section__label">Athlete</p>
                  <dl className="ai-context-dl">
                    <div><dt>Name</dt><dd>{athleteProfile.displayName}</dd></div>
                    {athleteProfile.bodyWeightKg && (
                      <div><dt>Weight</dt><dd>{athleteProfile.bodyWeightKg} kg</dd></div>
                    )}
                    {athleteProfile.heightCm && (
                      <div><dt>Height</dt><dd>{athleteProfile.heightCm} cm</dd></div>
                    )}
                  </dl>
                  <div className="ai-context-sports">
                    {athleteProfile.primarySports.map((s) => (
                      <SportBadge key={s} sport={s} />
                    ))}
                  </div>
                </section>

                <section className="ai-context-section">
                  <p className="ai-context-section__label">Thresholds</p>
                  {hasThresholds ? (
                    <dl className="ai-context-dl">
                      {thresholds.currentFtpWatts && (
                        <div><dt>Bike FTP</dt><dd>{thresholds.currentFtpWatts} W</dd></div>
                      )}
                      {thresholds.maxHeartRateBpm && (
                        <div><dt>HR max</dt><dd>{thresholds.maxHeartRateBpm} bpm</dd></div>
                      )}
                      {thresholds.restingHeartRateBpm && (
                        <div><dt>HR rest</dt><dd>{thresholds.restingHeartRateBpm} bpm</dd></div>
                      )}
                      {thresholds.runningThresholdPaceSecPerKm && (
                        <div>
                          <dt>Run threshold</dt>
                          <dd>{formatRunPace(thresholds.runningThresholdPaceSecPerKm)}</dd>
                        </div>
                      )}
                      {thresholds.swimmingThresholdPaceSecPer100m && (
                        <div>
                          <dt>Swim threshold</dt>
                          <dd>{formatSwimPace(thresholds.swimmingThresholdPaceSecPer100m)}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="ai-context-empty">No threshold baselines set.</p>
                  )}
                </section>

                {mainGoal && (
                  <section className="ai-context-section">
                    <p className="ai-context-section__label">Main goal</p>
                    <p className="ai-context-goal__title">{mainGoal.title}</p>
                    {mainGoal.targetDate && (
                      <p className="ai-context-goal__date">
                        {new Intl.DateTimeFormat('en', {
                          month: 'short', day: 'numeric', year: 'numeric',
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
                          {goal.targetDate && (
                            <em>
                              {new Intl.DateTimeFormat('en', {
                                month: 'short', day: 'numeric',
                              }).format(new Date(`${goal.targetDate}T12:00:00Z`))}
                            </em>
                          )}
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

                {activeDays.length > 0 && (
                  <section className="ai-context-section">
                    <p className="ai-context-section__label">Weekly availability</p>
                    <ul className="ai-context-availability">
                      {activeDays.map((day) => (
                        <li key={day.weekday} className="ai-context-availability__day">
                          <span className="ai-context-availability__weekday">
                            {WEEKDAY_SHORT[day.weekday]}
                          </span>
                          <span className="ai-context-availability__duration">
                            {day.maxDurationMinutes} min
                          </span>
                          <span className="ai-context-availability__sports">
                            {day.preferredSports.map((s) => sportLabels[s]).join(' · ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="ai-context-section">
                  <p className="ai-context-section__label">Current week load</p>
                  <dl className="ai-context-dl">
                    <div><dt>Sessions</dt><dd>{weekLoad.workoutCount}</dd></div>
                    <div>
                      <dt>Total time</dt>
                      <dd>{formatDuration(weekLoad.plannedDurationSeconds)}</dd>
                    </div>
                    {weekLoad.cyclingDurationSeconds > 0 && (
                      <div><dt>Bike</dt><dd>{formatDuration(weekLoad.cyclingDurationSeconds)}</dd></div>
                    )}
                    {weekLoad.runningDurationSeconds > 0 && (
                      <div><dt>Run</dt><dd>{formatDuration(weekLoad.runningDurationSeconds)}</dd></div>
                    )}
                    {weekLoad.swimmingDurationSeconds > 0 && (
                      <div><dt>Swim</dt><dd>{formatDuration(weekLoad.swimmingDurationSeconds)}</dd></div>
                    )}
                  </dl>
                </section>
              </>
            );
          })()}

        </aside>

        {/* ── Right: request form ────────────────────────────────── */}
        <div className="ai-coach__output">

          <div className="segmented-control" role="tablist" aria-label="Generation mode">
            <span
              className="segmented-control__indicator"
              aria-hidden="true"
              style={{ left: mode === 'week_plan' ? '0%' : '50%', width: '50%' }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'week_plan'}
              className={`segmented-control__tab${mode === 'week_plan' ? ' is-active' : ''}`}
              onClick={() => switchMode('week_plan')}
              disabled={loading}
            >
              Week plan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'single_workout'}
              className={`segmented-control__tab${mode === 'single_workout' ? ' is-active' : ''}`}
              onClick={() => switchMode('single_workout')}
              disabled={loading}
            >
              Single workout
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="ai-error-banner" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="ai-error-banner__dismiss"
                aria-label="Dismiss"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Validation failure notice */}
          {invalidOutput && (
            <div className="ai-error-banner ai-error-banner--warn" role="alert">
              <span>
                The AI proposal could not be validated. Try a more specific description.
              </span>
              <button
                type="button"
                className="ai-error-banner__dismiss"
                aria-label="Dismiss"
                onClick={() => setInvalidOutput(false)}
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="ai-loading">
              <div className="ai-loading__spinner" aria-hidden="true" />
              <p className="ai-loading__label">
                {mode === 'week_plan'
                  ? 'AI is generating your week plan…'
                  : 'AI is generating your workout…'}
              </p>
              <p className="ai-loading__hint">This may take 5–15 seconds</p>
            </div>
          ) : (
            <>
              {mode === 'week_plan' && (
                <form className="ai-request-form" onSubmit={handleWeekPlanSubmit} noValidate>
                  <p className="ai-output__label">Generate week plan</p>

                  <div className="ai-request-form__fields">
                    <div className="cw-field">
                      <label className="cw-label cw-label--required" htmlFor="weekStartDate">
                        Week start (Monday)
                      </label>
                      <input
                        id="weekStartDate"
                        type="date"
                        className="cw-input"
                        value={weekStartDate}
                        onChange={(e) => setWeekStartDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cw-field">
                      <label className="cw-label" htmlFor="weekInstruction">
                        Instructions <span className="ai-form-optional">(optional)</span>
                      </label>
                      <textarea
                        id="weekInstruction"
                        className="cw-textarea ai-request-form__textarea"
                        value={weekInstruction}
                        onChange={(e) => setWeekInstruction(e.target.value)}
                        placeholder="e.g. Short on time Monday. Focus on cycling this week."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="ai-request-form__actions">
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={!weekStartDate}
                    >
                      Generate week plan
                    </button>
                  </div>
                </form>
              )}

              {mode === 'single_workout' && (
                <form className="ai-request-form" onSubmit={handleWorkoutSubmit} noValidate>
                  <p className="ai-output__label">Generate single workout</p>

                  <div className="ai-request-form__fields">
                    <div className="cw-row">
                      <div className="cw-field">
                        <label className="cw-label cw-label--required" htmlFor="sport">
                          Sport
                        </label>
                        <SelectMenu
                          id="sport"
                          value={sport}
                          options={SPORT_OPTIONS}
                          onChange={setSport}
                          disabled={loading}
                        />
                      </div>

                      <div className="cw-field">
                        <label className="cw-label cw-label--required" htmlFor="intensity">
                          Intensity
                        </label>
                        <SelectMenu
                          id="intensity"
                          value={intensity}
                          options={INTENSITY_OPTIONS}
                          onChange={setIntensity}
                          disabled={loading}
                        />
                      </div>

                      <div className="cw-field cw-field--metric">
                        <label className="cw-label" htmlFor="duration">
                          Duration <span className="ai-form-optional">(optional)</span>
                        </label>
                        <div className="cw-input-with-unit">
                          <input
                            id="duration"
                            type="number"
                            className="cw-input"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            placeholder="60"
                            min="5"
                            max="600"
                          />
                          <span className="cw-input-with-unit__label">min</span>
                        </div>
                      </div>
                    </div>

                    <div className="cw-field">
                      <label className="cw-label" htmlFor="workoutInstruction">
                        Instructions <span className="ai-form-optional">(optional)</span>
                      </label>
                      <textarea
                        id="workoutInstruction"
                        className="cw-textarea ai-request-form__textarea"
                        value={workoutInstruction}
                        onChange={(e) => setWorkoutInstruction(e.target.value)}
                        placeholder="e.g. Threshold intervals with a clean warm-up. FTP is 285 W."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="ai-request-form__actions">
                    <button
                      type="submit"
                      className="button button--primary"
                    >
                      Generate workout
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

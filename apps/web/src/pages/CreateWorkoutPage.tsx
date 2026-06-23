import type { FormEvent } from 'react';
import { useState } from 'react';

import type { CreatePlannedWorkoutRequest, CreateWorkoutStepRequest } from '@pp-trainer/shared';

import { createWorkout } from '../api/trainingApi';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { PageShell } from '../layout/PageShell';
import type { PageComponentProps } from '../routes/routeTypes';

const SPORT_OPTIONS = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'other', label: 'Other' },
] as const;

const WORKOUT_TYPE_OPTIONS = [
  { value: 'endurance', label: 'Endurance' },
  { value: 'long', label: 'Long' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'vo2max', label: 'VO₂max' },
  { value: 'race_specific', label: 'Race-Specific' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'technique', label: 'Technique' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'rest', label: 'Rest' },
  { value: 'other', label: 'Other' },
] as const;

const INTENSITY_OPTIONS = [
  { value: 'rest', label: 'Rest' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'vo2max', label: 'VO₂max' },
  { value: 'race', label: 'Race' },
  { value: 'strength', label: 'Strength' },
] as const;

const STEP_TYPE_OPTIONS = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'main', label: 'Main Set' },
  { value: 'interval', label: 'Interval' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cooldown', label: 'Cool-down' },
  { value: 'technique', label: 'Technique' },
  { value: 'strength_exercise', label: 'Exercise' },
  { value: 'rest', label: 'Rest' },
  { value: 'other', label: 'Other' },
] as const;

type StepDraft = {
  key: string;
  stepType: string;
  instruction: string;
  durationMinutes: string;
  distanceKm: string;
  repetitions: string;
};

function newStep(): StepDraft {
  return {
    key: `step-${Date.now()}-${Math.random()}`,
    stepType: 'main',
    instruction: '',
    durationMinutes: '',
    distanceKm: '',
    repetitions: '',
  };
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function CreateWorkoutPage({ navigate }: PageComponentProps) {
  const plansState = useTrainingPlans();

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<string>('running');
  const [workoutType, setWorkoutType] = useState<string>('endurance');
  const [scheduledDate, setScheduledDate] = useState<string>(todayIso());
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [intensity, setIntensity] = useState<string>('easy');
  const [plannedDurationMinutes, setPlannedDurationMinutes] = useState('');
  const [plannedDistanceKm, setPlannedDistanceKm] = useState('');
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [trainingPlanId, setTrainingPlanId] = useState('');

  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep() {
    setSteps((prev) => [...prev, newStep()]);
  }

  function removeStep(key: string) {
    setSteps((prev) => prev.filter((s) => s.key !== key));
  }

  function moveStep(key: string, dir: 'up' | 'down') {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  function updateStep(key: string, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!scheduledDate) {
      setError('Scheduled date is required.');
      return;
    }

    const workoutSteps: CreateWorkoutStepRequest[] = steps.map((s, idx) => {
      const step: CreateWorkoutStepRequest = {
        stepIndex: idx,
        stepType: s.stepType as CreateWorkoutStepRequest['stepType'],
        instruction: s.instruction.trim() || '—',
      };
      const durMin = parseFloat(s.durationMinutes);
      if (!isNaN(durMin) && durMin > 0) step.durationSeconds = Math.round(durMin * 60);
      const distKm = parseFloat(s.distanceKm);
      if (!isNaN(distKm) && distKm > 0) step.distanceMeters = Math.round(distKm * 1000);
      const reps = parseInt(s.repetitions);
      if (!isNaN(reps) && reps > 0) step.repetitions = reps;
      return step;
    });

    const payload: CreatePlannedWorkoutRequest = {
      title: title.trim(),
      sport: sport as CreatePlannedWorkoutRequest['sport'],
      workoutType: workoutType as CreatePlannedWorkoutRequest['workoutType'],
      scheduledDate,
      intensity: intensity as CreatePlannedWorkoutRequest['intensity'],
      status: 'planned',
      steps: workoutSteps,
    };

    if (scheduledStartTime) {
      payload.scheduledStartTime = `${scheduledDate}T${scheduledStartTime}:00`;
    }
    const durMin = parseFloat(plannedDurationMinutes);
    if (!isNaN(durMin) && durMin > 0) payload.plannedDurationSeconds = Math.round(durMin * 60);
    const distKm = parseFloat(plannedDistanceKm);
    if (!isNaN(distKm) && distKm > 0) payload.plannedDistanceMeters = Math.round(distKm * 1000);
    if (objective.trim()) payload.objective = objective.trim();
    if (description.trim()) payload.description = description.trim();
    if (coachNotes.trim()) payload.coachNotes = coachNotes.trim();
    if (trainingPlanId) payload.trainingPlanId = trainingPlanId;

    setSubmitting(true);
    try {
      const created = await createWorkout(payload);
      navigate(`/workouts/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout.');
      setSubmitting(false);
    }
  }

  const plans = plansState.status === 'success' ? plansState.plans : [];

  return (
    <PageShell
      title="Create Workout"
      eyebrow="Training Plan · New Workout"
      description="Plan a new workout session — add steps, set targets, and assign it to a training week."
    >
      <form className="cw-form" onSubmit={handleSubmit} noValidate>

        {/* ── Basics ─────────────────────────────────────────────────── */}
        <section className="cw-section">
          <h2 className="cw-section__title">Basics</h2>

          <div className="cw-row">
            <div className="cw-field cw-field--full">
              <label className="cw-label cw-label--required" htmlFor="cw-title">Title</label>
              <input
                id="cw-title"
                className="cw-input"
                type="text"
                placeholder="e.g. 60 min easy run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="cw-row">
            <div className="cw-field cw-field--1">
              <label className="cw-label cw-label--required" htmlFor="cw-sport">Sport</label>
              <select
                id="cw-sport"
                className="cw-select"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                {SPORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="cw-field cw-field--2">
              <label className="cw-label cw-label--required" htmlFor="cw-workout-type">Workout type</label>
              <select
                id="cw-workout-type"
                className="cw-select"
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
              >
                {WORKOUT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="cw-field cw-field--1">
              <label className="cw-label cw-label--required" htmlFor="cw-intensity">Intensity</label>
              <select
                id="cw-intensity"
                className="cw-select"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
              >
                {INTENSITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Schedule ───────────────────────────────────────────────── */}
        <section className="cw-section">
          <h2 className="cw-section__title">Schedule</h2>

          <div className="cw-row">
            <div className="cw-field">
              <label className="cw-label cw-label--required" htmlFor="cw-date">Date</label>
              <input
                id="cw-date"
                className="cw-input"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="cw-field">
              <label className="cw-label" htmlFor="cw-start-time">Start time</label>
              <input
                id="cw-start-time"
                className="cw-input"
                type="time"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
              />
            </div>
            <div className="cw-field">
              <label className="cw-label" htmlFor="cw-duration">Duration (min)</label>
              <input
                id="cw-duration"
                className="cw-input"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 60"
                value={plannedDurationMinutes}
                onChange={(e) => setPlannedDurationMinutes(e.target.value)}
              />
            </div>
            <div className="cw-field">
              <label className="cw-label" htmlFor="cw-distance">Distance (km)</label>
              <input
                id="cw-distance"
                className="cw-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 10"
                value={plannedDistanceKm}
                onChange={(e) => setPlannedDistanceKm(e.target.value)}
              />
            </div>
          </div>

          <div className="cw-row">
            <div className="cw-field cw-field--2">
              <label className="cw-label" htmlFor="cw-plan">Training plan</label>
              <select
                id="cw-plan"
                className="cw-select"
                value={trainingPlanId}
                onChange={(e) => setTrainingPlanId(e.target.value)}
              >
                <option value="">None — standalone workout</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Goal & Notes ───────────────────────────────────────────── */}
        <section className="cw-section">
          <h2 className="cw-section__title">Goal &amp; Notes</h2>

          <div className="cw-row">
            <div className="cw-field cw-field--full">
              <label className="cw-label" htmlFor="cw-objective">Objective</label>
              <input
                id="cw-objective"
                className="cw-input"
                type="text"
                placeholder="What is the goal of this session?"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>
          </div>
          <div className="cw-row">
            <div className="cw-field cw-field--full">
              <label className="cw-label" htmlFor="cw-description">Description</label>
              <textarea
                id="cw-description"
                className="cw-textarea"
                placeholder="Additional workout notes or context..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="cw-row">
            <div className="cw-field cw-field--full">
              <label className="cw-label" htmlFor="cw-coach-notes">Coach notes</label>
              <textarea
                id="cw-coach-notes"
                className="cw-textarea"
                placeholder="Private coaching or pacing notes..."
                rows={2}
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ── Session Structure ──────────────────────────────────────── */}
        <section className="cw-section">
          <h2 className="cw-section__title">Session Structure</h2>

          {steps.length > 0 && (
            <ol className="cw-steps">
              {steps.map((step, idx) => (
                <li key={step.key} className="cw-step">
                  <div className="cw-step__header">
                    <span className="cw-step__num">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="cw-step__type">
                      <select
                        className="cw-select"
                        value={step.stepType}
                        onChange={(e) => updateStep(step.key, { stepType: e.target.value })}
                        aria-label="Step type"
                      >
                        {STEP_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="cw-step__reorder">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => moveStep(step.key, 'up')}
                        disabled={idx === 0}
                        aria-label="Move up"
                      >↑</button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => moveStep(step.key, 'down')}
                        disabled={idx === steps.length - 1}
                        aria-label="Move down"
                      >↓</button>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm cw-step__remove"
                      onClick={() => removeStep(step.key)}
                      aria-label="Remove step"
                    >✕</button>
                  </div>

                  <div className="cw-step__body">
                    <div className="cw-field">
                      <label className="cw-label" htmlFor={`cw-instr-${step.key}`}>Instruction</label>
                      <textarea
                        id={`cw-instr-${step.key}`}
                        className="cw-textarea"
                        placeholder="What to do in this step..."
                        rows={2}
                        value={step.instruction}
                        onChange={(e) => updateStep(step.key, { instruction: e.target.value })}
                      />
                    </div>
                    <div className="cw-step__metrics">
                      <div className="cw-field">
                        <label className="cw-label" htmlFor={`cw-step-dur-${step.key}`}>Duration (min)</label>
                        <input
                          id={`cw-step-dur-${step.key}`}
                          className="cw-input"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="—"
                          value={step.durationMinutes}
                          onChange={(e) => updateStep(step.key, { durationMinutes: e.target.value })}
                        />
                      </div>
                      <div className="cw-field">
                        <label className="cw-label" htmlFor={`cw-step-dist-${step.key}`}>Distance (km)</label>
                        <input
                          id={`cw-step-dist-${step.key}`}
                          className="cw-input"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="—"
                          value={step.distanceKm}
                          onChange={(e) => updateStep(step.key, { distanceKm: e.target.value })}
                        />
                      </div>
                      <div className="cw-field">
                        <label className="cw-label" htmlFor={`cw-step-reps-${step.key}`}>Repetitions</label>
                        <input
                          id={`cw-step-reps-${step.key}`}
                          className="cw-input"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="—"
                          value={step.repetitions}
                          onChange={(e) => updateStep(step.key, { repetitions: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <button type="button" className="btn btn--secondary cw-add-step" onClick={addStep}>
            + Add step
          </button>
        </section>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <p className="cw-error" role="alert">{error}</p>
        )}

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="cw-form__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => navigate('/training-plan')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Workout'}
          </button>
        </div>

      </form>
    </PageShell>
  );
}

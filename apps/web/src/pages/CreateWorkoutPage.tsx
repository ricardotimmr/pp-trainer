import type { FormEvent } from 'react';
import { useState } from 'react';

import type { CreatePlannedWorkoutRequest, CreateWorkoutStepRequest } from '@pp-trainer/shared';

import { createWorkout } from '../api/trainingApi';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { PageShell } from '../layout/PageShell';
import type { PageComponentProps } from '../routes/routeTypes';

/* ─── Option constants ───────────────────────────────────────────────────── */

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

const STEP_TYPE_SHORT: Record<string, string> = {
  warmup: 'WU',
  main: 'M',
  interval: 'INT',
  recovery: 'REC',
  cooldown: 'CD',
  technique: 'TEC',
  strength_exercise: 'STR',
  rest: 'RST',
  other: '—',
};

/* ─── Session item types ─────────────────────────────────────────────────── */

type SubStepDraft = {
  key: string;
  stepType: string;
  instruction: string;
  durationMinutes: string;
  distanceKm: string;
};

type SingleStep = {
  kind: 'step';
  key: string;
  stepType: string;
  instruction: string;
  durationMinutes: string;
  distanceKm: string;
  repetitions: string;
};

type RepeatBlock = {
  kind: 'repeat';
  key: string;
  count: number;
  steps: SubStepDraft[];
};

type SessionItem = SingleStep | RepeatBlock;

/* ─── Factories ──────────────────────────────────────────────────────────── */

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newSingleStep(stepType = 'main'): SingleStep {
  return { kind: 'step', key: uid(), stepType, instruction: '', durationMinutes: '', distanceKm: '', repetitions: '' };
}

function newSubStep(stepType = 'interval'): SubStepDraft {
  return { key: uid(), stepType, instruction: '', durationMinutes: '', distanceKm: '' };
}

function newRepeatBlock(): RepeatBlock {
  return {
    kind: 'repeat',
    key: uid(),
    count: 4,
    steps: [
      newSubStep('interval'),
      newSubStep('recovery'),
    ],
  };
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/* ─── Visual bar helpers ─────────────────────────────────────────────────── */

type BarSeg = { key: string; stepType: string; dur: number };

function computeBarSegs(items: SessionItem[]): BarSeg[] {
  const segs: BarSeg[] = [];
  for (const item of items) {
    if (item.kind === 'step') {
      segs.push({ key: item.key, stepType: item.stepType, dur: parseFloat(item.durationMinutes) || 0 });
    } else {
      const c = Math.max(1, item.count || 1);
      for (let r = 0; r < c; r++) {
        for (const s of item.steps) {
          segs.push({ key: `${item.key}-${r}-${s.key}`, stepType: s.stepType, dur: parseFloat(s.durationMinutes) || 0 });
        }
      }
    }
  }
  return segs;
}

/* ─── Submit payload builder ─────────────────────────────────────────────── */

function buildStepsPayload(items: SessionItem[]): CreateWorkoutStepRequest[] {
  const steps: CreateWorkoutStepRequest[] = [];
  let idx = 0;

  const addStep = (
    stepType: string,
    instruction: string,
    durationMinutes: string,
    distanceKm: string,
    repetitions?: string,
  ) => {
    const step: CreateWorkoutStepRequest = {
      stepIndex: idx++,
      stepType: stepType as CreateWorkoutStepRequest['stepType'],
      instruction: instruction.trim() || '—',
    };
    const dur = parseFloat(durationMinutes);
    if (!isNaN(dur) && dur > 0) step.durationSeconds = Math.round(dur * 60);
    const dist = parseFloat(distanceKm);
    if (!isNaN(dist) && dist > 0) step.distanceMeters = Math.round(dist * 1000);
    if (repetitions !== undefined) {
      const reps = parseInt(repetitions);
      if (!isNaN(reps) && reps > 0) step.repetitions = reps;
    }
    steps.push(step);
  };

  for (const item of items) {
    if (item.kind === 'step') {
      addStep(item.stepType, item.instruction, item.durationMinutes, item.distanceKm, item.repetitions);
    } else {
      const c = Math.max(1, item.count || 1);
      for (let r = 0; r < c; r++) {
        for (const sub of item.steps) {
          addStep(sub.stepType, sub.instruction, sub.durationMinutes, sub.distanceKm);
        }
      }
    }
  }

  return steps;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

type FieldProps = {
  label: string;
  required?: boolean;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
};

function Field({ label, required, htmlFor, className = '', children }: FieldProps) {
  return (
    <div className={`cw-field ${className}`}>
      <label className={`cw-label${required ? ' cw-label--required' : ''}`} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

type SubStepRowProps = {
  step: SubStepDraft;
  index: number;
  total: number;
  onUpdate: (patch: Partial<SubStepDraft>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
};

function SubStepRow({ step, index, total, onUpdate, onRemove, onMove }: SubStepRowProps) {
  return (
    <div className="cw-sub-step">
      <div className="cw-sub-step__header">
        <span className={`cw-step-type-dot cw-step-type-dot--${step.stepType}`} />
        <select
          className="cw-select cw-select--inline"
          value={step.stepType}
          onChange={(e) => onUpdate({ stepType: e.target.value })}
          aria-label="Step type"
        >
          {STEP_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="cw-step-reorder">
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('up')} disabled={index === 0} aria-label="Move up">↑</button>
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('down')} disabled={index === total - 1} aria-label="Move down">↓</button>
        </div>
        <button type="button" className="btn btn--ghost btn--xs cw-remove-btn" onClick={onRemove} aria-label="Remove">✕</button>
      </div>
      <div className="cw-sub-step__body">
        <Field label="Instruction" htmlFor={`instr-${step.key}`}>
          <textarea
            id={`instr-${step.key}`}
            className="cw-textarea cw-textarea--sm"
            placeholder="What to do..."
            rows={1}
            value={step.instruction}
            onChange={(e) => onUpdate({ instruction: e.target.value })}
          />
        </Field>
        <div className="cw-step-metrics">
          <Field label="Duration (min)" htmlFor={`dur-${step.key}`} className="cw-field--metric">
            <input id={`dur-${step.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.5" placeholder="—" value={step.durationMinutes} onChange={(e) => onUpdate({ durationMinutes: e.target.value })} />
          </Field>
          <Field label="Distance (km)" htmlFor={`dist-${step.key}`} className="cw-field--metric">
            <input id={`dist-${step.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.1" placeholder="—" value={step.distanceKm} onChange={(e) => onUpdate({ distanceKm: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

type SingleStepRowProps = {
  item: SingleStep;
  index: number;
  total: number;
  onUpdate: (patch: Partial<SingleStep>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
};

function SingleStepRow({ item, index, total, onUpdate, onRemove, onMove }: SingleStepRowProps) {
  return (
    <div className={`cw-step cw-step--single cw-step--${item.stepType}`}>
      <div className="cw-step__header">
        <span className="cw-step__num">{String(index + 1).padStart(2, '0')}</span>
        <span className={`cw-step-type-dot cw-step-type-dot--${item.stepType}`} />
        <select
          className="cw-select cw-select--inline"
          value={item.stepType}
          onChange={(e) => onUpdate({ stepType: e.target.value })}
          aria-label="Step type"
        >
          {STEP_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="cw-step-reorder">
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('up')} disabled={index === 0} aria-label="Move up">↑</button>
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('down')} disabled={index === total - 1} aria-label="Move down">↓</button>
        </div>
        <button type="button" className="btn btn--ghost btn--xs cw-remove-btn" onClick={onRemove} aria-label="Remove">✕</button>
      </div>
      <div className="cw-step__body">
        <Field label="Instruction" htmlFor={`instr-${item.key}`}>
          <textarea
            id={`instr-${item.key}`}
            className="cw-textarea cw-textarea--sm"
            placeholder="What to do in this step..."
            rows={2}
            value={item.instruction}
            onChange={(e) => onUpdate({ instruction: e.target.value })}
          />
        </Field>
        <div className="cw-step-metrics">
          <Field label="Duration (min)" htmlFor={`dur-${item.key}`} className="cw-field--metric">
            <input id={`dur-${item.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.5" placeholder="—" value={item.durationMinutes} onChange={(e) => onUpdate({ durationMinutes: e.target.value })} />
          </Field>
          <Field label="Distance (km)" htmlFor={`dist-${item.key}`} className="cw-field--metric">
            <input id={`dist-${item.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.1" placeholder="—" value={item.distanceKm} onChange={(e) => onUpdate({ distanceKm: e.target.value })} />
          </Field>
          <Field label="Repetitions" htmlFor={`reps-${item.key}`} className="cw-field--metric">
            <input id={`reps-${item.key}`} className="cw-input cw-input--sm" type="number" min="0" step="1" placeholder="—" value={item.repetitions} onChange={(e) => onUpdate({ repetitions: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  );
}

type RepeatBlockRowProps = {
  item: RepeatBlock;
  index: number;
  total: number;
  onUpdate: (patch: Partial<RepeatBlock>) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
};

function RepeatBlockRow({ item, index, total, onUpdate, onRemove, onMove }: RepeatBlockRowProps) {
  function updateSubStep(key: string, patch: Partial<SubStepDraft>) {
    onUpdate({ steps: item.steps.map((s) => (s.key === key ? { ...s, ...patch } : s)) });
  }

  function removeSubStep(key: string) {
    onUpdate({ steps: item.steps.filter((s) => s.key !== key) });
  }

  function moveSubStep(key: string, dir: 'up' | 'down') {
    const idx = item.steps.findIndex((s) => s.key === key);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= item.steps.length) return;
    const next = [...item.steps];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onUpdate({ steps: next });
  }

  function addSubStep() {
    onUpdate({ steps: [...item.steps, newSubStep('recovery')] });
  }

  return (
    <div className="cw-step cw-step--repeat">
      <div className="cw-step__header cw-step__header--repeat">
        <span className="cw-step__num">{String(index + 1).padStart(2, '0')}</span>
        <span className="cw-repeat-icon" aria-hidden="true">⟳</span>
        <span className="cw-repeat-label">Repeat</span>
        <div className="cw-repeat-count">
          <input
            className="cw-input cw-input--count"
            type="number"
            min="1"
            max="99"
            value={item.count}
            onChange={(e) => onUpdate({ count: Math.max(1, parseInt(e.target.value) || 1) })}
            aria-label="Repeat count"
          />
          <span className="cw-repeat-count__label">×</span>
        </div>
        <div className="cw-step-reorder">
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('up')} disabled={index === 0} aria-label="Move up">↑</button>
          <button type="button" className="btn btn--ghost btn--xs" onClick={() => onMove('down')} disabled={index === total - 1} aria-label="Move down">↓</button>
        </div>
        <button type="button" className="btn btn--ghost btn--xs cw-remove-btn" onClick={onRemove} aria-label="Remove block">✕</button>
      </div>

      <div className="cw-repeat-block__body">
        {item.steps.map((sub, si) => (
          <SubStepRow
            key={sub.key}
            step={sub}
            index={si}
            total={item.steps.length}
            onUpdate={(patch) => updateSubStep(sub.key, patch)}
            onRemove={() => removeSubStep(sub.key)}
            onMove={(dir) => moveSubStep(sub.key, dir)}
          />
        ))}
        <button type="button" className="btn btn--ghost btn--sm cw-add-sub-step" onClick={addSubStep}>
          + Add step to block
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export function CreateWorkoutPage({ navigate }: PageComponentProps) {
  const plansState = useTrainingPlans();

  /* form fields */
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

  /* session */
  const [items, setItems] = useState<SessionItem[]>([]);

  /* submission */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── item mutations ────────────────────────────────────────────────────── */

  function addStep() {
    setItems((prev) => [...prev, newSingleStep(prev.length === 0 ? 'warmup' : 'main')]);
  }

  function addRepeatBlock() {
    setItems((prev) => [...prev, newRepeatBlock()]);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function moveItem(key: string, dir: 'up' | 'down') {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  function updateItem<T extends SessionItem>(key: string, patch: Partial<T>) {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, ...patch } : i)) as SessionItem[],
    );
  }

  /* ── submit ────────────────────────────────────────────────────────────── */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!scheduledDate) { setError('Scheduled date is required.'); return; }

    const payload: CreatePlannedWorkoutRequest = {
      title: title.trim(),
      sport: sport as CreatePlannedWorkoutRequest['sport'],
      workoutType: workoutType as CreatePlannedWorkoutRequest['workoutType'],
      scheduledDate,
      intensity: intensity as CreatePlannedWorkoutRequest['intensity'],
      status: 'planned',
      steps: buildStepsPayload(items),
    };

    if (scheduledStartTime) payload.scheduledStartTime = `${scheduledDate}T${scheduledStartTime}:00`;
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

  /* ── derived ───────────────────────────────────────────────────────────── */

  const plans = plansState.status === 'success' ? plansState.plans : [];
  const barSegs = computeBarSegs(items);
  const totalBarDur = barSegs.reduce((s, seg) => s + seg.dur, 0);

  /* ── render ────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Create Workout"
      eyebrow="Training Plan · New Workout"
      description="Plan a new session — set targets, build structure, assign to a training week."
    >
      <form className="cw-form" onSubmit={handleSubmit} noValidate>

        {/* ── TOP GRID: Basics + Schedule side by side ─────────────────── */}
        <div className="cw-top-grid">

          {/* Basics */}
          <section className="cw-section">
            <h2 className="cw-section__title">Basics</h2>

            <Field label="Title" required htmlFor="cw-title" className="cw-field--full">
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
            </Field>

            <Field label="Sport" required htmlFor="cw-sport">
              <select id="cw-sport" className="cw-select" value={sport} onChange={(e) => setSport(e.target.value)}>
                {SPORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Workout type" required htmlFor="cw-workout-type">
              <select id="cw-workout-type" className="cw-select" value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
                {WORKOUT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>

            <Field label="Intensity" required htmlFor="cw-intensity">
              <select id="cw-intensity" className="cw-select" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                {INTENSITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </section>

          {/* Schedule */}
          <section className="cw-section">
            <h2 className="cw-section__title">Schedule</h2>

            <div className="cw-row">
              <Field label="Date" required htmlFor="cw-date" className="cw-field--2">
                <input id="cw-date" className="cw-input" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
              </Field>
              <Field label="Start time" htmlFor="cw-start-time" className="cw-field--1">
                <input id="cw-start-time" className="cw-input" type="time" value={scheduledStartTime} onChange={(e) => setScheduledStartTime(e.target.value)} />
              </Field>
            </div>

            <div className="cw-row">
              <Field label="Duration (min)" htmlFor="cw-duration" className="cw-field--1">
                <input id="cw-duration" className="cw-input" type="number" min="0" step="1" placeholder="e.g. 60" value={plannedDurationMinutes} onChange={(e) => setPlannedDurationMinutes(e.target.value)} />
              </Field>
              <Field label="Distance (km)" htmlFor="cw-distance" className="cw-field--1">
                <input id="cw-distance" className="cw-input" type="number" min="0" step="0.1" placeholder="e.g. 10" value={plannedDistanceKm} onChange={(e) => setPlannedDistanceKm(e.target.value)} />
              </Field>
            </div>

            <Field label="Training plan" htmlFor="cw-plan" className="cw-field--full">
              <select id="cw-plan" className="cw-select" value={trainingPlanId} onChange={(e) => setTrainingPlanId(e.target.value)}>
                <option value="">None — standalone workout</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
          </section>

        </div>

        {/* ── SESSION STRUCTURE ─────────────────────────────────────────── */}
        <section className="cw-section cw-section--session">
          <h2 className="cw-section__title">Session Structure</h2>

          {/* Visual bar */}
          {barSegs.length > 0 && (
            <div className="cw-session-bar" aria-hidden="true">
              {barSegs.map((seg) => (
                <div
                  key={seg.key}
                  className={`cw-session-bar__seg session-bar__segment--${seg.stepType}`}
                  style={{ flex: totalBarDur > 0 ? Math.max(seg.dur, totalBarDur * 0.025) : 1 }}
                  title={`${STEP_TYPE_SHORT[seg.stepType] ?? seg.stepType}${seg.dur > 0 ? ` · ${seg.dur} min` : ''}`}
                >
                  <span className="cw-session-bar__label">
                    {STEP_TYPE_SHORT[seg.stepType] ?? '?'}
                    {seg.dur > 0 && <span className="cw-session-bar__dur">{seg.dur}′</span>}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Step list */}
          {items.length > 0 && (
            <div className="cw-session-list">
              {items.map((item, idx) =>
                item.kind === 'step' ? (
                  <SingleStepRow
                    key={item.key}
                    item={item}
                    index={idx}
                    total={items.length}
                    onUpdate={(patch) => updateItem<SingleStep>(item.key, patch)}
                    onRemove={() => removeItem(item.key)}
                    onMove={(dir) => moveItem(item.key, dir)}
                  />
                ) : (
                  <RepeatBlockRow
                    key={item.key}
                    item={item}
                    index={idx}
                    total={items.length}
                    onUpdate={(patch) => updateItem<RepeatBlock>(item.key, patch)}
                    onRemove={() => removeItem(item.key)}
                    onMove={(dir) => moveItem(item.key, dir)}
                  />
                ),
              )}
            </div>
          )}

          {/* Add actions */}
          <div className="cw-session-actions">
            <button type="button" className="btn btn--secondary" onClick={addStep}>
              + Add step
            </button>
            <button type="button" className="btn btn--secondary" onClick={addRepeatBlock}>
              ⟳ Add repeat block
            </button>
          </div>
        </section>

        {/* ── GOAL & NOTES ──────────────────────────────────────────────── */}
        <section className="cw-section">
          <h2 className="cw-section__title">Goal &amp; Notes</h2>

          <Field label="Objective" htmlFor="cw-objective" className="cw-field--full">
            <input id="cw-objective" className="cw-input" type="text" placeholder="What is the goal of this session?" value={objective} onChange={(e) => setObjective(e.target.value)} />
          </Field>

          <Field label="Description" htmlFor="cw-description" className="cw-field--full">
            <textarea id="cw-description" className="cw-textarea" placeholder="Additional workout notes..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Field label="Coach notes" htmlFor="cw-coach-notes" className="cw-field--full">
            <textarea id="cw-coach-notes" className="cw-textarea" placeholder="Private pacing or coaching notes..." rows={2} value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} />
          </Field>
        </section>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && <p className="cw-error" role="alert">{error}</p>}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="cw-form__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/training-plan')} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Workout'}
          </button>
        </div>

      </form>
    </PageShell>
  );
}

import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { CreatePlannedWorkoutRequest, CreateWorkoutStepRequest } from '@pp-trainer/shared';

import { createWorkout } from '../api/trainingApi';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
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
  targetFrom: string;
  targetTo: string;
  repetitions: string;
};

type SingleStep = {
  kind: 'step';
  key: string;
  stepType: string;
  instruction: string;
  durationMinutes: string;
  distanceKm: string;
  repetitions: string;
  targetFrom: string;
  targetTo: string;
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
  return { kind: 'step', key: uid(), stepType, instruction: '', durationMinutes: '', distanceKm: '', repetitions: '', targetFrom: '', targetTo: '' };
}

function newSubStep(stepType = 'interval'): SubStepDraft {
  return { key: uid(), stepType, instruction: '', durationMinutes: '', distanceKm: '', targetFrom: '', targetTo: '', repetitions: '' };
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

function defaultItems(): SessionItem[] {
  return [
    newSingleStep('warmup'),
    newSingleStep('main'),
    newSingleStep('cooldown'),
  ];
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

function parsePaceToSec(pace: string): number | null {
  const m = pace.trim().match(/^(\d+):(\d{2})$/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

function buildStepsPayload(items: SessionItem[], sport: string): CreateWorkoutStepRequest[] {
  const steps: CreateWorkoutStepRequest[] = [];
  let idx = 0;

  const addStep = (
    stepType: string,
    instruction: string,
    durationMinutes: string,
    distanceKm: string,
    repetitions?: string,
    targetFrom?: string,
    targetTo?: string,
  ) => {
    const step: CreateWorkoutStepRequest = {
      stepIndex: idx++,
      stepType: stepType as CreateWorkoutStepRequest['stepType'],
      instruction: instruction.trim(),
    };
    const dur = parseFloat(durationMinutes);
    if (!isNaN(dur) && dur > 0) step.durationSeconds = Math.round(dur * 60);
    const dist = parseFloat(distanceKm);
    if (!isNaN(dist) && dist > 0) step.distanceMeters = Math.round(dist * 1000);
    if (repetitions !== undefined) {
      const reps = parseInt(repetitions);
      if (!isNaN(reps) && reps > 0) step.repetitions = reps;
    }

    if (sport === 'running') {
      const lo = targetFrom ? parsePaceToSec(targetFrom) : null;
      const hi = targetTo ? parsePaceToSec(targetTo) : null;
      if (lo !== null) step.targetPaceLowerSecPerKm = lo;
      if (hi !== null) step.targetPaceUpperSecPerKm = hi;
    } else if (sport === 'swimming') {
      const lo = targetFrom ? parsePaceToSec(targetFrom) : null;
      const hi = targetTo ? parsePaceToSec(targetTo) : null;
      if (lo !== null) step.targetSwimPaceLowerSecPer100m = lo;
      if (hi !== null) step.targetSwimPaceUpperSecPer100m = hi;
    } else if (sport === 'cycling') {
      const lo = parseInt(targetFrom ?? '');
      const hi = parseInt(targetTo ?? '');
      if (!isNaN(lo) && lo > 0) step.targetPowerLowerWatts = lo;
      if (!isNaN(hi) && hi > 0) step.targetPowerUpperWatts = hi;
    }

    steps.push(step);
  };

  for (const item of items) {
    if (item.kind === 'step') {
      addStep(item.stepType, item.instruction, item.durationMinutes, item.distanceKm, item.repetitions, item.targetFrom, item.targetTo);
    } else {
      const c = Math.max(1, item.count || 1);
      for (let r = 0; r < c; r++) {
        for (const sub of item.steps) {
          addStep(sub.stepType, sub.instruction, sub.durationMinutes, sub.distanceKm, sub.repetitions, sub.targetFrom, sub.targetTo);
        }
      }
    }
  }

  return steps;
}

/* ─── Sport-specific intensity helpers ───────────────────────────────────── */

type SportIntensityConfig =
  | { type: 'pace'; unit: string; placeholder: string }
  | { type: 'power' }
  | { type: 'reps' };

function getSportIntensityConfig(sport: string): SportIntensityConfig | null {
  if (sport === 'running') return { type: 'pace', unit: '/km', placeholder: '4:00' };
  if (sport === 'swimming') return { type: 'pace', unit: '/100m', placeholder: '1:45' };
  if (sport === 'cycling') return { type: 'power' };
  if (sport === 'strength' || sport === 'mobility' || sport === 'other') return { type: 'reps' };
  return null;
}

function formatCardIntensity(
  item: { targetFrom: string; targetTo: string; repetitions: string },
  sport: string,
): string | null {
  const cfg = getSportIntensityConfig(sport);
  if (!cfg) return null;
  if (cfg.type === 'pace') {
    if (item.targetFrom && item.targetTo) return `${item.targetFrom} – ${item.targetTo} ${cfg.unit}`;
    if (item.targetFrom) return `${item.targetFrom} ${cfg.unit}`;
  } else if (cfg.type === 'power') {
    if (item.targetFrom && item.targetTo) return `${item.targetFrom} – ${item.targetTo} W`;
    if (item.targetFrom) return `${item.targetFrom} W`;
  } else if (cfg.type === 'reps') {
    if (item.repetitions) return `${item.repetitions} reps`;
  }
  return null;
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

type SelectMenuOption = { value: string; label: string };

type SelectMenuProps = {
  id?: string;
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (value: string) => void;
  className?: string;
  'aria-label'?: string;
};

function SelectMenu({ id, value, options, onChange, className, 'aria-label': ariaLabel }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`cw-sm${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`cw-sm__trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {selected?.label ?? value}
      </button>
      <div
        className={`cw-sm__menu${open ? ' is-open' : ''}`}
        role="menu"
        aria-hidden={!open}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="menuitem"
            className={opt.value === value ? 'is-selected' : undefined}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

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

function StepCard({ item, sport, onEdit, onRemove }: { item: SingleStep; sport: string; onEdit: () => void; onRemove: () => void }) {
  const typeLabel = STEP_TYPE_OPTIONS.find((o) => o.value === item.stepType)?.label ?? item.stepType;
  const dur = parseFloat(item.durationMinutes);
  const dist = parseFloat(item.distanceKm);
  const hasDur = !isNaN(dur) && dur > 0;
  const hasDist = !isNaN(dist) && dist > 0;
  const intensityLabel = formatCardIntensity(item, sport);

  return (
    <div
      className={`cw-card cw-card--step cw-card--${item.stepType}`}
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => e.key === 'Enter' && onEdit()}
    >
      <span className={`cw-card__dot cw-step-type-dot--${item.stepType}`} />
      <span className="cw-card__type">{typeLabel}</span>
      {intensityLabel && <span className="cw-card__intensity">{intensityLabel}</span>}
      <span className="cw-card__metrics">
        {hasDur ? `${dur} min` : '—'}
        {hasDist ? ` · ${dist} km` : ''}
      </span>
      {item.instruction && <span className="cw-card__instr">{item.instruction}</span>}
      <button
        type="button"
        className="cw-card__remove"
        aria-label="Remove step"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >✕</button>
    </div>
  );
}

function RepeatBlockCard({ item, onEdit, onRemove }: { item: RepeatBlock; onEdit: () => void; onRemove: () => void }) {
  const totalDur = item.steps.reduce((s, sub) => s + (parseFloat(sub.durationMinutes) || 0), 0) * item.count;

  return (
    <div
      className="cw-card cw-card--repeat"
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => e.key === 'Enter' && onEdit()}
    >
      <span className="cw-card__repeat-badge">⟳ {item.count}×</span>
      <div className="cw-card__dots">
        {item.steps.map((s) => (
          <span
            key={s.key}
            className={`cw-step-type-dot cw-step-type-dot--${s.stepType}`}
            title={STEP_TYPE_OPTIONS.find((o) => o.value === s.stepType)?.label}
          />
        ))}
      </div>
      <div className="cw-card__sub-labels">
        {item.steps.map((s) => (
          <span key={s.key} className="cw-card__sub-label">{STEP_TYPE_SHORT[s.stepType] ?? '?'}</span>
        ))}
      </div>
      {totalDur > 0 && <span className="cw-card__metrics">{totalDur} min</span>}
      <button
        type="button"
        className="cw-card__remove"
        aria-label="Remove block"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >✕</button>
    </div>
  );
}

function IntensityFields({ cfg, idPrefix, item, onChange }: {
  cfg: SportIntensityConfig;
  idPrefix: string;
  item: { targetFrom: string; targetTo: string; repetitions: string };
  onChange: (patch: Partial<Pick<SubStepDraft, 'targetFrom' | 'targetTo' | 'repetitions'>>) => void;
}) {
  if (cfg.type === 'pace') return (
    <div className="cw-row">
      <Field label={`From (${cfg.unit})`} htmlFor={`${idPrefix}-pf`} className="cw-field--1">
        <input id={`${idPrefix}-pf`} className="cw-input" type="text" placeholder={cfg.placeholder} value={item.targetFrom} onChange={(e) => onChange({ targetFrom: e.target.value })} />
      </Field>
      <Field label={`To (${cfg.unit})`} htmlFor={`${idPrefix}-pt`} className="cw-field--1">
        <input id={`${idPrefix}-pt`} className="cw-input" type="text" placeholder={cfg.placeholder} value={item.targetTo} onChange={(e) => onChange({ targetTo: e.target.value })} />
      </Field>
    </div>
  );
  if (cfg.type === 'power') return (
    <div className="cw-row">
      <Field label="Watts from" htmlFor={`${idPrefix}-wf`} className="cw-field--1">
        <input id={`${idPrefix}-wf`} className="cw-input" type="number" min="0" placeholder="250" value={item.targetFrom} onChange={(e) => onChange({ targetFrom: e.target.value })} />
      </Field>
      <Field label="Watts to" htmlFor={`${idPrefix}-wt`} className="cw-field--1">
        <input id={`${idPrefix}-wt`} className="cw-input" type="number" min="0" placeholder="300" value={item.targetTo} onChange={(e) => onChange({ targetTo: e.target.value })} />
      </Field>
    </div>
  );
  return (
    <Field label="Exercise reps" htmlFor={`${idPrefix}-er`}>
      <input id={`${idPrefix}-er`} className="cw-input" type="number" min="0" step="1" placeholder="e.g. 12" value={item.repetitions} onChange={(e) => onChange({ repetitions: e.target.value })} />
    </Field>
  );
}

function useModalEscape(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
}

function StepEditModal({ item, sport, onUpdate, onClose }: { item: SingleStep; sport: string; onUpdate: (p: Partial<SingleStep>) => void; onClose: () => void }) {
  useModalEscape(onClose);
  const typeLabel = STEP_TYPE_OPTIONS.find((o) => o.value === item.stepType)?.label ?? item.stepType;
  const intensityCfg = getSportIntensityConfig(sport);

  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onClose}>
      <div className="cw-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <span className={`cw-step-type-dot cw-step-type-dot--${item.stepType}`} />
          <h3>{typeLabel}</h3>
          <button type="button" className="cw-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cw-modal__body">
          <Field label="Type" htmlFor={`mt-${item.key}`}>
            <SelectMenu id={`mt-${item.key}`} value={item.stepType} options={STEP_TYPE_OPTIONS} onChange={(v) => onUpdate({ stepType: v })} />
          </Field>
          {intensityCfg && (
            <IntensityFields cfg={intensityCfg} idPrefix={item.key} item={item} onChange={(p) => onUpdate(p as Partial<SingleStep>)} />
          )}
          <Field label="Instruction" htmlFor={`mi-${item.key}`} className="cw-field--full">
            <textarea id={`mi-${item.key}`} className="cw-textarea" placeholder="What to do in this step..." rows={3} value={item.instruction} onChange={(e) => onUpdate({ instruction: e.target.value })} />
          </Field>
          <div className="cw-row">
            <Field label="Duration (min)" htmlFor={`md-${item.key}`} className="cw-field--1">
              <input id={`md-${item.key}`} className="cw-input" type="number" min="0" step="0.5" placeholder="—" value={item.durationMinutes} onChange={(e) => onUpdate({ durationMinutes: e.target.value })} />
            </Field>
            <Field label="Distance (km)" htmlFor={`mdi-${item.key}`} className="cw-field--1">
              <input id={`mdi-${item.key}`} className="cw-input" type="number" min="0" step="0.1" placeholder="—" value={item.distanceKm} onChange={(e) => onUpdate({ distanceKm: e.target.value })} />
            </Field>
            {intensityCfg?.type !== 'reps' && (
              <Field label="Repetitions" htmlFor={`mr-${item.key}`} className="cw-field--1">
                <input id={`mr-${item.key}`} className="cw-input" type="number" min="0" step="1" placeholder="—" value={item.repetitions} onChange={(e) => onUpdate({ repetitions: e.target.value })} />
              </Field>
            )}
          </div>
        </div>
        <div className="cw-modal__footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RepeatBlockEditModal({ item, sport, onUpdate, onClose }: { item: RepeatBlock; sport: string; onUpdate: (p: Partial<RepeatBlock>) => void; onClose: () => void }) {
  useModalEscape(onClose);
  const intensityCfg = getSportIntensityConfig(sport);

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

  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onClose}>
      <div className="cw-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <span className="cw-card__repeat-badge" style={{ fontSize: '1rem' }}>⟳</span>
          <h3>Repeat Block</h3>
          <button type="button" className="cw-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cw-modal__body">
          <div className="cw-modal__repeat-count">
            <label className="cw-label" htmlFor="mrc">Repeat</label>
            <input id="mrc" className="cw-input cw-input--count" type="number" min="1" max="99" value={item.count} onChange={(e) => onUpdate({ count: Math.max(1, parseInt(e.target.value) || 1) })} />
            <span className="cw-modal__repeat-unit">times</span>
          </div>

          <div className="cw-modal__sub-steps">
            {item.steps.map((sub, si) => (
              <div key={sub.key} className="cw-modal__sub-step">
                <div className="cw-modal__sub-step-header">
                  <span className={`cw-step-type-dot cw-step-type-dot--${sub.stepType}`} />
                  <SelectMenu value={sub.stepType} options={STEP_TYPE_OPTIONS} onChange={(v) => updateSubStep(sub.key, { stepType: v })} className="cw-sm--inline" aria-label="Step type" />
                  <div className="cw-step-reorder">
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => moveSubStep(sub.key, 'up')} disabled={si === 0} aria-label="Move up">↑</button>
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => moveSubStep(sub.key, 'down')} disabled={si === item.steps.length - 1} aria-label="Move down">↓</button>
                  </div>
                  <button type="button" className="btn btn--ghost btn--xs" onClick={() => removeSubStep(sub.key)} aria-label="Remove">✕</button>
                </div>
                {intensityCfg && (
                  <IntensityFields cfg={intensityCfg} idPrefix={sub.key} item={sub} onChange={(p) => updateSubStep(sub.key, p)} />
                )}
                <textarea className="cw-textarea cw-textarea--sm" placeholder="Instruction..." rows={1} value={sub.instruction} onChange={(e) => updateSubStep(sub.key, { instruction: e.target.value })} />
                <div className="cw-row">
                  <Field label="Duration (min)" htmlFor={`sd-${sub.key}`} className="cw-field--1">
                    <input id={`sd-${sub.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.5" placeholder="—" value={sub.durationMinutes} onChange={(e) => updateSubStep(sub.key, { durationMinutes: e.target.value })} />
                  </Field>
                  <Field label="Distance (km)" htmlFor={`sdi-${sub.key}`} className="cw-field--1">
                    <input id={`sdi-${sub.key}`} className="cw-input cw-input--sm" type="number" min="0" step="0.1" placeholder="—" value={sub.distanceKm} onChange={(e) => updateSubStep(sub.key, { distanceKm: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onUpdate({ steps: [...item.steps, newSubStep('recovery')] })}>
            + Add step to block
          </button>
        </div>
        <div className="cw-modal__footer">
          <button type="button" className="btn btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export function CreateWorkoutPage({ navigate }: PageComponentProps) {
  const plansState = useTrainingPlans();
  const { refresh: refreshWeekPlan } = useCurrentWeekPlan();

  /* form fields */
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState<string>('');
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
  const [items, setItems] = useState<SessionItem[]>(defaultItems);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  /* submission */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── item mutations ────────────────────────────────────────────────────── */

  function addStep() {
    const step = newSingleStep('main');
    setItems((prev) => [...prev, step]);
    setEditingKey(step.key);
  }

  function addRepeatBlock() {
    const block = newRepeatBlock();
    setItems((prev) => [...prev, block]);
    setEditingKey(block.key);
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
    setEditingKey((cur) => (cur === key ? null : cur));
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

    const stepsPayload = buildStepsPayload(items, sport);
    if (stepsPayload.some((s) => !s.instruction)) {
      setError('Each step needs an instruction. Click the step card to add one.');
      return;
    }

    const payload: CreatePlannedWorkoutRequest = {
      title: title.trim(),
      sport: sport as CreatePlannedWorkoutRequest['sport'],
      workoutType: workoutType as CreatePlannedWorkoutRequest['workoutType'],
      scheduledDate,
      intensity: intensity as CreatePlannedWorkoutRequest['intensity'],
      status: 'planned',
      steps: stepsPayload,
    };

    if (scheduledStartTime) payload.scheduledStartTime = `${scheduledDate}T${scheduledStartTime}:00Z`;
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
      refreshWeekPlan();
      navigate(`/workouts/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout.');
      setSubmitting(false);
    }
  }

  /* ── derived ───────────────────────────────────────────────────────────── */

  const isLocked = !sport;
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

        {/* ── SPORT PICKER ──────────────────────────────────────────────── */}
        <div className="cw-sport-row">
          <div className="cw-sport-row__head">
            <span className="cw-sport-row__title">Select a sport</span>
            {!sport && <span className="cw-sport-row__hint">Choose a sport to unlock the form below</span>}
          </div>
          <div className="cw-sport-pills">
            {SPORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`badge badge--sport badge--sport-${o.value} cw-sport-pill${sport === o.value ? ' is-selected' : ''}`}
                onClick={() => setSport(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`cw-form__body${isLocked ? ' cw-form__body--locked' : ''}`}>

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

          {/* Cards grid */}
          <div className="cw-cards">
            {items.map((item) =>
              item.kind === 'step' ? (
                <StepCard
                  key={item.key}
                  item={item}
                  sport={sport}
                  onEdit={() => setEditingKey(item.key)}
                  onRemove={() => removeItem(item.key)}
                />
              ) : (
                <RepeatBlockCard
                  key={item.key}
                  item={item}
                  onEdit={() => setEditingKey(item.key)}
                  onRemove={() => removeItem(item.key)}
                />
              )
            )}
          </div>

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

            <Field label="Workout type" required htmlFor="cw-workout-type">
              <SelectMenu id="cw-workout-type" value={workoutType} options={WORKOUT_TYPE_OPTIONS} onChange={setWorkoutType} />
            </Field>

            <Field label="Intensity" required htmlFor="cw-intensity">
              <SelectMenu id="cw-intensity" value={intensity} options={INTENSITY_OPTIONS} onChange={setIntensity} />
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
              <SelectMenu
                id="cw-plan"
                value={trainingPlanId}
                options={[{ value: '', label: 'None — standalone workout' }, ...plans.map((p) => ({ value: p.id, label: p.title }))]}
                onChange={setTrainingPlanId}
              />
            </Field>
          </section>

        </div>

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

        </div>{/* end cw-form__body */}
      </form>

      {/* ── Step / Repeat-Block edit modal (portal → renders over full page) ── */}
      {editingKey && (() => {
        const item = items.find((i) => i.key === editingKey);
        if (!item) return null;
        const onClose = () => setEditingKey(null);
        return item.kind === 'step'
          ? <StepEditModal item={item} sport={sport} onUpdate={(p) => updateItem<SingleStep>(editingKey, p)} onClose={onClose} />
          : <RepeatBlockEditModal item={item} sport={sport} onUpdate={(p) => updateItem<RepeatBlock>(editingKey, p)} onClose={onClose} />;
      })()}
    </PageShell>
  );
}

import { useEffect, useRef, useState } from 'react';

import type {
  CreateGoalInput,
  GoalPriorityDto,
  SportTypeDto,
  TrainingGoalDto,
  TrainingGoalTypeDto,
  UpdateGoalInput,
} from '@pp-trainer/shared';

import { createGoal, updateGoal } from '../api/athleteApi';
import { SelectMenu } from './SelectMenu';

// ── helpers ───────────────────────────────────────────────────────────────────

const GOAL_TYPE_OPTIONS = [
  { value: 'race', label: 'Race' },
  { value: 'performance', label: 'Performance' },
  { value: 'volume', label: 'Volume' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'general', label: 'General' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'main_goal', label: 'Main goal' },
  { value: 'secondary_goal', label: 'Secondary goal' },
  { value: 'watchlist', label: 'Watchlist' },
] as const;

const SPORT_OPTIONS = [
  { value: '', label: 'No specific sport' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'running', label: 'Running' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'strength', label: 'Strength' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'other', label: 'Other' },
] as const;

function parsePaceInput(value: string): number | undefined {
  const match = /^(\d+):(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function secondsToPaceString(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

type GoalFormState = {
  title: string;
  goalType: TrainingGoalTypeDto;
  priority: GoalPriorityDto;
  sport: string;
  targetDate: string;
  targetDistanceKm: string;
  targetDurationHhMmSs: string;
  targetPacePerKm: string;
  targetPowerWatts: string;
  targetSwimPacePer100m: string;
  description: string;
};

function emptyForm(): GoalFormState {
  return {
    title: '',
    goalType: 'race',
    priority: 'main_goal',
    sport: '',
    targetDate: '',
    targetDistanceKm: '',
    targetDurationHhMmSs: '',
    targetPacePerKm: '',
    targetPowerWatts: '',
    targetSwimPacePer100m: '',
    description: '',
  };
}

function goalToForm(goal: TrainingGoalDto): GoalFormState {
  return {
    title: goal.title,
    goalType: goal.goalType,
    priority: goal.priority,
    sport: goal.sport ?? '',
    targetDate: goal.targetDate ?? '',
    targetDistanceKm: goal.targetDistanceMeters
      ? (goal.targetDistanceMeters / 1000).toFixed(1)
      : '',
    targetDurationHhMmSs: goal.targetDurationSeconds
      ? (() => {
          const h = Math.floor(goal.targetDurationSeconds / 3600);
          const m = Math.floor((goal.targetDurationSeconds % 3600) / 60);
          const s = goal.targetDurationSeconds % 60;
          return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        })()
      : '',
    targetPacePerKm: goal.targetPaceSecPerKm
      ? secondsToPaceString(goal.targetPaceSecPerKm)
      : '',
    targetPowerWatts: goal.targetPowerWatts ? String(goal.targetPowerWatts) : '',
    targetSwimPacePer100m: goal.targetSwimPaceSecPer100m
      ? secondsToPaceString(goal.targetSwimPaceSecPer100m)
      : '',
    description: goal.description ?? '',
  };
}

function formToInput(form: GoalFormState): CreateGoalInput {
  const parseDuration = (v: string): number | undefined => {
    const m = /^(\d+):(\d{2}):(\d{2})$/.exec(v.trim());
    if (!m) return undefined;
    return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  };

  return {
    title: form.title.trim(),
    goalType: form.goalType,
    priority: form.priority,
    ...(form.sport && { sport: form.sport as SportTypeDto }),
    ...(form.targetDate && { targetDate: form.targetDate }),
    ...(form.targetDistanceKm && {
      targetDistanceMeters: Math.round(parseFloat(form.targetDistanceKm) * 1000),
    }),
    ...(form.targetDurationHhMmSs && { targetDurationSeconds: parseDuration(form.targetDurationHhMmSs) }),
    ...(form.targetPacePerKm && { targetPaceSecPerKm: parsePaceInput(form.targetPacePerKm) }),
    ...(form.targetPowerWatts && { targetPowerWatts: parseInt(form.targetPowerWatts, 10) }),
    ...(form.targetSwimPacePer100m && { targetSwimPaceSecPer100m: parsePaceInput(form.targetSwimPacePer100m) }),
    ...(form.description.trim() && { description: form.description.trim() }),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

type Props = {
  mode: 'create';
  onSave: (goal: TrainingGoalDto) => void;
  onClose: () => void;
} | {
  mode: 'edit';
  goal: TrainingGoalDto;
  onSave: (goal: TrainingGoalDto) => void;
  onClose: () => void;
};

export function GoalFormModal(props: Props) {
  const { mode, onSave, onClose } = props;
  const initialValues = mode === 'edit' ? goalToForm(props.goal) : emptyForm();
  const [form, setForm] = useState<GoalFormState>(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const set = (key: keyof GoalFormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Goal title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = formToInput(form);
      const saved =
        mode === 'edit'
          ? await updateGoal(props.goal.id, input as UpdateGoalInput)
          : await createGoal(input);
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cw-modal-overlay" role="dialog" aria-modal="true" aria-label={mode === 'create' ? 'Add goal' : 'Edit goal'}>
      <div className="cw-modal goal-modal">
        <div className="cw-modal__header">
          <h2 className="cw-modal__title">{mode === 'create' ? 'Add goal' : 'Edit goal'}</h2>
          <button
            type="button"
            className="cw-modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="cw-modal__body" onSubmit={handleSubmit} noValidate>
          <div className="goal-modal__field">
            <label className="goal-modal__label" htmlFor="goal-title">
              Title <span aria-hidden="true">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="goal-title"
              type="text"
              className="cw-input"
              placeholder="e.g. Olympic Triathlon 2026"
              value={form.title}
              onChange={(e) => set('title')(e.target.value)}
              required
            />
          </div>

          <div className="goal-modal__row">
            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-type">
                Goal type
              </label>
              <SelectMenu
                id="goal-type"
                value={form.goalType}
                options={GOAL_TYPE_OPTIONS}
                onChange={set('goalType')}
                aria-label="Goal type"
              />
            </div>

            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-priority">
                Priority
              </label>
              <SelectMenu
                id="goal-priority"
                value={form.priority}
                options={PRIORITY_OPTIONS}
                onChange={set('priority')}
                aria-label="Priority"
              />
            </div>
          </div>

          <div className="goal-modal__row">
            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-sport">
                Sport
              </label>
              <SelectMenu
                id="goal-sport"
                value={form.sport}
                options={SPORT_OPTIONS}
                onChange={set('sport')}
                aria-label="Sport"
              />
            </div>

            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-date">
                Target date
              </label>
              <input
                id="goal-date"
                type="date"
                className="cw-input"
                value={form.targetDate}
                onChange={(e) => set('targetDate')(e.target.value)}
              />
            </div>
          </div>

          <div className="goal-modal__row">
            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-distance">
                Distance (km)
              </label>
              <input
                id="goal-distance"
                type="number"
                className="cw-input"
                placeholder="e.g. 40"
                min="0"
                step="0.1"
                value={form.targetDistanceKm}
                onChange={(e) => set('targetDistanceKm')(e.target.value)}
              />
            </div>

            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-duration">
                Duration (h:mm:ss)
              </label>
              <input
                id="goal-duration"
                type="text"
                className="cw-input"
                placeholder="e.g. 2:15:00"
                value={form.targetDurationHhMmSs}
                onChange={(e) => set('targetDurationHhMmSs')(e.target.value)}
              />
            </div>
          </div>

          <div className="goal-modal__row">
            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-pace">
                Run pace (/km)
              </label>
              <input
                id="goal-pace"
                type="text"
                className="cw-input"
                placeholder="e.g. 4:30"
                value={form.targetPacePerKm}
                onChange={(e) => set('targetPacePerKm')(e.target.value)}
              />
            </div>

            <div className="goal-modal__field">
              <label className="goal-modal__label" htmlFor="goal-power">
                Bike power (W)
              </label>
              <input
                id="goal-power"
                type="number"
                className="cw-input"
                placeholder="e.g. 300"
                min="0"
                value={form.targetPowerWatts}
                onChange={(e) => set('targetPowerWatts')(e.target.value)}
              />
            </div>
          </div>

          <div className="goal-modal__field">
            <label className="goal-modal__label" htmlFor="goal-swim-pace">
              Swim pace (/100m)
            </label>
            <input
              id="goal-swim-pace"
              type="text"
              className="cw-input"
              placeholder="e.g. 1:45"
              value={form.targetSwimPacePer100m}
              onChange={(e) => set('targetSwimPacePer100m')(e.target.value)}
            />
          </div>

          <div className="goal-modal__field">
            <label className="goal-modal__label" htmlFor="goal-description">
              Description
            </label>
            <textarea
              id="goal-description"
              className="cw-textarea"
              placeholder="What does achieving this goal mean to you?"
              rows={3}
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
            />
          </div>

          {error && <p className="goal-modal__error">{error}</p>}

          <div className="cw-modal__footer">
            <button
              type="button"
              className="button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="button--primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add goal' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

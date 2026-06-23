import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  CreateTrainingPlanRequest,
  PlannedWorkoutDto,
  TrainingPlanDto,
  TrainingPlanSummaryDto,
  UpdateTrainingPlanRequest,
} from '@pp-trainer/shared';

import { EmptyState, ErrorState, LoadingState, WorkoutCard } from '../components';
import type { WorkoutCardData } from '../components';
import { SportBadge } from '../components';
import { WorkoutStatusBadge } from '../components/badges/WorkoutStatusBadge';
import { formatDate, formatDuration } from '../components/prototypeFormatters';
import {
  createTrainingPlan,
  deleteTrainingPlan,
  deleteWorkout,
  fetchTrainingPlanById,
  updateTrainingPlan,
  updateWorkout,
} from '../api/trainingApi';
import { DATA_MODE } from '../config/dataMode';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { useWorkouts } from '../hooks/useWorkouts';
import { PageShell } from '../layout/PageShell';
import {
  getCurrentTrainingPlan,
  getPlannedWorkouts,
  getWeeklySummary,
} from '../mock/prototypeData.helpers';
import type { PlannedWorkout } from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';

const TODAY = new Date().toISOString().split('T')[0];

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

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

function formatDayHeader(dateStr: string): { weekday: string; date: string } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat('en', { weekday: 'long' }).format(d),
    date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d),
  };
}

function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const s = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start);
  const e = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(end);
  return `${s} – ${e}`;
}

/* ── Plan status badge ───────────────────────────────────────────────────── */

type TrainingPlanStatus = TrainingPlanSummaryDto['status'];

const planStatusLabels: Record<TrainingPlanStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

function TrainingPlanStatusBadge({ status }: { status: TrainingPlanStatus }) {
  return (
    <span className={`badge badge--plan-status badge--plan-status-${status}`}>
      {planStatusLabels[status]}
    </span>
  );
}

/* ── Shared plan form fields (used by Create + Edit modals) ─────────────── */

type PlanFormFields = {
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  status: TrainingPlanStatus;
};

type PlanFormProps = {
  fields: PlanFormFields;
  onChange: (f: PlanFormFields) => void;
  disabled: boolean;
  idPrefix: string;
  showStatus?: boolean;
};

const PLAN_STATUS_OPTIONS: TrainingPlanStatus[] = ['draft', 'active', 'completed', 'archived'];

function PlanForm({ fields, onChange, disabled, idPrefix, showStatus = true }: PlanFormProps) {
  return (
    <>
      <div className="cw-field cw-field--full">
        <label className="cw-label cw-label--required" htmlFor={`${idPrefix}-title`}>Title</label>
        <input
          id={`${idPrefix}-title`}
          className="cw-input"
          type="text"
          value={fields.title}
          onChange={(e) => onChange({ ...fields, title: e.target.value })}
          placeholder="e.g. Week 26 Base Training"
          disabled={disabled}
        />
      </div>
      <div className="cw-field cw-field--1">
        <label className="cw-label cw-label--required" htmlFor={`${idPrefix}-start`}>Start date</label>
        <input
          id={`${idPrefix}-start`}
          className="cw-input"
          type="date"
          value={fields.startDate}
          onChange={(e) => onChange({ ...fields, startDate: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="cw-field cw-field--1">
        <label className="cw-label cw-label--required" htmlFor={`${idPrefix}-end`}>End date</label>
        <input
          id={`${idPrefix}-end`}
          className="cw-input"
          type="date"
          value={fields.endDate}
          min={fields.startDate}
          onChange={(e) => onChange({ ...fields, endDate: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="cw-field cw-field--full">
        <label className="cw-label" htmlFor={`${idPrefix}-desc`}>Description</label>
        <textarea
          id={`${idPrefix}-desc`}
          className="cw-input"
          rows={2}
          value={fields.description}
          onChange={(e) => onChange({ ...fields, description: e.target.value })}
          disabled={disabled}
        />
      </div>
      {showStatus && (
        <div className="cw-field cw-field--full">
          <span className="cw-label">Status</span>
          <div className="tp-status-radios">
            {PLAN_STATUS_OPTIONS.map((s) => (
              <label key={s} className={`tp-status-radio${fields.status === s ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name={`${idPrefix}-status`}
                  value={s}
                  checked={fields.status === s}
                  onChange={() => onChange({ ...fields, status: s })}
                  disabled={disabled}
                />
                {planStatusLabels[s]}
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Create Plan Modal ───────────────────────────────────────────────────── */

type CreatePlanModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const [fields, setFields] = useState<PlanFormFields>({
    title: '',
    startDate: weekStart,
    endDate: weekEnd,
    description: '',
    status: 'draft',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fields.title.trim()) { setError('Title is required.'); return; }
    if (fields.endDate < fields.startDate) { setError('End date must be on or after start date.'); return; }

    const payload: CreateTrainingPlanRequest = {
      title: fields.title.trim(),
      startDate: fields.startDate,
      endDate: fields.endDate,
      status: fields.status,
    };
    if (fields.description.trim()) payload.description = fields.description.trim();

    setSubmitting(true);
    try {
      await createTrainingPlan(payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan.');
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onClose}>
      <div className="cw-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <h3>New Training Plan</h3>
          <button type="button" className="cw-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="cw-modal__body" onSubmit={handleSubmit} noValidate>
          <PlanForm fields={fields} onChange={setFields} disabled={submitting} idPrefix="cp" />
          {error && <p className="cw-form__error">{error}</p>}
          <div className="cw-modal__footer">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/* ── Edit Plan Modal ─────────────────────────────────────────────────────── */

type EditPlanModalProps = {
  plan: TrainingPlanSummaryDto;
  onClose: () => void;
  onSuccess: () => void;
};

function EditPlanModal({ plan, onClose, onSuccess }: EditPlanModalProps) {
  const [fields, setFields] = useState<PlanFormFields>({
    title: plan.title,
    startDate: plan.startDate,
    endDate: plan.endDate,
    description: plan.description ?? '',
    status: plan.status,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fields.title.trim()) { setError('Title is required.'); return; }
    if (fields.endDate < fields.startDate) { setError('End date must be on or after start date.'); return; }

    // Omit status from payload — status changes only happen via Activate/Archive actions,
    // not the edit form. This prevents accidentally overwriting completed/archived status.
    const payload: UpdateTrainingPlanRequest = {
      title: fields.title.trim(),
      startDate: fields.startDate,
      endDate: fields.endDate,
      description: fields.description.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await updateTrainingPlan(plan.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan.');
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onClose}>
      <div className="cw-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <h3>Edit Plan</h3>
          <button type="button" className="cw-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="cw-modal__body" onSubmit={handleSubmit} noValidate>
          <PlanForm fields={fields} onChange={setFields} disabled={submitting} idPrefix="ep" showStatus={false} />
          {error && <p className="cw-form__error">{error}</p>}
          <div className="cw-modal__footer">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

/* ── Plan row with accordion ─────────────────────────────────────────────── */

type PlanRowProps = {
  plan: TrainingPlanSummaryDto;
  onActivate: (id: string) => Promise<void>;
  onEdit: (plan: TrainingPlanSummaryDto) => void;
  onDelete: (id: string) => Promise<void>;
  activating: string | null;
  deleting: string | null;
  navigate: PageComponentProps['navigate'];
};

function PlanRow({ plan, onActivate, onEdit, onDelete, activating, deleting, navigate }: PlanRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [planDetail, setPlanDetail] = useState<TrainingPlanDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleToggle() {
    if (!expanded && !planDetail) {
      setLoadingDetail(true);
      try {
        const detail = await fetchTrainingPlanById(plan.id);
        setPlanDetail(detail);
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded((v) => !v);
  }

  const isDeleting = deleting === plan.id;
  const isActivating = activating === plan.id;

  return (
    <li className={`tp-plan-row${expanded ? ' is-expanded' : ''}`}>
      <div className="tp-plan-row__main">
        <button
          type="button"
          className="tp-plan-row__toggle"
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          <span className="tp-plan-row__chevron">{expanded ? '▾' : '▸'}</span>
          <div className="tp-plan-row__info">
            <span className="tp-plan-row__title">{plan.title}</span>
            <span className="tp-plan-row__dates">{plan.startDate} – {plan.endDate}</span>
          </div>
        </button>
        <div className="tp-plan-row__right">
          <TrainingPlanStatusBadge status={plan.status} />
          {plan.status !== 'active' && !confirmDelete && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={activating !== null || isDeleting}
              onClick={() => onActivate(plan.id)}
            >
              {isActivating ? '…' : 'Activate'}
            </button>
          )}
          {!confirmDelete && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={isDeleting}
              onClick={() => onEdit(plan)}
            >
              Edit
            </button>
          )}
          {confirmDelete ? (
            <span className="tp-plan-row__confirm">
              Delete?
              <button
                type="button"
                className="btn btn--danger btn--sm"
                disabled={isDeleting}
                onClick={async () => { await onDelete(plan.id); }}
              >
                {isDeleting ? '…' : 'Yes'}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn--ghost btn--sm tp-plan-row__delete"
              disabled={isDeleting}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="tp-plan-row__workouts">
          {loadingDetail ? (
            <p className="tp-plan-row__workouts-empty">Loading…</p>
          ) : planDetail && planDetail.plannedWorkouts.length > 0 ? (
            <ul className="tp-plan-workouts">
              {planDetail.plannedWorkouts.map((w) => (
                <li key={w.id} className="tp-plan-workout-row">
                  <button
                    type="button"
                    className="tp-plan-workout-row__btn"
                    onClick={() => navigate(`/workouts/${w.id}`)}
                  >
                    <SportBadge sport={w.sport} />
                    <span className="tp-plan-workout-row__title">{w.title}</span>
                    <span className="tp-plan-workout-row__date">{formatDate(w.scheduledDate)}</span>
                    <WorkoutStatusBadge status={w.status as 'planned'} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tp-plan-row__workouts-empty">No workouts assigned to this plan.</p>
          )}
        </div>
      )}
    </li>
  );
}

/* ── All Plans section ───────────────────────────────────────────────────── */

type PlanListSectionProps = {
  plans: TrainingPlanSummaryDto[];
  onActivate: (id: string) => Promise<void>;
  onEdit: (plan: TrainingPlanSummaryDto) => void;
  onDelete: (id: string) => Promise<void>;
  activating: string | null;
  deleting: string | null;
  navigate: PageComponentProps['navigate'];
};

function PlanListSection({ plans, onActivate, onEdit, onDelete, activating, deleting, navigate }: PlanListSectionProps) {
  if (plans.length === 0) return null;

  return (
    <section className="tp-plans">
      <h2 className="tp-plans__heading">All Plans</h2>
      <ul className="tp-plans__list">
        {plans.map((plan) => (
          <PlanRow
            key={plan.id}
            plan={plan}
            onActivate={onActivate}
            onEdit={onEdit}
            onDelete={onDelete}
            activating={activating}
            deleting={deleting}
            navigate={navigate}
          />
        ))}
      </ul>
    </section>
  );
}

/* ── All Workouts section ────────────────────────────────────────────────── */

type AllWorkoutsSectionProps = {
  workouts: PlannedWorkoutDto[];
  plans: TrainingPlanSummaryDto[];
  onAssign: (workoutId: string, planId: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  assigning: string | null;
  navigate: PageComponentProps['navigate'];
};

function AllWorkoutsSection({ workouts, plans, onAssign, onDelete, assigning, navigate }: AllWorkoutsSectionProps) {
  const [assigningFor, setAssigningFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    function handleOutside(e: MouseEvent) {
      if (!(e.target as Element).closest('.tp-workout-row__delete')) {
        setConfirmDeleteId(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [confirmDeleteId]);

  if (workouts.length === 0) return null;

  const planById = Object.fromEntries(plans.map((p) => [p.id, p]));

  return (
    <section className="tp-workouts">
      <h2 className="tp-plans__heading">All Workouts</h2>
      <ul className="tp-workouts__list">
        {workouts.map((w) => {
          const assignedPlan = w.trainingPlanId ? planById[w.trainingPlanId] : null;
          const isAssigning = assigning === w.id;
          const showPicker = assigningFor === w.id;

          const isDeleting = deletingId === w.id;
          const showConfirm = confirmDeleteId === w.id;

          return (
            <li key={w.id} className="tp-workout-row">
              <button
                type="button"
                className="tp-workout-row__btn"
                onClick={() => navigate(`/workouts/${w.id}`)}
              >
                <SportBadge sport={w.sport} />
                <div className="tp-workout-row__info">
                  <span className="tp-workout-row__title">{w.title}</span>
                  <span className="tp-workout-row__date">{formatDate(w.scheduledDate)}</span>
                </div>
              </button>
              <WorkoutStatusBadge status={w.status as 'planned'} />
              <div className="tp-workout-row__plan">
                {showPicker ? (
                  <select
                    className="cw-input cw-input--sm tp-workout-row__select"
                    autoFocus
                    defaultValue={w.trainingPlanId ?? ''}
                    disabled={isAssigning}
                    onBlur={() => setAssigningFor(null)}
                    onChange={async (e) => {
                      const planId = e.target.value;
                      if (planId) {
                        setAssigningFor(null);
                        await onAssign(w.id, planId);
                      }
                    }}
                  >
                    <option value="" disabled>Select plan…</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <button
                    type="button"
                    className={`tp-workout-row__plan-btn${assignedPlan ? ' is-assigned' : ''}`}
                    disabled={isAssigning}
                    onClick={() => setAssigningFor(w.id)}
                  >
                    {isAssigning ? '…' : assignedPlan ? assignedPlan.title : 'Unassigned'}
                  </button>
                )}
              </div>
              <div className="tp-workout-row__delete">
                <button
                  type="button"
                  className={`tp-workout-row__delete-btn${showConfirm ? ' is-open' : ''}`}
                  title="Delete workout"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteId(showConfirm ? null : w.id)}
                >
                  {isDeleting ? '…' : '×'}
                </button>
                {showConfirm && (
                  <div className="tp-workout-row__delete-tooltip">
                    <span className="tp-workout-row__delete-tooltip-label">Delete workout?</span>
                    <div className="tp-workout-row__delete-tooltip-actions">
                      <button
                        type="button"
                        className="tp-workout-row__delete-tooltip-yes"
                        disabled={isDeleting}
                        onClick={async () => {
                          setDeletingId(w.id);
                          setConfirmDeleteId(null);
                          await onDelete(w.id);
                          setDeletingId(null);
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="tp-workout-row__delete-tooltip-no"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Week plan content ───────────────────────────────────────────────────── */

type WeekPlanContentProps = {
  title: string;
  description?: string;
  weekStart: string;
  weekEnd: string;
  workouts: WorkoutCardData[];
  summaryItems: { label: string; value: string }[];
  navigate: PageComponentProps['navigate'];
  actions?: React.ReactNode;
  viewToggle?: React.ReactNode;
  contentKey?: string;
  footer?: React.ReactNode;
};

function WeekPlanContent({
  title,
  description,
  weekStart,
  weekEnd,
  workouts,
  summaryItems,
  navigate,
  actions,
  viewToggle,
  contentKey,
  footer,
}: WeekPlanContentProps) {
  const weekRange = formatWeekRange(weekStart, weekEnd);
  const weekDates = getWeekDates(weekStart, weekEnd);

  const workoutsByDate = workouts.reduce<Record<string, WorkoutCardData[]>>((acc, w) => {
    const key = w.scheduledDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <PageShell title={title} eyebrow={`Training Plan · ${weekRange}`} description={description} actions={actions}>
      <dl className="week-summary">
        {summaryItems.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {viewToggle}

      <div key={contentKey} className="tp-week-content">
      {workouts.length === 0 ? (
        <EmptyState
          title="No workouts this week"
          description="No workouts scheduled for this week."
        />
      ) : (
        <ol className="week-plan">
          {weekDates.map((date) => {
            const dayWorkouts = workoutsByDate[date] ?? [];
            const isToday = date === TODAY;
            const { weekday, date: dateLabel } = formatDayHeader(date);

            return (
              <li key={date} className={`week-day${isToday ? ' week-day--today' : ''}`}>
                <div className="week-day__label">
                  <span className="week-day__weekday">{weekday}</span>
                  <span className="week-day__date">{dateLabel}</span>
                  {isToday && <span className="week-day__today-tag">Today</span>}
                </div>
                <div className="week-day__content">
                  {dayWorkouts.length === 0 ? (
                    <p className="week-day__rest">Rest day</p>
                  ) : (
                    dayWorkouts.map((workout) => (
                      <WorkoutCard
                        key={workout.id}
                        workout={workout}
                        showDate={false}
                        onOpen={(id) => navigate(`/workouts/${id}`)}
                      />
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      </div>
      {footer}
    </PageShell>
  );
}

function buildMockSummaryItems(
  weeklySummary: ReturnType<typeof getWeeklySummary>,
): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [
    { label: 'Sessions', value: String(weeklySummary.activityCount) },
    { label: 'Total time', value: formatDuration(weeklySummary.plannedDurationSeconds) },
  ];
  if (weeklySummary.cyclingDurationSeconds)
    items.push({ label: 'Bike', value: formatDuration(weeklySummary.cyclingDurationSeconds) });
  if (weeklySummary.runningDurationSeconds)
    items.push({ label: 'Run', value: formatDuration(weeklySummary.runningDurationSeconds) });
  if (weeklySummary.swimmingDurationSeconds)
    items.push({ label: 'Swim', value: formatDuration(weeklySummary.swimmingDurationSeconds) });
  if (weeklySummary.strengthDurationSeconds)
    items.push({ label: 'Strength', value: formatDuration(weeklySummary.strengthDurationSeconds) });
  return items;
}

function buildApiSummaryItems(workouts: PlannedWorkoutDto[]): { label: string; value: string }[] {
  let totalSeconds = 0;
  const bySport: Record<string, number> = {};
  for (const w of workouts) {
    const dur = w.plannedDurationSeconds ?? 0;
    totalSeconds += dur;
    bySport[w.sport] = (bySport[w.sport] ?? 0) + dur;
  }
  const items: { label: string; value: string }[] = [
    { label: 'Sessions', value: String(workouts.length) },
    { label: 'Total time', value: formatDuration(totalSeconds) },
  ];
  if (bySport['cycling']) items.push({ label: 'Bike', value: formatDuration(bySport['cycling']) });
  if (bySport['running']) items.push({ label: 'Run', value: formatDuration(bySport['running']) });
  if (bySport['swimming']) items.push({ label: 'Swim', value: formatDuration(bySport['swimming']) });
  if (bySport['strength']) items.push({ label: 'Strength', value: formatDuration(bySport['strength']) });
  return items;
}

/* ── Mock mode ───────────────────────────────────────────────────────────── */

function TrainingPlanMockMode({ navigate }: PageComponentProps) {
  const trainingPlan = getCurrentTrainingPlan();
  const weeklySummary = getWeeklySummary();
  const allWorkouts = getPlannedWorkouts();

  return (
    <WeekPlanContent
      title={trainingPlan.title}
      description={trainingPlan.description}
      weekStart={trainingPlan.startDate}
      weekEnd={trainingPlan.endDate}
      workouts={allWorkouts as PlannedWorkout[]}
      summaryItems={buildMockSummaryItems(weeklySummary)}
      navigate={navigate}
    />
  );
}

/* ── API mode ────────────────────────────────────────────────────────────── */

function TrainingPlanApiMode({ navigate }: PageComponentProps) {
  const weekPlanState = useCurrentWeekPlan();
  const plansState = useTrainingPlans();
  const workoutsState = useWorkouts();
  const { weekStart, weekEnd } = getCurrentWeekRange();

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlanSummaryDto | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [weekView, setWeekView] = useState<'all' | 'plan'>('plan');
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshAll = useCallback(() => {
    weekPlanState.refresh();
    plansState.refresh();
    workoutsState.refresh();
  }, [weekPlanState.refresh, plansState.refresh, workoutsState.refresh]);

  async function handleActivate(id: string) {
    setActivating(id);
    setActionError(null);
    try {
      await updateTrainingPlan(id, { status: 'active' });
      refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to activate plan.');
    } finally {
      setActivating(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    setActionError(null);
    try {
      await deleteTrainingPlan(id);
      refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete plan.');
    } finally {
      setDeleting(null);
    }
  }

  async function handleAssign(workoutId: string, planId: string) {
    setAssigning(workoutId);
    setActionError(null);
    try {
      await updateWorkout(workoutId, { trainingPlanId: planId });
      refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to assign plan.');
    } finally {
      setAssigning(null);
    }
  }

  async function handleDeleteWorkout(id: string) {
    setActionError(null);
    try {
      await deleteWorkout(id);
      refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete workout.');
    }
  }

  const plans = plansState.status === 'success' ? plansState.plans : [];
  const allWorkouts = workoutsState.status === 'success' ? workoutsState.workouts : [];

  const activePlanId = weekPlanState.status === 'success' ? weekPlanState.plan?.id : undefined;

  const viewToggle = activePlanId ? (
    <div className="segmented-control" role="tablist" aria-label="Week view filter">
      <span
        className="segmented-control__indicator"
        aria-hidden="true"
        style={{ left: weekView === 'plan' ? '0%' : '50%', width: '50%' }}
      />
      <button
        type="button"
        role="tab"
        aria-selected={weekView === 'plan'}
        className={`segmented-control__tab${weekView === 'plan' ? ' is-active' : ''}`}
        onClick={() => setWeekView('plan')}
      >
        Active plan only
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={weekView === 'all'}
        className={`segmented-control__tab${weekView === 'all' ? ' is-active' : ''}`}
        onClick={() => setWeekView('all')}
      >
        All this week
      </button>
    </div>
  ) : null;

  const sideContent = (
    <>
      <PlanListSection
        plans={plans}
        onActivate={handleActivate}
        onEdit={setEditingPlan}
        onDelete={handleDelete}
        activating={activating}
        deleting={deleting}
        navigate={navigate}
      />
      <AllWorkoutsSection
        workouts={allWorkouts}
        plans={plans}
        onAssign={handleAssign}
        onDelete={handleDeleteWorkout}
        assigning={assigning}
        navigate={navigate}
      />
    </>
  );

  const headerActions = (
    <div className="tp-header-actions">
      <button type="button" className="btn btn--secondary" onClick={() => setShowCreatePlan(true)}>
        + New Plan
      </button>
      <button type="button" className="btn btn--primary" onClick={() => navigate('/workouts/new')}>
        + Create Workout
      </button>
    </div>
  );

  if (weekPlanState.status === 'loading') {
    return (
      <PageShell title="Training Plan" eyebrow="Training Plan · Loading...">
        <LoadingState title="Loading training plan" description="Fetching from local backend..." />
      </PageShell>
    );
  }

  if (weekPlanState.status === 'error') {
    return (
      <PageShell title="Training Plan" eyebrow="Training Plan" actions={headerActions}>
        <ErrorState title="Could not load training plan" description={weekPlanState.message} />
        {sideContent}
      </PageShell>
    );
  }

  const rendered = weekPlanState.plan ? (() => {
    const allWeekWorkouts = weekPlanState.plan.plannedWorkouts;
    const displayedWorkouts = weekView === 'plan' && activePlanId
      ? allWeekWorkouts.filter((w) => w.trainingPlanId === activePlanId)
      : allWeekWorkouts;

    return (
      <WeekPlanContent
        title={weekPlanState.plan.title}
        description={weekPlanState.plan.description}
        weekStart={weekStart}
        weekEnd={weekEnd}
        workouts={displayedWorkouts as WorkoutCardData[]}
        summaryItems={buildApiSummaryItems(displayedWorkouts)}
        navigate={navigate}
        actions={headerActions}
        viewToggle={viewToggle}
        contentKey={weekView}
        footer={sideContent}
      />
    );
  })() : (
    <PageShell
      title="Training Plan"
      eyebrow={`Training Plan · ${formatWeekRange(weekStart, weekEnd)}`}
      actions={headerActions}
    >
      <EmptyState
        title="No active training plan"
        description="No training plan for this week. Create one or wait for the AI Coach."
      />
      {sideContent}
    </PageShell>
  );

  return (
    <>
      {actionError && (
        <div className="tp-action-error" role="alert">
          {actionError}
          <button type="button" className="tp-action-error__dismiss" onClick={() => setActionError(null)}>×</button>
        </div>
      )}
      {rendered}
      {showCreatePlan && (
        <CreatePlanModal
          onClose={() => setShowCreatePlan(false)}
          onSuccess={() => { setShowCreatePlan(false); refreshAll(); }}
        />
      )}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={() => { setEditingPlan(null); refreshAll(); }}
        />
      )}
    </>
  );
}

export function TrainingPlanPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <TrainingPlanApiMode navigate={navigate} params={params} />;
  }
  return <TrainingPlanMockMode navigate={navigate} params={params} />;
}

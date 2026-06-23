import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  CreateTrainingPlanRequest,
  PlannedWorkoutDto,
  TrainingPlanSummaryDto,
  UpdateTrainingPlanRequest,
} from '@pp-trainer/shared';

import { EmptyState, ErrorState, LoadingState, WorkoutCard } from '../components';
import type { WorkoutCardData } from '../components';
import { formatDuration } from '../components/prototypeFormatters';
import { createTrainingPlan, updateTrainingPlan } from '../api/trainingApi';
import { DATA_MODE } from '../config/dataMode';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
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

/* ── Create Plan Modal ───────────────────────────────────────────────────── */

type CreatePlanModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(weekStart);
  const [endDate, setEndDate] = useState(weekEnd);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (endDate < startDate) { setError('End date must be on or after start date.'); return; }

    const payload: CreateTrainingPlanRequest = {
      title: title.trim(),
      startDate,
      endDate,
      status,
    };
    if (description.trim()) payload.description = description.trim();

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
          <div className="cw-field cw-field--full">
            <label className="cw-label cw-label--required" htmlFor="cp-title">Title</label>
            <input
              id="cp-title"
              className="cw-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 26 Base Training"
              disabled={submitting}
            />
          </div>
          <div className="cw-field cw-field--1">
            <label className="cw-label cw-label--required" htmlFor="cp-start">Start date</label>
            <input
              id="cp-start"
              className="cw-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="cw-field cw-field--1">
            <label className="cw-label cw-label--required" htmlFor="cp-end">End date</label>
            <input
              id="cp-end"
              className="cw-input"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="cw-field cw-field--full">
            <label className="cw-label" htmlFor="cp-desc">Description</label>
            <textarea
              id="cp-desc"
              className="cw-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="cw-field cw-field--full">
            <span className="cw-label">Status</span>
            <div className="tp-status-radios">
              {(['draft', 'active'] as const).map((s) => (
                <label key={s} className={`tp-status-radio${status === s ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="cp-status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    disabled={submitting}
                  />
                  {planStatusLabels[s]}
                </label>
              ))}
            </div>
          </div>
          {error && <p className="cw-form__error">{error}</p>}
          <div className="cw-modal__footer">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
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

/* ── Plan list section ───────────────────────────────────────────────────── */

type PlanListSectionProps = {
  plans: TrainingPlanSummaryDto[];
  onActivate: (id: string) => Promise<void>;
  activating: string | null;
};

function PlanListSection({ plans, onActivate, activating }: PlanListSectionProps) {
  if (plans.length === 0) return null;

  return (
    <section className="tp-plans">
      <h2 className="tp-plans__heading">All Plans</h2>
      <ul className="tp-plans__list">
        {plans.map((plan) => (
          <li key={plan.id} className="tp-plan-row">
            <div className="tp-plan-row__info">
              <span className="tp-plan-row__title">{plan.title}</span>
              <span className="tp-plan-row__dates">
                {plan.startDate} – {plan.endDate}
              </span>
            </div>
            <div className="tp-plan-row__right">
              <TrainingPlanStatusBadge status={plan.status} />
              {plan.status !== 'active' && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={activating !== null}
                  onClick={() => onActivate(plan.id)}
                >
                  {activating === plan.id ? '…' : 'Activate'}
                </button>
              )}
            </div>
          </li>
        ))}
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
    items.push({
      label: 'Strength',
      value: formatDuration(weeklySummary.strengthDurationSeconds),
    });
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
  if (bySport['strength'])
    items.push({ label: 'Strength', value: formatDuration(bySport['strength']) });
  return items;
}

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

function TrainingPlanApiMode({ navigate }: PageComponentProps) {
  const weekPlanState = useCurrentWeekPlan();
  const plansState = useTrainingPlans();
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  async function handleActivate(id: string) {
    setActivating(id);
    try {
      const payload: UpdateTrainingPlanRequest = { status: 'active' };
      await updateTrainingPlan(id, payload);
      weekPlanState.refresh();
      plansState.refresh();
    } catch {
      // silently fall through — plan list will re-render unchanged
    } finally {
      setActivating(null);
    }
  }

  function handlePlanCreated() {
    setShowCreatePlan(false);
    weekPlanState.refresh();
    plansState.refresh();
  }

  const planList =
    plansState.status === 'success' && plansState.plans.length > 0 ? (
      <PlanListSection
        plans={plansState.plans}
        onActivate={handleActivate}
        activating={activating}
      />
    ) : null;

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
        {planList}
      </PageShell>
    );
  }

  const rendered = weekPlanState.plan ? (
    <WeekPlanContent
      title={weekPlanState.plan.title}
      description={weekPlanState.plan.description}
      weekStart={weekStart}
      weekEnd={weekEnd}
      workouts={weekPlanState.plan.plannedWorkouts as WorkoutCardData[]}
      summaryItems={buildApiSummaryItems(weekPlanState.plan.plannedWorkouts)}
      navigate={navigate}
      actions={headerActions}
      footer={planList}
    />
  ) : (
    <PageShell
      title="Training Plan"
      eyebrow={`Training Plan · ${formatWeekRange(weekStart, weekEnd)}`}
      actions={headerActions}
    >
      <EmptyState
        title="No active training plan"
        description="No training plan for this week. Create one or wait for the AI Coach."
      />
      {planList}
    </PageShell>
  );

  return (
    <>
      {rendered}
      {showCreatePlan && (
        <CreatePlanModal onClose={() => setShowCreatePlan(false)} onSuccess={handlePlanCreated} />
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

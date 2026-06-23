import React from 'react';

import type { PlannedWorkoutDto } from '@pp-trainer/shared';

import { EmptyState, ErrorState, LoadingState, WorkoutCard } from '../components';
import type { WorkoutCardData } from '../components';
import { formatDuration } from '../components/prototypeFormatters';
import { DATA_MODE } from '../config/dataMode';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
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

type WeekPlanContentProps = {
  title: string;
  description?: string;
  weekStart: string;
  weekEnd: string;
  workouts: WorkoutCardData[];
  summaryItems: { label: string; value: string }[];
  navigate: PageComponentProps['navigate'];
  actions?: React.ReactNode;
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

function CreateWorkoutButton({ navigate }: { navigate: PageComponentProps['navigate'] }) {
  return (
    <button
      type="button"
      className="btn btn--primary"
      onClick={() => navigate('/workouts/new')}
    >
      + Create Workout
    </button>
  );
}

function TrainingPlanApiMode({ navigate }: PageComponentProps) {
  const state = useCurrentWeekPlan();
  const { weekStart, weekEnd } = getCurrentWeekRange();
  const createBtn = <CreateWorkoutButton navigate={navigate} />;

  if (state.status === 'loading') {
    return (
      <PageShell title="Training Plan" eyebrow="Training Plan · Loading...">
        <LoadingState title="Loading training plan" description="Fetching from local backend..." />
      </PageShell>
    );
  }

  if (state.status === 'error') {
    return (
      <PageShell title="Training Plan" eyebrow="Training Plan">
        <ErrorState title="Could not load training plan" description={state.message} />
      </PageShell>
    );
  }

  if (!state.plan) {
    return (
      <PageShell
        title="Training Plan"
        eyebrow={`Training Plan · ${formatWeekRange(weekStart, weekEnd)}`}
        actions={createBtn}
      >
        <EmptyState
          title="No active training plan"
          description="No training plan for this week. Create one or wait for the AI Coach."
        />
      </PageShell>
    );
  }

  const { plan } = state;

  return (
    <WeekPlanContent
      title={plan.title}
      description={plan.description}
      weekStart={weekStart}
      weekEnd={weekEnd}
      workouts={plan.plannedWorkouts as WorkoutCardData[]}
      summaryItems={buildApiSummaryItems(plan.plannedWorkouts)}
      navigate={navigate}
      actions={createBtn}
    />
  );
}

export function TrainingPlanPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <TrainingPlanApiMode navigate={navigate} params={params} />;
  }
  return <TrainingPlanMockMode navigate={navigate} params={params} />;
}

import { EmptyState, WorkoutCard } from '../components';
import { PageShell } from '../layout/PageShell';
import {
  getCurrentTrainingPlan,
  getPlannedWorkouts,
  getWeeklySummary,
} from '../mock/prototypeData.helpers';
import { formatDuration } from '../components/prototypeFormatters';
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

export function TrainingPlanPage({ navigate }: PageComponentProps) {
  const trainingPlan = getCurrentTrainingPlan();
  const weeklySummary = getWeeklySummary();
  const allWorkouts = getPlannedWorkouts();

  const workoutsByDate = allWorkouts.reduce<Record<string, PlannedWorkout[]>>(
    (acc, w) => {
      const key = w.scheduledDate;
      if (!acc[key]) acc[key] = [];
      acc[key].push(w);
      return acc;
    },
    {},
  );

  const weekDates = getWeekDates(trainingPlan.startDate, trainingPlan.endDate);
  const weekRange = formatWeekRange(trainingPlan.startDate, trainingPlan.endDate);

  return (
    <PageShell
      title={trainingPlan.title}
      eyebrow={`Training Plan · ${weekRange}`}
      description={trainingPlan.description}
    >
      <dl className="week-summary">
        <div>
          <dt>Sessions</dt>
          <dd>{weeklySummary.activityCount}</dd>
        </div>
        <div>
          <dt>Total time</dt>
          <dd>{formatDuration(weeklySummary.plannedDurationSeconds)}</dd>
        </div>
        {weeklySummary.cyclingDurationSeconds ? (
          <div>
            <dt>Bike</dt>
            <dd>{formatDuration(weeklySummary.cyclingDurationSeconds)}</dd>
          </div>
        ) : null}
        {weeklySummary.runningDurationSeconds ? (
          <div>
            <dt>Run</dt>
            <dd>{formatDuration(weeklySummary.runningDurationSeconds)}</dd>
          </div>
        ) : null}
        {weeklySummary.swimmingDurationSeconds ? (
          <div>
            <dt>Swim</dt>
            <dd>{formatDuration(weeklySummary.swimmingDurationSeconds)}</dd>
          </div>
        ) : null}
        {weeklySummary.strengthDurationSeconds ? (
          <div>
            <dt>Strength</dt>
            <dd>{formatDuration(weeklySummary.strengthDurationSeconds)}</dd>
          </div>
        ) : null}
      </dl>

      {allWorkouts.length === 0 ? (
        <EmptyState
          title="No planned workouts"
          description="The active prototype plan does not contain scheduled workouts yet."
        />
      ) : (
        <ol className="week-plan">
          {weekDates.map((date) => {
            const dayWorkouts = workoutsByDate[date] ?? [];
            const isToday = date === TODAY;
            const { weekday, date: dateLabel } = formatDayHeader(date);

            return (
              <li
                key={date}
                className={`week-day${isToday ? ' week-day--today' : ''}`}
              >
                <div className="week-day__label">
                  <span className="week-day__weekday">{weekday}</span>
                  <span className="week-day__date">{dateLabel}</span>
                  {isToday && (
                    <span className="week-day__today-tag">Today</span>
                  )}
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

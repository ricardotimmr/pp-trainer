import type { PlannedWorkoutDto } from '@pp-trainer/shared';

import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardChartsSection,
  DashboardWidget,
  EmptyState,
  ErrorState,
  LoadingState,
  SportBadge,
  WorkoutCard,
} from '../components';
import type { WorkoutCardData } from '../components/cards/WorkoutCard';
import {
  formatDate,
  formatDistance,
  formatDuration,
  sportLabels,
} from '../components/prototypeFormatters';
import { useDashboard } from '../hooks/useDashboard';
import type { WeekVolume } from '../hooks/useDashboard';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { PageShell } from '../layout/PageShell';
import type { SportType } from '../types/domain';
import type { PageComponentProps } from '../routes/routeTypes';

type SportSplitItem = { sport: SportType; durationSeconds: number };

type WeekBalancePanelProps = {
  plannedSeconds: number;
  completedSeconds: number;
  remainingSeconds: number;
  sportSplit: SportSplitItem[];
};

function WeekBalancePanel({
  plannedSeconds,
  completedSeconds,
  remainingSeconds,
  sportSplit,
}: WeekBalancePanelProps) {
  const completion =
    plannedSeconds > 0
      ? Math.min(100, Math.round((completedSeconds / plannedSeconds) * 100))
      : 0;

  return (
    <section className="dashboard-week-balance" aria-label="Weekly volume">
      <div className="dashboard-week-balance__topline">
        <h3>Weekly volume</h3>
        <span>{completion}% reached</span>
      </div>
      <dl className="dashboard-week-balance__metrics">
        <div>
          <dt>Planned</dt>
          <dd>{formatDuration(plannedSeconds)}</dd>
        </div>
        <div className="is-completed">
          <dt>Completed</dt>
          <dd>{formatDuration(completedSeconds)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>{remainingSeconds === 0 ? <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Completed</span> : formatDuration(remainingSeconds)}</dd>
        </div>
      </dl>
      {sportSplit.length > 0 && (
        <>
          <div className="dashboard-week-balance__bar" aria-hidden="true">
            {sportSplit.map((item) => {
              const width =
                plannedSeconds > 0
                  ? Math.max(3, (item.durationSeconds / plannedSeconds) * 100)
                  : 0;
              return (
                <span
                  key={item.sport}
                  className={`dashboard-week-balance__segment dashboard-week-balance__segment--${item.sport}`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
          <div className="dashboard-week-balance__legend">
            {sportSplit.map((item) => (
              <div key={item.sport}>
                <span
                  className={`dashboard-week-balance__dot dashboard-week-balance__dot--${item.sport}`}
                />
                <span>
                  {sportLabels[item.sport]} {formatDuration(item.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function WeekCompletedPanel({ weekVolume }: { weekVolume: WeekVolume }) {
  const sportSplit: SportSplitItem[] = (
    Object.entries(weekVolume.bySport) as [SportType, number][]
  )
    .filter(([, dur]) => dur > 0)
    .map(([sport, durationSeconds]) => ({ sport, durationSeconds }));

  return (
    <section className="dashboard-week-balance" aria-label="Weekly volume">
      <div className="dashboard-week-balance__topline">
        <h3>Weekly volume</h3>
        <span>{formatDuration(weekVolume.totalSeconds)} completed</span>
      </div>
      <dl className="dashboard-week-balance__metrics">
        <div className="is-completed">
          <dt>Completed</dt>
          <dd>{formatDuration(weekVolume.totalSeconds)}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(weekVolume.totalDistanceMeters)}</dd>
        </div>
      </dl>
      {sportSplit.length > 0 && (
        <>
          <div className="dashboard-week-balance__bar" aria-hidden="true">
            {sportSplit.map((item) => {
              const width =
                weekVolume.totalSeconds > 0
                  ? Math.max(3, (item.durationSeconds / weekVolume.totalSeconds) * 100)
                  : 0;
              return (
                <span
                  key={item.sport}
                  className={`dashboard-week-balance__segment dashboard-week-balance__segment--${item.sport}`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
          <div className="dashboard-week-balance__legend">
            {sportSplit.map((item) => (
              <div key={item.sport}>
                <span
                  className={`dashboard-week-balance__dot dashboard-week-balance__dot--${item.sport}`}
                />
                <span>
                  {sportLabels[item.sport]} {formatDuration(item.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function toWorkoutCardData(w: PlannedWorkoutDto): WorkoutCardData {
  return {
    id: w.id,
    sport: w.sport as SportType,
    intensity: w.intensity as WorkoutCardData['intensity'],
    status: w.status as WorkoutCardData['status'],
    title: w.title,
    objective: w.objective ?? undefined,
    description: w.description ?? undefined,
    scheduledDate: w.scheduledDate,
    scheduledStartTime: w.scheduledStartTime ?? undefined,
    plannedDurationSeconds: w.plannedDurationSeconds ?? undefined,
    plannedDistanceMeters: w.plannedDistanceMeters ?? undefined,
  };
}

export function DashboardPage({ navigate }: PageComponentProps) {
  const state = useDashboard();
  const analyticsState = useDashboardAnalytics();

  if (state.status === 'loading') {
    return (
      <PageShell title="Dashboard" description="Loading your training data...">
        <LoadingState title="Loading dashboard" description="Fetching your training data..." />
      </PageShell>
    );
  }

  if (state.status === 'error') {
    return (
      <PageShell title="Dashboard" description="Could not load dashboard.">
        <ErrorState title="Could not load dashboard" description={state.message} />
      </PageShell>
    );
  }

  const {
    weekStart,
    weekEnd,
    recentActivities,
    weekVolume,
    plannedWorkouts,
    plannedSummary,
    upcomingWorkouts,
    mainGoal,
    secondaryGoals,
    watchlistGoals,
    settings,
  } = state.data;

  const hasPlan = plannedWorkouts.length > 0;
  const plannedSeconds = plannedSummary.totalSeconds;
  const completedSeconds = plannedSummary.completedSeconds;
  const remainingSeconds = plannedSummary.remainingSeconds;
  const sportSplit: SportSplitItem[] = (
    Object.entries(plannedSummary.bySport) as [SportType, number][]
  )
    .filter(([, dur]) => dur > 0)
    .map(([sport, durationSeconds]) => ({ sport, durationSeconds }));

  return (
    <PageShell
      title="Dashboard"
      description="Your current training week, upcoming workouts, and recent activity."
      actions={
        <>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/training-plan')}
          >
            Open training plan
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/activities')}
          >
            View activities
          </button>
        </>
      }
    >
      <div className="dashboard-page">
        <section className="dashboard-hero" aria-label="Current training week">
          <div className="dashboard-hero__intro">
            <p className="dashboard-hero__eyebrow">
              {formatDate(weekStart)} to {formatDate(weekEnd)}
            </p>
            {hasPlan ? (
              <>
                <h2>Current training week</h2>
                <p>
                  {plannedWorkouts.length} workout{plannedWorkouts.length !== 1 ? 's' : ''}{' '}
                  planned this week
                </p>
              </>
            ) : (
              <>
                <h2>No active plan</h2>
                <p>Generate a week plan with AI Coach to get started.</p>
              </>
            )}
          </div>

          {hasPlan ? (
            <WeekBalancePanel
              plannedSeconds={plannedSeconds}
              completedSeconds={completedSeconds}
              remainingSeconds={remainingSeconds}
              sportSplit={sportSplit}
            />
          ) : (
            <WeekCompletedPanel weekVolume={weekVolume} />
          )}
        </section>

        <div className="dashboard-layout">
          {/* Left / main column */}
          <div className="dashboard-col--main">
            {hasPlan && (
              <DashboardWidget title="Weekly summary" eyebrow="Training load">
                <div className="dashboard-metric-grid">
                  <div className="dashboard-metric is-accent">
                    <p>Total duration</p>
                    <strong>{formatDuration(plannedSummary.totalSeconds)}</strong>
                    <span>Across all planned sports</span>
                  </div>
                  <div className="dashboard-metric">
                    <p>Total distance</p>
                    <strong>{formatDistance(plannedSummary.totalDistanceMeters)}</strong>
                    <span>Bike, run and swim combined</span>
                  </div>
                  <div className="dashboard-metric">
                    <p>Easy</p>
                    <strong>{formatDuration(plannedSummary.easySeconds)}</strong>
                    <span>Low intensity work</span>
                  </div>
                  <div className="dashboard-metric">
                    <p>Moderate / hard</p>
                    <strong>{formatDuration(plannedSummary.moderateHardSeconds)}</strong>
                    <span>Quality and strength</span>
                  </div>
                </div>
              </DashboardWidget>
            )}

            <DashboardWidget
              title="This week's workouts"
              eyebrow="Planned sessions"
              action={
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => navigate('/training-plan')}
                >
                  View plan
                </button>
              }
            >
              {upcomingWorkouts.length > 0 ? (
                <div className="dashboard-card-grid">
                  {upcomingWorkouts.slice(0, 4).map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={toWorkoutCardData(workout)}
                      onOpen={(workoutId) => navigate(`/workouts/${workoutId}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming workouts"
                  description="Generate a week plan with AI Coach to schedule sessions."
                  variant="inline"
                  action={
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => navigate('/ai-coach')}
                    >
                      Open AI Coach
                    </button>
                  }
                />
              )}
            </DashboardWidget>

            <DashboardWidget
              title="Recent activities"
              eyebrow="Training history"
              action={
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => navigate('/activities')}
                >
                  View all
                </button>
              }
            >
              {recentActivities.length > 0 ? (
                <>
                  <ActivitySummaryStats activities={recentActivities} />
                  <div className="list-stack">
                    {recentActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onOpen={(activityId) => navigate(`/activities/${activityId}`)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No recent activities"
                  description="Completed workouts will appear here once you import activity data."
                  variant="inline"
                />
              )}
            </DashboardWidget>
          </div>

          {/* Right / side column */}
          <div className="dashboard-col--side">
            <div className="side-stack">
              <section className="open-panel">
                <header className="open-panel__head">
                  <p className="open-panel__eyebrow">Focus</p>
                  <h2 className="open-panel__title">Active goal</h2>
                </header>
                {mainGoal ? (
                  <div className="dashboard-goal">
                    <div className="badge-row">
                      <span className="badge badge--priority badge--priority-main">Main goal</span>
                      {mainGoal.sport ? (
                        <SportBadge sport={mainGoal.sport as SportType} />
                      ) : null}
                    </div>
                    <h3>{mainGoal.title}</h3>
                    {mainGoal.description ? <p>{mainGoal.description}</p> : null}
                    {mainGoal.targetDate ? (
                      <span>Target: {formatDate(mainGoal.targetDate)}</span>
                    ) : null}
                    {(secondaryGoals.length > 0 || watchlistGoals.length > 0) && (
                      <ul className="dashboard-goal-list">
                        {[...secondaryGoals, ...watchlistGoals].map((goal) => (
                          <li key={goal.id} className="dashboard-goal-list__item">
                            <div className="dashboard-goal-list__meta">
                              <span className={`badge badge--priority badge--priority-${goal.priority === 'secondary_goal' ? 'secondary' : 'watchlist'}`}>
                                {goal.priority === 'secondary_goal' ? 'Secondary' : 'Watchlist'}
                              </span>
                              {goal.sport ? <SportBadge sport={goal.sport as SportType} /> : null}
                            </div>
                            <span className="dashboard-goal-list__title">{goal.title}</span>
                            {goal.targetDate ? (
                              <span className="dashboard-goal-list__date">{formatDate(goal.targetDate)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    title="No active goal"
                    description="Configure goals in your athlete profile to track progress."
                    variant="inline"
                  />
                )}
              </section>

              <section className="open-panel open-panel--linked">
                <header className="open-panel__head">
                  <p className="open-panel__eyebrow">Athlete profile</p>
                  <h2 className="open-panel__title">Primary sports</h2>
                </header>
                <div className="dashboard-sport-list">
                  {settings.athleteProfile.primarySports.map((sport) => (
                    <SportBadge key={sport} sport={sport as SportType} />
                  ))}
                </div>
              </section>
            </div>

            <div className="coach-block">
              <p className="coach-block__label">AI Coach</p>
              <p className="coach-block__body">
                {hasPlan
                  ? 'Your week is planned. Use AI Coach to generate individual workouts or adjust the current plan.'
                  : 'No plan for this week yet. Let AI Coach build a personalised training week based on your goals and availability.'}
              </p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate('/ai-coach')}
              >
                Open AI Coach →
              </button>
            </div>
          </div>
        </div>
        <DashboardChartsSection state={analyticsState} />
      </div>
    </PageShell>
  );
}

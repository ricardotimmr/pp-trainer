import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  EmptyState,
  ErrorState,
  LoadingState,
  SportBadge,
  WorkoutCard,
} from '../components';
import { DATA_MODE } from '../config/dataMode';
import { usePrototypeAthleteContext } from '../context/prototypeAthleteContextValue';
import { useDashboardApi } from '../hooks/useDashboardApi';
import type { WeekVolume } from '../hooks/useDashboardApi';
import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';
import type { SportType } from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';
import {
  formatDate,
  formatDistance,
  formatDuration,
  goalPriorityLabels,
  sportLabels,
} from '../components/prototypeFormatters';

type WeekBalancePanelProps = {
  plannedSeconds: number;
  completedSeconds: number;
  remainingSeconds: number;
  sportSplit: {
    sport: SportType;
    durationSeconds: number;
  }[];
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
          <dd>{formatDuration(remainingSeconds)}</dd>
        </div>
      </dl>
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
    </section>
  );
}

type SportSplitItem = { sport: SportType; durationSeconds: number };

function WeekCompletedPanel({
  weekVolume,
}: {
  weekVolume: WeekVolume;
}) {
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

function DashboardApiMode({ navigate }: PageComponentProps) {
  const state = useDashboardApi();

  if (state.status === 'loading') {
    return (
      <PageShell title="Dashboard" description="Loading from local backend...">
        <LoadingState title="Loading dashboard" description="Fetching from local backend..." />
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

  const { recentActivities, weekVolume, weekStart, weekEnd } = state;

  return (
    <PageShell
      title="Dashboard"
      description="Current week activity volume and recent activities from the local backend."
      actions={
        <button
          type="button"
          className="button button--secondary"
          onClick={() => navigate('/activities')}
        >
          View activities
        </button>
      }
    >
      <div className="dashboard-page">
        <section className="dashboard-hero" aria-label="Current training week">
          <div className="dashboard-hero__intro">
            <p className="dashboard-hero__eyebrow">
              {formatDate(weekStart)} to {formatDate(weekEnd)}
            </p>
            <h2>Current week</h2>
            <p>No active training plan.</p>
          </div>
          <WeekCompletedPanel weekVolume={weekVolume} />
        </section>

        <div className="dashboard-layout">
          <div className="dashboard-col--main">
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
                  description="Completed training will appear here once activity data exists."
                  variant="inline"
                />
              )}
            </DashboardWidget>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function DashboardPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <DashboardApiMode navigate={navigate} params={params} />;
  }
  return <DashboardPageMock navigate={navigate} params={params} />;
}

function DashboardPageMock({ navigate }: PageComponentProps) {
  const dashboard = getDashboardSummary();
  const { mainGoal, secondaryGoals, watchlistGoals } =
    usePrototypeAthleteContext();
  const isLoading = false;
  const week = dashboard.currentWeek;
  const plannedSeconds = week.plannedDurationSeconds ?? 0;
  const completedSeconds = week.completedPlannedDurationSeconds ?? 0;
  const remainingSeconds = Math.max(plannedSeconds - completedSeconds, 0);
  const sportSplit = [
    {
      sport: 'cycling' as const,
      durationSeconds: week.cyclingDurationSeconds ?? 0,
    },
    {
      sport: 'running' as const,
      durationSeconds: week.runningDurationSeconds ?? 0,
    },
    {
      sport: 'swimming' as const,
      durationSeconds: week.swimmingDurationSeconds ?? 0,
    },
    {
      sport: 'strength' as const,
      durationSeconds: week.strengthDurationSeconds ?? 0,
    },
  ].filter((item) => item.durationSeconds > 0);

  if (isLoading) {
    return (
      <PageShell
        title="Dashboard"
        description="Preparing the current prototype dashboard from mock data."
      >
        <LoadingState
          title="Loading dashboard"
          description="The dashboard shell is ready while training overview data is prepared."
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      description={
        <>
          Prototype dashboard for {dashboard.athleteProfile.displayName}:
          current training week, recent activities, upcoming workouts and a
          short AI coach hint.
        </>
      }
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
              {formatDate(week.weekStartDate)} to {formatDate(week.weekEndDate)}
            </p>
            <h2>{dashboard.currentTrainingPlan.title}</h2>
            {dashboard.currentTrainingPlan.description ? (
              <p>{dashboard.currentTrainingPlan.description}</p>
            ) : null}
          </div>
          <WeekBalancePanel
            plannedSeconds={plannedSeconds}
            completedSeconds={completedSeconds}
            remainingSeconds={remainingSeconds}
            sportSplit={sportSplit}
          />
        </section>

        <div className="dashboard-layout">
          {/* Left / main column */}
          <div className="dashboard-col--main">
            <DashboardWidget title="Weekly summary" eyebrow="Training load">
              <div className="dashboard-metric-grid">
                <div className="dashboard-metric is-accent">
                  <p>Total duration</p>
                  <strong>{formatDuration(week.totalDurationSeconds)}</strong>
                  <span>Across all planned sports</span>
                </div>
                <div className="dashboard-metric">
                  <p>Total distance</p>
                  <strong>{formatDistance(week.totalDistanceMeters)}</strong>
                  <span>Bike, run and swim combined</span>
                </div>
                <div className="dashboard-metric">
                  <p>Easy</p>
                  <strong>{formatDuration(week.easyDurationSeconds)}</strong>
                  <span>Low intensity work</span>
                </div>
                <div className="dashboard-metric">
                  <p>Moderate / hard</p>
                  <strong>
                    {formatDuration(
                      (week.moderateDurationSeconds ?? 0) +
                        (week.hardDurationSeconds ?? 0),
                    )}
                  </strong>
                  <span>Quality and strength</span>
                </div>
              </div>
            </DashboardWidget>

            <DashboardWidget
              title="Upcoming workouts"
              eyebrow="Next sessions"
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
              {dashboard.upcomingWorkouts.length > 0 ? (
                <div className="dashboard-card-grid">
                  {dashboard.upcomingWorkouts.map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      onOpen={(workoutId) => navigate(`/workouts/${workoutId}`)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No upcoming workouts"
                  description="Planned workouts will appear here when the active week contains sessions."
                  variant="inline"
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
              {dashboard.recentActivities.length > 0 ? (
                <>
                  <ActivitySummaryStats activities={dashboard.recentActivities} />
                  <div className="list-stack">
                    {dashboard.recentActivities.slice(0, 3).map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onOpen={(activityId) =>
                          navigate(`/activities/${activityId}`)
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No recent activities"
                  description="Completed training will appear here once activity data exists."
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
                      {mainGoal.sport ? (
                        <SportBadge sport={mainGoal.sport} />
                      ) : null}
                      <span className="badge badge--source">
                        {goalPriorityLabels[mainGoal.priority]}
                      </span>
                      {secondaryGoals.length > 0 ? (
                        <span className="badge badge--goal badge--goal-secondary">
                          {secondaryGoals.length} secondary
                        </span>
                      ) : null}
                      {watchlistGoals.length > 0 ? (
                        <span className="badge badge--goal badge--goal-watchlist">
                          {watchlistGoals.length} watchlist
                        </span>
                      ) : null}
                    </div>
                    <h3>{mainGoal.title}</h3>
                    {mainGoal.description ? (
                      <p>{mainGoal.description}</p>
                    ) : null}
                    {mainGoal.targetDate ? (
                      <span>
                        Target: {formatDate(mainGoal.targetDate)}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="No active goal"
                    description="Athlete goals will appear here once configured."
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
                  {dashboard.athleteProfile.primarySports.map((sport) => (
                    <SportBadge key={sport} sport={sport} />
                  ))}
                </div>
              </section>
            </div>

            <div className="coach-block">
              <p className="coach-block__label">AI Coach · Hint</p>
              <p className="coach-block__body">{dashboard.aiCoachPreview.summary}</p>
              {dashboard.aiCoachPreview.rawText ? (
                <blockquote className="coach-block__quote">
                  {dashboard.aiCoachPreview.rawText}
                </blockquote>
              ) : null}
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate('/ai-coach')}
              >
                Open AI coach →
              </button>
            </div>

          </div>
        </div>
      </div>
    </PageShell>
  );
}

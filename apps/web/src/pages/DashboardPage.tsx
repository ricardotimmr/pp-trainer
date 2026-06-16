import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  EmptyState,
  LoadingState,
  SportBadge,
  WorkoutCard,
} from '../components';
import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';
import type { SportType } from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';
import {
  formatDate,
  formatDistance,
  formatDuration,
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

export function DashboardPage({ navigate }: PageComponentProps) {
  const dashboard = getDashboardSummary();
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
          <DashboardWidget
            title="Weekly summary"
            eyebrow="Training load"
            className="dashboard-widget--wide"
          >
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

          <DashboardWidget title="Active goal" eyebrow="Focus">
            {dashboard.activeGoal ? (
              <div className="dashboard-goal">
                <div className="badge-row">
                  {dashboard.activeGoal.sport ? (
                    <SportBadge sport={dashboard.activeGoal.sport} />
                  ) : null}
                  <span className="badge badge--source">
                    {dashboard.activeGoal.priority}
                  </span>
                </div>
                <h3>{dashboard.activeGoal.title}</h3>
                {dashboard.activeGoal.description ? (
                  <p>{dashboard.activeGoal.description}</p>
                ) : null}
                {dashboard.activeGoal.targetDate ? (
                  <span>
                    Target: {formatDate(dashboard.activeGoal.targetDate)}
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
          </DashboardWidget>

          <DashboardWidget title="Primary sports" eyebrow="Athlete profile">
            <div className="dashboard-sport-list">
              {dashboard.athleteProfile.primarySports.map((sport) => (
                <div key={sport}>
                  <SportBadge sport={sport} />
                  <span>{sportLabels[sport]}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>

          <DashboardWidget
            title="Upcoming workouts"
            eyebrow="Next sessions"
            className="dashboard-widget--wide"
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
            className="dashboard-widget--wide"
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

          <DashboardWidget
            title="AI coach hint"
            eyebrow="Static preview"
            action={
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigate('/ai-coach')}
              >
                Open AI coach
              </button>
            }
          >
            <div className="dashboard-coach">
              <p>{dashboard.aiCoachPreview.summary}</p>
              <blockquote>{dashboard.aiCoachPreview.rawText}</blockquote>
              <span>{dashboard.aiCoachPreview.validationStatus}</span>
            </div>
          </DashboardWidget>
        </div>
      </div>
    </PageShell>
  );
}

import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  WorkoutCard,
} from '../components';
import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

export function DashboardPage({ navigate }: PageComponentProps) {
  const dashboard = getDashboardSummary();

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
    >
      <div className="prototype-grid prototype-grid--dashboard">
        <DashboardWidget title="Current week" eyebrow="Training load">
          <ActivitySummaryStats activities={dashboard.recentActivities} />
        </DashboardWidget>

        <DashboardWidget title="Active goal" eyebrow="Focus">
          <p className="prototype-copy">
            {dashboard.activeGoal?.title ?? 'No active goal configured yet.'}
          </p>
          {dashboard.activeGoal?.description ? (
            <p className="prototype-muted">
              {dashboard.activeGoal.description}
            </p>
          ) : null}
        </DashboardWidget>

        <DashboardWidget title="Next workouts" eyebrow="Plan">
          <div className="stack">
            {dashboard.upcomingWorkouts.slice(0, 2).map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onOpen={(workoutId) => navigate(`/workouts/${workoutId}`)}
              />
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Recent activities" eyebrow="History">
          <div className="stack">
            {dashboard.recentActivities.slice(0, 2).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onOpen={(activityId) => navigate(`/activities/${activityId}`)}
              />
            ))}
          </div>
        </DashboardWidget>

        <DashboardWidget title="AI coach hint" eyebrow="Preview">
          <p className="prototype-copy">{dashboard.aiCoachPreview.summary}</p>
        </DashboardWidget>
      </div>
    </PageShell>
  );
}

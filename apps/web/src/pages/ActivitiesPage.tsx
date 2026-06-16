import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  EmptyState,
} from '../components';
import { PageShell } from '../layout/PageShell';
import {
  getActivities,
  getRecentActivities,
} from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

export function ActivitiesPage({ navigate }: PageComponentProps) {
  const activities = getActivities();
  const recentActivities = getRecentActivities(3);

  return (
    <PageShell
      title="Activities"
      description={
        <>
          Activity list placeholder with {recentActivities.length} mock
          activities ready for the first list implementation.
        </>
      }
      actions={
        <button
          type="button"
          className="button button--primary"
          onClick={() =>
            navigate(`/activities/${recentActivities[0]?.id ?? ''}`)
          }
        >
          Open first mock activity
        </button>
      }
    >
      {activities.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Imported, synced or mock activities will appear here once they are available."
        />
      ) : (
        <>
          <DashboardWidget title="Activity summary" eyebrow="Mock history">
            <ActivitySummaryStats activities={activities} />
          </DashboardWidget>

          <div className="list-stack" aria-label="Prototype activity list">
            {activities.slice(0, 6).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onOpen={(activityId) => navigate(`/activities/${activityId}`)}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

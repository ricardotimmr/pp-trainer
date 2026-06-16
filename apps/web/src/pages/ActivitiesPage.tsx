import { PageShell } from '../layout/PageShell';
import { getRecentActivities } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

export function ActivitiesPage({ navigate }: PageComponentProps) {
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
    />
  );
}

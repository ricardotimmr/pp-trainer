import { getRecentActivities } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { PlaceholderPage } from './PlaceholderPage';

export function ActivitiesPage({ navigate }: PageComponentProps) {
  const recentActivities = getRecentActivities(3);

  return (
    <PlaceholderPage title="Activities">
      <p>
        Activity list placeholder with {recentActivities.length} mock activities
        ready for the first list implementation.
      </p>
      <button
        type="button"
        onClick={() => navigate(`/activities/${recentActivities[0]?.id ?? ''}`)}
      >
        Open first mock activity
      </button>
    </PlaceholderPage>
  );
}

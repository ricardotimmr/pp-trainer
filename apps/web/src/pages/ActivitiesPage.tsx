import { useState } from 'react';
import {
  ActivityCard,
  ActivitySummaryStats,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../components';
import { DATA_MODE } from '../config/dataMode';
import { useActivitiesApi } from '../hooks/useActivitiesApi';
import { PageShell } from '../layout/PageShell';
import type { Activity } from '../mock/prototypeData.types';
import { getActivities } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

const PAGE_SIZE = 10;

type ActivitiesContentProps = {
  activities: Activity[];
  navigate: PageComponentProps['navigate'];
  description: string;
};

function ActivitiesContent({ activities, navigate, description }: ActivitiesContentProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(activities.length / PAGE_SIZE);
  const pageActivities = activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <PageShell title="Activities" description={description}>
      {activities.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Imported, synced or mock activities will appear here once they are available."
        />
      ) : (
        <>
          <ActivitySummaryStats activities={activities} />
          <div className="list-stack" aria-label="Activity list">
            {pageActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onOpen={(activityId) => navigate(`/activities/${activityId}`)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                ←
              </button>
              <span className="pagination__indicator">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="pagination__btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages - 1}
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

function ActivitiesApiMode({ navigate }: PageComponentProps) {
  const state = useActivitiesApi();

  if (state.status === 'loading') {
    return (
      <PageShell title="Activities" description="Loading from local backend...">
        <LoadingState title="Loading activities" description="Fetching from local backend..." />
      </PageShell>
    );
  }

  if (state.status === 'error') {
    return (
      <PageShell title="Activities" description="Could not load activities.">
        <ErrorState
          title="Could not load activities"
          description={state.message}
        />
      </PageShell>
    );
  }

  return (
    <ActivitiesContent
      activities={state.activities}
      navigate={navigate}
      description={`${state.activities.length} activities from the local backend.`}
    />
  );
}

function ActivitiesMockMode({ navigate }: PageComponentProps) {
  const activities = getActivities();

  return (
    <ActivitiesContent
      activities={activities}
      navigate={navigate}
      description={`Prototype activity log — ${activities.length} activities across all sports.`}
    />
  );
}

export function ActivitiesPage({ navigate }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <ActivitiesApiMode navigate={navigate} />;
  }
  return <ActivitiesMockMode navigate={navigate} />;
}

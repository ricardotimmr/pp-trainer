import { useState } from 'react';
import {
  ActivityCard,
  ActivitySummaryStats,
  EmptyState,
} from '../components';
import { PageShell } from '../layout/PageShell';
import { getActivities } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

const PAGE_SIZE = 10;

export function ActivitiesPage({ navigate }: PageComponentProps) {
  const activities = getActivities();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(activities.length / PAGE_SIZE);
  const pageActivities = activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <PageShell
      title="Activities"
      description={`Prototype activity log — ${activities.length} activities across all sports.`}
    >
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

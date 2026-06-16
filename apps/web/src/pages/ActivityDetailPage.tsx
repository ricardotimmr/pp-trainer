import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  SourceBadge,
  SportBadge,
} from '../components';
import { PageShell } from '../layout/PageShell';
import { getActivityById } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { NotFoundPage } from './NotFoundPage';

export function ActivityDetailPage({ params }: PageComponentProps) {
  const activity = params.id ? getActivityById(params.id) : undefined;

  if (!activity) {
    return <NotFoundPage />;
  }

  return (
    <PageShell
      title={activity.title ?? 'Activity Detail'}
      eyebrow="Activity detail"
      description={
        <>
          Detail placeholder for a {activity.sport} activity from{' '}
          {activity.sourceType} mock data.
        </>
      }
    >
      <div className="prototype-grid">
        <DashboardWidget title="Activity identity" eyebrow="Source agnostic">
          <div className="badge-row">
            <SportBadge sport={activity.sport} />
            <SourceBadge source={activity.sourceType} />
          </div>
          <ActivityCard activity={activity} />
        </DashboardWidget>

        <DashboardWidget title="Key stats" eyebrow="Summary">
          <ActivitySummaryStats activities={[activity]} />
        </DashboardWidget>

        {activity.notes ? (
          <DashboardWidget title="Notes" eyebrow="Athlete context">
            <p className="prototype-copy">{activity.notes}</p>
          </DashboardWidget>
        ) : null}
      </div>
    </PageShell>
  );
}

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
    />
  );
}

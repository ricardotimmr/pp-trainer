import { getActivityById } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';

export function ActivityDetailPage({ params }: PageComponentProps) {
  const activity = params.id ? getActivityById(params.id) : undefined;

  if (!activity) {
    return <NotFoundPage />;
  }

  return (
    <PlaceholderPage title={activity.title ?? 'Activity Detail'}>
      <p>
        Detail placeholder for a {activity.sport} activity from{' '}
        {activity.sourceType} mock data.
      </p>
    </PlaceholderPage>
  );
}

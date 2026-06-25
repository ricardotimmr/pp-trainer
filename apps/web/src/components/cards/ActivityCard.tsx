import type { Activity } from '../../types/domain';
import { SportBadge } from '../badges/SportBadge';
import { SourceBadge } from '../badges/SourceBadge';
import {
  formatDate,
  formatDistance,
  formatDuration,
  getActivityPrimaryMetric,
} from '../prototypeFormatters';

type ActivityCardProps = {
  activity: Activity;
  onOpen?: (activityId: string) => void;
};

export function ActivityCard({ activity, onOpen }: ActivityCardProps) {
  const content = (
    <>
      <div className="activity-card__main">
        <div className="activity-card__badges">
          <SportBadge sport={activity.sport} />
          <SourceBadge source={activity.sourceType} />
        </div>
        <h3>{activity.title ?? 'Untitled activity'}</h3>
        <p>{formatDate(activity.startTime)}</p>
      </div>
      <dl className="activity-card__metrics">
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(activity.durationSeconds)}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(activity.distanceMeters)}</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>{getActivityPrimaryMetric(activity)}</dd>
        </div>
      </dl>
    </>
  );

  if (!onOpen) {
    return <article className="activity-card">{content}</article>;
  }

  return (
    <button
      type="button"
      className="activity-card activity-card--button"
      onClick={() => onOpen(activity.id)}
    >
      {content}
    </button>
  );
}

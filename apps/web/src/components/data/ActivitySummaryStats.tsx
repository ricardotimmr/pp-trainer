import type { Activity } from '../../mock/prototypeData.types';
import { formatDistance, formatDuration } from '../prototypeFormatters';

type ActivitySummaryStatsProps = {
  activities: Activity[];
};

export function ActivitySummaryStats({
  activities,
}: ActivitySummaryStatsProps) {
  const totalDurationSeconds = activities.reduce(
    (sum, activity) => sum + activity.durationSeconds,
    0,
  );
  const totalDistanceMeters = activities.reduce(
    (sum, activity) => sum + (activity.distanceMeters ?? 0),
    0,
  );
  const averageHeartRateValues = activities
    .map((activity) => activity.averageHeartRateBpm)
    .filter((heartRate): heartRate is number => Boolean(heartRate));
  const averageHeartRate =
    averageHeartRateValues.length > 0
      ? Math.round(
          averageHeartRateValues.reduce((sum, value) => sum + value, 0) /
            averageHeartRateValues.length,
        )
      : undefined;

  return (
    <dl className="metric-strip" aria-label="Activity summary">
      <div className="metric">
        <dt>Activities</dt>
        <dd>{activities.length}</dd>
      </div>
      <div className="metric">
        <dt>Duration</dt>
        <dd>{formatDuration(totalDurationSeconds)}</dd>
      </div>
      <div className="metric">
        <dt>Distance</dt>
        <dd>{formatDistance(totalDistanceMeters)}</dd>
      </div>
      <div className="metric">
        <dt>Avg HR</dt>
        <dd>{averageHeartRate ? `${averageHeartRate} bpm` : 'n/a'}</dd>
      </div>
    </dl>
  );
}

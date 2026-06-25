import type { WorkoutIntensity, WorkoutStatus, SportType } from '../../types/domain';
import { IntensityBadge } from '../badges/IntensityBadge';
import { SportBadge } from '../badges/SportBadge';
import { WorkoutStatusBadge } from '../badges/WorkoutStatusBadge';
import {
  formatDate,
  formatDistance,
  formatDuration,
} from '../prototypeFormatters';

export type WorkoutCardData = {
  id: string;
  sport: SportType;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  title: string;
  objective?: string;
  description?: string;
  scheduledDate: string;
  scheduledStartTime?: string;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
};

type WorkoutCardProps = {
  workout: WorkoutCardData;
  onOpen?: (workoutId: string) => void;
  showDate?: boolean;
};

export function WorkoutCard({ workout, onOpen, showDate = true }: WorkoutCardProps) {
  const showIntensity = workout.sport !== 'strength' && workout.sport !== 'mobility';

  const content = (
    <>
      <div className="workout-card__topline">
        <SportBadge sport={workout.sport} />
        {showIntensity && <IntensityBadge intensity={workout.intensity} />}
        <WorkoutStatusBadge status={workout.status} />
      </div>
      <h3>{workout.title}</h3>
      <p>
        {workout.objective ??
          workout.description ??
          'Planned prototype workout'}
      </p>
      <dl className="workout-card__metrics">
        {showDate && (
          <div>
            <dt>Date</dt>
            <dd>
              {formatDate(workout.scheduledStartTime ?? workout.scheduledDate)}
            </dd>
          </div>
        )}
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(workout.plannedDurationSeconds)}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(workout.plannedDistanceMeters)}</dd>
        </div>
      </dl>
    </>
  );

  if (!onOpen) {
    return <article className="workout-card">{content}</article>;
  }

  return (
    <button
      type="button"
      className="workout-card workout-card--button"
      onClick={() => onOpen(workout.id)}
    >
      {content}
    </button>
  );
}

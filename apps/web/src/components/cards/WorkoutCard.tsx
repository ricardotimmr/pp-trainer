import type { PlannedWorkout } from '../../mock/prototypeData.types';
import { IntensityBadge } from '../badges/IntensityBadge';
import { SportBadge } from '../badges/SportBadge';
import {
  formatDate,
  formatDistance,
  formatDuration,
} from '../prototypeFormatters';

type WorkoutCardProps = {
  workout: PlannedWorkout;
  onOpen?: (workoutId: string) => void;
};

export function WorkoutCard({ workout, onOpen }: WorkoutCardProps) {
  const content = (
    <>
      <div className="workout-card__topline">
        <SportBadge sport={workout.sport} />
        <IntensityBadge intensity={workout.intensity} />
        <span className="workout-card__status">{workout.status}</span>
      </div>
      <h3>{workout.title}</h3>
      <p>
        {workout.objective ??
          workout.description ??
          'Planned prototype workout'}
      </p>
      <dl className="workout-card__metrics">
        <div>
          <dt>Date</dt>
          <dd>
            {formatDate(workout.scheduledStartTime ?? workout.scheduledDate)}
          </dd>
        </div>
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

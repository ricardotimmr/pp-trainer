import { getWorkoutById, getWorkoutSteps } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';

export function WorkoutDetailPage({ params }: PageComponentProps) {
  const workout = params.id ? getWorkoutById(params.id) : undefined;

  if (!workout) {
    return <NotFoundPage />;
  }

  const steps = getWorkoutSteps(workout.id);

  return (
    <PlaceholderPage title={workout.title}>
      <p>
        Workout detail placeholder with {steps.length} structured mock steps.
      </p>
    </PlaceholderPage>
  );
}

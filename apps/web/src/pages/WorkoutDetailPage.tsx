import { PageShell } from '../layout/PageShell';
import { getWorkoutById, getWorkoutSteps } from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { NotFoundPage } from './NotFoundPage';

export function WorkoutDetailPage({ params }: PageComponentProps) {
  const workout = params.id ? getWorkoutById(params.id) : undefined;

  if (!workout) {
    return <NotFoundPage />;
  }

  const steps = getWorkoutSteps(workout.id);

  return (
    <PageShell
      title={workout.title}
      eyebrow="Workout detail"
      description={
        <>
          Workout detail placeholder with {steps.length} structured mock steps.
        </>
      }
    />
  );
}

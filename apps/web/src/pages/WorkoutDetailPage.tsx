import {
  DashboardWidget,
  IntensityBadge,
  SportBadge,
  WorkoutCard,
  WorkoutStepList,
} from '../components';
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
    >
      <div className="prototype-grid">
        <DashboardWidget title="Workout overview" eyebrow="Planned session">
          <div className="badge-row">
            <SportBadge sport={workout.sport} />
            <IntensityBadge intensity={workout.intensity} />
          </div>
          <WorkoutCard workout={workout} />
        </DashboardWidget>

        {workout.coachNotes ? (
          <DashboardWidget title="Coach notes" eyebrow="Context">
            <p className="prototype-copy">{workout.coachNotes}</p>
          </DashboardWidget>
        ) : null}

        <DashboardWidget title="Workout steps" eyebrow="Structure">
          <WorkoutStepList steps={steps} />
        </DashboardWidget>
      </div>
    </PageShell>
  );
}

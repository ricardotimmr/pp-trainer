import { PageShell } from '../layout/PageShell';
import {
  getCurrentTrainingPlan,
  getPlannedWorkouts,
} from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

export function TrainingPlanPage({ navigate }: PageComponentProps) {
  const trainingPlan = getCurrentTrainingPlan();
  const plannedWorkouts = getPlannedWorkouts();

  return (
    <PageShell
      title="Training Plan"
      description={
        <>
          {trainingPlan.title} placeholder with {plannedWorkouts.length} planned
          workouts ready for the week view.
        </>
      }
      actions={
        <button
          type="button"
          className="button button--primary"
          onClick={() => navigate(`/workouts/${plannedWorkouts[0]?.id ?? ''}`)}
        >
          Open first mock workout
        </button>
      }
    />
  );
}

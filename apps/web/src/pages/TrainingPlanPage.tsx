import {
  getCurrentTrainingPlan,
  getPlannedWorkouts,
} from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';
import { PlaceholderPage } from './PlaceholderPage';

export function TrainingPlanPage({ navigate }: PageComponentProps) {
  const trainingPlan = getCurrentTrainingPlan();
  const plannedWorkouts = getPlannedWorkouts();

  return (
    <PlaceholderPage title="Training Plan">
      <p>
        {trainingPlan.title} placeholder with {plannedWorkouts.length} planned
        workouts ready for the week view.
      </p>
      <button
        type="button"
        onClick={() => navigate(`/workouts/${plannedWorkouts[0]?.id ?? ''}`)}
      >
        Open first mock workout
      </button>
    </PlaceholderPage>
  );
}

import { DashboardWidget, EmptyState, WorkoutCard } from '../components';
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
    >
      <DashboardWidget title={trainingPlan.title} eyebrow="Active plan">
        {trainingPlan.description ? (
          <p className="prototype-copy">{trainingPlan.description}</p>
        ) : null}
        {plannedWorkouts.length === 0 ? (
          <EmptyState
            title="No planned workouts"
            description="The active prototype plan does not contain scheduled workouts yet."
            variant="inline"
          />
        ) : (
          <div className="list-stack" aria-label="Prototype training plan">
            {plannedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onOpen={(workoutId) => navigate(`/workouts/${workoutId}`)}
              />
            ))}
          </div>
        )}
      </DashboardWidget>
    </PageShell>
  );
}

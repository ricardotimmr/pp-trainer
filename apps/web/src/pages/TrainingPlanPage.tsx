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
          {trainingPlan.title} — {plannedWorkouts.length} sessions planned this
          week. Open any workout for the full structured session view.
        </>
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

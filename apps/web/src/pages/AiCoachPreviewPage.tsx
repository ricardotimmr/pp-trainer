import { DashboardWidget, EmptyState, WorkoutCard } from '../components';
import { PageShell } from '../layout/PageShell';
import {
  getDashboardSummary,
  getWorkoutById,
} from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

export function AiCoachPreviewPage({ navigate }: PageComponentProps) {
  const { aiCoachPreview } = getDashboardSummary();
  const createdWorkout = aiCoachPreview.createdPlannedWorkoutId
    ? getWorkoutById(aiCoachPreview.createdPlannedWorkoutId)
    : undefined;

  return (
    <PageShell title="AI Coach Preview" description={aiCoachPreview.summary}>
      <div className="prototype-grid">
        <DashboardWidget title="Mock recommendation" eyebrow="Static output">
          <p className="prototype-copy">{aiCoachPreview.rawText}</p>
        </DashboardWidget>

        {createdWorkout ? (
          <DashboardWidget title="Generated workout example" eyebrow="Preview">
            <WorkoutCard
              workout={createdWorkout}
              onOpen={(workoutId) => navigate(`/workouts/${workoutId}`)}
            />
          </DashboardWidget>
        ) : (
          <DashboardWidget title="Generated workout example" eyebrow="Preview">
            <EmptyState
              title="No generated workout"
              description="This mock AI output does not point to a planned workout."
              variant="inline"
            />
          </DashboardWidget>
        )}
      </div>
    </PageShell>
  );
}

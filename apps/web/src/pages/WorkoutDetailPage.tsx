import {
  ErrorState,
  IntensityBadge,
  LoadingState,
  SportBadge,
  WorkoutStepList,
} from '../components';
import type { WorkoutStepData } from '../components';
import { WorkoutStatusBadge } from '../components/badges/WorkoutStatusBadge';
import { stepTypeLabels } from '../components/data/workoutStepLabels';
import { formatDate, formatDistance, formatDuration } from '../components/prototypeFormatters';
import { DATA_MODE } from '../config/dataMode';
import { useWorkout } from '../hooks/useWorkout';
import { PageShell } from '../layout/PageShell';
import { getWorkoutById, getWorkoutSteps } from '../mock/prototypeData.helpers';
import type {
  SportType,
  WorkoutIntensity,
  WorkoutStatus,
} from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';

type WorkoutDetailData = {
  id: string;
  title: string;
  sport: SportType;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  scheduledDate: string;
  scheduledStartTime?: string;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  objective?: string;
  description?: string;
  coachNotes?: string;
};

type WorkoutDetailContentProps = {
  workout: WorkoutDetailData;
  steps: WorkoutStepData[];
};

function WorkoutDetailContent({ workout, steps }: WorkoutDetailContentProps) {
  const formattedDate = formatDate(workout.scheduledStartTime ?? workout.scheduledDate);

  const stepsWithDuration = steps.filter((s) => s.durationSeconds);
  const totalStepSeconds = stepsWithDuration.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);

  return (
    <PageShell
      title={workout.title}
      eyebrow={`Workout · ${formattedDate}`}
      description={
        workout.objective ? (
          <span className="workout-detail__objective">{workout.objective}</span>
        ) : undefined
      }
    >
      <dl className="workout-detail__meta">
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(workout.plannedDurationSeconds)}</dd>
        </div>
        {workout.plannedDistanceMeters ? (
          <div>
            <dt>Distance</dt>
            <dd>{formatDistance(workout.plannedDistanceMeters)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Sport</dt>
          <dd>
            <SportBadge sport={workout.sport} />
          </dd>
        </div>
        <div>
          <dt>Intensity</dt>
          <dd>
            <IntensityBadge intensity={workout.intensity} />
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <WorkoutStatusBadge status={workout.status} />
          </dd>
        </div>
      </dl>

      {workout.coachNotes ? (
        <blockquote className="workout-detail__notes">{workout.coachNotes}</blockquote>
      ) : null}

      <div className="workout-detail__steps">
        <p className="workout-detail__steps-label">Session structure</p>

        {stepsWithDuration.length > 0 ? (
          <div className="session-bar" aria-hidden="true" title="Session structure overview">
            {stepsWithDuration.map((step) => (
              <div
                key={step.id}
                className={`session-bar__segment session-bar__segment--${step.stepType}`}
                style={{ flex: step.durationSeconds }}
                title={`${stepTypeLabels[step.stepType]}: ${formatDuration(step.durationSeconds)}`}
              />
            ))}
            {totalStepSeconds < (workout.plannedDurationSeconds ?? 0) && (
              <div
                className="session-bar__segment session-bar__segment--other"
                style={{ flex: (workout.plannedDurationSeconds ?? 0) - totalStepSeconds }}
              />
            )}
          </div>
        ) : null}

        <WorkoutStepList steps={steps} />
      </div>
    </PageShell>
  );
}

function WorkoutDetailMockMode({ params }: PageComponentProps) {
  const workout = params.id ? getWorkoutById(params.id) : undefined;

  if (!workout) {
    return (
      <PageShell
        title="Workout not found"
        eyebrow="Workout detail"
        description="The requested workout does not exist in the current prototype data."
      >
        <ErrorState
          title="Unknown workout"
          description={
            <>
              No mock workout was found for ID <strong>{params.id}</strong>.
            </>
          }
        />
      </PageShell>
    );
  }

  const steps = getWorkoutSteps(workout.id);

  return (
    <WorkoutDetailContent
      workout={workout as WorkoutDetailData}
      steps={steps as WorkoutStepData[]}
    />
  );
}

function WorkoutDetailApiMode({ params }: PageComponentProps) {
  const id = params.id ?? '';
  const state = useWorkout(id);

  if (state.status === 'loading') {
    return (
      <PageShell title="Workout" eyebrow="Workout detail">
        <LoadingState title="Loading workout" description="Fetching from local backend..." />
      </PageShell>
    );
  }

  if (state.status === 'error') {
    return (
      <PageShell title="Workout not found" eyebrow="Workout detail">
        <ErrorState
          title="Workout not found"
          description={state.message}
          action={
            <a href="/training" className="btn btn--secondary">
              Back to Training Plan
            </a>
          }
        />
      </PageShell>
    );
  }

  const { workout } = state;

  return (
    <WorkoutDetailContent
      workout={workout as WorkoutDetailData}
      steps={workout.steps as WorkoutStepData[]}
    />
  );
}

export function WorkoutDetailPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <WorkoutDetailApiMode navigate={navigate} params={params} />;
  }
  return <WorkoutDetailMockMode navigate={navigate} params={params} />;
}

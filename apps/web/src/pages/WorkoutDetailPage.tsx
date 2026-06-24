import { useEffect, useRef, useState } from 'react';

import type { PlannedWorkoutDto, UpdateWorkoutStatusRequest, WorkoutStepDto } from '@pp-trainer/shared';

import {
  AiBadge,
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
import { deleteWorkout, updateWorkoutStatus } from '../api/trainingApi';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
import { useWorkout } from '../hooks/useWorkout';
import { PageShell } from '../layout/PageShell';
import { getWorkoutById, getWorkoutSteps } from '../mock/prototypeData.helpers';
import type {
  SportType,
  WorkoutIntensity,
} from '../mock/prototypeData.types';
import type { PageComponentProps } from '../routes/routeTypes';

type WorkoutStatus = PlannedWorkoutDto['status'];

// Strips the old "[HR: Zone 2]" embedded format as a backwards-compat fallback.
function extractZoneFromInstruction(instruction: string): { instruction: string; zoneName?: string } {
  const match = instruction.match(/^(.*?)\s*\[([^\]]+)\]\s*$/s);
  if (match) return { instruction: match[1].trimEnd(), zoneName: match[2] };
  return { instruction };
}

function mapStepDto(step: WorkoutStepDto): WorkoutStepData {
  const { instruction, zoneName: embedded } = extractZoneFromInstruction(step.instruction);
  return {
    id: step.id,
    stepIndex: step.stepIndex,
    stepType: step.stepType as WorkoutStepData['stepType'],
    title: step.title,
    instruction,
    zoneName: step.notes ?? embedded,
    durationSeconds: step.durationSeconds,
    distanceMeters: step.distanceMeters,
    repetitions: step.repetitions,
    restSeconds: step.restSeconds,
    targetPowerLowerWatts: step.targetPowerLowerWatts,
    targetPowerUpperWatts: step.targetPowerUpperWatts,
    targetPaceLowerSecPerKm: step.targetPaceLowerSecPerKm,
    targetPaceUpperSecPerKm: step.targetPaceUpperSecPerKm,
    targetSwimPaceLowerSecPer100m: step.targetSwimPaceLowerSecPer100m,
    targetSwimPaceUpperSecPer100m: step.targetSwimPaceUpperSecPer100m,
  };
}

type WorkoutDetailData = {
  id: string;
  title: string;
  sport: SportType;
  intensity: WorkoutIntensity;
  status: WorkoutStatus;
  source?: string;
  scheduledDate: string;
  scheduledStartTime?: string;
  plannedDurationSeconds?: number;
  plannedDistanceMeters?: number;
  objective?: string;
  description?: string;
  coachNotes?: string;
};

type StatusAction = { label: string; next: WorkoutStatus };

function getStatusActions(status: WorkoutStatus): StatusAction[] {
  if (status === 'planned') {
    return [
      { label: 'Mark as Completed', next: 'completed' },
      { label: 'Mark as Missed', next: 'missed' },
      { label: 'Cancel', next: 'cancelled' },
    ];
  }
  if (status === 'completed' || status === 'missed') {
    return [{ label: 'Reset to Planned', next: 'planned' }];
  }
  if (status === 'cancelled') {
    return [{ label: 'Reopen as Planned', next: 'planned' }];
  }
  if (status === 'moved' || status === 'adjusted') {
    return [{ label: 'Reset to Planned', next: 'planned' }];
  }
  return [];
}

type WorkoutStatusActionsProps = {
  workoutId: string;
  status: WorkoutStatus;
  onSuccess: (updated: PlannedWorkoutDto) => void;
};

function WorkoutStatusActions({ workoutId, status, onSuccess }: WorkoutStatusActionsProps) {
  const [loading, setLoading] = useState<WorkoutStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = getStatusActions(status);
  if (actions.length === 0) return null;

  async function handleAction(next: WorkoutStatus) {
    setError(null);
    setLoading(next);
    try {
      const payload: UpdateWorkoutStatusRequest = { status: next };
      const updated = await updateWorkoutStatus(workoutId, payload);
      onSuccess(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="wd-status-actions">
      {actions.map(({ label, next }) => (
        <button
          key={next}
          type="button"
          className={`btn btn--sm wd-status-actions__btn wd-status-actions__btn--${next}`}
          disabled={loading !== null}
          onClick={() => handleAction(next)}
        >
          {loading === next ? '…' : label}
        </button>
      ))}
      {error && <p className="wd-status-actions__error">{error}</p>}
    </div>
  );
}

type WorkoutDetailContentProps = {
  workout: WorkoutDetailData;
  steps: WorkoutStepData[];
  statusActions?: React.ReactNode;
  deleteAction?: React.ReactNode;
};

function WorkoutDetailContent({ workout, steps, statusActions, deleteAction }: WorkoutDetailContentProps) {
  const formattedDate = formatDate(workout.scheduledStartTime ?? workout.scheduledDate);

  const stepBarFlex = (s: WorkoutStepData) => s.durationSeconds ?? s.distanceMeters ?? 0;
  const hasBarData = steps.some((s) => stepBarFlex(s) > 0);
  const hasDistanceOnlyStep = steps.some((s) => !s.durationSeconds && (s.distanceMeters ?? 0) > 0);
  const totalStepSeconds = steps.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);

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
        {workout.source === 'ai_generated' && (
          <div>
            <dt>Source</dt>
            <dd><AiBadge /></dd>
          </div>
        )}
      </dl>

      {statusActions}

      {deleteAction}

      {workout.coachNotes ? (
        <blockquote className="workout-detail__notes">{workout.coachNotes}</blockquote>
      ) : null}

      <div className="workout-detail__steps">
        <p className="workout-detail__steps-label">Session structure</p>

        {hasBarData && (
          <div className="session-bar" aria-hidden="true" title="Session structure overview">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`session-bar__segment session-bar__segment--${step.stepType}`}
                style={{ flex: stepBarFlex(step) }}
                title={`${stepTypeLabels[step.stepType]}: ${formatDuration(step.durationSeconds)}`}
              />
            ))}
            {!hasDistanceOnlyStep && totalStepSeconds < (workout.plannedDurationSeconds ?? 0) && (
              <div
                className="session-bar__segment session-bar__segment--other"
                style={{ flex: (workout.plannedDurationSeconds ?? 0) - totalStepSeconds }}
              />
            )}
          </div>
        )}

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

function WorkoutDeleteAction({
  workoutId,
  navigate,
  onDeleted,
}: {
  workoutId: string;
  navigate: PageComponentProps['navigate'];
  onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      await deleteWorkout(workoutId);
      onDeleted();
      navigate('/training-plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout.');
      setLoading(false);
    }
  }

  return (
    <div className="wd-delete-action">
      {confirm ? (
        <div className="wd-delete-action__confirm">
          <span className="wd-delete-action__confirm-label">Delete this workout?</span>
          <button
            type="button"
            className="btn btn--sm btn--danger"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? '…' : 'Yes, delete'}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            disabled={loading}
            onClick={() => setConfirm(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--sm btn--ghost wd-delete-action__trigger"
          onClick={() => setConfirm(true)}
        >
          Delete workout
        </button>
      )}
      {error && <p className="wd-status-actions__error">{error}</p>}
    </div>
  );
}

function WorkoutDetailApiMode({ params, navigate }: PageComponentProps) {
  const id = params.id ?? '';
  const { refresh: refreshWeekPlan } = useCurrentWeekPlan();
  const state = useWorkout(id);
  const [workoutOverride, setWorkoutOverride] = useState<PlannedWorkoutDto | null>(null);

  // L8: clear the local override once the hook delivers fresh data after a refresh
  const hookWorkout = state.status === 'success' ? state.workout : null;
  const prevHookWorkout = useRef(hookWorkout);
  useEffect(() => {
    if (hookWorkout !== null && hookWorkout !== prevHookWorkout.current) {
      prevHookWorkout.current = hookWorkout;
      setWorkoutOverride(null);
    }
  }, [hookWorkout]);

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

  const workout = workoutOverride ?? state.workout;

  function handleStatusSuccess(updated: PlannedWorkoutDto) {
    setWorkoutOverride(updated);
    state.refresh();
    refreshWeekPlan();
  }

  return (
    <WorkoutDetailContent
      workout={workout as WorkoutDetailData}
      steps={workout.steps.map(mapStepDto)}
      statusActions={
        <WorkoutStatusActions
          workoutId={id}
          status={workout.status}
          onSuccess={handleStatusSuccess}
        />
      }
      deleteAction={
        <WorkoutDeleteAction
          workoutId={id}
          navigate={navigate}
          onDeleted={refreshWeekPlan}
        />
      }
    />
  );
}

export function WorkoutDetailPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <WorkoutDetailApiMode navigate={navigate} params={params} />;
  }
  return <WorkoutDetailMockMode navigate={navigate} params={params} />;
}

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

import type { ActivitySummaryDto, PlannedWorkoutDto, UpdateWorkoutStatusRequest, WorkoutStepDto } from '@pp-trainer/shared';

import {
  AiBadge,
  EmptyState,
  ErrorState,
  IntensityBadge,
  LoadingState,
  SportBadge,
  WorkoutStepList,
} from '../components';
import type { WorkoutStepData } from '../components';
import { WorkoutStatusBadge } from '../components/badges/WorkoutStatusBadge';
import { stepTypeLabels } from '../components/data/workoutStepLabels';
import {
  getSessionBarSegments,
  getSessionBarTotalFlex,
  hasDistanceOnlySessionStep,
  hasSessionBarData,
} from '../components/data/workoutSessionBar';
import { formatDate, formatDistance, formatDuration } from '../components/prototypeFormatters';
import { fetchActivitiesForWeek } from '../api/activitiesApi';
import { ApiClientError } from '../api/apiClient';
import { toast } from 'sonner';

import { deleteWorkout, linkWorkoutActivity, unlinkWorkoutActivity, updateWorkoutStatus } from '../api/trainingApi';
import { useCurrentWeekPlan } from '../hooks/useCurrentWeekPlan';
import { useWorkout } from '../hooks/useWorkout';
import { PageShell } from '../layout/PageShell';
import type { SportType, WorkoutIntensity } from '../types/domain';
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
      toast.success(`Workout marked as ${next}`);
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

function getWorkoutWeekRange(dateStr: string): { weekStart: string; weekEnd: string } {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const daysFromMonday = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const s = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start);
  const e = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(end);
  return `${s} – ${e}`;
}

function formatActivityMeta(activity: ActivitySummaryDto): string {
  const parts = [formatDate(activity.startTime)];
  if (activity.metrics.distanceMeters != null) {
    parts.push(`${(activity.metrics.distanceMeters / 1000).toFixed(1)} km`);
  }
  parts.push(formatDuration(activity.metrics.durationSeconds));
  return parts.join(' · ');
}

type ActivityPickerModalProps = {
  workout: PlannedWorkoutDto;
  linkedActivityIds: string[];
  linking: boolean;
  onClose: () => void;
  onSelect: (activityId: string) => Promise<void>;
};

function ActivityPickerModal({
  workout,
  linkedActivityIds,
  linking,
  onClose,
  onSelect,
}: ActivityPickerModalProps) {
  const { weekStart, weekEnd } = getWorkoutWeekRange(workout.scheduledDate);
  const linkedActivityIdsKey = linkedActivityIds.join('|');
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'success'; activities: ActivitySummaryDto[] }
    | { status: 'error'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const linkedIds = new Set(linkedActivityIdsKey ? linkedActivityIdsKey.split('|') : []);
    fetchActivitiesForWeek(weekStart, weekEnd)
      .then((activities) => {
        if (cancelled) return;
        setState({
          status: 'success',
          activities: activities
            .filter((activity) => !linkedIds.has(activity.id))
            .sort((a, b) => {
              if (a.sport === workout.sport && b.sport !== workout.sport) return -1;
              if (a.sport !== workout.sport && b.sport === workout.sport) return 1;
              return b.startTime.localeCompare(a.startTime);
            }),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load activities.',
        });
      });
    return () => { cancelled = true; };
  }, [linkedActivityIdsKey, weekEnd, weekStart, workout.sport]);

  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onClose}>
      <div className="cw-modal tp-activity-picker" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <div>
            <h3>Link activity</h3>
            <p className="tp-activity-picker__subtitle">
              {workout.title} · {formatWeekRange(weekStart, weekEnd)}
            </p>
          </div>
          <button type="button" className="cw-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="cw-modal__body">
          {state.status === 'loading' && (
            <LoadingState title="Loading activities" description="Finding imported activities from this workout week." variant="inline" />
          )}
          {state.status === 'error' && (
            <ErrorState title="Could not load activities" description={state.message} variant="inline" />
          )}
          {state.status === 'success' && state.activities.length === 0 && (
            <EmptyState
              title="No linkable activities"
              description="No unlinked activities were found for this workout week."
            />
          )}
          {state.status === 'success' && state.activities.length > 0 && (
            <ul className="tp-activity-picker__list">
              {state.activities.map((activity) => {
                const isSportMatch = activity.sport === workout.sport;
                return (
                  <li key={activity.id} className="tp-activity-picker__item">
                    <button
                      type="button"
                      className="tp-activity-picker__button"
                      disabled={linking}
                      onClick={() => onSelect(activity.id)}
                    >
                      <SportBadge sport={activity.sport} />
                      <span className="tp-activity-picker__info">
                        <span className="tp-activity-picker__title">
                          {activity.title ?? 'Imported activity'}
                        </span>
                        <span className="tp-activity-picker__meta">{formatActivityMeta(activity)}</span>
                      </span>
                      {isSportMatch && <span className="tp-activity-picker__match">Sport match</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type WorkoutFulfillmentActionsProps = {
  workout: PlannedWorkoutDto;
  linking: boolean;
  unlinking: boolean;
  onOpenPicker: () => void;
  onUnlink: () => void;
  navigate: PageComponentProps['navigate'];
};

function WorkoutFulfillmentActions({
  workout,
  linking,
  unlinking,
  onOpenPicker,
  onUnlink,
  navigate,
}: WorkoutFulfillmentActionsProps) {
  const canLink = workout.status === 'planned' || workout.status === 'completed';
  const linkedActivityId = workout.activityId;
  const isLinked = linkedActivityId != null;

  if (!canLink && !isLinked) return null;

  return (
    <div className={`tp-fulfillment${isLinked ? ' is-linked' : ''}`}>
      {isLinked ? (
        <>
          <button
            type="button"
            className="tp-fulfillment__indicator"
            onClick={() => navigate(`/activities/${linkedActivityId}`)}
          >
            <span className="tp-fulfillment__dot" aria-hidden="true" />
            Linked activity
          </button>
          <button
            type="button"
            className="tp-fulfillment__action"
            disabled={unlinking}
            onClick={onUnlink}
          >
            {unlinking ? 'Unlinking…' : 'Unlink'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="tp-fulfillment__action"
          disabled={linking}
          onClick={onOpenPicker}
        >
          {linking ? 'Linking…' : 'Link activity'}
        </button>
      )}
    </div>
  );
}

type WorkoutDetailContentProps = {
  workout: WorkoutDetailData;
  steps: WorkoutStepData[];
  statusActions?: React.ReactNode;
  fulfillmentActions?: React.ReactNode;
  deleteAction?: React.ReactNode;
};

function WorkoutDetailContent({ workout, steps, statusActions, fulfillmentActions, deleteAction }: WorkoutDetailContentProps) {
  const formattedDate = formatDate(workout.scheduledStartTime ?? workout.scheduledDate);

  const barSegments = getSessionBarSegments(steps);
  const hasBarData = hasSessionBarData(barSegments);
  const hasDistanceOnlyStep = hasDistanceOnlySessionStep(steps);
  const totalStepSeconds = getSessionBarTotalFlex(barSegments);

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

      {fulfillmentActions}

      {deleteAction}

      {workout.coachNotes ? (
        <blockquote className="workout-detail__notes">{workout.coachNotes}</blockquote>
      ) : null}

      <div className="workout-detail__steps">
        <p className="workout-detail__steps-label">Session structure</p>

        {hasBarData && (
          <div className="session-bar" aria-hidden="true" title="Session structure overview">
            {barSegments.map((segment) => (
              <div
                key={segment.key}
                className={`session-bar__segment session-bar__segment--${segment.stepType}`}
                style={{ flex: segment.flex }}
                title={segment.kind === 'rest'
                  ? `Rest: ${formatDuration(segment.flex)}`
                  : `${stepTypeLabels[segment.step.stepType]}: ${formatDuration((segment.step.durationSeconds ?? 0) * (segment.step.repetitions ?? 1))}`}
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

function getLinkedActivityConflictId(error: unknown): string | null {
  if (!(error instanceof ApiClientError) || error.status !== 409) return null;
  const details = error.details;
  if (
    details != null &&
    typeof details === 'object' &&
    'linkedActivityId' in details &&
    typeof details.linkedActivityId === 'string'
  ) {
    return details.linkedActivityId;
  }
  return null;
}

function LinkedWorkoutDeleteWarning({
  linkedActivityId,
  deleting,
  onCancel,
  onConfirm,
}: {
  linkedActivityId: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return createPortal(
    <div className="cw-modal-overlay" onPointerDown={onCancel}>
      <div className="cw-modal tp-delete-warning" onPointerDown={(e) => e.stopPropagation()}>
        <div className="cw-modal__header">
          <h3>Delete linked workout?</h3>
          <button type="button" className="cw-modal__close" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <div className="cw-modal__body">
          <p className="tp-delete-warning__copy">
            This workout is linked to an activity. Deleting it will not delete the activity. Continue?
          </p>
          <p className="tp-delete-warning__meta">Linked activity: {linkedActivityId}</p>
          <div className="cw-modal__footer">
            <button type="button" className="btn btn--secondary btn--sm" onClick={onCancel} disabled={deleting}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={onConfirm} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete anyway'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
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
  const [linkedConflictId, setLinkedConflictId] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    try {
      await deleteWorkout(workoutId);
      onDeleted();
      toast.success('Workout deleted');
      navigate('/training-plan');
    } catch (err) {
      const conflictId = getLinkedActivityConflictId(err);
      if (conflictId) {
        setConfirm(false);
        setLinkedConflictId(conflictId);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete workout.');
      }
      setLoading(false);
    }
  }

  async function handleForceDelete() {
    setError(null);
    setLoading(true);
    try {
      await deleteWorkout(workoutId, { force: true });
      onDeleted();
      toast.success('Workout deleted');
      navigate('/training-plan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout.');
      setLoading(false);
    }
  }

  return (
    <>
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
      {linkedConflictId && (
        <LinkedWorkoutDeleteWarning
          linkedActivityId={linkedConflictId}
          deleting={loading}
          onCancel={() => setLinkedConflictId(null)}
          onConfirm={handleForceDelete}
        />
      )}
    </>
  );
}

function WorkoutDetailApiMode({ params, navigate }: PageComponentProps) {
  const id = params.id ?? '';
  const { refresh: refreshWeekPlan } = useCurrentWeekPlan();
  const state = useWorkout(id);
  const [workoutOverride, setWorkoutOverride] = useState<PlannedWorkoutDto | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

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

  async function handleLinkActivity(activityId: string) {
    setLinking(true);
    try {
      const updated = await linkWorkoutActivity(id, activityId);
      setPickerOpen(false);
      handleStatusSuccess(updated);
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkActivity() {
    setUnlinking(true);
    try {
      const updated = await unlinkWorkoutActivity(id);
      handleStatusSuccess(updated);
    } finally {
      setUnlinking(false);
    }
  }

  const linkedActivityIds = workout.activityId != null ? [workout.activityId] : [];

  return (
    <>
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
        fulfillmentActions={
          <WorkoutFulfillmentActions
            workout={workout}
            linking={linking}
            unlinking={unlinking}
            onOpenPicker={() => setPickerOpen(true)}
            onUnlink={handleUnlinkActivity}
            navigate={navigate}
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
      {pickerOpen && (
        <ActivityPickerModal
          workout={workout}
          linkedActivityIds={linkedActivityIds}
          linking={linking}
          onClose={() => setPickerOpen(false)}
          onSelect={handleLinkActivity}
        />
      )}
    </>
  );
}

export function WorkoutDetailPage({ navigate, params }: PageComponentProps) {
  return <WorkoutDetailApiMode navigate={navigate} params={params} />;
}

import { useState } from 'react';

import type { AiCoachOutputDto, AiGeneratedWorkoutStep, PlannedWorkoutDto } from '@pp-trainer/shared';
import { AiGeneratedSingleWorkoutSchema } from '@pp-trainer/shared';

import { ErrorState, IntensityBadge, LoadingState, SportBadge, WorkoutStepList } from '../components';
import type { WorkoutStepData } from '../components';
import { acceptOutput, rejectOutput } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { useAiOutput } from '../hooks/useAiOutput';
import { PageShell } from '../layout/PageShell';
import { formatDate, formatDistance, formatDuration } from '../components/prototypeFormatters';
import { stepTypeLabels } from '../components/data/workoutStepLabels';
import type { PageComponentProps } from '../routes/routeTypes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPlannedWorkout(v: unknown): v is PlannedWorkoutDto {
  return typeof v === 'object' && v !== null && 'sport' in v && !('plannedWorkouts' in v);
}

function mapAiStep(step: AiGeneratedWorkoutStep): WorkoutStepData {
  const zoneParts: string[] = [];
  if (step.targetHeartRateZoneName) zoneParts.push(step.targetHeartRateZoneName);
  if (step.targetPowerZoneName) zoneParts.push(step.targetPowerZoneName);
  if (step.targetPaceZoneName) zoneParts.push(step.targetPaceZoneName);

  return {
    id: String(step.stepIndex),
    stepIndex: step.stepIndex,
    stepType: step.stepType as WorkoutStepData['stepType'],
    title: step.title,
    instruction: step.instruction,
    zoneName: zoneParts.length > 0 ? zoneParts.join(' · ') : undefined,
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

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AiCoachOutputDto['status'] }) {
  const labels: Record<string, string> = {
    accepted: 'Accepted', rejected: 'Rejected', archived: 'Archived', draft: 'Draft',
  };
  return (
    <span className={`ai-preview-status ai-preview-status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AiWorkoutPreviewPage({ params, navigate }: PageComponentProps) {
  const outputId = params.id ?? '';
  const outputState = useAiOutput(outputId);

  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  async function handleAccept() {
    setActionError(null);
    setActionLoading('accept');
    try {
      const result = await acceptOutput(outputId);
      if (isPlannedWorkout(result)) {
        navigate(`/workouts/${result.id}`);
      } else {
        navigate('/training-plan');
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save workout. Please try again.';
      setActionError(msg);
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionError(null);
    setActionLoading('reject');
    try {
      await rejectOutput(outputId);
      navigate('/ai-coach');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not discard proposal. Please try again.';
      setActionError(msg);
      setActionLoading(null);
      setConfirmReject(false);
    }
  }

  if (outputState.status === 'loading') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <LoadingState title="Loading proposal" description="Preparing your workout preview…" />
      </PageShell>
    );
  }

  if (outputState.status === 'error') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <ErrorState title="Proposal unavailable" description={outputState.message} />
      </PageShell>
    );
  }

  const { output } = outputState;
  const parsed = AiGeneratedSingleWorkoutSchema.safeParse(output.structuredOutput);
  if (!parsed.success) {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <ErrorState title="Invalid format" description="The proposal has an unexpected data format." />
      </PageShell>
    );
  }

  const { workout } = parsed.data;
  const isInvalid = output.validationStatus === 'invalid';
  const isAlreadyActed = output.status === 'accepted' || output.status === 'rejected';
  const canAct = !isInvalid && !isAlreadyActed;

  const steps = [...workout.steps].sort((a, b) => a.stepIndex - b.stepIndex).map(mapAiStep);
  // Use durationSeconds where available, fall back to distanceMeters so distance-
  // only steps (e.g. intervals with reps) still appear in the session bar.
  const stepBarFlex = (s: WorkoutStepData) => s.durationSeconds ?? s.distanceMeters ?? 0;
  const hasBarData = steps.some((s) => stepBarFlex(s) > 0);
  const hasDistanceOnlyStep = steps.some((s) => !s.durationSeconds && (s.distanceMeters ?? 0) > 0);
  const totalStepSec = steps.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
  const scheduledLabel = workout.scheduledDate ? formatDate(workout.scheduledDate) : undefined;

  return (
    <PageShell
      title={workout.title}
      eyebrow={scheduledLabel ? `AI Coach · Preview · ${scheduledLabel}` : 'AI Coach · Preview'}
      description={
        workout.objective ? (
          <span className="workout-detail__objective">{workout.objective}</span>
        ) : isAlreadyActed ? (
          <StatusBadge status={output.status} />
        ) : undefined
      }
    >
      {/* ai-preview-layout provides the padding-bottom:100px for the sticky bar */}
      <div className="ai-preview-layout ai-workout-preview">

        {/* ── Meta ── */}
        <dl className="workout-detail__meta">
          {workout.plannedDurationSeconds && (
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(workout.plannedDurationSeconds)}</dd>
            </div>
          )}
          {workout.plannedDistanceMeters && (
            <div>
              <dt>Distance</dt>
              <dd>{formatDistance(workout.plannedDistanceMeters)}</dd>
            </div>
          )}
          <div>
            <dt>Sport</dt>
            <dd><SportBadge sport={workout.sport} /></dd>
          </div>
          <div>
            <dt>Intensity</dt>
            <dd><IntensityBadge intensity={workout.intensity} /></dd>
          </div>
          {isAlreadyActed && (
            <div>
              <dt>Status</dt>
              <dd><StatusBadge status={output.status} /></dd>
            </div>
          )}
        </dl>

        {/* ── Validation warning ── */}
        {isInvalid && (
          <div className="ai-error-banner ai-error-banner--warn">
            <span>This proposal could not be fully validated. The content may be incomplete.</span>
          </div>
        )}

        {/* ── Coach rationale ── */}
        {(output.summary ?? workout.description) && (
          <div className="ai-preview-summary">
            <p className="ai-preview-summary__label">Coach rationale</p>
            <p className="ai-preview-summary__text">{output.summary ?? workout.description}</p>
          </div>
        )}

        {/* ── Coach notes ── */}
        {workout.coachNotes && (
          <blockquote className="workout-detail__notes">{workout.coachNotes}</blockquote>
        )}

        {/* ── Session structure ── */}
        <div className="workout-detail__steps">
          <p className="workout-detail__steps-label">Session structure</p>

          {hasBarData && (
            <div className="session-bar" aria-hidden="true">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`session-bar__segment session-bar__segment--${step.stepType}`}
                  style={{ flex: stepBarFlex(step) }}
                  title={step.durationSeconds ? `${stepTypeLabels[step.stepType as keyof typeof stepTypeLabels] ?? step.stepType}: ${formatDuration(step.durationSeconds)}` : `${stepTypeLabels[step.stepType as keyof typeof stepTypeLabels] ?? step.stepType}`}
                />
              ))}
              {!hasDistanceOnlyStep && totalStepSec < (workout.plannedDurationSeconds ?? 0) && (
                <div
                  className="session-bar__segment session-bar__segment--other"
                  style={{ flex: (workout.plannedDurationSeconds ?? 0) - totalStepSec }}
                />
              )}
            </div>
          )}

          <WorkoutStepList steps={steps} />
        </div>

        {/* ── Action bar ── */}
        <div className="ai-preview-bar">
          {actionError && (
            <div className="ai-preview-bar__error" role="alert">
              {actionError}
              <button
                type="button"
                className="ai-error-banner__dismiss"
                onClick={() => setActionError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <div className="ai-preview-bar__actions">
            {!confirmReject ? (
              <>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleAccept}
                  disabled={!canAct || actionLoading !== null}
                >
                  {actionLoading === 'accept' ? 'Saving…' : 'Accept workout'}
                </button>

                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(true)}
                  disabled={!canAct || actionLoading !== null}
                >
                  Discard
                </button>
              </>
            ) : (
              <div className="ai-preview-bar__confirm">
                <span className="ai-preview-bar__confirm-label">Discard this proposal?</span>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'reject' ? 'Discarding…' : 'Yes, discard'}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(false)}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}

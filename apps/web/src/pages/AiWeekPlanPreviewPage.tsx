import { useState } from 'react';

import type { AiCoachOutputDto, AiGeneratedWeekPlan, AiGeneratedWorkout, AiGeneratedWorkoutStep } from '@pp-trainer/shared';
import { AiGeneratedWeekPlanSchema } from '@pp-trainer/shared';

import { ErrorState, IntensityBadge, LoadingState, SportBadge } from '../components';
import { toast } from 'sonner';

import { acceptOutput, rejectOutput } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { useAiOutput } from '../hooks/useAiOutput';
import { PageShell } from '../layout/PageShell';
import { formatDuration } from '../components/prototypeFormatters';
import type { PageComponentProps } from '../routes/routeTypes';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d);
}

function formatWeekdayShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d);
}

function formatPaceRange(lower?: number, upper?: number): string | undefined {
  if (!lower && !upper) return undefined;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (lower && upper) return `${fmt(lower)}–${fmt(upper)} /km`;
  if (lower) return `≥ ${fmt(lower)} /km`;
  return `≤ ${fmt(upper!)} /km`;
}

function formatSwimPaceRange(lower?: number, upper?: number): string | undefined {
  if (!lower && !upper) return undefined;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (lower && upper) return `${fmt(lower)}–${fmt(upper)} /100m`;
  if (lower) return `≥ ${fmt(lower)} /100m`;
  return `≤ ${fmt(upper!)} /100m`;
}

function formatPowerRange(lower?: number, upper?: number): string | undefined {
  if (!lower && !upper) return undefined;
  if (lower && upper) return `${lower}–${upper} W`;
  if (lower) return `≥ ${lower} W`;
  return `≤ ${upper!} W`;
}

const STEP_TYPE_LABELS: Record<string, string> = {
  warmup: 'Warm-up', main: 'Main set', interval: 'Interval',
  recovery: 'Recovery', cooldown: 'Cool-down', technique: 'Technique',
  strength_exercise: 'Exercise', rest: 'Rest', other: 'Other',
};

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AiCoachOutputDto['status'] }) {
  const map: Record<string, string> = {
    accepted: 'Accepted', rejected: 'Rejected', archived: 'Archived', draft: 'Draft',
  };
  return (
    <span className={`ai-preview-status ai-preview-status--${status}`}>
      {map[status] ?? status}
    </span>
  );
}

// ── Step row ─────────────────────────────────────────────────────────────────

function StepRow({ step }: { step: AiGeneratedWorkoutStep }) {
  const targets: string[] = [];
  const pace = formatPaceRange(step.targetPaceLowerSecPerKm, step.targetPaceUpperSecPerKm);
  const swimPace = formatSwimPaceRange(step.targetSwimPaceLowerSecPer100m, step.targetSwimPaceUpperSecPer100m);
  const power = formatPowerRange(step.targetPowerLowerWatts, step.targetPowerUpperWatts);
  if (pace) targets.push(pace);
  if (swimPace) targets.push(swimPace);
  if (power) targets.push(power);
  if (step.targetHeartRateZoneName) targets.push(step.targetHeartRateZoneName);
  if (step.targetPowerZoneName) targets.push(step.targetPowerZoneName);
  if (step.targetPaceZoneName) targets.push(step.targetPaceZoneName);

  return (
    <li className="ai-preview-step">
      <span className="ai-preview-step__type">
        {STEP_TYPE_LABELS[step.stepType] ?? step.stepType}
      </span>
      <span className="ai-preview-step__instruction">{step.instruction}</span>
      <span className="ai-preview-step__meta">
        {step.durationSeconds && <span>{formatDuration(step.durationSeconds)}</span>}
        {step.distanceMeters && <span>{(step.distanceMeters / 1000).toFixed(1)} km</span>}
        {step.repetitions && <span>{step.repetitions}×</span>}
        {targets.length > 0 && (
          <span className="ai-preview-step__targets">{targets.join(' · ')}</span>
        )}
      </span>
    </li>
  );
}

// ── Workout card ─────────────────────────────────────────────────────────────

function WorkoutCard({ workout }: { workout: AiGeneratedWorkout }) {
  const [expanded, setExpanded] = useState(false);
  const hasSteps = workout.steps.length > 0;
  const sortedSteps = [...workout.steps].sort((a, b) => a.stepIndex - b.stepIndex);
  const stepBarFlex = (s: AiGeneratedWorkoutStep) => s.durationSeconds ?? s.distanceMeters ?? 0;
  const hasBarData = sortedSteps.some((s) => stepBarFlex(s) > 0);
  const hasDistanceOnlyStep = sortedSteps.some((s) => !s.durationSeconds && (s.distanceMeters ?? 0) > 0);
  const totalStepSec = sortedSteps.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);

  return (
    <div className="ai-preview-workout">
      <div className="ai-preview-workout__header">
        <div className="ai-preview-workout__badges">
          <SportBadge sport={workout.sport} />
          <IntensityBadge intensity={workout.intensity} />
        </div>
        <div className="ai-preview-workout__meta">
          {workout.scheduledDate && (
            <span className="ai-preview-workout__date">
              <span className="ai-preview-workout__weekday">
                {formatWeekdayShort(workout.scheduledDate)}
              </span>
              <span>{formatShortDate(workout.scheduledDate)}</span>
            </span>
          )}
          {workout.plannedDurationSeconds && (
            <span className="ai-preview-workout__duration">
              {formatDuration(workout.plannedDurationSeconds)}
            </span>
          )}
          {workout.plannedDistanceMeters && (
            <span className="ai-preview-workout__duration">
              {(workout.plannedDistanceMeters / 1000).toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      <h3 className="ai-preview-workout__title">{workout.title}</h3>
      {workout.objective && (
        <p className="ai-preview-workout__objective">{workout.objective}</p>
      )}
      {workout.description && !workout.objective && (
        <p className="ai-preview-workout__objective">{workout.description}</p>
      )}

      {hasBarData && (
        <div className="session-bar ai-preview-workout__bar" aria-hidden="true">
          {sortedSteps.map((step) => (
            <div
              key={step.stepIndex}
              className={`session-bar__segment session-bar__segment--${step.stepType}`}
              style={{ flex: stepBarFlex(step) }}
              title={step.durationSeconds
                ? `${STEP_TYPE_LABELS[step.stepType]}: ${formatDuration(step.durationSeconds)}`
                : STEP_TYPE_LABELS[step.stepType] ?? step.stepType}
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

      {hasSteps && (
        <button
          type="button"
          className="ai-preview-workout__toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className={`ai-preview-workout__toggle-icon${expanded ? ' is-open' : ''}`} aria-hidden="true" />
          {expanded ? 'Hide steps' : `${workout.steps.length} step${workout.steps.length === 1 ? '' : 's'}`}
        </button>
      )}

      <div className={`ai-preview-step-wrap${expanded ? ' is-open' : ''}`}>
        <ul className="ai-preview-step-list">
          {[...workout.steps]
            .sort((a, b) => a.stepIndex - b.stepIndex)
            .map((step) => (
              <StepRow key={step.stepIndex} step={step} />
            ))}
        </ul>
      </div>

      {workout.coachNotes && (
        <p className="ai-preview-workout__coach-notes">{workout.coachNotes}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AiWeekPlanPreviewPage({ params, navigate }: PageComponentProps) {
  const outputId = params.id ?? '';
  const outputState = useAiOutput(outputId);

  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  async function handleAccept() {
    setActionError(null);
    setActionLoading('accept');
    try {
      await acceptOutput(outputId);
      toast.success('Plan activated');
      navigate('/training-plan');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save plan. Please try again.';
      setActionError(msg);
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionError(null);
    setActionLoading('reject');
    try {
      await rejectOutput(outputId);
      toast('Proposal discarded');
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
        <LoadingState title="Loading proposal" description="Preparing your week plan preview…" />
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
  const parsedPlan = AiGeneratedWeekPlanSchema.safeParse(output.structuredOutput);
  if (!parsedPlan.success) {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <ErrorState title="Invalid format" description="The proposal has an unexpected data format." />
      </PageShell>
    );
  }

  const plan: AiGeneratedWeekPlan = parsedPlan.data;
  const isInvalid = output.validationStatus === 'invalid';
  const isAlreadyActed = output.status === 'accepted' || output.status === 'rejected';
  const canAct = !isInvalid && !isAlreadyActed;

  return (
    <PageShell
      title="Week Plan Preview"
      eyebrow="AI Coach · Preview"
      description={
        <span>
          {isAlreadyActed && <StatusBadge status={output.status} />}
          {isInvalid && (
            <span className="ai-preview-status ai-preview-status--invalid">Validation failed</span>
          )}
        </span>
      }
    >
      <div className="ai-preview-layout">

        {/* ── Plan header ── */}
        <div className="ai-preview-header">
          <h2 className="ai-preview-header__title">{plan.title}</h2>
          <p className="ai-preview-header__range">
            {formatShortDate(plan.weekStartDate)} – {formatShortDate(plan.weekEndDate)}
          </p>
          {plan.focus && (
            <p className="ai-preview-header__focus">{plan.focus}</p>
          )}
        </div>

        {/* ── Summary ── */}
        {(output.summary ?? plan.summary) && (
          <div className="ai-preview-summary">
            <p className="ai-preview-summary__label">Coach rationale</p>
            <p className="ai-preview-summary__text">{output.summary ?? plan.summary}</p>
          </div>
        )}

        {/* ── Validation warning ── */}
        {isInvalid && (
          <div className="ai-error-banner ai-error-banner--warn">
            <span>
              This proposal could not be fully validated. The content may be incomplete.
            </span>
          </div>
        )}

        {/* ── Workout list ── */}
        <div className="ai-preview-workouts">
          <p className="ai-output__label">{plan.workouts.length} workout{plan.workouts.length === 1 ? '' : 's'} this week</p>
          <div className="ai-preview-workout-list">
            {plan.workouts.map((workout, i) => (
              <WorkoutCard key={i} workout={workout} />
            ))}
          </div>
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
                  {actionLoading === 'accept' ? 'Saving…' : 'Accept plan'}
                </button>

                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(true)}
                  disabled={!canAct || actionLoading !== null}
                >
                  Discard
                </button>

                {canAct && (
                  <p className="ai-preview-bar__hint">
                    Accepting will activate this plan and deactivate your current active plan.
                  </p>
                )}
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

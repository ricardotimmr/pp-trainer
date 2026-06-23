import { useState } from 'react';

import type { AiCoachOutputDto, AiGeneratedWeekPlan, AiGeneratedWorkout, AiGeneratedWorkoutStep } from '@pp-trainer/shared';
import { AiGeneratedWeekPlanSchema } from '@pp-trainer/shared';

import { ErrorState, IntensityBadge, LoadingState, SportBadge } from '../components';
import { acceptOutput, rejectOutput } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { useAiOutput } from '../hooks/useAiOutput';
import { PageShell } from '../layout/PageShell';
import { formatDuration } from '../components/prototypeFormatters';
import type { PageComponentProps } from '../routes/routeTypes';

// ── Formatters ───────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('de', { month: 'short', day: 'numeric' }).format(d);
}

function formatWeekdayShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('de', { weekday: 'short' }).format(d);
}

function formatPaceRange(lower?: number, upper?: number): string | undefined {
  if (!lower && !upper) return undefined;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  if (lower && upper) return `${fmt(lower)}–${fmt(upper)} /km`;
  if (lower) return `≥ ${fmt(lower)} /km`;
  return `≤ ${fmt(upper!)} /km`;
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
    accepted: 'Übernommen',
    rejected: 'Verworfen',
    archived: 'Archiviert',
    draft: 'Entwurf',
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
  const power = formatPowerRange(step.targetPowerLowerWatts, step.targetPowerUpperWatts);
  if (pace) targets.push(pace);
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
        {step.durationSeconds && (
          <span>{formatDuration(step.durationSeconds)}</span>
        )}
        {step.distanceMeters && (
          <span>{(step.distanceMeters / 1000).toFixed(1)} km</span>
        )}
        {step.repetitions && (
          <span>{step.repetitions}×</span>
        )}
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
  const stepsWithDuration = workout.steps.filter((s) => s.durationSeconds);
  const totalStepSec = stepsWithDuration.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);

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

      {stepsWithDuration.length > 0 && (
        <div className="session-bar ai-preview-workout__bar" aria-hidden="true">
          {stepsWithDuration.map((step) => (
            <div
              key={step.stepIndex}
              className={`session-bar__segment session-bar__segment--${step.stepType}`}
              style={{ flex: step.durationSeconds }}
              title={`${STEP_TYPE_LABELS[step.stepType]}: ${formatDuration(step.durationSeconds)}`}
            />
          ))}
          {totalStepSec < (workout.plannedDurationSeconds ?? 0) && (
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
          {expanded ? 'Steps ausblenden' : `${workout.steps.length} Steps anzeigen`}
          <span className="ai-preview-workout__toggle-icon" aria-hidden="true">
            {expanded ? '▲' : '▼'}
          </span>
        </button>
      )}

      {expanded && hasSteps && (
        <ul className="ai-preview-step-list">
          {[...workout.steps]
            .sort((a, b) => a.stepIndex - b.stepIndex)
            .map((step) => (
              <StepRow key={step.stepIndex} step={step} />
            ))}
        </ul>
      )}

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
      navigate('/training-plan');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Plan konnte nicht gespeichert werden.';
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
      const msg = err instanceof ApiClientError ? err.message : 'Vorschlag konnte nicht verworfen werden.';
      setActionError(msg);
      setActionLoading(null);
      setConfirmReject(false);
    }
  }

  if (outputState.status === 'loading') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Vorschau">
        <LoadingState title="Lade Vorschlag" description="Vorschau wird vorbereitet…" />
      </PageShell>
    );
  }

  if (outputState.status === 'error') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Vorschau">
        <ErrorState title="Vorschlag nicht verfügbar" description={outputState.message} />
      </PageShell>
    );
  }

  const { output } = outputState;
  const parsedPlan = AiGeneratedWeekPlanSchema.safeParse(output.structuredOutput);
  if (!parsedPlan.success) {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Vorschau">
        <ErrorState title="Ungültiges Format" description="Der Vorschlag hat ein unerwartetes Format." />
      </PageShell>
    );
  }
  const plan: AiGeneratedWeekPlan = parsedPlan.data;
  const isInvalid = output.validationStatus === 'invalid';
  const isAlreadyActed = output.status === 'accepted' || output.status === 'rejected';
  const canAct = !isInvalid && !isAlreadyActed;

  return (
    <PageShell
      title="Wochenplan-Vorschlag"
      eyebrow="AI Coach · Vorschau"
      description={
        <span>
          {isAlreadyActed && <StatusBadge status={output.status} />}
          {isInvalid && (
            <span className="ai-preview-status ai-preview-status--invalid">
              Validierung fehlgeschlagen
            </span>
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
            <p className="ai-preview-summary__label">Coach-Begründung</p>
            <p className="ai-preview-summary__text">{output.summary ?? plan.summary}</p>
          </div>
        )}

        {/* ── Validation warning ── */}
        {isInvalid && (
          <div className="ai-error-banner ai-error-banner--warn">
            <span>
              Dieser Vorschlag konnte nicht vollständig validiert werden. Der Inhalt kann unvollständig sein.
            </span>
          </div>
        )}

        {/* ── Workout list ── */}
        <div className="ai-preview-workouts">
          <p className="ai-output__label">{plan.workouts.length} Workouts diese Woche</p>
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
                aria-label="Schließen"
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
                  {actionLoading === 'accept' ? 'Wird gespeichert…' : 'Übernehmen'}
                </button>

                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(true)}
                  disabled={!canAct || actionLoading !== null}
                >
                  Verwerfen
                </button>

                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => navigate('/ai-coach')}
                  disabled={actionLoading !== null}
                >
                  Neu generieren
                </button>
              </>
            ) : (
              <div className="ai-preview-bar__confirm">
                <span className="ai-preview-bar__confirm-label">Vorschlag verwerfen?</span>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'reject' ? 'Wird verworfen…' : 'Ja, verwerfen'}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(false)}
                  disabled={actionLoading !== null}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}

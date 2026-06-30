import { useState } from 'react';

import type {
  AiCoachOutputDto,
  AiGeneratedSingleWorkout,
  AiGeneratedWorkout,
  AiGeneratedWorkoutStep,
  PlannedWorkoutDto,
} from '@pp-trainer/shared';
import { AiGeneratedSingleWorkoutSchema } from '@pp-trainer/shared';

import type { TrainingZoneSetDto } from '@pp-trainer/shared';

import { ErrorState, IntensityBadge, LoadingState, SelectMenu, SportBadge } from '../components';
import type { WorkoutStepData } from '../components';
import { toast } from 'sonner';

import { acceptOutput, rejectOutput } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { useAiOutput } from '../hooks/useAiOutput';
import { useTrainingZones } from '../hooks/useTrainingZones';
import { PageShell } from '../layout/PageShell';
import { formatDate, formatDistance, formatDuration } from '../components/prototypeFormatters';
import { stepTypeLabels } from '../components/data/workoutStepLabels';
import {
  getSessionBarSegments,
  getSessionBarTotalFlex,
  hasDistanceOnlySessionStep,
  hasSessionBarData,
} from '../components/data/workoutSessionBar';
import type { PageComponentProps } from '../routes/routeTypes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPlannedWorkout(v: unknown): v is PlannedWorkoutDto {
  return typeof v === 'object' && v !== null && 'sport' in v && !('plannedWorkouts' in v);
}

type StepEditDraft = {
  instruction: string;
  durationMinutes: string;
  distanceKm: string;
  repetitions: string;
  paceZoneId: string;
  paceLowerSecPerKm: number | undefined;
  paceUpperSecPerKm: number | undefined;
  paceZoneName: string;
  powerZoneId: string;
  powerZoneName: string;
  hrZoneId: string;
  hrZoneName: string;
};

type EditedStepsByIndex = Record<number, AiGeneratedWorkoutStep>;

function formatOptionalMinutes(seconds?: number): string {
  if (seconds == null) return '';
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

function formatOptionalKm(meters?: number): string {
  if (meters == null) return '';
  const km = meters / 1000;
  return Number.isInteger(km) ? String(km) : km.toFixed(2);
}

function formatDraftDecimal(value: number, maxDecimals: number): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function stepToDraft(step: AiGeneratedWorkoutStep): StepEditDraft {
  return {
    instruction: step.instruction,
    durationMinutes: formatOptionalMinutes(step.durationSeconds),
    distanceKm: formatOptionalKm(step.distanceMeters),
    repetitions: step.repetitions != null ? String(step.repetitions) : '',
    paceZoneId: '',
    paceLowerSecPerKm: undefined,
    paceUpperSecPerKm: undefined,
    paceZoneName: '',
    powerZoneId: '',
    powerZoneName: '',
    hrZoneId: '',
    hrZoneName: '',
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseOptionalInteger(value: string): number | undefined {
  const parsed = parseOptionalNumber(value);
  return parsed == null ? undefined : Math.round(parsed);
}

function getAveragePaceSecPerKm(step: AiGeneratedWorkoutStep): number | undefined {
  if (step.targetPaceLowerSecPerKm != null && step.targetPaceUpperSecPerKm != null) {
    return (step.targetPaceLowerSecPerKm + step.targetPaceUpperSecPerKm) / 2;
  }
  if (step.targetSwimPaceLowerSecPer100m != null && step.targetSwimPaceUpperSecPer100m != null) {
    return ((step.targetSwimPaceLowerSecPer100m + step.targetSwimPaceUpperSecPer100m) / 2) * 10;
  }
  if (step.durationSeconds != null && step.distanceMeters != null && step.distanceMeters > 0) {
    return step.durationSeconds / (step.distanceMeters / 1000);
  }
  return undefined;
}

function getEffectivePaceSecPerKm(step: AiGeneratedWorkoutStep, draft: StepEditDraft): number | undefined {
  if (draft.paceLowerSecPerKm != null && draft.paceUpperSecPerKm != null) {
    return (draft.paceLowerSecPerKm + draft.paceUpperSecPerKm) / 2;
  }
  return getAveragePaceSecPerKm(step);
}

function syncDistanceFromDuration(
  step: AiGeneratedWorkoutStep,
  draft: StepEditDraft,
  durationMinutes: string,
): StepEditDraft {
  const parsedMinutes = parseOptionalNumber(durationMinutes);
  const averagePaceSecPerKm = getEffectivePaceSecPerKm(step, draft);

  if (parsedMinutes == null || averagePaceSecPerKm == null) {
    return { ...draft, durationMinutes };
  }

  return {
    ...draft,
    durationMinutes,
    distanceKm: formatDraftDecimal((parsedMinutes * 60) / averagePaceSecPerKm, 2),
  };
}

function syncDurationFromDistance(
  step: AiGeneratedWorkoutStep,
  draft: StepEditDraft,
  distanceKm: string,
): StepEditDraft {
  const parsedDistanceKm = parseOptionalNumber(distanceKm);
  const averagePaceSecPerKm = getEffectivePaceSecPerKm(step, draft);

  if (parsedDistanceKm == null || averagePaceSecPerKm == null) {
    return { ...draft, distanceKm };
  }

  return {
    ...draft,
    distanceKm,
    durationMinutes: formatDraftDecimal((parsedDistanceKm * averagePaceSecPerKm) / 60, 1),
  };
}

function applyDraftToStep(step: AiGeneratedWorkoutStep, draft: StepEditDraft): AiGeneratedWorkoutStep {
  const durationMinutes = parseOptionalNumber(draft.durationMinutes);
  const distanceKm = parseOptionalNumber(draft.distanceKm);
  const repetitions = parseOptionalInteger(draft.repetitions);

  const result: AiGeneratedWorkoutStep = {
    ...step,
    instruction: draft.instruction.trim(),
    durationSeconds: durationMinutes != null ? Math.round(durationMinutes * 60) : undefined,
    distanceMeters: distanceKm != null ? Math.round(distanceKm * 1000) : undefined,
    repetitions,
  };
  if (draft.paceZoneId) {
    result.targetPaceLowerSecPerKm = draft.paceLowerSecPerKm;
    result.targetPaceUpperSecPerKm = draft.paceUpperSecPerKm;
    result.targetPaceZoneName = draft.paceZoneName || undefined;
  }
  if (draft.powerZoneId) {
    result.targetPowerZoneName = draft.powerZoneName || undefined;
  }
  if (draft.hrZoneId) {
    result.targetHeartRateZoneName = draft.hrZoneName || undefined;
  }
  return result;
}

function normalizeStepForCompare(step: AiGeneratedWorkoutStep): string {
  return JSON.stringify(
    Object.entries(step)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function stepsEqual(a: AiGeneratedWorkoutStep, b: AiGeneratedWorkoutStep): boolean {
  return normalizeStepForCompare(a) === normalizeStepForCompare(b);
}

function sumStepValues(
  steps: AiGeneratedWorkoutStep[],
  key: 'durationSeconds' | 'distanceMeters',
): number {
  return steps.reduce((sum, step) => sum + (step[key] ?? 0), 0);
}

function adjustWorkoutTotal(
  baseValue: number | undefined,
  originalStepTotal: number,
  effectiveStepTotal: number,
): number | undefined {
  const delta = effectiveStepTotal - originalStepTotal;
  if (baseValue != null) return Math.max(0, baseValue + delta);
  return effectiveStepTotal > 0 ? effectiveStepTotal : undefined;
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

function getStepTarget(step: WorkoutStepData): string | undefined {
  const formatPaceValue = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  if (step.targetPowerLowerWatts && step.targetPowerUpperWatts) {
    return `${step.targetPowerLowerWatts}–${step.targetPowerUpperWatts} W`;
  }
  if (step.targetPaceLowerSecPerKm && step.targetPaceUpperSecPerKm) {
    return `${formatPaceValue(step.targetPaceLowerSecPerKm)}–${formatPaceValue(step.targetPaceUpperSecPerKm)} /km`;
  }
  if (step.targetSwimPaceLowerSecPer100m && step.targetSwimPaceUpperSecPer100m) {
    return `${formatPaceValue(step.targetSwimPaceLowerSecPer100m)}–${formatPaceValue(step.targetSwimPaceUpperSecPer100m)} /100m`;
  }
  return undefined;
}

function buildStepMetrics(step: WorkoutStepData): string {
  const parts: string[] = [];
  if (step.durationSeconds) parts.push(formatDuration(step.durationSeconds));
  if (step.distanceMeters) parts.push(formatDistance(step.distanceMeters));
  if (step.repetitions) parts.push(`×${step.repetitions}`);
  const target = getStepTarget(step);
  if (target) parts.push(target);
  if (step.restSeconds) parts.push(`Rest ${formatDuration(step.restSeconds)}`);
  return parts.join(' · ');
}

// ── Zone picker (local) ───────────────────────────────────────────────────────

type AiZoneType = 'heart_rate' | 'cycling_power' | 'running_pace' | 'swimming_pace';

function AiZonePicker({ id, label, zoneType, sport, zoneSets, selectedId, navigate, onSelect }: {
  id: string;
  label: string;
  zoneType: AiZoneType;
  sport?: string;
  zoneSets: TrainingZoneSetDto[];
  selectedId: string;
  navigate: (path: string) => void;
  onSelect: (zoneId: string, zoneName: string, lower?: number, upper?: number) => void;
}) {
  const activeSets = zoneSets.filter((s) => {
    if (!s.isActive || s.zoneType !== zoneType) return false;
    if (zoneType === 'heart_rate' && sport) return s.sport === sport || s.sport == null;
    return true;
  });
  if (activeSets.length === 0) {
    return (
      <div className="cw-field">
        <span className="cw-label">{label}</span>
        <p className="cw-zone-empty">
          No zones configured —{' '}
          <button type="button" className="cw-zone-empty__link" onClick={() => navigate('/settings')}>
            add them in Settings
          </button>
        </p>
      </div>
    );
  }
  const allZones = activeSets.flatMap((s) => s.zones);
  const options = [
    { value: '', label: 'None' },
    ...activeSets.flatMap((set) =>
      set.zones.map((z) => ({
        value: z.id,
        label: `${z.name}${z.lowerBound != null && z.upperBound != null ? ` (${z.lowerBound}–${z.upperBound})` : ''}`,
      })),
    ),
  ];
  return (
    <div className="cw-field">
      <label className="cw-label" htmlFor={id}>{label}</label>
      <SelectMenu
        id={id}
        value={selectedId}
        options={options}
        onChange={(zoneId) => {
          if (!zoneId) { onSelect('', '', undefined, undefined); return; }
          const zone = allZones.find((z) => z.id === zoneId);
          if (zone) onSelect(zoneId, zone.name, zone.lowerBound, zone.upperBound);
        }}
      />
    </div>
  );
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

  const zonesState = useTrainingZones();
  const zoneSets = zonesState.status === 'success' ? zonesState.zoneSets : [];

  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [editedStepsByIndex, setEditedStepsByIndex] = useState<EditedStepsByIndex>({});
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepDraft, setStepDraft] = useState<StepEditDraft | null>(null);

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

  const originalSteps = [...workout.steps].sort((a, b) => a.stepIndex - b.stepIndex);
  const effectiveAiSteps = originalSteps.map((step) => editedStepsByIndex[step.stepIndex] ?? step);
  const hasEditedSteps = Object.keys(editedStepsByIndex).length > 0;
  const effectivePlannedDurationSeconds = adjustWorkoutTotal(
    workout.plannedDurationSeconds,
    sumStepValues(originalSteps, 'durationSeconds'),
    sumStepValues(effectiveAiSteps, 'durationSeconds'),
  );
  const effectivePlannedDistanceMeters = adjustWorkoutTotal(
    workout.plannedDistanceMeters,
    sumStepValues(originalSteps, 'distanceMeters'),
    sumStepValues(effectiveAiSteps, 'distanceMeters'),
  );
  const steps = effectiveAiSteps.map(mapAiStep);
  const barSegments = getSessionBarSegments(steps);
  const hasBarData = hasSessionBarData(barSegments);
  const hasDistanceOnlyStep = hasDistanceOnlySessionStep(steps);
  const totalStepSec = getSessionBarTotalFlex(barSegments);
  const scheduledLabel = workout.scheduledDate ? formatDate(workout.scheduledDate) : undefined;

  function startEditingStep(step: AiGeneratedWorkoutStep) {
    setActionError(null);
    setEditingStepIndex(step.stepIndex);
    setStepDraft(stepToDraft(editedStepsByIndex[step.stepIndex] ?? step));
  }

  function cancelStepEdit() {
    setEditingStepIndex(null);
    setStepDraft(null);
  }

  function saveStepEdit(originalStep: AiGeneratedWorkoutStep) {
    if (!stepDraft) return;
    const updatedStep = applyDraftToStep(originalStep, stepDraft);
    if (!updatedStep.instruction) {
      setActionError('Step instruction cannot be empty.');
      return;
    }

    setEditedStepsByIndex((current) => {
      const next = { ...current };
      if (stepsEqual(originalStep, updatedStep)) {
        delete next[originalStep.stepIndex];
      } else {
        next[originalStep.stepIndex] = updatedStep;
      }
      return next;
    });
    setEditingStepIndex(null);
    setStepDraft(null);
    setActionError(null);
  }

  async function handleAccept() {
    setActionError(null);
    setActionLoading('accept');
    try {
      const singleWorkoutOverride: AiGeneratedSingleWorkout | undefined = hasEditedSteps
        ? {
            workout: {
              ...workout,
              plannedDurationSeconds: effectivePlannedDurationSeconds,
              plannedDistanceMeters: effectivePlannedDistanceMeters,
              steps: effectiveAiSteps,
            } satisfies AiGeneratedWorkout,
          }
        : undefined;
      const result = await acceptOutput(
        outputId,
        singleWorkoutOverride ? { singleWorkoutOverride } : undefined,
      );
      if (isPlannedWorkout(result)) {
        toast.success('Workout added');
        navigate(`/workouts/${result.id}`);
      } else {
        toast.success('Workout added');
        navigate('/training-plan');
      }
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save workout. Please try again.';
      setActionError(msg);
      setActionLoading(null);
    }
  }

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
          {effectivePlannedDurationSeconds && (
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(effectivePlannedDurationSeconds)}</dd>
            </div>
          )}
          {effectivePlannedDistanceMeters && (
            <div>
              <dt>Distance</dt>
              <dd>{formatDistance(effectivePlannedDistanceMeters)}</dd>
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
              {barSegments.map((segment) => (
                <div
                  key={segment.key}
                  className={`session-bar__segment session-bar__segment--${segment.stepType}`}
                  style={{ flex: segment.flex }}
                  title={segment.kind === 'rest'
                    ? `Rest: ${formatDuration(segment.flex)}`
                    : segment.step.durationSeconds
                      ? `${stepTypeLabels[segment.step.stepType as keyof typeof stepTypeLabels] ?? segment.step.stepType}: ${formatDuration(segment.step.durationSeconds * (segment.step.repetitions ?? 1))}`
                      : `${stepTypeLabels[segment.step.stepType as keyof typeof stepTypeLabels] ?? segment.step.stepType}`}
                />
              ))}
              {!hasDistanceOnlyStep && totalStepSec < (effectivePlannedDurationSeconds ?? 0) && (
                <div
                  className="session-bar__segment session-bar__segment--other"
                  style={{ flex: (effectivePlannedDurationSeconds ?? 0) - totalStepSec }}
                />
              )}
            </div>
          )}

          <ol className="workout-step-list ai-step-editor-list">
            {originalSteps.map((originalStep) => {
              const effectiveStep = editedStepsByIndex[originalStep.stepIndex] ?? originalStep;
              const step = mapAiStep(effectiveStep);
              const typeLabel = stepTypeLabels[step.stepType] ?? step.stepType;
              const hasTitle = !!step.title;
              const title = step.title ?? step.instruction;
              const instruction = hasTitle ? step.instruction : undefined;
              const metrics = buildStepMetrics(step);
              const isEditing = editingStepIndex === originalStep.stepIndex;
              const isEdited = editedStepsByIndex[originalStep.stepIndex] != null;

              return (
                <li
                  key={step.id}
                  className={`workout-step workout-step--${step.stepType} ai-step-editor${isEditing ? ' is-editing' : ''}`}
                >
                  <span className="workout-step__num" aria-hidden="true">
                    {String(step.stepIndex).padStart(2, '0')}
                  </span>
                  <span className="workout-step__type">{typeLabel}</span>
                  <div className="ai-step-editor__title-row">
                    <h3 className="workout-step__title">{title}</h3>
                    <div className="ai-step-editor__actions">
                      {isEdited && <span className="ai-step-editor__chip">Edited</span>}
                      {canAct && (
                        <button
                          type="button"
                          className="ai-step-editor__edit"
                          aria-label={`Edit step ${step.stepIndex}`}
                          onClick={() => startEditingStep(originalStep)}
                          disabled={actionLoading !== null}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  {(metrics || step.zoneName) && (
                    <p className="workout-step__metrics">
                      {metrics}
                      {step.zoneName && (
                        <span className="workout-step__zone">{step.zoneName}</span>
                      )}
                    </p>
                  )}
                  {instruction && (
                    <p className="workout-step__instruction">{instruction}</p>
                  )}

                  {isEditing && stepDraft && (
                    <form
                      className="ai-step-editor__form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveStepEdit(originalStep);
                      }}
                    >
                      <div className="cw-field ai-step-editor__instruction">
                        <label className="cw-label cw-label--required" htmlFor={`step-${step.stepIndex}-instruction`}>
                          Instruction
                        </label>
                        <textarea
                          id={`step-${step.stepIndex}-instruction`}
                          className="cw-textarea"
                          value={stepDraft.instruction}
                          rows={3}
                          onChange={(event) => setStepDraft((draft) => draft
                            ? { ...draft, instruction: event.target.value }
                            : draft)}
                          required
                        />
                      </div>

                      {workout.sport === 'running' && (
                        <AiZonePicker
                          id={`step-${step.stepIndex}-pace-zone`} label="Pace Zone"
                          zoneType="running_pace" zoneSets={zoneSets} selectedId={stepDraft.paceZoneId}
                          navigate={navigate}
                          onSelect={(id, name, lo, hi) => setStepDraft((d) => {
                            if (!d) return d;
                            const patch: Partial<StepEditDraft> = { paceZoneId: id, paceZoneName: name, paceLowerSecPerKm: lo, paceUpperSecPerKm: hi };
                            if (id && lo != null && hi != null) {
                              const avgPace = (lo + hi) / 2;
                              const dur = parseOptionalNumber(d.durationMinutes);
                              if (dur != null && dur > 0 && avgPace > 0) {
                                patch.distanceKm = formatDraftDecimal((dur * 60) / avgPace, 2);
                              }
                            }
                            return { ...d, ...patch };
                          })}
                        />
                      )}
                      {workout.sport === 'swimming' && (
                        <AiZonePicker
                          id={`step-${step.stepIndex}-pace-zone`} label="Pace Zone"
                          zoneType="swimming_pace" zoneSets={zoneSets} selectedId={stepDraft.paceZoneId}
                          navigate={navigate}
                          onSelect={(id, name, lo, hi) => setStepDraft((d) => {
                            if (!d) return d;
                            const patch: Partial<StepEditDraft> = { paceZoneId: id, paceZoneName: name, paceLowerSecPerKm: lo, paceUpperSecPerKm: hi };
                            if (id && lo != null && hi != null) {
                              const avgPace = (lo + hi) / 2;
                              const dur = parseOptionalNumber(d.durationMinutes);
                              if (dur != null && dur > 0 && avgPace > 0) {
                                patch.distanceKm = formatDraftDecimal((dur * 60) / avgPace, 2);
                              }
                            }
                            return { ...d, ...patch };
                          })}
                        />
                      )}
                      {workout.sport === 'cycling' && (
                        <AiZonePicker
                          id={`step-${step.stepIndex}-power-zone`} label="Power Zone"
                          zoneType="cycling_power" zoneSets={zoneSets} selectedId={stepDraft.powerZoneId}
                          navigate={navigate}
                          onSelect={(id, name) => setStepDraft((d) => d ? { ...d, powerZoneId: id, powerZoneName: name } : d)}
                        />
                      )}
                      <AiZonePicker
                        id={`step-${step.stepIndex}-hr-zone`} label="HR Zone"
                        zoneType="heart_rate" sport={workout.sport} zoneSets={zoneSets} selectedId={stepDraft.hrZoneId}
                        navigate={navigate}
                        onSelect={(id, name) => setStepDraft((d) => d ? { ...d, hrZoneId: id, hrZoneName: name } : d)}
                      />

                      <div className="ai-step-editor__fields">
                        <div className="cw-field">
                          <label className="cw-label" htmlFor={`step-${step.stepIndex}-duration`}>
                            Duration
                          </label>
                          <div className="cw-input-with-unit">
                            <input
                              id={`step-${step.stepIndex}-duration`}
                              className="cw-input"
                              type="number"
                              min="0"
                              step="0.1"
                              value={stepDraft.durationMinutes}
                              onChange={(event) => setStepDraft((draft) => draft
                                ? syncDistanceFromDuration(effectiveStep, draft, event.target.value)
                                : draft)}
                            />
                            <span className="cw-input-with-unit__label">min</span>
                          </div>
                        </div>

                        <div className="cw-field">
                          <label className="cw-label" htmlFor={`step-${step.stepIndex}-distance`}>
                            Distance
                          </label>
                          <div className="cw-input-with-unit">
                            <input
                              id={`step-${step.stepIndex}-distance`}
                              className="cw-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={stepDraft.distanceKm}
                              onChange={(event) => setStepDraft((draft) => draft
                                ? syncDurationFromDistance(effectiveStep, draft, event.target.value)
                                : draft)}
                            />
                            <span className="cw-input-with-unit__label">km</span>
                          </div>
                        </div>

                        <div className="cw-field">
                          <label className="cw-label" htmlFor={`step-${step.stepIndex}-repetitions`}>
                            Reps
                          </label>
                          <input
                            id={`step-${step.stepIndex}-repetitions`}
                            className="cw-input"
                            type="number"
                            min="0"
                            step="1"
                            value={stepDraft.repetitions}
                            onChange={(event) => setStepDraft((draft) => draft
                              ? { ...draft, repetitions: event.target.value }
                              : draft)}
                          />
                        </div>
                      </div>

                      <div className="ai-step-editor__form-actions">
                        <button type="submit" className="button button--primary">
                          Save
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={cancelStepEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
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

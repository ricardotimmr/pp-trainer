import type { WorkoutStep, WorkoutStepType } from '../../mock/prototypeData.types';
import { EmptyState } from '../states/EmptyState';
import {
  formatDistance,
  formatDuration,
  formatPace,
} from '../prototypeFormatters';

type WorkoutStepListProps = {
  steps: WorkoutStep[];
};

const stepTypeLabels: Record<WorkoutStepType, string> = {
  warmup: 'Warm-up',
  main: 'Main set',
  interval: 'Interval',
  recovery: 'Recovery',
  cooldown: 'Cool-down',
  technique: 'Technique',
  strength_exercise: 'Exercise',
  rest: 'Rest',
  other: 'Other',
};

const getStepTarget = (step: WorkoutStep): string | undefined => {
  if (step.targetPowerLowerWatts && step.targetPowerUpperWatts) {
    return `${step.targetPowerLowerWatts}–${step.targetPowerUpperWatts} W`;
  }
  if (step.targetPaceLowerSecPerKm && step.targetPaceUpperSecPerKm) {
    return `${formatPace(step.targetPaceLowerSecPerKm)} – ${formatPace(step.targetPaceUpperSecPerKm)}`;
  }
  if (step.targetSwimPaceLowerSecPer100m && step.targetSwimPaceUpperSecPer100m) {
    return `${step.targetSwimPaceLowerSecPer100m}–${step.targetSwimPaceUpperSecPer100m} s/100m`;
  }
  return undefined;
};

export function WorkoutStepList({ steps }: WorkoutStepListProps) {
  if (steps.length === 0) {
    return (
      <EmptyState
        title="No structured steps"
        description="This planned workout does not define any prototype workout steps yet."
        variant="inline"
      />
    );
  }

  return (
    <ol className="workout-step-list">
      {steps.map((step) => {
        const target = getStepTarget(step);
        const typeLabel = stepTypeLabels[step.stepType] ?? step.stepType;

        return (
          <li key={step.id} className="workout-step">
            <div className="workout-step__index" aria-hidden="true">
              {step.stepIndex}
            </div>
            <div className="workout-step__body">
              <p className="workout-step__type">{typeLabel}</p>
              <h3>{step.title ?? step.instruction}</h3>
              {step.title ? <p>{step.instruction}</p> : null}
              <dl className="workout-step__metrics">
                {step.durationSeconds ? (
                  <div>
                    <dt>Duration</dt>
                    <dd>{formatDuration(step.durationSeconds)}</dd>
                  </div>
                ) : null}
                {step.distanceMeters ? (
                  <div>
                    <dt>Distance</dt>
                    <dd>{formatDistance(step.distanceMeters)}</dd>
                  </div>
                ) : null}
                {step.repetitions ? (
                  <div>
                    <dt>Reps</dt>
                    <dd>×{step.repetitions}</dd>
                  </div>
                ) : null}
                {target ? (
                  <div>
                    <dt>Target</dt>
                    <dd>{target}</dd>
                  </div>
                ) : null}
                {step.restSeconds ? (
                  <div>
                    <dt>Rest</dt>
                    <dd>{formatDuration(step.restSeconds)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

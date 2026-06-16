import type { WorkoutStep } from '../../mock/prototypeData.types';
import {
  formatDistance,
  formatDuration,
  formatPace,
} from '../prototypeFormatters';

type WorkoutStepListProps = {
  steps: WorkoutStep[];
};

const getStepTarget = (step: WorkoutStep) => {
  if (step.targetPowerLowerWatts && step.targetPowerUpperWatts) {
    return `${step.targetPowerLowerWatts}-${step.targetPowerUpperWatts} W`;
  }

  if (step.targetPaceLowerSecPerKm && step.targetPaceUpperSecPerKm) {
    return `${formatPace(step.targetPaceLowerSecPerKm)} to ${formatPace(
      step.targetPaceUpperSecPerKm,
    )}`;
  }

  if (
    step.targetSwimPaceLowerSecPer100m &&
    step.targetSwimPaceUpperSecPer100m
  ) {
    return `${step.targetSwimPaceLowerSecPer100m}-${step.targetSwimPaceUpperSecPer100m}s /100m`;
  }

  return undefined;
};

export function WorkoutStepList({ steps }: WorkoutStepListProps) {
  if (steps.length === 0) {
    return <p className="empty-inline">No structured workout steps yet.</p>;
  }

  return (
    <ol className="workout-step-list">
      {steps.map((step) => {
        const target = getStepTarget(step);

        return (
          <li key={step.id} className="workout-step">
            <div className="workout-step__index">{step.stepIndex}</div>
            <div className="workout-step__body">
              <p className="workout-step__type">{step.stepType}</p>
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
                    <dd>{step.repetitions}</dd>
                  </div>
                ) : null}
                {target ? (
                  <div>
                    <dt>Target</dt>
                    <dd>{target}</dd>
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

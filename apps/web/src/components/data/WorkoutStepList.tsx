import type { WorkoutStep } from '../../mock/prototypeData.types';
import { stepTypeLabels } from './workoutStepLabels';
import { EmptyState } from '../states/EmptyState';
import {
  formatDistance,
  formatDuration,
  formatPace,
} from '../prototypeFormatters';

type WorkoutStepListProps = {
  steps: WorkoutStep[];
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

const buildMetrics = (step: WorkoutStep): string => {
  const parts: string[] = [];
  if (step.durationSeconds) parts.push(formatDuration(step.durationSeconds));
  if (step.distanceMeters) parts.push(formatDistance(step.distanceMeters));
  if (step.repetitions) parts.push(`×${step.repetitions}`);
  const target = getStepTarget(step);
  if (target) parts.push(target);
  if (step.restSeconds) parts.push(`Rest ${formatDuration(step.restSeconds)}`);
  return parts.join(' · ');
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
        const typeLabel = stepTypeLabels[step.stepType] ?? step.stepType;
        const hasTitle = !!step.title;
        const title = step.title ?? step.instruction;
        const instruction = hasTitle ? step.instruction : undefined;
        const metrics = buildMetrics(step);

        return (
          <li
            key={step.id}
            className={`workout-step workout-step--${step.stepType}`}
          >
            <span className="workout-step__num" aria-hidden="true">
              {String(step.stepIndex).padStart(2, '0')}
            </span>
            <span className="workout-step__type">{typeLabel}</span>
            <h3 className="workout-step__title">{title}</h3>
            {metrics && (
              <p className="workout-step__metrics">{metrics}</p>
            )}
            {instruction && (
              <p className="workout-step__instruction">{instruction}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

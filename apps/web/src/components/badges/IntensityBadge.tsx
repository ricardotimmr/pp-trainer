import type { WorkoutIntensity } from '../../types/domain';
import { intensityLabels } from '../prototypeFormatters';

type IntensityBadgeProps = {
  intensity: WorkoutIntensity;
};

export function IntensityBadge({ intensity }: IntensityBadgeProps) {
  return (
    <span className={`badge badge--intensity badge--intensity-${intensity}`}>
      {intensityLabels[intensity]}
    </span>
  );
}

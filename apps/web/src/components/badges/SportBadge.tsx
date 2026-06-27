import type { SportType } from '../../types/domain';
import { sportLabels } from '../prototypeFormatters';

type SportBadgeProps = {
  sport: SportType;
};

export function SportBadge({ sport }: SportBadgeProps) {
  return (
    <span className={`badge badge--sport badge--sport-${sport}`}>
      {sportLabels[sport]}
    </span>
  );
}

import {
  formatTrainingZoneRange,
  getZoneColor,
} from '../zoneVisuals';
import type { TrainingZone } from '../../mock/prototypeData.types';

type ZoneListProps = {
  zones: TrainingZone[];
  className: string;
  rowClassName: string;
  dotClassName: string;
  numberClassName?: string;
  nameClassName?: string;
  rangeClassName?: string;
};

export function ZoneList({
  zones,
  className,
  rowClassName,
  dotClassName,
  numberClassName,
  nameClassName,
  rangeClassName,
}: ZoneListProps) {
  return (
    <ul className={className}>
      {zones.map((zone, index) => (
        <li key={zone.id} className={rowClassName}>
          <span
            className={dotClassName}
            style={{ background: getZoneColor(index) }}
            aria-hidden="true"
          />
          <span className={numberClassName}>Z{zone.zoneNumber}</span>
          <span className={nameClassName}>{zone.name}</span>
          <span className={rangeClassName}>
            {formatTrainingZoneRange(zone)}
          </span>
        </li>
      ))}
    </ul>
  );
}

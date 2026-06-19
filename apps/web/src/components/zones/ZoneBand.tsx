import { getZoneColor } from '../zoneVisuals';
import type { TrainingZone } from '../../mock/prototypeData.types';

type ZoneBandProps = {
  zones: TrainingZone[];
  className: string;
};

export function ZoneBand({ zones, className }: ZoneBandProps) {
  return (
    <div
      className={className}
      style={{
        gridTemplateColumns: `repeat(${Math.max(zones.length, 1)}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {zones.map((zone, index) => (
        <span
          key={zone.id}
          style={{ background: getZoneColor(index) }}
        />
      ))}
    </div>
  );
}

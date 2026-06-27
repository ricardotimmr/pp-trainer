import { getZoneColor } from '../zoneVisuals';
import type { TrainingZone } from '../../types/domain';

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

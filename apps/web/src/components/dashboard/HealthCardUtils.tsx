import type { ReactNode } from 'react';

import type { HealthRange } from '../../hooks/useHealthRange';
import { HEALTH_RANGE_OPTIONS } from './healthCardFormat';

type HealthRangeToggleProps = {
  value: HealthRange;
  options?: HealthRange[];
  onChange: (range: HealthRange) => void;
};

export function HealthRangeToggle({
  value,
  options = HEALTH_RANGE_OPTIONS,
  onChange,
}: HealthRangeToggleProps) {
  return (
    <div className="dashboard-health-range-toggle" aria-label="Health chart range">
      {options.map((range) => (
        <button
          key={range}
          type="button"
          className={value === range ? 'is-active' : ''}
          aria-pressed={value === range}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

type HealthMetricRowProps = {
  items: { label: string; value: ReactNode }[];
};

export function HealthMetricRow({ items }: HealthMetricRowProps) {
  return (
    <dl className="dashboard-health-card__metrics">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

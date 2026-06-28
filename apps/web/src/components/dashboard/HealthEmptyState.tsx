import { EmptyState } from '../states/EmptyState';

type HealthEmptyStateProps = {
  type: 'health' | 'sleep' | 'HRV';
};

export function HealthEmptyState({ type }: HealthEmptyStateProps) {
  return (
    <EmptyState
      title={`No ${type} data yet`}
      description={`Sync from Garmin to populate this ${type === 'HRV' ? 'section' : 'card'}.`}
      variant="inline"
    />
  );
}

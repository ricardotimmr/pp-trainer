import type { WorkoutStatus } from '../../mock/prototypeData.types';

const statusLabels: Record<WorkoutStatus, string> = {
  planned: 'Planned',
  completed: 'Done',
  missed: 'Missed',
  moved: 'Moved',
  adjusted: 'Adjusted',
  cancelled: 'Cancelled',
};

type WorkoutStatusBadgeProps = {
  status: WorkoutStatus;
};

export function WorkoutStatusBadge({ status }: WorkoutStatusBadgeProps) {
  return (
    <span className={`badge badge--status badge--status-${status}`}>
      {statusLabels[status]}
    </span>
  );
}

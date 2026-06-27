import type { DataSourceType } from '../../types/domain';
import { sourceLabels } from '../prototypeFormatters';

type SourceBadgeProps = {
  source: DataSourceType;
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return <span className="badge badge--source">{sourceLabels[source]}</span>;
}

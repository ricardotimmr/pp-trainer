import type { DataSourceType } from '../../mock/prototypeData.types';
import { sourceLabels } from '../prototypeFormatters';

type SourceBadgeProps = {
  source: DataSourceType;
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return <span className="badge badge--source">{sourceLabels[source]}</span>;
}

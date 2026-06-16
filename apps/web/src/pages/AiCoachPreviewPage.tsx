import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';

export function AiCoachPreviewPage() {
  const { aiCoachPreview } = getDashboardSummary();

  return (
    <PageShell title="AI Coach Preview" description={aiCoachPreview.summary} />
  );
}

import { getDashboardSummary } from '../mock/prototypeData.helpers';
import { PlaceholderPage } from './PlaceholderPage';

export function AiCoachPreviewPage() {
  const { aiCoachPreview } = getDashboardSummary();

  return (
    <PlaceholderPage title="AI Coach Preview">
      <p>{aiCoachPreview.summary}</p>
    </PlaceholderPage>
  );
}

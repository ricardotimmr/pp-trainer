import { getDashboardSummary } from '../mock/prototypeData.helpers';
import { PlaceholderPage } from './PlaceholderPage';

export function SettingsPage() {
  const { athleteProfile } = getDashboardSummary();

  return (
    <PlaceholderPage title="Settings">
      <p>
        Athlete profile and training zones placeholder for{' '}
        {athleteProfile.displayName}.
      </p>
    </PlaceholderPage>
  );
}

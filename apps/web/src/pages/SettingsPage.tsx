import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';

export function SettingsPage() {
  const { athleteProfile } = getDashboardSummary();

  return (
    <PageShell
      title="Settings"
      description={
        <>
          Athlete profile and training zones placeholder for{' '}
          {athleteProfile.displayName}.
        </>
      }
    />
  );
}

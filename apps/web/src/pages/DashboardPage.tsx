import { getDashboardSummary } from '../mock/prototypeData.helpers';
import { PlaceholderPage } from './PlaceholderPage';

export function DashboardPage() {
  const dashboard = getDashboardSummary();

  return (
    <PlaceholderPage title="Dashboard">
      <p>
        Prototype dashboard for {dashboard.athleteProfile.displayName}: current
        training week, recent activities, upcoming workouts and a short AI coach
        hint.
      </p>
    </PlaceholderPage>
  );
}

import { PageShell } from '../layout/PageShell';
import { getDashboardSummary } from '../mock/prototypeData.helpers';

export function DashboardPage() {
  const dashboard = getDashboardSummary();

  return (
    <PageShell
      title="Dashboard"
      description={
        <>
          Prototype dashboard for {dashboard.athleteProfile.displayName}:
          current training week, recent activities, upcoming workouts and a
          short AI coach hint.
        </>
      }
    />
  );
}

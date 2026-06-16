import { DashboardWidget, SportBadge } from '../components';
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
    >
      <div className="prototype-grid">
        <DashboardWidget title="Athlete profile" eyebrow="Single user">
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{athleteProfile.displayName}</dd>
            </div>
            <div>
              <dt>FTP</dt>
              <dd>{athleteProfile.currentFtpWatts ?? 'n/a'} W</dd>
            </div>
            <div>
              <dt>Max HR</dt>
              <dd>{athleteProfile.maxHeartRateBpm ?? 'n/a'} bpm</dd>
            </div>
          </dl>
        </DashboardWidget>

        <DashboardWidget title="Primary sports" eyebrow="Configuration">
          <div className="badge-row">
            {athleteProfile.primarySports.map((sport) => (
              <SportBadge key={sport} sport={sport} />
            ))}
          </div>
        </DashboardWidget>
      </div>
    </PageShell>
  );
}

import type { PageComponentProps } from '../routes/routeTypes';
import { PlaceholderPage } from './PlaceholderPage';

export function HomePage({ navigate }: PageComponentProps) {
  return (
    <PlaceholderPage title="pp-trainer">
      <p>
        Frontend prototype entry point for the single-user training dashboard.
        Login and account flows are intentionally out of scope for Phase 2.
      </p>
      <button type="button" onClick={() => navigate('/dashboard')}>
        Open dashboard
      </button>
    </PlaceholderPage>
  );
}

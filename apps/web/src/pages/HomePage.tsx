import { PageShell } from '../layout/PageShell';
import type { PageComponentProps } from '../routes/routeTypes';

export function HomePage({ navigate }: PageComponentProps) {
  return (
    <PageShell
      title="pp-trainer"
      description="
        Frontend prototype entry point for the single-user training dashboard.
        Login and account flows are intentionally out of scope for Phase 2.
      "
      actions={
        <>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/dashboard')}
          >
            Open dashboard
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate('/training-plan')}
          >
            View training plan
          </button>
        </>
      }
    />
  );
}

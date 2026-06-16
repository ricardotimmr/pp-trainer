import { ErrorState } from '../components';
import { PageShell } from '../layout/PageShell';

export function NotFoundPage() {
  return (
    <PageShell
      title="Page not found"
      eyebrow="Prototype route"
      description="The requested prototype route does not exist."
    >
      <ErrorState
        title="Prototype route not found"
        description="This route is not part of the current Phase 2 frontend prototype."
      />
    </PageShell>
  );
}

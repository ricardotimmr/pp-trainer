import { PageShell } from '../layout/PageShell';

export function NotFoundPage() {
  return (
    <PageShell
      title="Page not found"
      eyebrow="Prototype route"
      description="The requested prototype route does not exist."
    />
  );
}

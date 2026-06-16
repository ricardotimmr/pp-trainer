import type { ReactNode } from 'react';

type PageShellProps = {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageShell({
  title,
  eyebrow = 'Phase 2 prototype',
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <section className="page-shell">
      <header className="page-shell__header">
        <div>
          <p className="page-shell__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? (
            <div className="page-shell__description">{description}</div>
          ) : null}
        </div>
        {actions ? <div className="page-shell__actions">{actions}</div> : null}
      </header>
      {children ? <div className="page-shell__content">{children}</div> : null}
    </section>
  );
}

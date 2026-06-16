import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: 'section' | 'inline';
};

export function EmptyState({
  title,
  description,
  action,
  variant = 'section',
}: EmptyStateProps) {
  return (
    <section className={`state state--empty state--${variant}`}>
      <div className="state__marker" aria-hidden="true">
        0
      </div>
      <div className="state__content">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="state__action">{action}</div> : null}
      </div>
    </section>
  );
}

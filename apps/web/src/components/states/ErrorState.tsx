import type { ReactNode } from 'react';

type ErrorStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: 'section' | 'inline';
};

export function ErrorState({
  title,
  description,
  action,
  variant = 'section',
}: ErrorStateProps) {
  return (
    <section className={`state state--error state--${variant}`} role="alert">
      <div className="state__marker" aria-hidden="true">
        !
      </div>
      <div className="state__content">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {action ? <div className="state__action">{action}</div> : null}
      </div>
    </section>
  );
}

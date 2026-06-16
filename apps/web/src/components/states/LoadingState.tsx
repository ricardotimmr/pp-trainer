import type { ReactNode } from 'react';

type LoadingStateProps = {
  title: string;
  description?: ReactNode;
  variant?: 'section' | 'inline';
};

export function LoadingState({
  title,
  description,
  variant = 'section',
}: LoadingStateProps) {
  return (
    <section
      className={`state state--loading state--${variant}`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="state__marker state__marker--loading" aria-hidden="true">
        <span />
      </div>
      <div className="state__content">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        <div className="state__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

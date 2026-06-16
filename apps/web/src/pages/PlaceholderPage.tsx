import type { ReactNode } from 'react';

type PlaceholderPageProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function PlaceholderPage({
  title,
  eyebrow = 'Phase 2 prototype',
  children,
}: PlaceholderPageProps) {
  return (
    <section className="prototype-page">
      <p className="prototype-page__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="prototype-page__body">{children}</div>
    </section>
  );
}

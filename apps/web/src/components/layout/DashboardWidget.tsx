import type { ReactNode } from 'react';

type DashboardWidgetProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardWidget({
  title,
  eyebrow,
  action,
  children,
}: DashboardWidgetProps) {
  return (
    <section className="dashboard-widget">
      <header className="dashboard-widget__header">
        <div>
          {eyebrow ? (
            <p className="dashboard-widget__eyebrow">{eyebrow}</p>
          ) : null}
          <h2>{title}</h2>
        </div>
        {action ? (
          <div className="dashboard-widget__action">{action}</div>
        ) : null}
      </header>
      <div className="dashboard-widget__body">{children}</div>
    </section>
  );
}

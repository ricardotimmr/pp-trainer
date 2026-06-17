// DEV-ONLY — not linked from navigation. Reach via /dev/ui-showcase
import {
  ActivityCard,
  ActivitySummaryStats,
  DashboardWidget,
  EmptyState,
  ErrorState,
  IntensityBadge,
  LoadingState,
  SourceBadge,
  SportBadge,
  WorkoutCard,
} from '../components';
import { PageShell } from '../layout/PageShell';
import {
  getActivities,
  getPlannedWorkouts,
  getRecentActivities,
} from '../mock/prototypeData.helpers';
import type { PageComponentProps } from '../routes/routeTypes';

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">{title}</h2>
      {children}
    </section>
  );
}

function ShowcaseGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="showcase-group">
      <p className="showcase-group__label">{label}</p>
      <div className="showcase-group__content">{children}</div>
    </div>
  );
}

export function DevUiShowcasePage({ navigate }: PageComponentProps) {
  const activities = getActivities();
  const workouts = getPlannedWorkouts();
  const recentActivities = getRecentActivities(4);

  const activityA = activities[0];
  const activityB = activities[1];
  const workoutA = workouts[0];
  const workoutB = workouts[1];
  const workoutC = workouts[2];

  return (
    <PageShell
      title="UI Component Showcase"
      eyebrow="Developer · /dev/ui-showcase"
      description="All shared prototype UI components in one place. Not linked from navigation — reach directly via URL."
    >
      <div className="showcase-page">

        {/* ── BADGES ─────────────────────────────────────────── */}
        <ShowcaseSection title="Badges">
          <ShowcaseGroup label="Sport — outline + skewed tick">
            <div className="badge-row">
              <SportBadge sport="cycling" />
              <SportBadge sport="running" />
              <SportBadge sport="swimming" />
              <SportBadge sport="strength" />
              <SportBadge sport="mobility" />
              <SportBadge sport="other" />
            </div>
          </ShowcaseGroup>

          <ShowcaseGroup label="Intensity — solid heat fill (cool → race)">
            <div className="badge-row">
              <IntensityBadge intensity="rest" />
              <IntensityBadge intensity="recovery" />
              <IntensityBadge intensity="easy" />
              <IntensityBadge intensity="moderate" />
              <IntensityBadge intensity="tempo" />
              <IntensityBadge intensity="threshold" />
              <IntensityBadge intensity="vo2max" />
              <IntensityBadge intensity="race" />
            </div>
          </ShowcaseGroup>

          <ShowcaseGroup label="Source — dashed neutral">
            <div className="badge-row">
              {activityA ? <SourceBadge source={activityA.sourceType} /> : null}
              {activityB ? <SourceBadge source={activityB.sourceType} /> : null}
              <span className="badge badge--source">Garmin Export</span>
              <span className="badge badge--source">Strava</span>
              <span className="badge badge--source">Fit Upload</span>
            </div>
          </ShowcaseGroup>

          <ShowcaseGroup label="Mixed — badge-row context">
            <div className="badge-row">
              <SportBadge sport="cycling" />
              <IntensityBadge intensity="vo2max" />
              <span className="badge badge--source">Garmin</span>
            </div>
            <div className="badge-row" style={{ marginTop: 8 }}>
              <SportBadge sport="running" />
              <IntensityBadge intensity="easy" />
              <span className="badge badge--source">Strava</span>
            </div>
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── BUTTONS ────────────────────────────────────────── */}
        <ShowcaseSection title="Buttons">
          <ShowcaseGroup label="Variants">
            <div className="badge-row">
              <button type="button" className="button button--primary">Primary</button>
              <button type="button" className="button button--secondary">Secondary</button>
              <button type="button" className="button button--primary" disabled>Primary disabled</button>
              <button type="button" className="button button--secondary" disabled>Secondary disabled</button>
            </div>
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── WORKOUT CARDS ──────────────────────────────────── */}
        <ShowcaseSection title="Workout Card">
          <ShowcaseGroup label="Static (no onOpen)">
            <div className="dashboard-card-grid">
              {workoutA ? <WorkoutCard workout={workoutA} /> : null}
              {workoutB ? <WorkoutCard workout={workoutB} /> : null}
            </div>
          </ShowcaseGroup>

          <ShowcaseGroup label="Interactive button (hover to see fill animation)">
            <div className="dashboard-card-grid">
              {workoutA ? (
                <WorkoutCard
                  workout={workoutA}
                  onOpen={(id) => navigate(`/workouts/${id}`)}
                />
              ) : null}
              {workoutB ? (
                <WorkoutCard
                  workout={workoutB}
                  onOpen={(id) => navigate(`/workouts/${id}`)}
                />
              ) : null}
              {workoutC ? (
                <WorkoutCard
                  workout={workoutC}
                  onOpen={(id) => navigate(`/workouts/${id}`)}
                />
              ) : null}
            </div>
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── ACTIVITY CARDS ─────────────────────────────────── */}
        <ShowcaseSection title="Activity Card">
          <ShowcaseGroup label="Static (no onOpen)">
            <div className="list-stack">
              {activityA ? <ActivityCard activity={activityA} /> : null}
              {activityB ? <ActivityCard activity={activityB} /> : null}
            </div>
          </ShowcaseGroup>

          <ShowcaseGroup label="Interactive button (hover to see fill animation)">
            <div className="list-stack">
              {activities.slice(0, 3).map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onOpen={(id) => navigate(`/activities/${id}`)}
                />
              ))}
            </div>
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── DATA COMPONENTS ────────────────────────────────── */}
        <ShowcaseSection title="Data Components">
          <ShowcaseGroup label="ActivitySummaryStats — metric strip">
            <ActivitySummaryStats activities={recentActivities} />
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── DASHBOARD WIDGET ───────────────────────────────── */}
        <ShowcaseSection title="Dashboard Widget">
          <ShowcaseGroup label="With eyebrow and action">
            <DashboardWidget
              title="Widget title"
              eyebrow="Eyebrow label"
              action={
                <button type="button" className="button button--secondary">
                  Action
                </button>
              }
            >
              <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Widget body content goes here.
              </p>
            </DashboardWidget>
          </ShowcaseGroup>

          <ShowcaseGroup label="Title only">
            <DashboardWidget title="Widget title only">
              <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Widget body content goes here.
              </p>
            </DashboardWidget>
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── STATES ─────────────────────────────────────────── */}
        <ShowcaseSection title="States">
          <ShowcaseGroup label="EmptyState — section">
            <EmptyState
              title="No data available"
              description="Content will appear here once data has been added."
              action={
                <button type="button" className="button button--primary">
                  Add data
                </button>
              }
              variant="section"
            />
          </ShowcaseGroup>

          <ShowcaseGroup label="EmptyState — inline">
            <EmptyState
              title="No upcoming workouts"
              description="Planned sessions will appear here."
              variant="inline"
            />
          </ShowcaseGroup>

          <ShowcaseGroup label="LoadingState — section">
            <LoadingState
              title="Loading data"
              description="Fetching content from the data source."
              variant="section"
            />
          </ShowcaseGroup>

          <ShowcaseGroup label="LoadingState — inline">
            <LoadingState title="Loading…" variant="inline" />
          </ShowcaseGroup>

          <ShowcaseGroup label="ErrorState — section">
            <ErrorState
              title="Something went wrong"
              description="An error occurred while loading this content."
              action={
                <button type="button" className="button button--secondary">
                  Try again
                </button>
              }
              variant="section"
            />
          </ShowcaseGroup>

          <ShowcaseGroup label="ErrorState — inline">
            <ErrorState
              title="Failed to load"
              description="Check your connection and retry."
              variant="inline"
            />
          </ShowcaseGroup>
        </ShowcaseSection>

        {/* ── OPEN PANELS ────────────────────────────────────── */}
        <ShowcaseSection title="Open Panel">
          <ShowcaseGroup label="With content">
            <section className="open-panel">
              <header className="open-panel__head">
                <p className="open-panel__eyebrow">Focus</p>
                <h2 className="open-panel__title">Active goal</h2>
              </header>
              <div className="dashboard-goal">
                <div className="badge-row">
                  <SportBadge sport="cycling" />
                  <span className="badge badge--source">main goal</span>
                </div>
                <h3>Finish Ironman 70.3</h3>
                <p>Complete the full distance race in under 5 hours.</p>
                <span>Target: 12 Oct 2026</span>
              </div>
            </section>
          </ShowcaseGroup>

          <ShowcaseGroup label="Linked variant (open-panel--linked)">
            <section className="open-panel open-panel--linked">
              <header className="open-panel__head">
                <p className="open-panel__eyebrow">Athlete profile</p>
                <h2 className="open-panel__title">Primary sports</h2>
              </header>
              <div className="dashboard-sport-list">
                <SportBadge sport="cycling" />
                <SportBadge sport="running" />
                <SportBadge sport="swimming" />
              </div>
            </section>
          </ShowcaseGroup>
        </ShowcaseSection>

      </div>
    </PageShell>
  );
}

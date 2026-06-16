import { DashboardWidget, SourceBadge } from '../components';
import { PageShell } from '../layout/PageShell';

export function ImportPage() {
  return (
    <PageShell
      title="Import"
      description="
        Placeholder for future manual activity imports. No real import is wired
        in Phase 2.
      "
    >
      <DashboardWidget title="Future import sources" eyebrow="Placeholder">
        <div className="badge-row">
          <SourceBadge source="manual_fit_upload" />
          <SourceBadge source="manual_gpx_upload" />
          <SourceBadge source="manual_tcx_upload" />
          <SourceBadge source="manual_json_import" />
          <SourceBadge source="manual_csv_import" />
        </div>
        <p className="prototype-muted">
          This area is only a visual placeholder. File parsing and persistence
          start in later phases.
        </p>
      </DashboardWidget>
    </PageShell>
  );
}

import { SourceBadge } from '../components';
import { PageShell } from '../layout/PageShell';
import type { DataSourceType } from '../mock/prototypeData.types';

type ImportSourceStatus = 'Prototype' | 'Planned' | 'Future' | 'Fallback';

type ImportSource = {
  title: string;
  source: DataSourceType;
  status: ImportSourceStatus;
  description: string;
  details: string[];
};

type ImportHistoryRow = {
  source: DataSourceType;
  status: 'Queued' | 'Validated' | 'Blocked';
  activities: number;
  timestamp: string;
  note: string;
};

const futureFormats = ['FIT', 'GPX', 'TCX'];
const developmentFormats = ['JSON', 'CSV', 'Mock data'];

const importSources: ImportSource[] = [
  {
    title: 'python-garminconnect',
    source: 'garmin_unofficial',
    status: 'Prototype',
    description: 'Primary private sync path for MVP exploration and richer Garmin activity fields.',
    details: ['Activity streams', 'Splits and laps', 'HR and power zones'],
  },
  {
    title: 'Manual upload',
    source: 'manual_fit_upload',
    status: 'Planned',
    description: 'Fallback and complement for athlete-controlled file imports.',
    details: ['FIT', 'GPX', 'TCX'],
  },
  {
    title: 'Official Garmin API',
    source: 'garmin_official',
    status: 'Future',
    description: 'Long-term production target when API access and compliance requirements are clear.',
    details: ['OAuth', 'Partner access', 'Production sync'],
  },
  {
    title: 'Garmin export',
    source: 'garmin_export',
    status: 'Fallback',
    description: 'Future backup path for historical exports and manual recovery imports.',
    details: ['Bulk exports', 'Historical files', 'Manual review'],
  },
];

const pipelineSteps = [
  {
    label: 'Source',
    title: 'File or sync payload',
    description: 'FIT, GPX, TCX, JSON, CSV, mock data or Garmin sync output.',
  },
  {
    label: 'Validate',
    title: 'Schema and required fields',
    description: 'Reject unsupported formats and flag missing timestamps, sport type or samples.',
  },
  {
    label: 'Store raw',
    title: 'Preserve source data',
    description: 'Keep original payloads available for debugging and future re-normalization.',
  },
  {
    label: 'Normalize',
    title: 'Adapter mapping',
    description: 'Map each source into the stable internal training and activity model.',
  },
  {
    label: 'Use',
    title: 'Activity model',
    description: 'Dashboard, Activities, Detail pages and AI Coach read the same internal structure.',
  },
];

const historyRows: ImportHistoryRow[] = [
  {
    source: 'garmin_unofficial',
    status: 'Validated',
    activities: 8,
    timestamp: 'Prototype sample',
    note: 'Representative Garmin sync batch with streams, laps and zones.',
  },
  {
    source: 'manual_fit_upload',
    status: 'Queued',
    activities: 1,
    timestamp: 'Future upload',
    note: 'Single FIT activity awaiting parser integration.',
  },
  {
    source: 'manual_json_import',
    status: 'Blocked',
    activities: 0,
    timestamp: 'Dev fixture',
    note: 'Missing activity start time in example JSON payload.',
  },
];

const validationExamples = [
  {
    title: 'Unsupported file type',
    detail: 'A .zip or image upload would be rejected before parsing starts.',
  },
  {
    title: 'Missing required data',
    detail: 'Activities without start time, sport type or duration cannot enter the internal model.',
  },
];

export function ImportPage() {
  return (
    <PageShell
      title="Import"
      eyebrow="Data sources · Phase 2"
      description="Future entry point for activity imports and Garmin-related sync paths. Real upload, parsing and persistence are intentionally out of scope for this prototype."
    >
      <div className="import-page">
        <section className="import-hero">
          <div className="import-dropzone" aria-label="Non-functional upload placeholder">
            <div className="import-dropzone__mark" aria-hidden="true">+</div>
            <div>
              <p className="import-section-label">Import entry</p>
              <h2>Drop activity files here</h2>
              <p>
                Visual placeholder only. Phase 2 does not read files, parse
                uploads or persist import results.
              </p>
            </div>
            <button type="button" disabled>
              Upload disabled
            </button>
          </div>

          <aside className="import-format-panel">
            <div>
              <p className="import-section-label">Future file support</p>
              <div className="import-format-list">
                {futureFormats.map((format) => (
                  <span key={format}>{format}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="import-section-label">Development inputs</p>
              <div className="import-format-list import-format-list--muted">
                {developmentFormats.map((format) => (
                  <span key={format}>{format}</span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="import-section">
          <header className="import-section__head">
            <div>
              <p>Import pipeline</p>
              <h2>External sources normalize into one Activity model</h2>
            </div>
            <span>Source agnostic</span>
          </header>
          <ol className="import-pipeline">
            {pipelineSteps.map((step) => (
              <li key={step.label}>
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="import-section">
          <header className="import-section__head">
            <div>
              <p>Source strategy</p>
              <h2>Garmin is important, but replaceable</h2>
            </div>
          </header>
          <div className="import-source-grid">
            {importSources.map((source) => (
              <article key={source.title} className="import-source-card">
                <div className="import-source-card__top">
                  <SourceBadge source={source.source} />
                  <span>{source.status}</span>
                </div>
                <h3>{source.title}</h3>
                <p>{source.description}</p>
                <div className="import-source-card__details">
                  {source.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="import-lower-grid">
          <div className="import-section import-section--compact">
            <header className="import-section__head">
              <div>
                <p>Recent imports</p>
                <h2>History placeholder</h2>
              </div>
            </header>
            <table className="import-history" aria-label="Static import history">
              <thead>
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Status</th>
                  <th scope="col">Count</th>
                  <th scope="col">When</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={`${row.source}-${row.status}`}>
                    <td data-label="Source"><SourceBadge source={row.source} /></td>
                    <td
                      className={`import-status import-status--${row.status.toLowerCase()}`}
                      data-label="Status"
                    >
                      {row.status}
                    </td>
                    <td data-label="Count">{row.activities}</td>
                    <td data-label="When">{row.timestamp}</td>
                    <td data-label="Note">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="import-section import-section--compact">
            <header className="import-section__head">
              <div>
                <p>Validation preview</p>
                <h2>Error states</h2>
              </div>
              <span>Example only</span>
            </header>
            <div className="import-validation-list">
              {validationExamples.map((example) => (
                <div key={example.title}>
                  <span aria-hidden="true">!</span>
                  <div>
                    <h3>{example.title}</h3>
                    <p>{example.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="import-caveat">
              No real validation runs in Phase 2. These examples define the
              expected product language for later import work.
            </p>
          </aside>
        </section>
      </div>
    </PageShell>
  );
}

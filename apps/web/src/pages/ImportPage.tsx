import { useRef, useState } from 'react';

import type { ImportDetailDto, ImportSummaryDto } from '@pp-trainer/shared';

import { EmptyState, ErrorState, LoadingState, SourceBadge } from '../components';
import { DATA_MODE } from '../config/dataMode';
import { formatDate } from '../components/prototypeFormatters';
import { getImportDetail } from '../api/importApi';
import { useImport } from '../hooks/useImport';
import type { FileResult } from '../hooks/useImport';
import { useImportHistory } from '../hooks/useImportHistory';
import { PageShell } from '../layout/PageShell';
import { getImportHistoryRows } from '../mock/prototypeImportData';
import type { PageComponentProps } from '../routes/routeTypes';
import type { DataSourceType } from '../mock/prototypeData.types';

type ImportSourceStatus = 'Prototype' | 'Planned' | 'Future' | 'Fallback';

type ImportSource = {
  title: string;
  source: DataSourceType;
  status: ImportSourceStatus;
  description: string;
  details: string[];
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

const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed: 'Failed',
  duplicate: 'Duplicate',
  processing: 'Processing',
  pending: 'Pending',
  partially_imported: 'Partial',
};

type FilterTab = { label: string; value: string | undefined };
const FILTER_TABS: FilterTab[] = [
  { label: 'All', value: undefined },
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
  { label: 'Duplicate', value: 'duplicate' },
];

function ImportStatusBadge({ status }: { status: string }) {
  return (
    <span className={`import-status-badge import-status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

type ImportHistoryRowProps = {
  item: ImportSummaryDto;
  expanded: boolean;
  detail: ImportDetailDto | undefined;
  loadingDetail: boolean;
  onShowError: (id: string) => void;
  navigate: (path: string) => void;
};

function ImportHistoryRow({
  item,
  expanded,
  detail,
  loadingDetail,
  onShowError,
  navigate,
}: ImportHistoryRowProps) {
  return (
    <div className="import-history-row">
      <div className="import-history-row__main">
        <div className="import-history-row__meta">
          <span className="import-history-row__date">{formatDate(item.createdAt)}</span>
          <span className="import-history-row__source">{item.sourceLabel}</span>
        </div>
        <ImportStatusBadge status={item.status} />
        <div className="import-history-row__action">
          {item.status === 'success' && item.activityId != null && (
            <button
              type="button"
              className="import-history-link"
              onClick={() => navigate(`/activities/${item.activityId}`)}
            >
              View Activity
            </button>
          )}
          {item.status === 'duplicate' && item.activityId != null && (
            <button
              type="button"
              className="import-history-link"
              onClick={() => navigate(`/activities/${item.activityId}`)}
            >
              View existing
            </button>
          )}
          {(item.status === 'processing' || item.status === 'pending') && (
            <span className="import-spinner" aria-label="In progress" />
          )}
          {item.status === 'failed' && (
            <button
              type="button"
              className="import-history-link import-history-link--error"
              onClick={() => onShowError(item.id)}
            >
              {expanded ? 'Hide error' : 'Show error'}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="import-history-row__detail">
          {loadingDetail && <span className="import-spinner" />}
          {item.errorMessage != null && (
            <p className="import-history-row__error">{item.errorMessage}</p>
          )}
          {detail != null && detail.warningMessages.length > 0 && (
            <ul className="import-history-row__warnings">
              {detail.warningMessages.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ImportHistorySection({ navigate }: { navigate: (path: string) => void }) {
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const { phase, items, hasMore, loadingMore, errorMessage, loadMore } =
    useImportHistory(filterStatus);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, ImportDetailDto>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  function handleShowError(id: string): void {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    if (detailCache[id] != null) {
      setExpandedId(id);
      return;
    }
    setLoadingDetailId(id);
    setExpandedId(id);
    getImportDetail(id)
      .then((d) => {
        setDetailCache((prev) => ({ ...prev, [id]: d }));
      })
      .catch(() => {
        // errorMessage already in summary; expand shows what we have
      })
      .finally(() => {
        setLoadingDetailId(null);
      });
  }

  return (
    <section className="import-section">
      <header className="import-section__head">
        <div>
          <p>Import history</p>
          <h2>Recent import attempts</h2>
        </div>
      </header>

      <div className="import-history-filters" role="tablist" aria-label="Filter by status">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={filterStatus === tab.value}
            className={`import-history-filter${filterStatus === tab.value ? ' is-active' : ''}`}
            onClick={() => setFilterStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {phase === 'loading' && (
        <LoadingState
          title="Loading import history"
          description="Fetching from local backend..."
          variant="inline"
        />
      )}

      {phase === 'error' && (
        <ErrorState
          title="Could not load history"
          description={errorMessage}
          variant="inline"
        />
      )}

      {phase === 'success' && items.length === 0 && (
        <EmptyState
          title="No imports yet"
          description="Upload your first activity above."
          variant="inline"
        />
      )}

      {phase === 'success' && items.length > 0 && (
        <>
          <div className="import-history-list">
            {items.map((item) => (
              <ImportHistoryRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                detail={detailCache[item.id]}
                loadingDetail={loadingDetailId === item.id}
                onShowError={handleShowError}
                navigate={navigate}
              />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className="import-load-more"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </section>
  );
}

const ACCEPTED_EXTENSIONS = ['.fit', '.gpx', '.tcx'];

const FILE_STATUS_ICON: Record<FileResult['status'], string> = {
  pending: '·',
  uploading: '↑',
  success: '✓',
  error: '!',
  duplicate: '≈',
};

function FileResultRow({
  result,
  navigate,
}: {
  result: FileResult;
  navigate: (path: string) => void;
}) {
  const s = result.status;
  return (
    <div className={`import-file-result import-file-result--${s}`}>
      <span className="import-file-result__icon" aria-hidden="true">
        {s === 'uploading' ? <span className="import-spinner import-spinner--sm" /> : FILE_STATUS_ICON[s]}
      </span>
      <span className="import-file-result__name">{result.name}</span>
      <div className="import-file-result__action">
        {s === 'success' && result.activityId != null && (
          <button
            type="button"
            className="import-file-result__link"
            onClick={() => navigate(`/activities/${result.activityId}`)}
          >
            View
          </button>
        )}
        {s === 'duplicate' && result.activityId != null && (
          <button
            type="button"
            className="import-file-result__link import-file-result__link--duplicate"
            onClick={() => navigate(`/activities/${result.activityId}`)}
          >
            View existing
          </button>
        )}
        {s === 'error' && (
          <span className="import-file-result__error-msg" title={result.message}>
            {result.message ?? 'Failed'}
          </span>
        )}
      </div>
    </div>
  );
}

function ImportApiMode({ navigate }: PageComponentProps) {
  const { state, startFileUploads, startJsonImport, reset } = useImport();
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBatchUploading = state.status === 'files-uploading';
  const isJsonUploading = state.status === 'json-uploading';
  const isUploading = isBatchUploading || isJsonUploading;

  function pickFiles(files: FileList | null): void {
    if (!files || files.length === 0) return;
    startFileUploads(Array.from(files));
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(): void {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    pickFiles(e.dataTransfer.files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    pickFiles(e.target.files);
    e.target.value = '';
  }

  function handleJsonSubmit(): void {
    setJsonParseError(null);
    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setJsonParseError('Invalid JSON — check the syntax and try again');
      return;
    }
    startJsonImport(payload);
  }

  function zoneClasses(): string {
    const base = 'import-upload-zone';
    if (isBatchUploading) return `${base} ${base}--uploading`;
    if (isDragging) return `${base} ${base}--dragging`;
    return base;
  }

  const batchLabel =
    state.status === 'files-uploading'
      ? `Importing ${state.completedCount + 1} of ${state.results.length}…`
      : null;

  const showFileResults =
    state.status === 'files-uploading' || state.status === 'files-done';

  const fileResults =
    state.status === 'files-uploading' || state.status === 'files-done'
      ? state.results
      : [];

  const doneCount = fileResults.filter((r) => r.status === 'success').length;
  const dupCount = fileResults.filter((r) => r.status === 'duplicate').length;
  const errCount = fileResults.filter((r) => r.status === 'error').length;

  return (
    <PageShell
      title="Import"
      eyebrow="Data sources · Phase 4"
      description="Upload FIT, GPX or TCX files from your Garmin device, or submit an activity via JSON for testing."
    >
      <div className="import-page">
        <section className="import-hero">
          <div>
            <div
              className={zoneClasses()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              aria-label="Drop FIT, GPX or TCX files here, or click to browse"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !isUploading && fileInputRef.current?.click()}
            >
              <div className="import-dropzone__mark" aria-hidden="true">
                {isBatchUploading ? <span className="import-spinner" /> : '+'}
              </div>

              <div className="import-upload-zone__body">
                <p className="import-section-label">Upload activity files</p>
                <h2>{batchLabel ?? 'Drop activity files here'}</h2>
                <p>
                  {isBatchUploading
                    ? 'Processing files through the import pipeline.'
                    : `Accepted: ${ACCEPTED_EXTENSIONS.join(', ')} — select multiple or drop a batch.`}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_EXTENSIONS.join(',')}
                style={{ display: 'none' }}
                onChange={handleFileInput}
                aria-hidden="true"
              />

              {!isUploading && (
                <button
                  type="button"
                  className="import-upload-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </button>
              )}
            </div>

            {showFileResults && (
              <div className="import-file-results" role="status" aria-live="polite">
                {fileResults.map((result, i) => (
                  <FileResultRow key={i} result={result} navigate={navigate} />
                ))}
                {state.status === 'files-done' && (
                  <div className="import-file-results__footer">
                    <span className="import-file-results__summary">
                      {doneCount > 0 && <span>{doneCount} imported</span>}
                      {dupCount > 0 && <span>{dupCount} duplicate{dupCount > 1 ? 's' : ''}</span>}
                      {errCount > 0 && <span>{errCount} failed</span>}
                    </span>
                    <button type="button" className="import-result__reset" onClick={reset}>
                      Import more
                    </button>
                  </div>
                )}
              </div>
            )}

            {state.status === 'json-success' && (
              <div className="import-result import-result--success" role="status">
                <span className="import-result__icon" aria-hidden="true">✓</span>
                <div>
                  <p className="import-result__title">Activity imported successfully</p>
                  <p className="import-result__message">Import ID: {state.importId}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="import-result__link"
                    onClick={() => navigate(`/activities/${state.activityId}`)}
                  >
                    View Activity
                  </button>
                  <button type="button" className="import-result__reset" onClick={reset}>
                    Import another
                  </button>
                </div>
              </div>
            )}

            {state.status === 'json-error' && (
              <div className="import-result import-result--error" role="alert">
                <span className="import-result__icon" aria-hidden="true">!</span>
                <div>
                  <p className="import-result__title">Import failed</p>
                  <p className="import-result__message">{state.message}</p>
                </div>
                <button type="button" className="import-result__reset" onClick={reset}>
                  Try again
                </button>
              </div>
            )}

            {state.status === 'json-duplicate' && (
              <div className="import-result import-result--duplicate" role="status">
                <span className="import-result__icon" aria-hidden="true">≈</span>
                <div>
                  <p className="import-result__title">Already imported</p>
                  <p className="import-result__message">
                    This activity was detected as a duplicate of an existing entry.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="import-result__link"
                    onClick={() => navigate(`/activities/${state.existingActivityId}`)}
                  >
                    View existing activity
                  </button>
                  <button type="button" className="import-result__reset" onClick={reset}>
                    Import another
                  </button>
                </div>
              </div>
            )}

            <details className="import-json-details">
              <summary>Import via JSON (Development)</summary>
              <div className="import-json-details__body">
                <textarea
                  className="import-json-textarea"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`{\n  "athleteProfileId": "...",\n  "sport": "running",\n  "startTime": "2026-06-22T07:00:00Z",\n  "durationSeconds": 3600\n}`}
                  disabled={isUploading}
                  spellCheck={false}
                />
                {jsonParseError != null && (
                  <p className="import-json-error">{jsonParseError}</p>
                )}
                <button
                  type="button"
                  className="import-json-submit"
                  onClick={handleJsonSubmit}
                  disabled={isUploading || jsonText.trim() === ''}
                >
                  Submit JSON
                </button>
              </div>
            </details>
          </div>

          <aside className="import-format-panel">
            <div>
              <p className="import-section-label">Supported file formats</p>
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

        <ImportHistorySection navigate={navigate} />

        <InformationalSections />
      </div>
    </PageShell>
  );
}

function ImportMockMode() {
  const historyRows = getImportHistoryRows();

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

        <InformationalSections historyRows={historyRows} />
      </div>
    </PageShell>
  );
}

type HistoryRow = ReturnType<typeof getImportHistoryRows>[number];

function InformationalSections({ historyRows }: { historyRows?: HistoryRow[] }) {
  return (
    <>
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

      {historyRows != null && (
        <section className="import-lower-grid">
          <div className="import-section import-section--compact">
            <header className="import-section__head">
              <div>
                <p>Recent imports</p>
                <h2>History placeholder</h2>
              </div>
            </header>
            {historyRows.length > 0 ? (
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
            ) : (
              <EmptyState
                title="No recent imports"
                description="Import history will appear here once activity data has been queued or validated."
                variant="inline"
              />
            )}
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
      )}
    </>
  );
}

export function ImportPage({ navigate, params }: PageComponentProps) {
  if (DATA_MODE === 'api') {
    return <ImportApiMode navigate={navigate} params={params} />;
  }
  return <ImportMockMode />;
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import type {
  ImportDetailDto,
  ImportSummaryDto,
  SyncImportBatchDto,
  SyncJobDto,
} from '@pp-trainer/shared';

import { EmptyState, ErrorState, LoadingState, SourceBadge } from '../components';
import { formatDate } from '../components/prototypeFormatters';
import { disconnectStrava, startStravaAuthorize } from '../api/connectionApi';
import { getImportDetail } from '../api/importApi';
import { ApiClientError } from '../api/apiClient';
import { startGarminSync, startStravaSync } from '../api/syncApi';
import { useGarminSyncStatus } from '../hooks/useGarminSyncStatus';
import { useImport } from '../hooks/useImport';
import type { FileResult } from '../hooks/useImport';
import { useImportHistory } from '../hooks/useImportHistory';
import { useStravaConnection } from '../hooks/useStravaConnection';
import { useSyncHistory } from '../hooks/useSyncHistory';
import { PageShell } from '../layout/PageShell';
import type { PageComponentProps } from '../routes/routeTypes';
import type { DataSourceType } from '../types/domain';

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

const STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed: 'Failed',
  duplicate: 'Duplicate',
  processing: 'Processing',
  pending: 'Pending',
  partially_imported: 'Partial',
  running: 'Running',
  completed: 'Completed',
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

type SyncImportBatchRowProps = {
  batch: SyncImportBatchDto;
  expanded: boolean;
  onToggle: (id: string) => void;
  navigate: (path: string) => void;
};

function formatBatchCounts(batch: SyncImportBatchDto): string {
  const imported = `${batch.activitiesImported} imported`;
  const skipped = `${batch.activitiesSkipped} skipped`;
  const health =
    batch.healthDaysImported > 0
      ? ` · ${batch.healthDaysImported} health day${batch.healthDaysImported === 1 ? '' : 's'}`
      : '';
  return `${imported} · ${skipped}${health}`;
}

function SyncImportBatchRow({ batch, expanded, onToggle, navigate }: SyncImportBatchRowProps) {
  return (
    <div className="import-history-row import-history-row--batch">
      <div className="import-history-row__main">
        <div className="import-history-row__meta">
          <span className="import-history-row__date">{formatDate(batch.startedAt)}</span>
          <span className="import-history-row__source">
            {batch.sourceLabel} sync package
          </span>
          <span className="import-history-row__summary">{formatBatchCounts(batch)}</span>
        </div>
        <ImportStatusBadge status={batch.status} />
        <div className="import-history-row__action">
          {batch.imports.length > 0 ? (
            <button
              type="button"
              className="import-history-link"
              aria-expanded={expanded}
              onClick={() => onToggle(batch.id)}
            >
              {expanded ? 'Hide activities' : `Show ${batch.imports.length} activities`}
            </button>
          ) : (
            <span className="import-history-row__summary">No activity imports</span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="import-history-row__detail">
          {batch.errorMessage != null && (
            <p className="import-history-row__error">{batch.errorMessage}</p>
          )}
          <div className="import-history-batch-list">
            {batch.imports.map((child) => (
              <div className="import-history-batch-item" key={child.id}>
                <div>
                  <span className="import-history-row__date">{formatDate(child.createdAt)}</span>
                  <span className="import-history-row__source">{child.sourceLabel}</span>
                  {child.errorMessage != null && (
                    <span className="import-history-row__error">{child.errorMessage}</span>
                  )}
                </div>
                <ImportStatusBadge status={child.status} />
                {child.activityId != null && (
                  <button
                    type="button"
                    className="import-history-link"
                    onClick={() => navigate(`/activities/${child.activityId}`)}
                  >
                    {child.status === 'duplicate' ? 'View existing' : 'View Activity'}
                  </button>
                )}
              </div>
            ))}
          </div>
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

  function handleToggleBatch(id: string): void {
    setExpandedId((current) => (current === id ? null : id));
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
            {items.map((item) =>
              item.entryType === 'sync_batch' ? (
                <SyncImportBatchRow
                  key={item.id}
                  batch={item}
                  expanded={expandedId === item.id}
                  onToggle={handleToggleBatch}
                  navigate={navigate}
                />
              ) : (
                <ImportHistoryRow
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  detail={detailCache[item.id]}
                  loadingDetail={loadingDetailId === item.id}
                  onShowError={handleShowError}
                  navigate={navigate}
                />
              ),
            )}
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

function SyncStatusBadge({ status }: { status: SyncJobDto['status'] }) {
  return (
    <span className={`sync-status-badge sync-status-badge--${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatRelativeSyncTime(dateValue: string): string {
  const date = new Date(dateValue);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMs < 60_000) return 'just now';
  if (absMs < 3_600_000) return formatter.format(Math.round(diffMs / 60_000), 'minute');
  if (absMs < 86_400_000) return formatter.format(Math.round(diffMs / 3_600_000), 'hour');
  return formatter.format(Math.round(diffMs / 86_400_000), 'day');
}

function formatSyncImportSummary(job: SyncJobDto): string {
  const activityText =
    job.activitiesImported === 1
      ? '1 activity imported'
      : `${job.activitiesImported} activities imported`;
  const healthText =
    job.healthDaysImported === 1
      ? '1 health day'
      : `${job.healthDaysImported} health days`;

  if (job.healthDaysImported > 0) return `${activityText} · ${healthText}`;
  return activityText;
}

function getSyncJobTime(job: SyncJobDto): string {
  return job.completedAt ?? job.startedAt;
}

function GarminSyncCard() {
  const statusState = useGarminSyncStatus();
  const historyState = useSyncHistory('garmin_unofficial');
  const [isSyncing, setIsSyncing] = useState(false);

  const statusData = statusState.data;
  const isConfigured = statusData?.configured === true;
  const jobs = historyState.jobs.slice(0, 5);
  const lastSync = statusData?.lastSync ?? jobs[0] ?? null;
  const lastFailed = lastSync?.status === 'failed' ? lastSync : null;

  async function handleSyncNow(): Promise<void> {
    setIsSyncing(true);
    try {
      const job = await startGarminSync();
      if (job.status === 'failed') {
        toast.error(`Garmin sync failed: ${job.errorMessage ?? 'Unknown error'}`);
      } else if (job.activitiesImported > 0) {
        toast.success(`${job.activitiesImported} activities imported from Garmin`);
      } else {
        toast.success('Garmin sync complete — no new activities');
      }
      statusState.refresh();
      historyState.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Garmin sync failed: ${message}`);
      statusState.refresh();
      historyState.refresh();
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <article className="sync-card sync-card--garmin">
      <header className="sync-card__header">
        <div>
          <SourceBadge source="garmin_unofficial" />
          <h3>Garmin</h3>
        </div>
        {statusState.status === 'loading' && statusData == null && (
          <span className="sync-card__meta">Checking setup</span>
        )}
        {isConfigured && <span className="sync-card__meta">Configured</span>}
      </header>

      {statusState.status === 'loading' && statusData == null && (
        <LoadingState title="Checking Garmin sync" variant="inline" />
      )}

      {statusState.status === 'error' && statusData == null && (
        <ErrorState
          title="Could not load Garmin status"
          description={statusState.message}
          variant="inline"
        />
      )}

      {statusData != null && !isConfigured && (
        <div className="sync-card__setup">
          <h4>Garmin sync not configured</h4>
          <p>
            Add <code>GARMIN_EMAIL</code> and <code>GARMIN_PASSWORD</code> to
            <code> apps/api/.env</code>, then restart the API server.
          </p>
        </div>
      )}

      {isConfigured && (
        <>
          <div className="sync-card__summary">
            <div>
              <span>Last sync</span>
              <strong>
                {lastSync == null
                  ? 'Never synced'
                  : `Last synced ${formatRelativeSyncTime(getSyncJobTime(lastSync))}`}
              </strong>
              {lastSync != null && <p>{formatSyncImportSummary(lastSync)}</p>}
            </div>
            {lastSync != null && <SyncStatusBadge status={lastSync.status} />}
          </div>

          {lastFailed != null && lastFailed.errorMessage != null && (
            <p className="sync-card__error">Last sync failed: {lastFailed.errorMessage}</p>
          )}

          <button
            type="button"
            className="sync-card__button"
            onClick={() => void handleSyncNow()}
            disabled={isSyncing}
          >
            {isSyncing && <span className="import-spinner import-spinner--sm" />}
            {isSyncing ? 'Syncing…' : 'Sync now'}
          </button>

          <div className="sync-card__history">
            <div className="sync-card__history-head">
              <span>Recent sync history</span>
              {historyState.status === 'loading' && jobs.length > 0 && <em>Refreshing</em>}
            </div>

            {historyState.status === 'loading' && jobs.length === 0 && (
              <LoadingState title="Loading sync history" variant="inline" />
            )}
            {historyState.status === 'error' && jobs.length === 0 && (
              <ErrorState
                title="Could not load sync history"
                description={historyState.message}
                variant="inline"
              />
            )}
            {historyState.status !== 'loading' && jobs.length === 0 && (
              <EmptyState
                title="No sync runs yet"
                description="Run your first Garmin sync to populate this history."
                variant="inline"
              />
            )}
            {jobs.length > 0 && (
              <ul>
                {jobs.map((job) => (
                  <li key={job.id}>
                    <div>
                      <strong>{formatDate(getSyncJobTime(job))}</strong>
                      <span>{formatSyncImportSummary(job)}</span>
                    </div>
                    <SyncStatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function StravaSyncCard({
  onConnectedToastHandled,
}: {
  onConnectedToastHandled: (refresh: () => void) => void;
}) {
  const connectionState = useStravaConnection();
  const historyState = useSyncHistory('strava');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [requiresReconnect, setRequiresReconnect] = useState(false);

  useEffect(() => {
    onConnectedToastHandled(connectionState.refresh);
  }, [connectionState.refresh, onConnectedToastHandled]);

  const connection = connectionState.data;
  const isConfigured = connection?.configured === true;
  const isConnected = connection?.connected === true;
  const jobs = historyState.jobs.slice(0, 5);
  const lastSync = jobs[0] ?? null;
  const lastFailed = lastSync?.status === 'failed' ? lastSync : null;
  const athleteLabel =
    connection?.athleteName ??
    (connection?.externalAthleteId != null ? `Athlete ${connection.externalAthleteId}` : 'Connected athlete');

  async function handleConnect(): Promise<void> {
    setIsConnecting(true);
    try {
      const authUrl = await startStravaAuthorize();
      window.location.href = authUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Could not start Strava connection: ${message}`);
      setIsConnecting(false);
    }
  }

  async function handleSyncNow(): Promise<void> {
    setIsSyncing(true);
    setRequiresReconnect(false);
    try {
      const job = await startStravaSync();
      if (job.status === 'failed') {
        const message = job.errorMessage ?? 'Unknown error';
        if (/token|unauthorized|401|revoked/i.test(message)) {
          setRequiresReconnect(true);
        }
        toast.error(`Strava sync failed: ${message}`);
      } else if (job.activitiesImported > 0) {
        toast.success(`${job.activitiesImported} activities imported from Strava`);
      } else {
        toast.success('Strava sync complete — no new activities');
      }
      connectionState.refresh();
      historyState.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof ApiClientError && error.status === 401) {
        setRequiresReconnect(true);
      }
      toast.error(`Strava sync failed: ${message}`);
      connectionState.refresh();
      historyState.refresh();
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect(): Promise<void> {
    setIsDisconnecting(true);
    try {
      await disconnectStrava();
      toast.success('Strava disconnected');
      setConfirmDisconnect(false);
      setRequiresReconnect(false);
      connectionState.refresh();
      historyState.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Could not disconnect Strava: ${message}`);
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <article className="sync-card sync-card--strava">
      <header className="sync-card__header">
        <div>
          <SourceBadge source="strava" />
          <h3>Strava</h3>
        </div>
        {connectionState.status === 'loading' && connection == null && (
          <span className="sync-card__meta">Checking setup</span>
        )}
        {isConfigured && isConnected && <span className="sync-card__meta">Connected</span>}
      </header>

      {connectionState.status === 'loading' && connection == null && (
        <LoadingState title="Checking Strava connection" variant="inline" />
      )}

      {connectionState.status === 'error' && connection == null && (
        <ErrorState
          title="Could not load Strava connection"
          description={connectionState.message}
          variant="inline"
        />
      )}

      {connection != null && !isConfigured && (
        <div className="sync-card__setup">
          <h4>Strava not configured</h4>
          <p>
            Add <code>STRAVA_CLIENT_ID</code> and <code>STRAVA_CLIENT_SECRET</code> to the
            server config, then restart the API server.
          </p>
        </div>
      )}

      {connection != null && isConfigured && !isConnected && (
        <div className="sync-card__setup">
          <h4>Connect Strava</h4>
          <p>Authorize Strava to import recent activities into your training model.</p>
          <button
            type="button"
            className="sync-card__button sync-card__button--strava"
            onClick={() => void handleConnect()}
            disabled={isConnecting}
          >
            {isConnecting && <span className="import-spinner import-spinner--sm" />}
            {isConnecting ? 'Redirecting…' : 'Connect Strava'}
          </button>
        </div>
      )}

      {isConfigured && isConnected && (
        <>
          <div className="sync-card__summary">
            <div>
              <span>Connected athlete</span>
              <strong>{athleteLabel}</strong>
              <p>
                {lastSync == null
                  ? 'No Strava sync runs yet'
                  : `Last synced ${formatRelativeSyncTime(getSyncJobTime(lastSync))} · ${formatSyncImportSummary(lastSync)}`}
              </p>
            </div>
            {lastSync != null && <SyncStatusBadge status={lastSync.status} />}
          </div>

          {(requiresReconnect || lastFailed?.errorMessage != null) && (
            <p className="sync-card__error">
              {requiresReconnect
                ? 'Strava token expired or was revoked — reconnect Strava.'
                : `Last sync failed: ${lastFailed?.errorMessage}`}
            </p>
          )}

          <div className="sync-card__actions">
            <button
              type="button"
              className="sync-card__button sync-card__button--strava"
              onClick={() => void (requiresReconnect ? handleConnect() : handleSyncNow())}
              disabled={isSyncing || isConnecting}
            >
              {(isSyncing || isConnecting) && <span className="import-spinner import-spinner--sm" />}
              {requiresReconnect
                ? isConnecting ? 'Redirecting…' : 'Reconnect'
                : isSyncing ? 'Syncing…' : 'Sync now'}
            </button>
            {!confirmDisconnect && (
              <button
                type="button"
                className="sync-card__button sync-card__button--secondary"
                onClick={() => setConfirmDisconnect(true)}
              >
                Disconnect
              </button>
            )}
          </div>

          {confirmDisconnect && (
            <div className="sync-card__confirm">
              <p>Disconnect Strava from this athlete?</p>
              <div>
                <button
                  type="button"
                  className="sync-card__button sync-card__button--danger"
                  onClick={() => void handleDisconnect()}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
                <button
                  type="button"
                  className="sync-card__button sync-card__button--secondary"
                  onClick={() => setConfirmDisconnect(false)}
                  disabled={isDisconnecting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="sync-card__history">
            <div className="sync-card__history-head">
              <span>Recent sync history</span>
              {historyState.status === 'loading' && jobs.length > 0 && <em>Refreshing</em>}
            </div>

            {historyState.status === 'loading' && jobs.length === 0 && (
              <LoadingState title="Loading sync history" variant="inline" />
            )}
            {historyState.status === 'error' && jobs.length === 0 && (
              <ErrorState
                title="Could not load sync history"
                description={historyState.message}
                variant="inline"
              />
            )}
            {historyState.status !== 'loading' && jobs.length === 0 && (
              <EmptyState
                title="No Strava sync runs yet"
                description="Run your first Strava sync to populate this history."
                variant="inline"
              />
            )}
            {jobs.length > 0 && (
              <ul>
                {jobs.map((job) => (
                  <li key={job.id}>
                    <div>
                      <strong>{formatDate(getSyncJobTime(job))}</strong>
                      <span>{formatSyncImportSummary(job)}</span>
                    </div>
                    <SyncStatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </article>
  );
}

function SyncSourcesSection() {
  const handleStravaCallback = useRef(false);

  const handleConnectedToast = useCallback((refresh: () => void): void => {
    if (handleStravaCallback.current) return;
    const url = new URL(window.location.href);
    const stravaStatus = url.searchParams.get('strava');
    if (stravaStatus == null) return;

    handleStravaCallback.current = true;
    url.searchParams.delete('strava');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

    if (stravaStatus === 'connected') {
      toast.success('Strava connected');
      refresh();
    } else if (stravaStatus === 'denied') {
      toast.error('Strava connection was cancelled');
    }
  }, []);

  return (
    <section className="sync-sources">
      <header className="import-section__head">
        <div>
          <p>Sync sources</p>
          <h2>Connect training data sources</h2>
        </div>
        <span>Prototype sync</span>
      </header>
      <div className="sync-source-grid">
        <GarminSyncCard />
        <StravaSyncCard onConnectedToastHandled={handleConnectedToast} />
      </div>
    </section>
  );
}

function ImportApiMode({ navigate }: PageComponentProps) {
  const { state, startFileUploads, startJsonImport, reset } = useImport();
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === 'json-success') {
      toast.success('Activity imported successfully');
    } else if (state.status === 'files-done') {
      const done = state.results.filter((r) => r.status === 'success').length;
      const dups = state.results.filter((r) => r.status === 'duplicate').length;
      const errs = state.results.filter((r) => r.status === 'error').length;
      if (done > 0) {
        toast.success(done === 1 ? 'Activity imported' : `${done} activities imported`);
      } else if (dups > 0 && errs === 0) {
        toast(`${dups} duplicate${dups > 1 ? 's' : ''} — already imported`);
      } else if (errs > 0 && done === 0) {
        toast.error(`Import failed for ${errs} file${errs > 1 ? 's' : ''}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

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

        <SyncSourcesSection />

        <ImportHistorySection navigate={navigate} />

        <InformationalSections />
      </div>
    </PageShell>
  );
}

function InformationalSections() {
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

    </>
  );
}

export function ImportPage({ navigate, params }: PageComponentProps) {
  return <ImportApiMode navigate={navigate} params={params} />;
}

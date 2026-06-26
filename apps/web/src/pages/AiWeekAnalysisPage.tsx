import { useState } from 'react';

import type { AiCoachOutputDto, SportTypeDto } from '@pp-trainer/shared';
import { AiGeneratedWeekAnalysisSchema, SportTypeSchema } from '@pp-trainer/shared';

import { ErrorState, LoadingState, SportBadge } from '../components';
import { acceptOutput, rejectOutput } from '../api/aiApi';
import { ApiClientError } from '../api/apiClient';
import { formatDistance, sportLabels } from '../components/prototypeFormatters';
import { useAiOutput } from '../hooks/useAiOutput';
import { PageShell } from '../layout/PageShell';
import type { PageComponentProps } from '../routes/routeTypes';

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d);
}

function formatAnalysisDuration(seconds: number): string {
  if (seconds === 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

function formatSportLabel(sport: string): string {
  const parsed = SportTypeSchema.safeParse(sport);
  return parsed.success ? sportLabels[parsed.data] : sport;
}

function isKnownSport(sport: string): sport is SportTypeDto {
  return SportTypeSchema.safeParse(sport).success;
}

function StatusBadge({ status }: { status: AiCoachOutputDto['status'] }) {
  const labels: Record<string, string> = {
    accepted: 'Accepted', rejected: 'Rejected', archived: 'Archived', draft: 'Draft',
  };
  return (
    <span className={`ai-preview-status ai-preview-status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function AiWeekAnalysisPage({ params, navigate }: PageComponentProps) {
  const outputId = params.id ?? '';
  const outputState = useAiOutput(outputId);

  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  async function handleAccept() {
    setActionError(null);
    setActionLoading('accept');
    try {
      await acceptOutput(outputId);
      outputState.refresh();
      setActionLoading(null);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not accept analysis. Please try again.';
      setActionError(msg);
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionError(null);
    setActionLoading('reject');
    try {
      await rejectOutput(outputId);
      navigate('/ai-coach');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not discard analysis. Please try again.';
      setActionError(msg);
      setActionLoading(null);
      setConfirmReject(false);
    }
  }

  if (outputState.status === 'loading') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <LoadingState title="Loading analysis" description="Preparing your week analysis preview…" />
      </PageShell>
    );
  }

  if (outputState.status === 'error') {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <ErrorState title="Analysis unavailable" description={outputState.message} />
      </PageShell>
    );
  }

  const { output } = outputState;
  const parsed = output.outputType === 'week_analysis'
    ? AiGeneratedWeekAnalysisSchema.safeParse(output.structuredOutput)
    : { success: false as const };

  if (!parsed.success) {
    return (
      <PageShell title="AI Coach" eyebrow="AI Coach · Preview">
        <ErrorState title="Invalid format" description="This analysis has an unexpected format." />
      </PageShell>
    );
  }

  const analysis = parsed.data;
  const isInvalid = output.validationStatus === 'invalid';
  const isAlreadyActed = output.status === 'accepted' || output.status === 'rejected';
  const canAct = !isInvalid && !isAlreadyActed;

  return (
    <PageShell
      title="Week Analysis"
      eyebrow="AI Coach · Preview"
      description={
        <span>
          {isAlreadyActed && <StatusBadge status={output.status} />}
          {isInvalid && (
            <span className="ai-preview-status ai-preview-status--invalid">Validation failed</span>
          )}
        </span>
      }
    >
      <div className="ai-preview-layout ai-week-analysis">
        <div className="ai-preview-header">
          <h2 className="ai-preview-header__title">
            {formatShortDate(analysis.weekStartDate)} – {formatShortDate(analysis.weekEndDate)}
          </h2>
          <p className="ai-preview-header__range">Current week analysis</p>
        </div>

        <dl className="ai-analysis-metrics">
          <div>
            <dt>Total volume</dt>
            <dd>{formatAnalysisDuration(analysis.totalDurationSeconds)}</dd>
          </div>
          {analysis.totalDistanceMeters != null && (
            <div>
              <dt>Total distance</dt>
              <dd>{formatDistance(analysis.totalDistanceMeters)}</dd>
            </div>
          )}
          <div>
            <dt>Activities</dt>
            <dd>
              {analysis.sportBreakdown.reduce((sum, sport) => sum + sport.activityCount, 0)}
            </dd>
          </div>
        </dl>

        {isInvalid && (
          <div className="ai-error-banner ai-error-banner--warn">
            <span>This analysis could not be fully validated. The content may be incomplete.</span>
          </div>
        )}

        <section className="ai-analysis-section" aria-labelledby="week-analysis-sports">
          <p className="ai-output__label" id="week-analysis-sports">Sport breakdown</p>
          <ul className="ai-analysis-sport-list">
            {analysis.sportBreakdown.map((sport) => (
              <li key={sport.sport} className="ai-analysis-sport">
                <div className="ai-analysis-sport__label">
                  {isKnownSport(sport.sport) ? (
                    <SportBadge sport={sport.sport} />
                  ) : (
                    <span className="badge badge--source">{formatSportLabel(sport.sport)}</span>
                  )}
                  <span>{sport.activityCount} activit{sport.activityCount === 1 ? 'y' : 'ies'}</span>
                </div>
                <div className="ai-analysis-sport__values">
                  <strong>{formatAnalysisDuration(sport.durationSeconds)}</strong>
                  {sport.distanceMeters != null && <span>{formatDistance(sport.distanceMeters)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="ai-analysis-section" aria-labelledby="week-analysis-observations">
          <p className="ai-output__label" id="week-analysis-observations">Key observations</p>
          <ul className="ai-analysis-observations">
            {analysis.keyObservations.map((observation) => (
              <li key={observation}>{observation}</li>
            ))}
          </ul>
        </section>

        <section className="ai-preview-summary ai-analysis-focus" aria-labelledby="week-analysis-focus">
          <p className="ai-preview-summary__label" id="week-analysis-focus">Suggested focus</p>
          <p className="ai-preview-summary__text">{analysis.suggestedFocus}</p>
        </section>

        <section className="ai-analysis-section" aria-labelledby="week-analysis-comment">
          <p className="ai-output__label" id="week-analysis-comment">Coach comment</p>
          <p className="ai-analysis-comment">{analysis.coachComment}</p>
        </section>

        <div className="ai-preview-bar">
          {actionError && (
            <div className="ai-preview-bar__error" role="alert">
              {actionError}
              <button
                type="button"
                className="ai-error-banner__dismiss"
                onClick={() => setActionError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <div className="ai-preview-bar__actions">
            {!confirmReject ? (
              <>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleAccept}
                  disabled={!canAct || actionLoading !== null}
                >
                  {actionLoading === 'accept' ? 'Saving…' : 'Accept analysis'}
                </button>

                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(true)}
                  disabled={!canAct || actionLoading !== null}
                >
                  Discard
                </button>

                {canAct && (
                  <p className="ai-preview-bar__hint">
                    Accepting saves this analysis as an insight. It will not create a plan or workout.
                  </p>
                )}
              </>
            ) : (
              <div className="ai-preview-bar__confirm">
                <span className="ai-preview-bar__confirm-label">Discard this analysis?</span>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'reject' ? 'Discarding…' : 'Yes, discard'}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setConfirmReject(false)}
                  disabled={actionLoading !== null}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

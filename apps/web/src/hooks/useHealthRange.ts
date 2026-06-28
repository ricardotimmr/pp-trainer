import { useEffect, useState } from 'react';

export type HealthRange = '7d' | '14d' | '30d';

export type HealthDataState<T> =
  | { status: 'loading'; data?: T[]; refresh: () => void }
  | { status: 'success'; data: T[]; refresh: () => void }
  | { status: 'error'; data?: T[]; message: string; refresh: () => void };

function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysForRange(range: HealthRange): number {
  return range === '7d' ? 7 : range === '14d' ? 14 : 30;
}

function getDateRange(range: HealthRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (daysForRange(range) - 1));
  return {
    from: toLocalDate(from),
    to: toLocalDate(to),
  };
}

export function useHealthRangeData<T>(
  range: HealthRange,
  loader: (from: string, to: string) => Promise<T[]>,
  errorMessage: string,
): HealthDataState<T> {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<HealthDataState<T>>({
    status: 'loading',
    refresh: () => setRefreshKey((key) => key + 1),
  });

  useEffect(() => {
    let cancelled = false;
    const { from, to } = getDateRange(range);
    const refresh = () => setRefreshKey((key) => key + 1);

    setState((previousState) => ({
      status: 'loading',
      data: 'data' in previousState ? previousState.data : undefined,
      refresh,
    }));
    loader(from, to)
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', data, refresh });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState((previousState) => ({
          status: 'error',
          data: 'data' in previousState ? previousState.data : undefined,
          message: error instanceof Error ? error.message : errorMessage,
          refresh,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [errorMessage, loader, range, refreshKey]);

  return state;
}

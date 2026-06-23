import { useCallback, useEffect, useState } from 'react';

import type { ImportSummaryDto } from '@pp-trainer/shared';

import { getImportHistory } from '../api/importApi';

const PAGE_SIZE = 20;

type State = {
  phase: 'loading' | 'success' | 'error';
  items: ImportSummaryDto[];
  hasMore: boolean;
  loadingMore: boolean;
  errorMessage: string;
};

export type UseImportHistoryResult = {
  phase: State['phase'];
  items: ImportSummaryDto[];
  hasMore: boolean;
  loadingMore: boolean;
  errorMessage: string;
  loadMore: () => void;
};

export function useImportHistory(filterStatus?: string): UseImportHistoryResult {
  const [state, setState] = useState<State>({
    phase: 'loading',
    items: [],
    hasMore: false,
    loadingMore: false,
    errorMessage: '',
  });

  useEffect(() => {
    let cancelled = false;

    getImportHistory({ status: filterStatus, limit: PAGE_SIZE, offset: 0 })
      .then(({ imports }) => {
        if (cancelled) return;
        setState({
          phase: 'success',
          items: imports,
          hasMore: imports.length === PAGE_SIZE,
          loadingMore: false,
          errorMessage: '',
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          phase: 'error',
          items: [],
          hasMore: false,
          loadingMore: false,
          errorMessage: err instanceof Error ? err.message : 'Failed to load history',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [filterStatus]);

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'success' || prev.loadingMore || !prev.hasMore) return prev;
      const offset = prev.items.length;

      getImportHistory({ status: filterStatus, limit: PAGE_SIZE, offset })
        .then(({ imports }) => {
          setState((cur) => {
            if (cur.phase !== 'success') return cur;
            return {
              ...cur,
              items: [...cur.items, ...imports],
              hasMore: imports.length === PAGE_SIZE,
              loadingMore: false,
            };
          });
        })
        .catch(() => {
          setState((cur) => {
            if (cur.phase !== 'success') return cur;
            return { ...cur, loadingMore: false };
          });
        });

      return { ...prev, loadingMore: true };
    });
  }, [filterStatus]);

  return {
    phase: state.phase,
    items: state.items,
    hasMore: state.hasMore,
    loadingMore: state.loadingMore,
    errorMessage: state.errorMessage,
    loadMore,
  };
}

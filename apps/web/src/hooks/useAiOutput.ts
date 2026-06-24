import { useCallback, useEffect, useState } from 'react';

import type { AiCoachOutputDto } from '@pp-trainer/shared';

import { getOutput } from '../api/aiApi';

export type AiOutputState =
  | { status: 'loading' }
  | { status: 'success'; output: AiCoachOutputDto }
  | { status: 'error'; message: string };

export function useAiOutput(id: string): AiOutputState & { refresh: () => void } {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<AiOutputState>({ status: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ status: 'error', message: 'No output ID provided.' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    getOutput(id)
      .then((output) => {
        if (!cancelled) setState({ status: 'success', output });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load proposal.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refresh };
}

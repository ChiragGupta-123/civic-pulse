import { useCallback, useEffect, useState } from 'react';
import { toRequestError, type RequestError } from '@/api/httpClient';
import type { PageMeta } from '@/types/envelope.types';

export interface AsyncDataState<T> {
  data: T | null;
  meta: PageMeta | null;
  loading: boolean;
  error: RequestError | null;
}

export function useAsyncData<T>(
  loader: () => Promise<{ data: T; meta?: PageMeta | null }>,
  deps: unknown[],
): AsyncDataState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    meta: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    loader()
      .then((result) => {
        if (cancelled) return;
        setState({
          data: result.data,
          meta: result.meta ?? null,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ data: null, meta: null, loading: false, error: toRequestError(error) });
      });

    return () => {
      cancelled = true;
    };
    // The caller owns the dependency list; loader identity is intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, reload };
}

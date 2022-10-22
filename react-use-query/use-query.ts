import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type QueryContext<TKey extends readonly unknown[]> = {
  /**
   * Query key associated with the current query function invocation.
   */
  readonly queryKey: TKey;
  /**
   * Abort signal provided by the query hook. Aborted when a new query begins
   * or the component is unmounted.
   */
  readonly signal?: AbortSignal;
};

type QueryOptions = {
  /**
   * Default: true
   */
  readonly enabled?: boolean;
  /**
   * Default: 0 (no auto-refresh).
   */
  readonly refetchInterval?: number;
  /**
   * Default: true
   */
  readonly refetchOnReconnect?: boolean;
  /**
   * Default: true
   */
  readonly refetchOnWindowFocus?: boolean;
};

type QueryResult<TData> = {
  /**
   * Most recent successful query data. Only cleared if the query key changes.
   */
  readonly data: TData | undefined;
  /**
   * Error thrown if the most recent query failed. Cleared when a subsequent
   * query succeeds.
   */
  readonly error: unknown;
  /**
   * True when the query function has been called and the returned promise is
   * still pending.
   */
  readonly isFetching: boolean;
  /**
   * Immediately cause the query to be refetched, even if the query is not
   * currently enabled.
   */
  readonly refetch: () => void;
};

type QueryFn<TData = unknown, TKey extends readonly unknown[] = readonly unknown[]> = (
  ctx: QueryContext<TKey>,
) => Promise<TData>;

const useStableQueryKey = <TKey extends readonly unknown[]>(queryKey: TKey): TKey => {
  const serialized = JSON.stringify(queryKey, (_, value: Record<string, unknown>) => {
    return Object.prototype.toString.call(value) === '[object Object]'
      ? Object.keys(value)
          .sort()
          .reduce((result: Record<string, unknown>, key) => {
            result[key] = value[key];
            return result;
          }, {})
      : value;
  });

  return useMemo(() => JSON.parse(serialized), [serialized]);
};

/**
 * A minimal asynchronous data read hook.
 *
 * This hook is suitable for
 * [safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP)
 * operations which should not have any side effects (eg. GET, HEAD, OPTIONS,
 * and TRACE requests)
 *
 * Inspired by (and API compatible with) React Query's
 * [useQuery](https://tanstack.com/query/v4/docs/reference/useQuery) hook.
 *
 * Implements the following React Query `useQuery` options:
 * - `enabled`
 * - `refetchInterval`
 * - `refetchOnReconnect`
 * - `refetchOnWindowFocus`
 *
 * Implements the following React Query `useQuery` response properties:
 * - `data`
 * - `error`
 * - `isFetching`
 * - `refetch()`
 *
 * Implements the following React Query `queryFn` context properties:
 * - `queryKey`
 * - `signal`
 */
const useQuery = <TData, TKey extends readonly unknown[]>(
  queryKey: TKey,
  queryFn: QueryFn<TData, TKey>,
  queryOptions: QueryOptions = {},
): QueryResult<TData> => {
  const stableQueryKey = useStableQueryKey(queryKey);
  const { enabled = true, refetchOnReconnect = true, refetchOnWindowFocus = true } = queryOptions;
  const refetchInterval = queryOptions.refetchInterval || 0;

  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<unknown>();
  const [isFetching, setIsFetching] = useState(false);

  const queryFnRef = useRef(queryFn);
  const refetchIntervalRef = useRef(refetchInterval);
  const abortControllerRef = useRef(new AbortController());

  const refetch = useCallback(() => {
    if (abortControllerRef.current.signal.aborted) {
      return;
    }

    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const signal = abortControllerRef.current.signal;

    setIsFetching(true);
    queryFnRef
      .current({ queryKey: stableQueryKey, signal })
      .then((newData) => {
        if (!signal.aborted) {
          setData(newData);
          setError(undefined);
          setIsFetching(false);
        }
      })
      .catch((newError) => {
        if (!signal.aborted) {
          setError(newError);
          setIsFetching(false);
        }
      })
      .finally(() => {
        if (!signal.aborted && refetchIntervalRef.current > 0) {
          const timeout = setTimeout(refetch, refetchIntervalRef.current);
          signal.addEventListener('abort', () => clearTimeout(timeout));
        }
      });
  }, [stableQueryKey]);

  // Keep query function (and related options) evergreen
  useEffect(() => {
    queryFnRef.current = queryFn;
    refetchIntervalRef.current = refetchInterval;
  });

  // Clear data and error if the key changes
  useEffect(() => {
    setData(undefined);
    setError(undefined);
  }, [stableQueryKey]);

  // Fetch on mount and re-fetch on update
  useEffect(() => {
    if (enabled) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refetch]);

  // Fetch on reconnect
  useEffect(() => {
    if (enabled && refetchOnReconnect) {
      window.addEventListener('online', refetch);
      return () => window.removeEventListener('online', refetch);
    }
  }, [enabled, refetchOnReconnect, refetch]);

  // Fetch on window focus
  useEffect(() => {
    if (enabled && refetchOnWindowFocus) {
      window.addEventListener('focus', refetch);
      return () => window.removeEventListener('focus', refetch);
    }
  }, [enabled, refetchOnWindowFocus, refetch]);

  // Abort active query and prevent state changes after unmount
  useEffect(() => {
    return () => abortControllerRef.current.abort();
  }, []);

  return { data, error, isFetching, refetch };
};

export type { QueryContext, QueryFn, QueryOptions, QueryResult };
export { useQuery, useStableQueryKey };

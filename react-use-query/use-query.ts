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

type QueryRefetchOptions = {
  /**
   * Per default, a currently running request will be cancelled before a new
   * request is made. When set to false, no refetch will be made if there is
   * already a request running.
   */
  cancelRefetch?: boolean;
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
  readonly refetch: (options?: QueryRefetchOptions) => void;
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
  const abortControllerRef = useRef<AbortController | undefined>();

  const refetch = useCallback(
    ({ cancelRefetch = true }: QueryRefetchOptions = {}) => {
      if (!cancelRefetch && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        return;
      }

      const controller = new AbortController();

      abortControllerRef.current?.abort();
      abortControllerRef.current = controller;
      setIsFetching(true);
      queryFnRef
        .current({ queryKey: stableQueryKey, signal: controller.signal })
        .finally(() => {
          if (controller === abortControllerRef.current) {
            abortControllerRef.current = undefined;
          }
        })
        .then((newData) => {
          if (!controller.signal.aborted) {
            setData(newData);
            setError(undefined);
            setIsFetching(false);
          }
        })
        .catch((newError) => {
          if (!controller.signal.aborted) {
            setError(newError);
            setIsFetching(false);
          }
        });
    },
    [stableQueryKey],
  );

  useEffect(() => {
    queryFnRef.current = queryFn;
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
  }, [enabled, refetch]);

  // Fetch on interval if set.
  useEffect(() => {
    if (enabled && refetchInterval > 0) {
      const interval = setInterval(() => refetch({ cancelRefetch: false }), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, refetch, refetchInterval]);

  // Fetch on reconnect
  useEffect(() => {
    if (enabled && refetchOnReconnect) {
      const onOnline = () => refetch({ cancelRefetch: false });
      window.addEventListener('online', onOnline);
      return () => window.removeEventListener('online', onOnline);
    }
  }, [enabled, refetchOnReconnect, refetch]);

  // Fetch on window focus
  useEffect(() => {
    if (enabled && refetchOnWindowFocus) {
      const onFocus = () => refetch({ cancelRefetch: false });
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [enabled, refetchOnWindowFocus, refetch]);

  // Abort active query and prevent state changes after unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, error, isFetching, refetch };
};

export type { QueryContext, QueryFn, QueryOptions, QueryResult };
export { useQuery, useStableQueryKey };

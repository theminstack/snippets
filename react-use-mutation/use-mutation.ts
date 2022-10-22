import { useCallback, useEffect, useRef, useState } from 'react';

type MutationResult<TData, TVariables> = {
  /**
   * Most recent successful mutation data. Cleared when a new mutation begins.
   */
  readonly data: TData | undefined;
  /**
   * Error thrown if the most recent mutation failed. Cleared when a new
   * mutation begins.
   */
  readonly error: unknown;
  /**
   * True when the mutation function has been called and the returned promise
   * is still pending.
   */
  readonly isLoading: boolean;
  /**
   * Begin a new mutation.
   *
   * **NOTE:** If a previous mutation is still loading, it will continue, but
   * the outcome will be lost. Only the state of the most recent mutation is
   * reflected in the mutation result.
   */
  readonly mutate: undefined extends TVariables ? (variables?: TVariables) => void : (variables: TVariables) => void;
};

type MutationFn<TData = unknown, TVariables = undefined> = (variables: TVariables) => Promise<TData>;

/**
 * Minimal asynchronous data create/update/delete hook.
 *
 * This hook is suitable for operations which may be
 * non-[safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP)
 * due to side effects (eg. POST, PUT, PATCH, and DELETE requests).
 *
 * Inspired by (and API compatible with) React Query's
 * [useMutation](https://tanstack.com/query/v4/docs/reference/useMutation)
 * hook.
 *
 * Implements the following React Query `useMutation` response properties:
 * - `data`
 * - `error`
 * - `isLoading`
 * - `mutate()`
 */
const useMutation = <TData, TVariables>(
  mutationFn: MutationFn<TData, TVariables>,
): MutationResult<TData, TVariables> => {
  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const mutationFnRef = useRef(mutationFn);
  const abortControllerRef = useRef(new AbortController());

  const mutate = useCallback((variables: TVariables = undefined as TVariables) => {
    if (abortControllerRef.current.signal.aborted) {
      return;
    }

    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setData(undefined);
    setError(undefined);
    mutationFnRef
      .current(variables)
      .then((newData) => {
        if (!signal.aborted) {
          setData(newData);
          setIsLoading(false);
        }
      })
      .catch((newError) => {
        if (!signal.aborted) {
          setError(newError);
          setIsLoading(false);
        }
      });
  }, []) as undefined extends TVariables ? (variables?: TVariables) => void : (variables: TVariables) => void;

  // Keep mutation function evergreen
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  });

  // Prevent state changes after unmount.
  useEffect(() => {
    return () => abortControllerRef.current.abort();
  }, []);

  return { data, error, isLoading, mutate };
};

export type { MutationFn, MutationResult };
export { useMutation };

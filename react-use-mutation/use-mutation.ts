import { useCallback, useEffect, useRef, useState } from 'react';

type MutationOptions<TData, TVariables, TContext> = {
  /**
   * Callback invoked before the mutation function. The returned value is
   * passed to `onSettled` as a context.
   */
  readonly onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
  /**
   * Callback invoked when a mutation completes.
   */
  readonly onSettled?: (
    data: TData | undefined,
    error: unknown,
    variables: TVariables,
    context?: unknown,
  ) => Promise<void> | void;
};

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
  /**
   * Reset the response `data` and `error` values to undefined.
   */
  readonly reset: () => void;
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
const useMutation = <TData, TVariables, TContext>(
  mutationFn: MutationFn<TData, TVariables>,
  options: MutationOptions<TData, TVariables, TContext> = {},
): MutationResult<TData, TVariables> => {
  const { onMutate = () => undefined as TContext, onSettled } = options;
  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(false);

  const mutationFnRef = useRef(mutationFn);
  const onMutateRef = useRef(onMutate);
  const onSettledRef = useRef(onSettled);
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

    let context: TContext | undefined | void;

    Promise.resolve()
      .then(async () => {
        context = await onMutateRef.current(variables);
      })
      .then(() => {
        return mutationFnRef.current(variables);
      })
      .then(async (newData) => {
        if (!signal.aborted) {
          await onSettledRef.current?.(newData, undefined, variables, context);
          setData(newData);
          setIsLoading(false);
        }
      })
      .catch(async (newError) => {
        if (!signal.aborted) {
          await onSettledRef.current?.(undefined, newError, variables, context);
          return Promise.reject(newError);
        }
      })
      .catch((newError) => {
        if (!signal.aborted) {
          setError(newError);
          setIsLoading(false);
        }
      });
  }, []) as undefined extends TVariables ? (variables?: TVariables) => void : (variables: TVariables) => void;

  const reset = useCallback(() => {
    setData(undefined);
    setError(undefined);
  }, []);

  // Keep mutation function evergreen
  useEffect(() => {
    onMutateRef.current = onMutate;
    mutationFnRef.current = mutationFn;
    onSettledRef.current = onSettled;
  });

  // Prevent state changes after unmount.
  useEffect(() => {
    return () => abortControllerRef.current.abort();
  }, []);

  return { data, error, isLoading, mutate, reset };
};

export type { MutationFn, MutationResult };
export { useMutation };

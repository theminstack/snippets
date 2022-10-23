type RetryOptions = {
  /**
   * Delay in milliseconds. May be an array to provide different delays for
   * each retry. If the number of retries exceeds the number of items in the
   * array, then the last delay is used.
   */
  delay?: number | readonly number[];
  /**
   * Determine if a retry is useful and/or what the delay should be. Returning
   * false prevents retrying. Returning true/void/undefined will retry with
   * the default delay. Returning a number will retry with a custom delay.
   */
  onRetry?: (error: unknown, count: number) => boolean | number | undefined | void;
  /**
   * Maximum number of retries, not including the initial handler call.
   */
  retries?: number;
  /**
   * If the signal is aborted, retrying is canceled and the next error will
   * be thrown.
   */
  signal?: AbortSignal;
};

type RetryHandler<TValue = unknown> = () => PromiseLike<TValue> | TValue;

const onRetryDefault = (error: unknown): boolean => {
  return !(error instanceof Error) || error.name !== 'AbortError';
};

/**
 * Retry `handler` while it throws.
 */
const retry = async <TValue>(handler: RetryHandler<TValue>, options: RetryOptions = {}): Promise<TValue> => {
  const { signal, delay: defaultDelay = 0, retries = 2, onRetry = onRetryDefault } = options;
  let lastError: unknown;
  let errorCount = 0;

  while (!signal?.aborted) {
    try {
      return await handler();
    } catch (error) {
      lastError = error;

      if (errorCount >= retries || signal?.aborted) {
        break;
      }

      const next = onRetry(error, (errorCount += 1)) ?? true;

      if (next === false) {
        break;
      }

      const delay =
        typeof next === 'number'
          ? next
          : typeof defaultDelay === 'number'
          ? defaultDelay
          : defaultDelay.at(errorCount - 1) ?? defaultDelay.at(-1);

      if (delay && delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // XXX: AbortError is not really a standard yet.
  throw Object.assign(lastError ?? new Error('ABORT_ERR'), { code: 20, name: 'AbortError' });
};

export type { RetryHandler, RetryOptions };
export { onRetryDefault, retry };

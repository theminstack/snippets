type Deferred<TArgs extends readonly unknown[]> = {
  (...args: TArgs): void;
  /**
   * If a call to the wrapped callback is scheduled, cancel it. Has no effect
   * if no call is scheduled.
   */
  readonly cancel: () => void;
  /**
   * If a call to the wrapped callback is scheduled, call it immediately
   * instead of waiting for the timeout to elapse. Has no effect if no call is
   * scheduled.
   */
  readonly flush: () => void;
};

/**
 * Wrap a callback so that it is not called until at least `timeout`
 * milliseconds have elapsed since the previous call to the wrapper. **If the
 * deferred wrapper is always called before the timeout expires, the wrapped
 * function may never be called!**
 */
const createDeferred = <TArgs extends readonly unknown[] = readonly []>(
  timeout: number,
  callback: (...args: TArgs) => void,
): Deferred<TArgs> => {
  let scheduled: { readonly args: TArgs; readonly handle: any } | undefined;

  const deferred = (...newArgs: TArgs): void => {
    if (scheduled) {
      clearTimeout(scheduled.handle);
    }

    scheduled = {
      args: newArgs,
      handle: setTimeout(() => {
        scheduled = undefined;
        callback(...newArgs);
      }, timeout),
    };
  };

  deferred.cancel = () => {
    if (scheduled) {
      clearTimeout(scheduled.handle);
      scheduled = undefined;
    }
  };

  deferred.flush = () => {
    if (scheduled) {
      clearTimeout(scheduled.handle);
      const { args } = scheduled;
      scheduled = undefined;
      callback(...args);
    }
  };

  return deferred;
};

export { createDeferred };

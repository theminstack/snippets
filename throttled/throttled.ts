type State<TArgs extends readonly unknown[]> =
  | {
      readonly args: TArgs;
      readonly handle: any;
      readonly key: 'scheduled';
    }
  | {
      readonly handle: any;
      readonly key: 'waiting';
    }
  | {
      readonly key: 'idle';
    };

type Throttled<TArgs extends readonly unknown[]> = {
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
 * Wrap a callback so that it is never called more than once in `timeout`
 * milliseconds. The wrapped callback will be called immediately if possible.
 * Otherwise, it will be scheduled to run as soon as possible. If the
 * throttled wrapper is called while a call is already scheduled, the
 * scheduled arguments are updated, but the scheduled time remains the same.
 */
const createThrottled = <TArgs extends readonly unknown[]>(
  timeout: number,
  callback: (...args: TArgs) => void,
): Throttled<TArgs> => {
  let state: State<TArgs> = { key: 'idle' };

  const onTimeout = (current: State<TArgs>) => {
    switch (current.key) {
      case 'scheduled':
        state = { handle: startTimeout(), key: 'waiting' };
        callback(...current.args);
        break;
      case 'waiting':
        state = { key: 'idle' };
        break;
    }
  };

  const startTimeout = () => {
    return setTimeout(() => {
      onTimeout(state);
    }, timeout);
  };

  const throttled = (...newArgs: TArgs): void => {
    switch (state.key) {
      case 'scheduled':
      case 'waiting':
        state = { args: newArgs, handle: state.handle, key: 'scheduled' };
        break;
      case 'idle':
        state = { handle: startTimeout(), key: 'waiting' };
        callback(...newArgs);
        break;
    }
  };

  throttled.cancel = () => {
    if (state.key === 'scheduled') {
      state = { handle: state.handle, key: 'waiting' };
    }
  };

  throttled.flush = () => {
    if (state.key === 'scheduled') {
      clearTimeout(state.handle);
      onTimeout(state);
    }
  };

  return throttled;
};

export { createThrottled };

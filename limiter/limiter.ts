type LimiterOptions = {
  /**
   * Create the limiter in the paused state.
   */
  readonly paused?: boolean;
  /**
   * Resolve task promises sequentially (tasks are always _started_
   * sequentially), in the order that `run()` is called.
   */
  readonly sequential?: boolean;
};

type Limiter = {
  /**
   * Number of tasks that are running (ie. the task functions have been called,
   * but have not resolved).
   */
  readonly active: number;
  /**
   * Remove all pending tasks without running them. If a `reason` is given,
   * promises associated with the pending tasks will be rejected with the
   * reason. Otherwise, pending task promises will never resolve or reject.
   * Active tasks are not affected.
   */
  readonly clear: (reason?: unknown) => void;
  /**
   * Return true if the limiter is paused. Otherwise, false.
   */
  readonly isPaused: boolean;
  /**
   * Prevent any new or pending tasks from becoming active until `resume()` is
   * called.
   */
  readonly pause: () => void;
  /**
   * Number of tasks that are waiting to run (ie. the task functions have not
   * been called).
   */
  readonly pending: number;
  /**
   * Allow new and pending tasks to become active.
   */
  readonly resume: () => void;
  /**
   * Run a task when concurrency limit requirements have been met, and the
   * limiter is not paused.
   */
  readonly run: <TReturn, TArgs extends readonly unknown[] = readonly []>(
    task: (...args: TArgs) => PromiseLike<TReturn> | TReturn,
    ...args: TArgs
  ) => Promise<TReturn>;
  /**
   * The number of incomplete tasks (`pending + active`).
   */
  readonly size: number;
};

/**
 * Create a limiter with a maximum concurrency (`size`).
 */
const createLimiter = (concurrency: number, options: LimiterOptions = {}): Limiter => {
  const { sequential = false, paused = false } = options;
  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const queue: { reject: (reason: unknown) => void; start: () => Promise<void> }[] = [];

  let isPaused = paused;
  let active = 0;
  let lastPromise = Promise.resolve();

  const update = (): void => {
    while (!isPaused && active < safeConcurrency && queue.length) {
      active += 1;
      queue
        .shift()
        ?.start()
        .finally(() => {
          active -= 1;
          update();
        });
    }
  };

  return {
    get active() {
      return active;
    },
    clear: (reason) => {
      if (reason != null) {
        queue.splice(0, Number.POSITIVE_INFINITY).forEach((item) => item.reject(reason));
      } else {
        queue.length = 0;
      }
    },
    get isPaused() {
      return isPaused;
    },
    pause: () => {
      isPaused = true;
    },
    get pending() {
      return queue.length;
    },
    resume: () => {
      isPaused = false;
      update();
    },
    run: async (task, ...args) => {
      const newPromise = new Promise<any>((resolve, reject) => {
        queue.push({
          reject,
          start: async () => {
            return Promise.resolve()
              .then(() => task(...args))
              .then(resolve, reject);
          },
        });
      });
      const promise = sequential ? lastPromise.then(() => newPromise) : newPromise;

      lastPromise = promise.catch(() => undefined);
      update();

      return promise;
    },
    get size() {
      return queue.length + active;
    },
  };
};

export { type Limiter, type LimiterOptions, createLimiter };

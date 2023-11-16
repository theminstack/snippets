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
   * The number of incomplete tasks (`pending + active`).
   */
  readonly size: number;
  /**
   * Number of tasks that are running (ie. the task functions have been called,
   * but have not resolved).
   */
  readonly active: number;
  /**
   * Number of tasks that are waiting to run (ie. the task functions have not
   * been called).
   */
  readonly pending: number;
  /**
   * Return true if the limiter is paused. Otherwise, false.
   */
  readonly isPaused: boolean;
  /**
   * Run a task when concurrency limit requirements have been met, and the
   * limiter is not paused.
   */
  run<TReturn, TArgs extends readonly unknown[] = readonly []>(
    task: (...args: TArgs) => PromiseLike<TReturn> | TReturn,
    ...args: TArgs
  ): Promise<TReturn>;
  /**
   * Prevent any new or pending tasks from becoming active until `resume()` is
   * called.
   */
  pause(): void;
  /**
   * Allow new and pending tasks to become active.
   */
  resume(): void;
  /**
   * Remove all pending tasks without running them. If a `reason` is given,
   * promises associated with the pending tasks will be rejected with the
   * reason. Otherwise, pending task promises will never resolve or reject.
   * Active tasks are not affected.
   */
  clear(reason?: unknown): void;
};

/**
 * Create a limiter with a maximum concurrency (`size`).
 */
const createLimiter = (concurrency: number, options: LimiterOptions = {}): Limiter => {
  const { sequential = false, paused = false } = options;
  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const queue: { reject(reason: unknown): void; start(): Promise<void> }[] = [];

  let isPaused = paused;
  let active = 0;
  let promise = Promise.resolve();

  const update = (): void => {
    while (!isPaused && active < safeConcurrency && queue.length) {
      active += 1;
      void queue
        .shift()
        ?.start()
        .finally(() => {
          active -= 1;
          update();
        });
    }
  };

  return {
    get size() {
      return queue.length + active;
    },
    get active() {
      return active;
    },
    get pending() {
      return queue.length;
    },
    get isPaused() {
      return isPaused;
    },
    async run(task, ...args) {
      const newPromise = new Promise<any>((resolve, reject) => {
        queue.push({
          reject,
          start: () => {
            return Promise.resolve()
              .then(() => task(...args))
              .then(resolve, reject);
          },
        });
      });

      update();

      return await (sequential ? (promise = promise.catch(() => undefined).then(() => newPromise)) : newPromise);
    },
    pause() {
      isPaused = true;
    },
    resume() {
      isPaused = false;
      update();
    },
    clear: (reason) => {
      if (reason != null) {
        queue.splice(0, Number.POSITIVE_INFINITY).forEach((item) => item.reject(reason));
      } else {
        queue.length = 0;
      }
    },
  };
};

export { createLimiter, type Limiter, type LimiterOptions };

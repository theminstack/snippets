type LimitOptions = {
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
   * The maximum concurrency allowed by the limiter.
   */
  readonly concurrency: number;
  /**
   * Return true if the limiter is paused. Otherwise, false.
   */
  readonly isPaused: boolean;
  /**
   * Returns a promise which resolves when the pending count is zero, and the
   * active count is less than or equal to the `count`.
   */
  readonly onActive: (count: number) => Promise<void>;
  /**
   * Returns a promise which resolves when there are no pending or active
   * tasks (ie. the `size` is zero and the limiter is completely inactive).
   *
   * This is slightly more efficient than using `onSize(0)`, because it can
   * await `Promise.all` instead of `Promise.race` on the task queue.
   */
  readonly onEmpty: () => Promise<void>;
  /**
   * Returns a promise which resolves when the pending count is less than or
   * equal to the `count`.
   */
  readonly onPending: (count: number) => Promise<void>;
  /**
   * Returns a promise which resolves when the incomplete task count
   * (`pending + active`) is less than or equal to the `count`.
   */
  readonly onSize: (count: number) => Promise<void>;
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
const limit = (concurrency: number, { sequential = false, paused = false }: LimitOptions = {}): Limiter => {
  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const pending: { reject: (reason: unknown) => void; task: () => Promise<unknown> }[] = [];
  const active = new Set<Promise<unknown>>();

  let isPaused = paused;

  const start = (task: () => Promise<unknown>): void => {
    let lastActive: Promise<unknown> | undefined;
    if (sequential) for (lastActive of active);
    const promise = Promise.allSettled(lastActive ? [lastActive, task()] : [task()]);

    active.add(promise);
    promise.finally(() => {
      active.delete(promise);
      next();
    });
  };

  const next = (): void => {
    while (active.size < safeConcurrency && !isPaused) {
      const action = pending.shift();
      if (!action) break;
      start(action.task);
    }
  };

  const update = () => {
    next();
    update._resolve();
    update.promise = new Promise<void>((resolve) => (update._resolve = resolve));
  };
  update._resolve = undefined as unknown as () => void;
  update.promise = new Promise<void>((resolve) => (update._resolve = resolve));

  return {
    get active() {
      return active.size;
    },
    clear: (reason) => {
      if (reason != null) {
        pending.forEach(({ reject }) => reject(reason));
      }

      pending.length = 0;
      update();
    },
    get concurrency(): number {
      return safeConcurrency;
    },
    get isPaused() {
      return isPaused;
    },
    onActive: async (count) => {
      const safeCount = Math.max(0, Math.floor(count));

      while (pending.length > 0 || active.size > safeCount) {
        await Promise.race([...active, update.promise]);
      }
    },
    onEmpty: async () => {
      while (pending.length + active.size > 0) {
        await Promise.race([Promise.all(active), update.promise]);
      }
    },
    onPending: async (count) => {
      const safeCount = Math.max(0, Math.floor(count));

      while (pending.length > safeCount) {
        await Promise.race([...active, update.promise]);
      }
    },
    onSize: async (count) => {
      const safeCount = Math.max(0, Math.floor(count));

      while (pending.length + active.size > safeCount) {
        await Promise.race([...active, update.promise]);
      }
    },
    pause: () => {
      isPaused = true;
    },
    get pending() {
      return pending.length;
    },
    resume: () => {
      isPaused = false;
      update();
    },
    run: async (task, ...args) => {
      return new Promise((resolve, reject) => {
        pending.push({
          reject,
          task: async () =>
            Promise.resolve()
              .then(() => task(...args))
              .then(resolve, reject),
        });
        next();
      });
    },
    get size() {
      return pending.length + active.size;
    },
  };
};

export { type Limiter, type LimitOptions, limit };

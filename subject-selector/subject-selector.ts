type Subscriber<TValue> = {
  readonly next: (value: TValue) => void;
};

/**
 * Reference returned by the {@link Subject.subscribe} method.
 */
type Subscription = {
  /**
   * Unsubscribe from the subject. The subscribed callback will no longer be
   * invoked when the subject value is set.
   */
  readonly unsubscribe: () => void;
};

type SubjectLike<TValue> = {
  readonly subscribe: (next: (value: TValue) => void) => Subscription;
  readonly value: TValue;
};

/**
 * Options passed to the {@link Subject.subscribe} method.
 */
type SubscribeOptions = {
  /**
   * Invoke the subscriber callback with the current subject value, immediately
   * after registration.
   */
  readonly immediate?: boolean;
};

/**
 * Computed multicast observable value.
 *
 * A value that can have zero or more subscribers, which are notified via
 * callback when the computed value is changed as a result of changes to the
 * subjects used to compute the value.
 */
type SubjectSelector<TValue> = {
  /**
   * Add a callback which will be invoked when the next value is set. If the
   * `immediate` option is set, the callback will also be invoked immediately.
   *
   * @param next Callback to be invoked when the next value is set.
   * @param options Callback invocation options.
   * @param options.immediate Invoke the callback immediately.
   */
  readonly subscribe: (next: (value: TValue) => void, options?: SubscribeOptions) => Subscription;
  /**
   * Unsubscribe from all subject dependencies which have been used by the
   * compute function
   *
   * After calling unsubscribe, the selector effectively becomes a static
   * value, and will no longer be updated when subject dependencies are
   * changed.
   */
  readonly unsubscribe: () => void;
  /**
   * Current subject value.
   */
  readonly value: TValue;
};

/**
 * Function used to compute a Subject Selector's value.
 *
 * @param get Get a subject value and add it as a computation dependency.
 * @param current Current computed value, or undefined on first compute.
 */
type SubjectSelectorCompute<TValue> = (
  get: <TSubValue>(subject: SubjectLike<TSubValue>) => TSubValue,
  current: TValue | undefined,
) => TValue;

/**
 * Create a new {@link SubjectSelector} instance.
 *
 * A Subject Selector is a computed, readonly, subject-like object with
 * `value` and `subscribe()`, but no `next()`. It updates when any of the
 * subjects used to compute it are changed.
 *
 * @param compute Compute the selector value.
 */
const createSubjectSelector = <TValue>(compute: SubjectSelectorCompute<TValue>): SubjectSelector<TValue> => {
  let value: TValue | undefined;
  let dependencies = new Map<SubjectLike<unknown>, { subValue: unknown; subscription: Subscription }>();
  let isUpdating = false;

  const subscribers = new Set<Subscriber<TValue>>();
  const update = () => {
    if (isUpdating) {
      return;
    }

    isUpdating = true;

    try {
      const newDependencies = new Map<SubjectLike<unknown>, { subValue: unknown; subscription: Subscription }>();
      const get = <TSubValue>(subject: SubjectLike<TSubValue>): TSubValue => {
        const newDependency = newDependencies.get(subject);

        if (newDependency) {
          return newDependency.subValue as TSubValue;
        }

        const subscription = dependencies.get(subject)?.subscription ?? subject.subscribe(update);
        const subValue = subject.value;

        newDependencies.set(subject, { subValue, subscription });

        return subValue;
      };
      const nextValue = compute(get, value);

      [...dependencies.entries()].forEach(([subject, dependency]) => {
        if (!newDependencies.has(subject)) {
          dependency.subscription.unsubscribe();
        }
      });

      dependencies = newDependencies;

      if (nextValue !== value) {
        value = nextValue;
        subscribers.forEach(({ next }) => {
          next(nextValue);
        });
      }
    } finally {
      isUpdating = false;
    }
  };

  update();

  return {
    subscribe: (next, { immediate = false } = {}) => {
      let unsubscribe: () => void;

      if (dependencies.size > 0) {
        const subscriber = { next };

        subscribers.add(subscriber);
        unsubscribe = () => {
          subscribers.delete(subscriber);
        };
      } else {
        unsubscribe = () => {
          return;
        };
      }

      if (immediate) {
        next(value as TValue);
      }

      return { unsubscribe };
    },
    unsubscribe: () => {
      const toUnsubscribe = dependencies;

      dependencies = new Map();
      toUnsubscribe.forEach((dependency) => {
        dependency.subscription.unsubscribe();
      });
    },
    get value() {
      return value as TValue;
    },
  };
};

export {
  type SubjectSelector,
  type SubjectSelectorCompute,
  type SubscribeOptions,
  type Subscription,
  createSubjectSelector,
};

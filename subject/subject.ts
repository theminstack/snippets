type Subscriber<TValue> = {
  next(value: TValue): void;
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
 * Reference returned by the {@link Subject.subscribe} method.
 */
type Subscription = {
  /**
   * Unsubscribe from the subject. The subscribed callback will no longer be
   * invoked when the subject value is set.
   */
  unsubscribe(): void;
};

/**
 * Multicast observable value.
 *
 * A value that can have zero or more subscribers, which are notified via
 * callback when a new value is set.
 */
type Subject<TValue> = {
  /**
   * Current subject value.
   */
  readonly value: TValue;
  /**
   * Set the next value and notify all subscribers.
   *
   * @param next The next subject value.
   */
  next(value: TValue): void;
  /**
   * Add a callback which will be invoked when the next value is set. If the
   * `immediate` option is set, the callback will also be invoked immediately.
   *
   * @param next Callback to be invoked when the next value is set.
   * @param options Callback invocation options.
   * @param options.immediate Invoke the callback immediately.
   */
  subscribe(next: (value: TValue) => void, options?: SubscribeOptions): Subscription;
};

/**
 * Create a new {@link Subject} instance.
 *
 * A subject is a multicast observable value. In other words: a value that can
 * have zero or more subscribers, which are notified via callback when a new
 * value is set.
 *
 * @param initialValue Initial value of the subject.
 */
const createSubject = <TValue>(initialValue: TValue): Subject<TValue> => {
  let value = initialValue;

  const subscribers = new Set<Subscriber<TValue>>();

  return {
    get value() {
      return value;
    },
    next: (newValue) => {
      value = newValue;
      [...subscribers].forEach(({ next }) => {
        next(value);
      });
    },
    subscribe: (next, options = {}) => {
      const { immediate = false } = options;
      const subscriber = { next };
      const unsubscribe = (): void => {
        subscribers.delete(subscriber);
      };

      subscribers.add(subscriber);

      if (immediate) {
        next(value);
      }

      return { unsubscribe };
    },
  };
};

export { createSubject, type Subject, type SubscribeOptions, type Subscription };

type Subscriber<TValue> = {
  readonly next: (value: TValue) => void;
};

/**
 * Callback passed to the {@link Subject.subscribe} method.
 *
 * @param value Current subject value.
 */
type SubscriberCallback<TValue> = (value: TValue) => void;

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
  readonly unsubscribe: () => void;
};

/**
 * Multicast observable value. A value that can have zero or more subscribers,
 * which are notified via callback when a new value is set.
 */
type Subject<TValue> = {
  /**
   * Set the next value and notify all subscribers.
   *
   * @param next The next subject value.
   */
  readonly next: (value: TValue) => void;
  /**
   * Add a callback which will be invoked when the next value is set. If the
   * `immediate` option is set, the callback will also be invoked immediately.
   *
   * @param next Callback to be invoked when the next value is set.
   * @param options Callback invocation options.
   * @param options.immediate Invoke the callback immediately.
   */
  readonly subscribe: (next: SubscriberCallback<TValue>, options?: SubscribeOptions) => Subscription;
  /**
   * Current subject value.
   */
  readonly value: TValue;
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
    next: (newValue) => {
      value = newValue;
      [...subscribers].forEach((subscriber) => {
        subscriber.next(value);
      });
    },
    subscribe: (next, { immediate = false } = {}) => {
      const subscriber = { next };
      const unsubscribe = () => {
        subscribers.delete(subscriber);
      };

      subscribers.add(subscriber);

      if (immediate) {
        subscriber.next(value);
      }

      return { unsubscribe };
    },
    get value() {
      return value;
    },
  };
};

export { type Subject, type SubscribeOptions, type SubscriberCallback, type Subscription, createSubject };

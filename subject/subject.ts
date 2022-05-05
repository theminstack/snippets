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
 * Options passed to the {@link createSubject} function.
 */
type SubjectOptions<TValue> = {
  /**
   * Determine whether the current and next values are different. By default,
   * values are considered changed if they do not referentially match (`!==`).
   *
   * If this function returns false, the value will not be set, and no
   * subscribers will be notified. This effectively ignores the `next()` call.
   */
  readonly changed?: (value: TValue, nextValue: TValue) => boolean;
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
   * called when the subject value is changed.
   */
  readonly unsubscribe: () => void;
};

/**
 * Multicast observable value. A value that can have zero or more subscribers,
 * which are notified via callback when the value is changed.
 */
type Subject<TValue> = {
  /**
   * Set the next value and notify all subscribers.
   *
   * @param next The next subject value.
   */
  readonly next: (value: TValue) => void;
  /**
   * Add a callback which will be called when the value is changed. If the
   * `immediate` option is set, the callback will also be called immediately.
   *
   * @param next Call when the value is changed.
   * @param options Subscriber options.
   * @param options.immediate Invoke the callback immediately.
   */
  readonly subscribe: (next: SubscriberCallback<TValue>, options?: SubscribeOptions) => Subscription;
  /**
   * Current subject value.
   */
  readonly value: TValue;
};

const changedDefault = (value: unknown, nextValue: unknown) => {
  return value !== nextValue;
};

/**
 * Create a new {@link Subject} instance.
 *
 * A subject is a multicast observable value. In other words: a value that can
 * have zero or more subscribers, which are notified via callback when the
 * value is changed.
 *
 * @param initialValue Initial value of the subject.
 * @param options Subject options.
 * @param options.changed Determine if current and next values are different.
 */
const createSubject = <TValue>(
  initialValue: TValue,
  { changed = changedDefault }: SubjectOptions<TValue> = {},
): Subject<TValue> => {
  let value = initialValue;

  const subscribers = new Set<Subscriber<TValue>>();

  return {
    next: (nextValue) => {
      if (!changed(value, nextValue)) {
        return;
      }

      value = nextValue;
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

export {
  type Subject,
  type SubjectOptions,
  type SubscribeOptions,
  type SubscriberCallback,
  type Subscription,
  createSubject,
};

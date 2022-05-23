type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer V) => any ? V : never;

type Listener<TValue = unknown> = ((value: TValue) => void) & { readonly listener?: Listener };

type EventsDefinition = Readonly<Record<string, unknown>>;

type EventTypes<TEvents extends EventsDefinition> = Record<string, never> extends TEvents ? EventsDefinition : TEvents;

type EventsEmit<TEvents extends EventsDefinition> = UnionToIntersection<
  { readonly [P in keyof TEvents]: (event: P, value: TEvents[P]) => boolean }[keyof TEvents]
>;

/**
 * Event publishing methods.
 */
type EventsPublish<TEvents extends EventsDefinition = {}> = {
  /**
   * Synchronously calls each of the listeners for the named `event`, passing
   * the `value` to each.
   *
   * Listeners are called in the order they were added.
   *
   * @returns True if there are event listeners, otherwise false.
   */
  readonly emit: EventsEmit<EventTypes<TEvents>>;
};

type EventsOff<TEvents extends EventsDefinition, TReturn> = (event: keyof TEvents, listener: Listener) => TReturn;

type EventsOn<TEvents extends EventsDefinition, TReturn> = UnionToIntersection<
  { readonly [P in keyof TEvents]: (event: P, listener: Listener<TEvents[P]>) => TReturn }[keyof TEvents]
>;

/**
 * Event subscribing methods.
 */
type EventsSubscribe<TEvents extends EventsDefinition = {}, TReturn = void> = {
  /**
   * Removes the specified `listener` for the named `event`.
   *
   * Removes, at most, one instance of a listener. If any single listener has
   * been added multiple times for the specified event, then `off()` must be
   * called multiple times to remove each instance. Multiple instances of the
   * same listener are removed in the order that they were added.
   */
  readonly off: EventsOff<EventTypes<TEvents>, TReturn>;
  /**
   * Adds a `listener` for the named `event`.
   *
   * No checks are made to see if the listener has already been added. Multiple
   * calls passing the same combination of event name and listener will result
   * in the listener being added, and called, multiple times.
   */
  readonly on: EventsOn<EventTypes<TEvents>, TReturn>;
};

/**
 * Events interface for publishing and subscribing to named events.
 */
type Events<TEvents extends EventsDefinition = {}, TReturn = void> = EventsPublish<TEvents> &
  EventsSubscribe<TEvents, TReturn>;

/**
 * Create a new {@link Events} instance.
 */
const createEvents = <TEvents extends EventsDefinition = {}>(): Events<TEvents> => {
  const listeners = new Map<string, readonly Listener[]>();

  const emitter: Events = {
    emit: (event, value): boolean => {
      const eventListeners = listeners.get(event);

      if (!eventListeners || !eventListeners.length) {
        return false;
      }

      eventListeners.forEach((listener) => {
        listener(value);
      });

      return true;
    },
    off: (event, listener) => {
      const eventListeners = listeners.get(event);

      if (!eventListeners) {
        return;
      }

      const index = eventListeners.indexOf(listener);

      if (index < 0) {
        return;
      }

      if (eventListeners.length === 1) {
        listeners.delete(event);
      } else {
        listeners.set(event, [...eventListeners.slice(0, index), ...eventListeners.slice(index + 1)]);
      }
    },
    on: (event, listener) => {
      const eventListeners = listeners.get(event);

      listeners.set(event, eventListeners ? [...eventListeners, listener] : [listener]);
    },
  };

  return emitter as Events<TEvents>;
};

export { type Events, type EventsPublish, type EventsSubscribe, createEvents };

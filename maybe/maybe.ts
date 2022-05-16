const MAYBE = Symbol.for('@@maybe');

type None = null | undefined | void;

type Throwable = {};

type Required<TValue> = Exclude<TValue, None>;

type MaybeBase<TValue> = {
  readonly [MAYBE]: Maybe<TValue>;
  /**
   * Get the next monad if the current monad has an `error`. Otherwise, return
   * the current monad.
   */
  readonly catch: <TNext>(next: (error: Throwable) => None | TNext) => Maybe<TNext | TValue>;
  /**
   * Get the next monad if the current monad is `empty` and does not have an
   * `error`. Otherwise, return the current monad.
   */
  readonly else: <TNext>(next: TNext | (() => None | TNext) | null | undefined) => Maybe<TNext | TValue>;
  /**
   * True if the monad does not have a non-nullish value. Otherwise, false.
   *
   * _NOTE: Always the inverse of the `ok` property._
   */
  readonly empty: boolean;
  /**
   * Get the current error if any.
   */
  readonly error: Throwable | null;
  /**
   * Get an `empty` monad if the current monad is `ok` and the `predicate`
   * returns false. Otherwise, return the current monad.
   */
  readonly filter: <TNext extends TValue = TValue>(
    predicate: ((value: Required<TValue>) => boolean) | ((value: TValue) => value is TNext),
  ) => Maybe<TNext>;
  /**
   * Get the next monad if the current monad is `ok`. Otherwise, return the
   * current `empty` monad.
   */
  readonly map: <TNext>(next: (value: Required<TValue>) => Maybe<TNext> | None | TNext) => Maybe<TNext>;
  /**
   * True if the monad has a non-nullish value. Otherwise, false.
   *
   * _NOTE: Always the inverse of the `empty` property._
   */
  readonly ok: boolean;
  /**
   * Get a one element array containing the non-nullish value if `ok`.
   * Otherwise, return an empty array.
   */
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly toArray: () => [] | [Required<TValue>];
  /**
   * Get the non-nullish value if the monad is `ok`. Otherwise, throws the
   * `error` or a new `ReferenceError`.
   */
  readonly value: Required<TValue>;
};

type MaybeOk<TValue> = MaybeBase<TValue> & {
  readonly empty: false;
  readonly error: null;
  readonly ok: true;
};

type MaybeNotOk<TValue> = MaybeBase<TValue> & {
  readonly empty: true;
  readonly ok: false;
  readonly value: never;
};

/**
 * Maybe monad.
 *
 * Access the current state using the `ok`, `empty`, `value`, and `error` properties,
 * or the `toArray` method.
 *
 * Create derivative monads using the `else*`, `map`, and `filter` methods.
 * The `else*` methods are no-ops if `ok` property is true. The `map` and
 * `filter` methods are no-ops if the `ok` property is false.
 */
type Maybe<TValue> = MaybeNotOk<TValue> | MaybeOk<TValue>;

const createOk = <TValue>(value: Required<TValue>): MaybeOk<TValue> => {
  const instance: MaybeOk<TValue> = {
    get [MAYBE]() {
      return instance;
    },
    catch: () => instance,
    else: () => instance,
    empty: false,
    error: null,
    filter: (predicate) => maybe<any>(() => (predicate(value) ? instance : maybe.empty())),
    map: (next) => maybe(() => next(value)),
    ok: true,
    toArray: () => [value],
    value,
  };

  return instance;
};

const createEmpty = (error: Throwable | null): MaybeNotOk<never> => {
  const instance: MaybeNotOk<never> = {
    get [MAYBE]() {
      return instance;
    },
    catch: error == null ? () => instance : (next) => maybe(() => next(error)),
    else: error == null ? maybe : () => instance,
    empty: true,
    error,
    filter: () => instance,
    map: () => instance,
    ok: false,
    toArray: () => [],
    get value(): never {
      throw error ?? new ReferenceError('maybe instance is empty');
    },
  };

  return instance;
};

/**
 * Get a monad for the `init` value.
 *
 * @param init A value, or value factory.
 */
const maybe = <TValue>(
  init: Maybe<TValue> | TValue | (() => Maybe<TValue> | None | TValue) | null | undefined,
): Maybe<TValue> => {
  try {
    const value = typeof init === 'function' ? (init as () => Maybe<TValue> | None | TValue)() : init;

    if (isMaybe(value)) {
      return value;
    } else if (value == null) {
      return maybe.empty();
    } else {
      return createOk(value as Required<TValue>);
    }
  } catch (error) {
    return maybe.error(error);
  }
};

/**
 * Get an empty monad with the given `error` value. If the error is not given
 * or nullish (ie. null or undefined), a default error will be created.
 */
maybe.error = <TValue = never>(error?: unknown): Maybe<TValue> => {
  return createEmpty((error ?? new Error('unknown')) as Throwable);
};

/**
 * Get an empty (not ok) monad, _without_ an error.
 *
 * **NOTE**: All empty monad instances are the same instance (ie. referentially
 * identical).
 */
maybe.empty = <TValue = never>(): Maybe<TValue> => {
  return empty;
};

const empty = createEmpty(null);

/**
 * Returns true of the `value` is a `Maybe` monad instance. Otherwise, false.
 */
const isMaybe = (value: unknown): value is Maybe<unknown> => {
  return Boolean((value as { [MAYBE]?: unknown })?.[MAYBE]);
};

export { type Maybe, isMaybe, maybe };

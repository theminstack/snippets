type ToArrayResult<TValue> = any extends any
  ? // eslint-disable-next-line functional/prefer-readonly-type
    (TValue extends Function | string ? TValue : TValue extends readonly (infer TElement)[] ? TElement : TValue)[]
  : never;

/**
 * A multi-value is an array-like or iterable value, _excluding_ strings and
 * functions.
 *
 * Strings and functions both have a `length` property, which makes them
 * "array-like" in JS. However, in the context of coercing to an array, strings
 * and functions should be considered single values.
 */
const isMultiValue = <TValue>(
  value: ArrayLike<TValue> | Iterable<TValue> | TValue,
): value is ArrayLike<TValue> | Iterable<TValue> => {
  return (
    value instanceof Object &&
    (Symbol.iterator in value || typeof (value as any).length === 'number') &&
    typeof value !== 'function'
  );
};

/**
 * Coerce a value to an array. Single values will become a single value array.
 * All entries in iterable and array-like values will be copied to a new array.
 *
 * Strings and functions both have a `length` property, which makes them seem
 * "array-like". But, when coercing to an array, the more useful outcome is to
 * have a single string or function become the only element in the resulting
 * array.
 */
const toArray = <TValue>(value: TValue): ToArrayResult<TValue> => {
  return (isMultiValue(value) ? Array.from(value) : [value]) as ToArrayResult<TValue>;
};

export { toArray };

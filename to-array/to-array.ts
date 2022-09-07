/**
 * Coerce a value to an array. Single values will become a single value array.
 * All entries in iterable and array-like values will be copied to a new array.
 *
 * Strings and functions both have a `length` property, which makes them seem
 * "array-like". But, when coercing to an array, the more useful outcome is to
 * have a single string or function become the only element in the resulting
 * array.
 */
const toArray = <TValue>(
  value: TValue,
): (TValue extends Function | string
  ? TValue
  : TValue extends ArrayLike<infer TElement> | Iterable<infer TElement>
  ? TElement
  : TValue)[] => {
  if (
    typeof value === 'object' &&
    value != null &&
    (Symbol.iterator in value || typeof (value as any).length === 'number')
  ) {
    return Array.from(value as any);
  }

  return [value as any];
};

export { toArray };

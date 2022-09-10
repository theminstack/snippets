const compatiblePrototypes = [Object.prototype, Array.prototype, null];
const compatibleTypes = ['boolean', 'string', 'number'];

/**
 * Returns true if the value can be JSON
 * serialized and deserialized without loosing
 * any data.
 *
 * Unsafe things:
 *
 * - Instances of classes (eg. `Date`).
 * - Objects with `symbol` keys.
 * - Arrays with extra (own enumerable) properties.
 * - `Function`, `bigint`, and `undefined` values.
 *
 * The `toJSON` method does not qualify any
 * values as safe that would otherwise be
 * unsafe, because it is one directional.
 * Similarly, JSON serializers and revivers are
 * not considered.
 */
const isJsonSafe = (value: unknown): boolean => {
  const type = typeof value;

  if (type === 'object') {
    if (value === null) return true;
    if (!compatiblePrototypes.includes(Object.getPrototypeOf(value))) return false;
    if (Object.getOwnPropertySymbols(value).length) return false;
    if (Array.isArray(value)) return Object.keys(value).length === 0 && value.every(isJsonSafe);
    return Object.values(value as {}).every(isJsonSafe);
  }

  return compatibleTypes.includes(type);
};

export { isJsonSafe };

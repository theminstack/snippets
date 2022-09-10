const compatiblePrototypes = [Object.prototype, Array.prototype, null];
const compatibleTypes = ['boolean', 'string', 'number'];

/**
 * Returns true if the value can be JSON serialized and deserialized without loosing any data.
 */
const isJsonSafe = (value: unknown): boolean => {
  const type = typeof value;

  if (type === 'object') {
    if (value === null) return true;
    if (!compatiblePrototypes.includes(Object.getPrototypeOf(value))) return false;
    if (Object.getOwnPropertySymbols(value).length) return false;
    if (Array.isArray(value))
      return (
        Object.keys(value).length === 0 &&
        Object.getOwnPropertyNames(value).toString() === 'length' &&
        value.every(isJsonSafe)
      );
    return (
      Object.keys(value as {}).length === Object.getOwnPropertyNames(value).length &&
      Object.values(value as {}).every(isJsonSafe)
    );
  }

  return compatibleTypes.includes(type);
};

export { isJsonSafe };

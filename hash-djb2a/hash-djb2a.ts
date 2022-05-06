type HashValue = {
  /**
   * Signed integer partial hash value.
   *
   * This value can be passed to the {@link hash} function as the seed to
   * continue a partially calculated hash.
   */
  readonly seed: number;
  /**
   * Unsigned 32-bit integer final hash value.
   */
  readonly value: number;
  readonly valueOf: () => number;
};

type HashOptions = { readonly seed?: number };

/**
 * XOR version of the [DJB2](http://www.cse.yorku.ca/~oz/hash.html) string
 * hashing algorithm (sometimes referred to as DJB2a), originally written by
 * [Dan Bernstein](https://en.wikipedia.org/wiki/Daniel_J._Bernstein).
 */
const hash = (source: string, { seed = 5381 }: HashOptions = {}): HashValue => {
  let current = seed;

  for (let index = 0, max = source.length; index < max; ++index) {
    current = ((current << 5) + current) ^ source.charCodeAt(index);
  }

  const value = current >>> 0;

  return { seed: current, value, valueOf: () => value };
};

export { hash };

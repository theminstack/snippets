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
  valueOf(): number;
};

type HashOptions = {
  /**
   * Initial hash seed value.
   *
   * Defaults to the "magic number" 5381. Here's an interesting stack
   * overflow thread on why that number is used:
   * https://stackoverflow.com/questions/10696223.
   *
   * It's highly recommended that the seed be derived from this magic number
   * (ie. the raw hash value from a partial previous hash calculation) to
   * maintain good hash characteristics like a low collision probability.
   */
  readonly seed?: number;
};

/**
 * XOR version of the [DJB2](http://www.cse.yorku.ca/~oz/hash.html) string
 * hashing algorithm (sometimes referred to as DJB2a), originally written by
 * [Dan Bernstein](https://en.wikipedia.org/wiki/Daniel_J._Bernstein).
 */
const hash = (source: string, options: HashOptions = {}): HashValue => {
  const { seed = 5381 } = options;

  let current = seed;

  for (let index = 0, max = source.length; index < max; ++index) {
    current = ((current << 5) + current) ^ source.charCodeAt(index);
  }

  const value = current >>> 0;

  return { seed: current, value, valueOf: () => value };
};

export { hash };

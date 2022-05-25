type SortedListCompare<TType = any> = (a: TType, b: TType) => number;

type SortedListOptions<TType> = {
  readonly allowDuplicates?: boolean;
  readonly compare?: SortedListCompare<TType>;
};

/**
 * A binary sorted list.
 */
class SortedList<TType> {
  public static readonly defaultCompare = (a_: any, b_: any): number => {
    const a = a_.toString();
    const b = b_.toString();

    return a < b ? -1 : a > b ? 1 : 0;
  };

  // eslint-disable-next-line functional/prefer-readonly-type
  readonly #values: TType[] = [];
  readonly #compare: (a: TType, b: TType) => number;
  readonly #allowDuplicates: boolean;

  /**
   * Construct a binary sorted list which is initially empty.
   */
  public constructor(options?: SortedListCompare<TType> | SortedListOptions<TType>);
  /**
   * Construct a binary sorted list with initial values.
   */
  public constructor(values: Iterable<TType>, options?: SortedListCompare<TType> | SortedListOptions<TType>);
  public constructor(
    ...args:
      | readonly [options?: SortedListCompare<TType> | SortedListOptions<TType>]
      | readonly [values: Iterable<TType>, options?: SortedListCompare<TType> | SortedListOptions<TType>]
  ) {
    const [values, options = {}] =
      args[0] && Symbol.iterator in args[0]
        ? (args as [values: Iterable<TType>, options?: SortedListOptions<TType>])
        : [[], ...(args as [options?: SortedListOptions<TType>])];
    const { compare = SortedList.defaultCompare, allowDuplicates = false } =
      typeof options === 'function' ? { compare: options } : options;

    this.#compare = (a, b) =>
      typeof b === 'undefined' ? (typeof a === 'undefined' ? 0 : -1) : typeof a === 'undefined' ? 1 : compare(a, b);
    this.#allowDuplicates = allowDuplicates;

    for (const value of values) {
      this.add(value);
    }
  }

  /**
   * Number of entries in the list.
   */
  public get size() {
    return this.#values.length;
  }

  /**
   * Insert the `value` in order (after duplicates if they exist).
   */
  public add(value: TType): this {
    let [index, isMatch] = this.search(value);

    if (!isMatch || this.#allowDuplicates) {
      if (typeof value !== 'undefined') {
        while (isMatch) {
          index += 1;
          isMatch = this.#compare(value, this.#values[index]) === 0;
        }
      }

      this.#values.splice(index, 0, value);
    }

    return this;
  }

  /**
   * Get the value at the `index`.
   */
  public at(index: number): TType | undefined {
    return this.#values.at(index);
  }

  /**
   * Returns true if the `value` is in the list.
   */
  public has(value: TType): boolean {
    return this.search(value)[1];
  }

  /**
   * Remove the `value` (only the first if duplicates exist).
   */
  public delete(value: TType): boolean {
    const [index, isMatch] = this.search(value);

    if (!isMatch) {
      return false;
    }

    this.#values.splice(index, 1);

    return true;
  }

  /**
   * Remove the entry at the `index`.
   */
  public deleteAt(index: number): TType | undefined {
    return this.#values.splice(index, 1)[0];
  }

  /**
   * Remove all entries from the list.
   */
  public clear(): void {
    this.#values.length = 0;
  }

  /**
   * Get part the list as a new sorted list, selected from `start` to `end`.
   */
  public slice(start?: number, end?: number): SortedList<TType> {
    return new SortedList(this.#values.slice(start, end), this.#compare);
  }

  /**
   * Call the `callback` once for each entry in the list.
   */
  public forEach(callback: (value: TType, index: number, list: this) => void): void {
    this.#values.forEach((value, index) => callback(value, index, this));
  }

  /**
   * Find the entry (first if duplicates exist) that matches `value`, or the
   * next greater entry if no exact match is found.
   */
  public search(value: TType): [index: number, isMatch: boolean] {
    let min = 0;
    let max = this.#values.length;
    let result = -1;

    while (min <= max) {
      const mid = min + Math.floor((max - min) / 2);

      result = this.#compare(value, this.#values[mid]);

      if (min === max) {
        break;
      }

      if (result > 0) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    return [min, result === 0];
  }

  /**
   * Returns a new iterator object that yields the list values.
   */
  public values(): IterableIterator<TType> {
    return this.#values.values();
  }

  /**
   * Returns a new iterator object that yields the list values.
   */
  public [Symbol.iterator](): IterableIterator<TType> {
    return this.values();
  }
}

export { type SortedListCompare, type SortedListOptions, SortedList };

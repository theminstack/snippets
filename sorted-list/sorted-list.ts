type SortedListCompare<TType = any> = (a: TType, b: TType) => number;

type SortedListOptions<TType> = {
  /**
   * Add duplicates to the list instead of ignoring them.
   */
  readonly allowDuplicates?: boolean;
  /**
   * Override the default compare by string value implementation.
   */
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

  readonly #compare: (a: TType, b: TType) => number;
  readonly #allowDuplicates: boolean;
  readonly #values: TType[];

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
    this.#values = this.#allowDuplicates
      ? [...values].sort(compare)
      : [...values]
          .sort(compare)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .filter((value, index, array) => index === 0 || this.#compare(value, array[index - 1]!) !== 0);
  }

  /**
   * Number of entries in the list.
   */
  public get size(): number {
    return this.#values.length;
  }

  /**
   * Insert the `value` in order (before duplicates if they exist).
   */
  public add(value: TType): this {
    const [index, isMatch] = this.search(value);

    if (!isMatch || this.#allowDuplicates) {
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

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result = this.#compare(value, this.#values[mid]!);

      if (min === max) {
        break;
      }

      if (result > 0) {
        min = mid + 1;
      } else {
        max = mid;
      }
    }

    /*
     * If the search value is undefined, it can look like an exact match with
     * the index off the end of the list, which is incorrect. So, isMatch
     * (result === 0) is only true if the index (min) is less than list length.
     */
    return [min, result === 0 && min < this.#values.length];
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

export { SortedList, type SortedListCompare, type SortedListOptions };

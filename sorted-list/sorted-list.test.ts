import { SortedList } from './sorted-list';

describe('sorted-list', () => {
  test('search', () => {
    let list = new SortedList([1, 3, 5]);
    expect(list.search(0)).toEqual([0, false]);
    expect(list.search(1)).toEqual([0, true]);
    expect(list.search(2)).toEqual([1, false]);
    expect(list.search(3)).toEqual([1, true]);
    expect(list.search(4)).toEqual([2, false]);
    expect(list.search(5)).toEqual([2, true]);
    expect(list.search(6)).toEqual([3, false]);
    list = new SortedList([1, 3]);
    expect(list.search(0)).toEqual([0, false]);
    expect(list.search(1)).toEqual([0, true]);
    expect(list.search(2)).toEqual([1, false]);
    expect(list.search(3)).toEqual([1, true]);
    expect(list.search(4)).toEqual([2, false]);
    list = new SortedList([1]);
    expect(list.search(0)).toEqual([0, false]);
    expect(list.search(1)).toEqual([0, true]);
    expect(list.search(2)).toEqual([1, false]);
    list = new SortedList();
    expect(list.search(Number.NEGATIVE_INFINITY)).toEqual([0, false]);
    expect(list.search(-1)).toEqual([0, false]);
    expect(list.search(0)).toEqual([0, false]);
    expect(list.search(1)).toEqual([0, false]);
    expect(list.search(Number.POSITIVE_INFINITY)).toEqual([0, false]);
  });

  test('duplicates', () => {
    expect(new SortedList([1, 1], { allowDuplicates: true }).search(1)).toEqual([0, true]);
    expect(new SortedList([1, 1, 2], { allowDuplicates: true }).search(1)).toEqual([0, true]);
    expect(new SortedList([1, 1, 1], { allowDuplicates: true }).search(1)).toEqual([0, true]);
    expect(new SortedList([0, 1, 1], { allowDuplicates: true }).search(1)).toEqual([1, true]);
    expect(new SortedList([0, 1, 1, 2], { allowDuplicates: true }).search(1)).toEqual([1, true]);
    expect(new SortedList([0, 1, 1, 2, 2], { allowDuplicates: true }).search(1)).toEqual([1, true]);
    expect(new SortedList([0, 0, 1, 1, 2, 2], { allowDuplicates: true }).search(1)).toEqual([2, true]);
    expect(new SortedList([0, 0, 1, 1, 2, 2], { allowDuplicates: true }).size).toBe(6);
  });

  test('no duplicates', () => {
    const list = new SortedList([1, 1, 2, 2, 3]);
    expect(list.size);
    expect([...list]).toEqual([1, 2, 3]);
  });

  test('default compare', () => {
    expect([...new SortedList([3, 5, 1])]).toEqual([1, 3, 5]);
    expect([...new SortedList(['3', 5, 1])]).toEqual([1, '3', 5]);
    expect([...new SortedList([undefined, 5, '3'])]).toEqual(['3', 5, undefined]);
    expect([...new SortedList([undefined, 5, undefined, '3'], { allowDuplicates: true })]).toEqual([
      '3',
      5,
      undefined,
      undefined,
    ]);
    expect([...new SortedList([undefined, 5, undefined, 3, '3'], { allowDuplicates: true })]).toEqual([
      3,
      '3',
      5,
      undefined,
      undefined,
    ]);
  });

  test('custom compare', () => {
    expect(
      [
        ...new SortedList<{ value: number }>([{ value: 3 }, { value: 5 }, { value: 1 }], (a, b) =>
          SortedList.defaultCompare(a.value, b.value),
        ),
      ].map((value) => value.value),
    ).toEqual([1, 3, 5]);
  });

  test('at', () => {
    const list = new SortedList([0, 2, 4]);

    for (let index = 0; index < list.size; index++) {
      expect(list.at(index)).toBe(index * 2);
    }

    for (let index = -1; index >= -list.size; index--) {
      expect(list.at(index)).toBe((list.size + index) * 2);
    }
  });

  test('has', () => {
    const list = new SortedList([0, 2, 4]);

    for (let index = 0; index <= 5; index++) {
      expect(list.has(index)).toBe(index % 2 === 0);
    }
  });

  test('delete', () => {
    const list = new SortedList([0, 2, 4]);

    for (let index = 0, remaining = list.size; index <= 5; index++) {
      const success = list.delete(index);

      if (success) {
        remaining--;
      }

      expect(success).toBe(index % 2 === 0);
      expect(list.size).toBe(remaining);
    }
  });

  test('deleteAt', () => {
    const list = new SortedList([1, 2, 3]);
    expect(list.deleteAt(1)).toBe(2);
    expect([...list]).toEqual([1, 3]);
    expect(list.deleteAt(0)).toBe(1);
    expect([...list]).toEqual([3]);
  });

  test('clear', () => {
    const list = new SortedList([1, 2, 3]);
    expect(list.size).toBe(3);
    list.clear();
    expect(list.size).toBe(0);
    expect([...list]).toEqual([]);
    expect(list.at(1)).toBeUndefined();
    expect(list.has(1)).toBe(false);
  });

  test('slice', () => {
    const list = new SortedList([1, 2, 3]);
    expect([...list.slice()]).toEqual([1, 2, 3]);
    expect([...list.slice(0)]).toEqual([1, 2, 3]);
    expect([...list.slice(1)]).toEqual([2, 3]);
    expect([...list.slice(0, 2)]).toEqual([1, 2]);
    expect([...list.slice(1, -1)]).toEqual([2]);
  });

  test('forEach', () => {
    const values = [1, 2, 3];
    const list = new SortedList(values);
    const callback = jest.fn();
    list.forEach(callback);
    expect(callback).toHaveBeenCalledTimes(values.length);

    for (let index = 0; index < values.length; index++) {
      expect(callback).toHaveBeenNthCalledWith(index + 1, values[index], index, list);
    }
  });
});

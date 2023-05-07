import { inspect } from 'node:util';

import { toArray } from './to-array.js';

const fn = (): undefined => undefined;

const cases: [unknown, unknown][] = [
  [null, [null]],
  [
    [null, null],
    [null, null],
  ],
  [undefined, [undefined]],
  [
    [undefined, undefined],
    [undefined, undefined],
  ],
  [1, [1]],
  [
    [1, 2],
    [1, 2],
  ],
  ['abc', ['abc']],
  [
    ['abc', 'def'],
    ['abc', 'def'],
  ],
  [true, [true]],
  [
    [true, false],
    [true, false],
  ],
  [fn, [fn]],
  [
    [fn, fn],
    [fn, fn],
  ],
  [{ 0: 'abc', 1: 'def', length: 2 }, ['abc', 'def']],
  [new Set([1, 2, 3]), [1, 2, 3]],
];

describe('toArray', () => {
  cases.forEach(([value, expected]) => {
    test(inspect(value), () => {
      expect(toArray(value)).toEqual(expected);
    });
  });

  test('mixed types', () => {
    const value = 1 as string[] | number;
    const array: (number | string)[] = toArray(value);

    expect(array).toEqual([1]);
  });
});

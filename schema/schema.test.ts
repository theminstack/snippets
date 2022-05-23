/* eslint-disable @typescript-eslint/no-empty-function */
import { type Schema, $ } from './schema';

describe('schema', () => {
  const cases: Record<string, [Schema<any>, any[], any[]]> = {
    any: [$.any, [1, '', {}, null, undefined], []],
    array: [$.array(), [[], [1], ['', 1], [{}]], []],
    arrayTyped: [$.array($.string), [[], [''], ['', 'test']], [[1], ['', 1]]],
    bigint: [$.bigint, [1n, new Object(1n)], [1, '']],
    boolean: [$.boolean, [true, false, new Object(true), new Object(false)], [1, 0, '', null, undefined, {}]],
    custom: [$.custom((value): value is string => typeof value === 'string'), [''], [1]],
    enum: [$.enum('a', 'b'), ['a', 'b'], ['c', 1]],
    function: [$.function, [() => true, function () {}, class Foo {}], [1, {}]],
    instance: [$.instance(RegExp), [/./], ['/./', new Object()]],
    intersection: [
      $.intersection($.object({ foo: $.string }), $.object({ bar: $.number })),
      [
        { bar: 1, foo: '' },
        { bar: 1, baz: true, foo: '' },
      ],
      [{ bar: 1 }, { foo: '' }, 1, {}],
    ],
    null: [$.null, [null], [undefined, 1, {}]],
    number: [$.number, [1, new Object(2)], ['']],
    object: [
      $.object({ bar: $.number, foo: $.string }),
      [
        { bar: 1, foo: '' },
        { bar: 1, baz: true, foo: '' },
      ],
      [{ bar: 1 }, { foo: '' }, 1, {}],
    ],
    record: [$.record(), [{}, { foo: '' }, { bar: true, foo: 1 }], [1, null]],
    recordTyped: [
      $.record($.string),
      [{}, { foo: '' }, { bar: '', foo: '' }],
      [{ foo: 1 }, { bar: 1, foo: '' }, 1, null],
    ],
    string: [$.string, ['', new Object('')], [1]],
    symbol: [$.symbol, [Symbol()], [1, {}, null]],
    tuple: [$.tuple($.string, $.number), [['', 1]], [['', 1, true], [], [1, ''], [''], [undefined, 1]]],
    undefined: [$.undefined, [undefined], [null, 1, {}]],
    union: [$.union($.string, $.number), ['', 1], [true, {}, null]],
    unknown: [$.unknown, [1, '', {}, null, undefined], []],
  };

  Object.entries(cases).forEach(([title, [schema, pass, fail]]) => {
    test(title, () => {
      pass.forEach((value) => expect(schema.test(value)).toBe(true));
      pass.forEach((value) => expect(schema.parse(value)).toBe(value));
      fail.forEach((value) => expect(schema.test(value)).toBe(false));
      fail.forEach((value) =>
        expect(() => schema.parse(value)).toThrow(
          expect.objectContaining({ message: expect.stringContaining('Unexpected type at $') }),
        ),
      );
    });
  });

  test('object index', () => {
    const schema = $.object({ foo: $.string }, $.number);
    expect(schema.test({ foo: '' })).toBe(true);
    expect(schema.test({ bar: 1, foo: '' })).toBe(true);
    expect(schema.test({ bar: '', foo: '' })).toBe(false);
  });

  test('error', () => {
    const schema = $.object({ 'foo bar 😄': $.array($.object({ baz: $.string })) });
    const value = { 'foo bar 😄': [{ baz: 1 }] };
    const onInvalid = jest.fn();

    expect(schema.test(value, { onInvalid })).toBe(false);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onInvalid).toHaveBeenLastCalledWith('Unexpected type at $["foo bar 😄"][0].baz');
    expect(() => schema.parse(value)).toThrow(
      expect.objectContaining({ message: 'Unexpected type at $["foo bar 😄"][0].baz' }),
    );
  });
});

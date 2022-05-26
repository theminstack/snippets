import { type Schema, type SchemaObject, $ } from './schema';

describe('schema', () => {
  const basicCases: Record<string, [Schema<any>, any[], any[]]> = {
    any: [$.any, [1, '', {}, null, undefined], []],
    array: [$.array(), [[], [1], ['', 1], [{}]], []],
    arrayTyped: [$.array($.string), [[], [''], ['', 'test']], [[1], ['', 1], undefined]],
    bigint: [$.bigint, [1n, new Object(1n)], [1, '', undefined]],
    boolean: [$.boolean, [true, false, new Object(true), new Object(false)], [1, 0, '', null, undefined, {}]],
    custom: [$.custom((value): value is string => typeof value === 'string'), [''], [1, undefined]],
    enum: [$.enum('a', 'b'), ['a', 'b'], ['c', 1, undefined]],
    function: [$.function, [() => true, function () {}, class Foo {}], [1, {}, undefined]],
    instance: [$.instance(RegExp), [/./], ['/./', new Object(), undefined]],
    intersection: [
      $.intersection($.object({ foo: $.string }), $.object({ bar: $.number })),
      [
        { bar: 1, foo: '' },
        { bar: 1, baz: true, foo: '' },
      ],
      [{ bar: 1 }, { foo: '' }, 1, {}, undefined],
    ],
    null: [$.null, [null], [undefined, 1, {}]],
    number: [$.number, [1, new Object(2)], ['', undefined]],
    object: [
      $.object({ bar: $.number, foo: $.string }),
      [
        { bar: 1, foo: '' },
        { bar: 1, baz: true, foo: '' },
      ],
      [{ bar: 1 }, { foo: '' }, 1, {}, undefined],
    ],
    record: [$.record(), [{}, { foo: '' }, { bar: true, foo: 1 }], [1, null, undefined]],
    recordTyped: [
      $.record($.string),
      [{}, { foo: '' }, { bar: '', foo: '' }],
      [{ foo: 1 }, { bar: 1, foo: '' }, 1, null, undefined],
    ],
    string: [$.string, ['', new Object('')], [1, undefined]],
    symbol: [$.symbol, [Symbol()], [1, {}, null, undefined]],
    tuple: [$.tuple($.string, $.number), [['', 1]], [['', 1, true], [], [1, ''], [''], [undefined, 1]]],
    undefined: [$.undefined, [undefined], [null, 1, {}]],
    union: [$.union($.string, $.number), ['', 1], [true, {}, null, undefined]],
    unknown: [$.unknown, [1, '', {}, null, undefined], []],
  };

  Object.entries(basicCases).forEach(([title, [schema, pass, fail]]) => {
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

  test('optional', () => {
    expect($.string.test(undefined)).toBe(false);
    expect($.string.optional().test(undefined)).toBe(true);
    expect($.string.optional()).toBe($.string.optional());
  });

  test('object index', () => {
    const $object = $.object({ foo: $.string }, $.number);
    expect($object.test({ foo: '' })).toBe(true);
    expect($object.test({ bar: 1, foo: '' })).toBe(true);
    expect($object.test({ bar: '', foo: '' })).toBe(false);
  });

  const partialCases: [string, SchemaObject<any>][] = [
    ['object', $.object({ a: $.string }, $.string)],
    ['record', $.record($.string)],
  ];

  partialCases.forEach(([name, $object]) => {
    test(`${name} partial`, () => {
      expect($object.test({ a: '', b: '' })).toBe(true);
      expect($object.test({ a: undefined })).toBe(false);
      expect($object.test({ a: '', b: undefined })).toBe(false);
      expect($object.test({ a: undefined, b: undefined })).toBe(false);
      const $partialObject = $object.partial();
      expect($partialObject.test({ a: '', b: '' })).toBe(true);
      expect($partialObject.test({ a: undefined })).toBe(true);
      expect($partialObject.test({ a: '', b: undefined })).toBe(true);
      expect($partialObject.test({ a: undefined, b: undefined })).toBe(true);
      expect($partialObject.test({ a: undefined, b: undefined, c: '' })).toBe(true);
    });
  });

  test('error', () => {
    const $object = $.object({ 'foo bar 😄': $.array($.object({ baz: $.string })) });
    const value = { 'foo bar 😄': [{ baz: 1 }] };
    const onInvalid = jest.fn();

    expect($object.test(value, { onInvalid })).toBe(false);
    expect(onInvalid).toHaveBeenCalledTimes(1);
    expect(onInvalid).toHaveBeenLastCalledWith('Unexpected type at $["foo bar 😄"][0].baz');
    expect(() => $object.parse(value)).toThrow(
      expect.objectContaining({ message: 'Unexpected type at $["foo bar 😄"][0].baz' }),
    );
  });
});

/* eslint-disable import/namespace */
import * as $ from './schema.js';

describe('schema', () => {
  test('assert', () => {
    const a = jest.fn() as unknown as (v: unknown) => v is any;

    jest.mocked(a).mockReturnValue(false);
    expect(() => $.assert(a, 1, 'testing')).toThrow(new TypeError('testing'));
    expect(a).toHaveBeenLastCalledWith(1);

    jest.mocked(a).mockReturnValue(false);
    expect(() => $.assert(a, 2, () => new SyntaxError('testing'))).toThrow(new SyntaxError('testing'));
    expect(a).toHaveBeenLastCalledWith(2);

    jest.mocked(a).mockReturnValue(true);
    expect(() => $.assert(a, 3)).not.toThrow();
    expect(a).toHaveBeenLastCalledWith(3);
  });

  describe('match everything', () => {
    (['any', 'unknown'] as const).forEach((name) => {
      test(name, () => {
        [true, 1, 2n, 'string', [], {}, new Date(), Symbol(), null, undefined].forEach((value) => {
          expect($[name]()(value)).toBe(true);
        });
      });
    });
  });

  describe('match nullish and non-nullish', () => {
    const notNils = [true, 1, 2n, 'string', [], {}, new Date(), Symbol()];

    (
      [
        ['notDefined', 'defined', [undefined], [null, ...notNils]],
        ['nul', 'notNul', [null], [undefined, ...notNils]],
        ['nil', 'notNil', [null, undefined], notNils],
      ] as const
    ).forEach(([name, inverse, expected, notExpected]) => {
      test(name, () => {
        // Pass
        expected.forEach((value) => expect($[name]()(value)).toBe(true));
        notExpected.forEach((value) => expect($[inverse]()(value)).toBe(true));
        // Fail
        expected.forEach((value) => expect($[inverse]()(value)).toBe(false));
        notExpected.forEach((value) => expect($[name]()(value)).toBe(false));
      });
    });
  });

  describe('match primitive', () => {
    (
      [
        ['boolean', [true, false], [1, 2n, 'true', Symbol()]],
        ['number', [1, Number.NaN], [true, '1', 2n, Symbol()]],
        ['bigint', [1n], [true, 1, '2n', Symbol()]],
        ['string', ['string'], [true, 1, 2n, Symbol()]],
        ['symbol', [Symbol(), Symbol.iterator], [true, 1, 2n, '']],
      ] as const
    ).forEach(([name, expected, notExpected]) => {
      test(name, () => {
        // Pass
        expected.forEach((value) => expect($[name]()(value)).toBe(true));
        // Fail
        expected.forEach((value) => expect($[name]()(new Object(value))).toBe(false));
        notExpected.forEach((value) => expect($[name]()(value)).toBe(false));
        expect($[name]()(null)).toBe(false);
        expect($[name]()(undefined)).toBe(false);
        expect($[name]()({ key: 'value', toString: () => '', valueOf: () => 1 })).toBe(false);
        expect($[name]()(['value'])).toBe(false);
        expect($[name]()(new Date())).toBe(false);
      });
    });
  });

  test('match literal', () => {
    const primitives = [1, 2n, 'a', true, null, Symbol.iterator];

    for (let i = 0; i < primitives.length; ++i) {
      const pass = primitives.slice(i, i + 2);
      const fail = primitives.filter((primitive) => !pass.includes(primitive));
      const matcher = $.literal(...pass);
      pass.forEach((value) => expect(matcher(value)).toBe(true));
      fail.forEach((value) => expect(matcher(value)).toBe(false));
    }
  });

  test('match enum', () => {
    enum NoValue {
      a,
      b,
    }
    enum Value {
      a = 1,
      b = 'B',
    }

    const a = $.enumeration(NoValue);
    // Pass
    [NoValue.a, NoValue.b, 0, 1].forEach((value) => expect(a(value)).toBe(true));
    // Fail
    [Value.b, 'a', 'b'].forEach((value) => expect(a(value)).toBe(false));

    const b = $.enumeration(Value);
    // Pass
    [Value.a, Value.b, 1, 'B'].forEach((value) => expect(b(value)).toBe(true));
    // Fail
    [NoValue.a, 'a', 'b'].forEach((value) => expect(b(value)).toBe(false));
  });

  describe('match function', () => {
    test('instance', () => {
      // Pass
      expect($.instance(Date)(new Date())).toBe(true);
      expect($.instance(Object)(new Date())).toBe(true);
      expect($.instance(Date, Error)(new Date())).toBe(true);
      expect($.instance(Date, Error)(new TypeError('...'))).toBe(true);
      // Fail
      expect($.instance(Date)(Date)).toBe(false);
      expect($.instance(Date)(new RegExp('/./'))).toBe(false);
    });

    test('callable', () => {
      // Pass
      expect($.callable()(() => {})).toBe(true);
      expect($.callable()(function () {})).toBe(true);
      expect($.callable()(class A {})).toBe(true);
      expect($.callable()(new Function())).toBe(true);
      // Fail
      [null, undefined, {}, [], /./].forEach((value) => {
        expect($.callable()(value)).toBe(false);
      });
    });
  });

  test('lazy match', () => {
    // Pass
    expect($.lazy(() => $.string())('')).toBe(true);
    // Fail
    expect($.lazy(() => $.string())(1)).toBe(false);
  });

  describe('common extensions', () => {
    test('optional', () => {
      // Pass
      expect($.string().optional()('')).toBe(true);
      expect($.string().optional()(undefined)).toBe(true);
      // Fail
      expect($.string().optional()(null)).toBe(false);
      expect($.string().optional()(1)).toBe(false);
    });

    test('or', () => {
      const a = $.string().or($.number()).or($.boolean());
      // Pass
      expect(a('')).toBe(true);
      expect(a(1)).toBe(true);
      expect(a(false)).toBe(true);
      // Fail
      expect(a({})).toBe(false);
    });

    test('and', () => {
      const a = $.object({ foo: $.number() }).and($.object({ bar: $.string() }));
      // Pass
      expect(a({ foo: 1, bar: '' })).toBe(true);
      expect(a({ foo: 1, bar: '', baz: true })).toBe(true);
      // Fail
      expect(a({ foo: 1 })).toBe(false);
      expect(a({ bar: '' })).toBe(false);
    });
  });

  test('object', () => {
    const a = $.object({ a: $.string(), b: $.object({ a: $.number() }) });
    // Pass
    expect(a({ a: '', b: { a: 1 } })).toBe(true);
    expect(a({ a: '', b: { a: 1 }, c: true })).toBe(true);
    // Fail
    expect(a({ a: '', b: true })).toBe(false);

    const b = a.extend({ c: $.boolean(), b: $.object({ b: $.string() }) });
    // Pass
    expect(b({ a: '', b: { a: 1, b: '' }, c: true })).toBe(true);
    // Fail
    expect(b({ a: '', b: { a: 1, b: '' } })).toBe(false);
    expect(b({ a: '', b: { a: 1, b: '' }, c: 1 })).toBe(false);
    expect(b({ a: '', b: { a: 1 }, c: true })).toBe(false);

    const c = a.partial();
    // Pass
    expect(c({})).toBe(true);
    expect(c([])).toBe(true);
    expect(c({ a: '' })).toBe(true);
    expect(c({ b: { a: 1 } })).toBe(true);
    // Fail
    expect(c(null)).toBe(false);
    expect(c(undefined)).toBe(false);
    expect(c(() => {})).toBe(false);
    expect(c({ b: {} })).toBe(false);

    const d = c.required();
    // Pass
    expect(d({ a: '', b: { a: 1 } })).toBe(true);
    expect(d({ a: '', b: { a: 1 }, c: true })).toBe(true);
    // Fail
    expect(d({ a: '', b: true })).toBe(false);
  });

  test('tuple', () => {
    const a = $.tuple($.string(), $.object({ a: $.number() }));
    // Pass
    expect(a(['', { a: 1 }])).toBe(true);
    expect(a(['', { a: 1 }, true])).toBe(true);
    // Fail
    expect(a(['', true])).toBe(false);

    const b = a.partial();
    // Pass
    expect(b([])).toBe(true);
    expect(b([''])).toBe(true);
    expect(b([undefined, { a: 1 }])).toBe(true);
    // Fail
    expect(b(null)).toBe(false);
    expect(b(undefined)).toBe(false);
    expect(b(() => {})).toBe(false);
    expect(b({ b: {} })).toBe(false);

    const c = b.required();
    // Pass
    expect(c(['', { a: 1 }])).toBe(true);
    expect(c(['', { a: 1 }, true])).toBe(true);
    // Fail
    expect(c(['', true])).toBe(false);
  });

  describe('array', () => {
    test('untyped', () => {
      const a = $.array();
      // Pass
      expect(a([1, null, {}])).toBe(true);
      expect(a.nonEmpty()([1])).toBe(true);
      // Fail
      expect(a({ 0: '', length: 1 })).toBe(false);
      expect(a.nonEmpty()([])).toBe(false);
    });

    test('typed', () => {
      const a = $.array($.string().or($.number()));
      // Pass
      expect(a([])).toBe(true);
      expect(a(['', 1])).toBe(true);
      expect(a([1, ''])).toBe(true);
      expect(a([1])).toBe(true);
      expect(a([''])).toBe(true);
      expect(a.partial()([undefined])).toBe(true);
      expect(a.nonEmpty()([1])).toBe(true);
      // Fail
      expect(a([1n])).toBe(false);
      expect(a([1, '', true])).toBe(false);
      expect(a({ 0: '', 1: 2, length: 2 })).toBe(false);
      expect(a([undefined])).toBe(false);
      expect(a.partial().required()([undefined])).toBe(false);
      expect(a.nonEmpty()([])).toBe(false);
    });
  });

  describe('record', () => {
    test('untyped', () => {
      const a = $.record();
      // Pass
      expect(a({ a: 1, b: null, c: {} })).toBe(true);
      expect(a([])).toBe(true);
      expect(a(new Object(''))).toBe(true);
      // Fail
      expect(a(1)).toBe(false);
      expect(a('')).toBe(false);
      expect(a(null)).toBe(false);
    });

    test('typed', () => {
      const a = $.record($.string().or($.number()));
      // Pass
      expect(a({})).toBe(true);
      expect(a({ a: '', b: 1 })).toBe(true);
      expect(a({ a: 1, b: '' })).toBe(true);
      expect(a({ a: 1 })).toBe(true);
      expect(a({ b: '' })).toBe(true);
      expect(a.partial()([undefined])).toBe(true);
      // Fail
      expect(a({ a: 1n })).toBe(false);
      expect(a({ a: 1, b: '', c: true })).toBe(false);
      expect(a([undefined])).toBe(false);
      expect(a.partial().required()([undefined])).toBe(false);
    });
  });

  describe('recursive', () => {
    const isNode = $.object({ name: $.string() });

    type Node = $.SchemaType<typeof isNode>;
    type Tree = Node & { children: Tree[] };

    const isTree: $.ObjectSchema<Tree> = isNode.extend({
      children: $.array($.lazy(() => isTree)),
    });

    test('tree', () => {
      expect(
        isTree({
          name: 'root',
          children: [
            {
              name: 'child',
              children: [],
            },
          ],
        }),
      ).toBe(true);

      expect(
        isTree({
          name: 'root',
          children: [
            {
              name: 'child',
              children: 'foo',
            },
          ],
        }),
      ).toBe(false);
    });

    test('depth limit (cyclic data)', () => {
      const tree: Tree = {
        name: 'root',
        children: [],
      };
      tree.children.push(tree);

      expect(isTree(tree)).toBe(true);
    });
  });
});

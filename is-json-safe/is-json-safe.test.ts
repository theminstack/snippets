import { isJsonSafe } from './is-json-safe.js';

describe('is-json-safe', () => {
  test('yes', () => {
    expect(
      isJsonSafe({
        array: [],
        boolean: true,
        null: null,
        number: 1,
        string: '',
      }),
    ).toBe(true);
  });

  test('no: instance', () => {
    class Foo {}
    expect(isJsonSafe(new Foo())).toBe(false);
    expect(isJsonSafe(new Date())).toBe(false);
  });

  test('no: symbol', () => {
    const s = Symbol();
    expect(isJsonSafe(s)).toBe(false);
    expect(isJsonSafe({ [s]: '' })).toBe(false);
  });

  test('no: bigint, undefined, or function', () => {
    expect(isJsonSafe(1n)).toBe(false);
    expect(isJsonSafe(undefined)).toBe(false);
    expect(isJsonSafe(() => {})).toBe(false);
  });

  test('no: array with statics', () => {
    expect(isJsonSafe(Object.assign([], { foo: true }))).toBe(false);
    expect(isJsonSafe(Object.defineProperty([], Symbol(), { value: true }))).toBe(false);
  });
});

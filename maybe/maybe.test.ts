import { maybe } from './maybe.js';

describe('maybe', () => {
  test('empty', () => {
    const test = maybe.empty();
    expect(test.ok).toBe(false);
    expect(test.empty).toBe(true);
    expect(test.error).toBe(null);
    expect(() => test.value).toThrow();
    expect(maybe(null)).toBe(test);
    expect(maybe(undefined)).toBe(test);
    expect(maybe.empty()).toBe(test);
    expect(test.catch(() => 1)).toBe(test);
    expect(test.else(() => 1).value).toBe(1);
    expect(test.map(() => 1)).toBe(test);
    expect(test.toArray()).toEqual([]);

    const callback = vi.fn();
    expect(test.filter(callback)).toBe(test);
    expect(callback).not.toBeCalled();
  });

  test('error', () => {
    const error = new Error('error');
    let test = maybe.error(error);
    expect(test.ok).toBe(false);
    expect(test.empty).toBe(true);
    expect(test.error).toBe(error);
    expect(() => test.value).toThrow(error);
    expect(maybe.error(error) !== test).toBeTruthy();
    expect(test.catch(() => 1).value).toBe(1);
    expect(test.toArray()).toEqual([]);

    const callback = vi.fn();
    expect(test.else(callback)).toBe(test);
    expect(test.filter(callback)).toBe(test);
    expect(test.map(callback)).toBe(test);
    expect(callback).not.toBeCalled();

    test = maybe(() => {
      throw error;
    });
    expect(test.ok).toBe(false);
    expect(test.empty).toBe(true);
    expect(test.error).toBe(error);
    expect(() => test.value).toThrow(error);

    test = maybe.error();
    expect(test.ok).toBe(false);
    expect(test.empty).toBe(true);
    expect(test.error).toBeInstanceOf(Error);
    expect(test.error).toEqual(
      expect.objectContaining({
        message: 'unknown',
      }),
    );
    expect(() => test.value).toThrow(test.error as any);
  });

  test('ok', () => {
    const test = maybe(1);
    expect(test.ok).toBe(true);
    expect(test.empty).toBe(false);
    expect(test.error).toBe(null);
    expect(test.value).toBe(1);
    expect(maybe(1)).not.toBe(test);
    expect(test.filter(() => true)).toBe(test);
    expect(test.filter(() => false)).toBe(maybe.empty());
    expect(test.map((value) => value + 2).value).toBe(3);
    expect(test.toArray()).toEqual([1]);

    const callback = vi.fn();
    expect(test.catch(callback)).toBe(test);
    expect(test.else(callback)).toBe(test);
    expect(callback).not.toBeCalled();
  });
});

import { FetchError } from './fetch-error.js';

describe('FetchError', () => {
  test('minimum details', () => {
    const error = new FetchError({
      url: 'https://example.com',
      status: 500,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(`Failed fetching https://example.com (500, unknown_error)`);
    expect(error).toMatchObject({
      name: 'FetchError',
      method: undefined,
      url: 'https://example.com',
      status: 500,
      headers: expect.objectContaining({}),
      id: undefined,
      code: 'unknown_error',
      reason: undefined,
    });
  });

  test('nulled details', () => {
    const error = new FetchError({
      method: null,
      url: 'https://example.com',
      status: 500,
      headers: null,
      id: null,
      code: null,
      reason: null,
    });

    expect(error).toMatchObject({
      name: 'FetchError',
      method: undefined,
      url: 'https://example.com',
      status: 500,
      headers: expect.objectContaining({}),
      id: undefined,
      code: 'unknown_error',
      reason: null,
    });
  });

  test('all details', () => {
    const reason = new Error('reason');
    const error = new FetchError({
      method: 'POST',
      url: 'https://example.com',
      status: 404,
      headers: {
        foo: 'bar',
        ...['allow', 'content-range', 'proxy-authenticate', 'retry-after', 'upgrade', 'www-authenticate'].reduce(
          (result, key) => ({ ...result, [key]: key.toUpperCase() }),
          {},
        ),
      },
      id: 'identifier',
      code: 'known_error',
      reason,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(`Failed fetching POST https://example.com (404, known_error, identifier)`);
    expect(error).toMatchObject({
      name: 'FetchError',
      method: 'POST',
      url: 'https://example.com',
      status: 404,
      headers: expect.objectContaining({
        ...['allow', 'content-range', 'proxy-authenticate', 'retry-after', 'upgrade', 'www-authenticate'].reduce(
          (result, key) => ({ ...result, [key]: key.toUpperCase() }),
          {},
        ),
      }),
      id: 'identifier',
      code: 'known_error',
      reason,
    });
  });

  test('headers is a Headers instance', () => {
    const error = new FetchError({
      url: 'https://example.com',
      status: 500,
      headers: new Headers({
        foo: 'bar',
        ...['allow', 'content-range', 'proxy-authenticate', 'retry-after', 'upgrade', 'www-authenticate'].reduce(
          (result, key) => ({ ...result, [key]: key.toUpperCase() }),
          {},
        ),
      }),
    });

    expect(error.headers).toEqual({
      ...['allow', 'content-range', 'proxy-authenticate', 'retry-after', 'upgrade', 'www-authenticate'].reduce(
        (result, key) => ({ ...result, [key]: key.toUpperCase() }),
        {},
      ),
    });
  });
});

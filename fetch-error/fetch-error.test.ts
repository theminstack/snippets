import { STATUS_CODES } from 'node:http';

import { type ResponseLike, assertFetchResponseOk, FetchResponseError } from './fetch-error.js';

describe('FetchResponseError', () => {
  Object.keys(STATUS_CODES)
    .map((key) => Number.parseInt(key, 10))
    .filter((status) => !Number.isNaN(status))
    .forEach((status) => {
      const expected = [404, 429, 500, 502, 503, 504].includes(status);

      it(`should set isTemporary to ${expected} for status ${status}`, () => {
        expect(new FetchResponseError(status, '').isTemporary).toBe(expected);
      });

      it('should default headers to an empty object', () => {
        expect(new FetchResponseError(status, '').headers).toBeInstanceOf(Object);
      });

      it('should set properties from constructor args', () => {
        expect(
          new FetchResponseError(500, 'https://test', {
            headers: {
              allow: 'ALLOW',
              contentRange: 'CONTENT_RANGE',
              proxyAuthenticate: 'PROXY_AUTHENTICATE',
              retryAfter: 1234,
              upgrade: 'UPGRADE',
              wwwAuthenticate: 'WWW_AUTHENTICATE',
            },
            json: 'JSON',
          }),
        ).toMatchObject({
          headers: {
            allow: 'ALLOW',
            contentRange: 'CONTENT_RANGE',
            proxyAuthenticate: 'PROXY_AUTHENTICATE',
            retryAfter: 1234,
            upgrade: 'UPGRADE',
            wwwAuthenticate: 'WWW_AUTHENTICATE',
          },
          isTemporary: true,
          json: 'JSON',
          message: 'HTTP_STATUS_500',
          name: 'FetchResponseError',
          status: 500,
          url: 'https://test',
        });
      });
    });
});

describe('assertFetchResponseOk', () => {
  let res: ResponseLike;

  beforeEach(() => {
    res = {
      headers: {
        get: jest.fn().mockImplementation((name: string): string | null => {
          return name.toLocaleLowerCase() === 'retry-after' ? '1234' : name.toUpperCase();
        }),
      },
      json: jest.fn().mockResolvedValue({ error: 'CODE' }),
      ok: false,
      status: 500,
      url: 'https://test',
    };
  });

  it('should not assert if response.ok === true', async () => {
    await expect(assertFetchResponseOk({ ...res, ok: true })).resolves.toBe(undefined);
  });

  it('should assert if response.ok !== true', async () => {
    const error = (await assertFetchResponseOk(res).catch((reason) => reason)) as FetchResponseError;
    expect(error).toBeInstanceOf(FetchResponseError);
    expect(error).toMatchObject({
      headers: {
        allow: 'ALLOW',
        contentRange: 'CONTENT-RANGE',
        proxyAuthenticate: 'PROXY-AUTHENTICATE',
        retryAfter: 1234,
        upgrade: 'UPGRADE',
        wwwAuthenticate: 'WWW-AUTHENTICATE',
      },
      isTemporary: true,
      json: { error: 'CODE' },
      message: 'HTTP_STATUS_500',
      name: 'FetchResponseError',
      status: 500,
      url: 'https://test',
    });
  });

  it('should not fail if json parsing throws', async () => {
    jest.mocked(res.json).mockRejectedValue(new TypeError('Invalid JSON'));
    const error = (await assertFetchResponseOk(res).catch((reason) => reason)) as FetchResponseError;
    expect(error).toBeInstanceOf(FetchResponseError);
    expect(error.json).toBeUndefined();
  });

  it('should set undefined for all missing headers', async () => {
    jest.mocked(res.headers.get).mockReturnValue(null);
    const error = (await assertFetchResponseOk(res).catch((reason) => reason)) as FetchResponseError;
    const headers = Object.keys(error.headers);
    expect(headers.length).toEqual(6);
    headers.forEach((header) => {
      expect(error.headers[header as keyof typeof error.headers]).toBeUndefined();
    });
  });
});

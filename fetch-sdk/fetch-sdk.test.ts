import { FetchError } from '../fetch-error/fetch-error.js';
import { createFetchSdk } from './fetch-sdk.js';

describe('createFetchSdk', () => {
  const res = {
    get ok() {
      return res.status >= 200 && res.status <= 299;
    },
    status: 200,
    headers: new Headers(),
  } as { -readonly [P in keyof Response]: Response[P] };

  beforeEach(() => {
    res.status = 200;
    (global as any).fetch = vi.fn().mockResolvedValue(res);
    (global as any).Request = class {
      constructor(url: string, init: Record<string, string>) {
        Object.assign(this, { url: String(url), ...init, headers: new Headers(init.headers as any) });
      }
    };
    res.text = vi.fn().mockResolvedValue('');
    res.json = vi.fn().mockResolvedValue({});
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  describe('defines', () => {
    test('methods for each definition key', () => {
      const Sdk = createFetchSdk({
        foo: () => ({ url: 'https://example.com' }),
        bar: { url: 'https://example.com' },
      });
      const sdk = new Sdk();

      expect(sdk).toEqual({
        foo: expect.any(Function),
        bar: expect.any(Function),
      });
    });

    test('constructor with arguments', () => {
      const definitions = vi.fn().mockReturnValue({});
      const Sdk = createFetchSdk(definitions);
      new Sdk('foo', 123, true);

      expect(definitions).toHaveBeenLastCalledWith('foo', 123, true);
    });
  });

  describe('calls fetch', () => {
    test('with defaults', async () => {
      const Sdk = createFetchSdk({
        foo: () => ({ url: 'https://example.com' }),
        bar: { url: 'https://example.com' },
      });
      const sdk = new Sdk();

      await sdk.foo();
      expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://example.com',
          body: undefined,
        }),
      );

      await sdk.bar();
      expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://example.com',
          body: undefined,
        }),
      );
    });

    test('with explicit request details', async () => {
      const formEncoded = new URLSearchParams({ a: 'b' });
      const Sdk = createFetchSdk({
        foo: async (query: Record<string, string>) => ({
          method: 'POST',
          url: new URL('https://example.com?foo=bar'),
          query,
          headers: { 'x-foo': 'foo' },
          body: 'foo',
        }),
        bar: {
          url: 'https://example.com?foo=bar',
          query: new URLSearchParams({ foo: 'foo' }),
          body: formEncoded,
        },
        baz: {
          url: 'https://example.com',
          body: { a: 'b' },
        },
      });
      const sdk = new Sdk();

      await sdk.foo({ foo: 'foo' });
      expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://example.com/?foo=bar&foo=foo',
          body: 'foo',
        }),
      );
      const args = vi.mocked(fetch).mock.lastCall!;
      const request = args[0] as unknown as Request;
      expect(request.headers.get('x-foo')).toBe('foo');

      await sdk.bar();
      expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: 'https://example.com?foo=bar&foo=foo',
          body: formEncoded,
        }),
      );

      await sdk.baz();
      expect(fetch).toHaveBeenLastCalledWith(
        expect.objectContaining({
          body: JSON.stringify({ a: 'b' }),
        }),
      );
    });
  });

  describe('returns', () => {
    test('raw response with no parser', async () => {
      const Sdk = createFetchSdk({ foo: { url: 'https://example.com' } });
      const sdk = new Sdk();
      await expect(sdk.foo()).resolves.toBe(res);
    });

    test('parsed response', async () => {
      const Sdk = createFetchSdk({ foo: { url: 'https://example.com', parse: async () => 'parsed' } });
      const sdk = new Sdk();
      await expect(sdk.foo()).resolves.toBe('parsed');
    });
  });

  describe('throws error', () => {
    test('when fetch throws', async () => {
      const Sdk = createFetchSdk({ foo: { url: 'https://example.com' } });
      const sdk = new Sdk();
      const reason = new Error('fetch');
      vi.mocked(fetch).mockRejectedValue(reason);
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'network_error',
        reason,
      });
    });

    test('when accept returns false', async () => {
      const Sdk = createFetchSdk({ foo: { url: 'https://example.com', accept: () => false } });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'unacceptable',
      });
    });

    test('when accept throws', async () => {
      const reason = new Error('accept');
      const Sdk = createFetchSdk({
        foo: {
          url: 'https://example.com',
          accept: () => {
            throw reason;
          },
        },
      });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'unacceptable',
        reason,
      });
    });

    test('when status code is non-2xx', async () => {
      res.status = 404;
      const Sdk = createFetchSdk({ foo: { url: 'https://example.com' } });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'unacceptable',
      });
    });

    test('with code returned by getErrorCode', async () => {
      const Sdk = createFetchSdk(
        {
          foo: { url: 'https://example.com', accept: () => false, getErrorCode: async () => 'foo' },
          bar: { url: 'https://example.com', accept: () => false },
          baz: { url: 'https://example.com', accept: () => false, getErrorCode: async () => 1 },
        },
        {
          getErrorCode: async () => 'bar',
        },
      );
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'foo',
      });
      await expect(sdk.bar()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'bar',
      });
      await expect(sdk.baz()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 1,
      });
    });

    test('with default code when getErrorCode throws', async () => {
      const Sdk = createFetchSdk({
        foo: {
          url: 'https://example.com',
          accept: () => false,
          getErrorCode: () => Promise.reject(new Error('getErrorCode')),
        },
      });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'unacceptable',
      });
    });

    test('when parse fails', async () => {
      const reason = new Error('parse');
      const Sdk = createFetchSdk({
        foo: {
          url: 'https://example.com',
          parse: () => Promise.reject(reason),
        },
      });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        message: expect.stringMatching(/^failed fetching /u),
        code: 'parse_error',
        reason,
      });
    });

    test('with id returned by getRequestId', async () => {
      const Sdk = createFetchSdk(
        {
          foo: { url: 'https://example.com', accept: () => false, getRequestId: () => 'a' },
          bar: { url: 'https://example.com', accept: () => false },
        },
        {
          getRequestId: () => 'b',
        },
      );
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toMatchObject({
        id: 'a',
      });
      await expect(sdk.bar()).rejects.toMatchObject({
        id: 'b',
      });
    });

    test('without id when getRequestId throws', async () => {
      const Sdk = createFetchSdk({
        foo: {
          url: 'https://example.com',
          accept: () => false,
          getRequestId: () => {
            throw new Error('getRequestId');
          },
        },
      });
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.not.toMatchObject({
        id: expect.anything(),
      });
    });

    test('using the custom error class', async () => {
      class A extends FetchError {}
      class B extends FetchError {}
      const Sdk = createFetchSdk(
        {
          foo: { url: 'https://example.com', accept: () => false, CustomError: A },
          bar: { url: 'https://example.com', accept: () => false },
        },
        {
          CustomError: B,
        },
      );
      const sdk = new Sdk();
      await expect(sdk.foo()).rejects.toBeInstanceOf(A);
      await expect(sdk.bar()).rejects.toBeInstanceOf(B);
    });
  });
});

interface FetchSdkErrorDetails {
  /**
   * HTTP request method.
   */
  readonly method: string;
  /**
   * HTTP request URL.
   */
  readonly url: string;
  /**
   * HTTP response status.
   */
  readonly status: number;
  /**
   * HTTP response headers.
   */
  readonly headers: Headers;
  /**
   * Request ID which is attached to log messages related to the request.
   */
  readonly id?: string;
  /**
   * Well known error code constant.
   */
  readonly code: number | string;
  /**
   * Thrown error which caused the fetch failure (if any).
   */
  readonly reason?: unknown;
}

interface FetchSdkDefaults {
  /**
   * Derive the request ID from the response. If not given, the
   * `x-request-id` is used if present.
   */
  readonly getRequestId?: (res: Response) => string | null | undefined;
  /**
   * Derive a well known error string constant from the response. If not
   * given, the response body is parsed and the `error` string property of
   * the decoded object is used. If the error response body does not
   * contain an `error` string property, then `unknown_error` is used.
   * Errors thrown by this function are ignored.
   */
  readonly getErrorCode?: (res: Response) => Promise<number | string | null | undefined>;
  /**
   * Custom `Error` constructor for thrown failed fetch errors.
   */
  readonly CustomError?: new (details: FetchSdkErrorDetails) => Error;
}

interface FetchSdkRequest<TResult> extends FetchSdkDefaults {
  /**
   * HTTP request method (default: GET).
   */
  readonly method?: string;
  /**
   * HTTP request URL (fully qualified).
   */
  readonly url: URL | string;
  /**
   * HTTP query (search) parameters to be added to the request URL.
   */
  readonly query?: Readonly<Record<string, string>> | URLSearchParams;
  /**
   * HTTP request headers.
   */
  readonly headers?: Headers | Readonly<Record<string, string>>;
  /**
   * HTTP request body. Will be `JSON.stringified` if the value is not a
   * `string` or `URLSearchParams` instance.
   */
  readonly body?: URLSearchParams | string | {} | null;
  /**
   * Callback which should return false if the response is not acceptable
   * (ie. an error). If not given, the `res.ok` value will be returned.
   */
  readonly accept?: (res: Response, req: Request) => boolean;
  /**
   * Callback which should parse the response body into a validated
   * return type. If not given, the `Response` object will be returned.
   */
  readonly parse?: (res: Response, req: Request, id: string | undefined) => Promise<TResult>;
}

type FetchSdkRequestFactory<TResult, TArgs extends unknown[] = []> = (
  ...args: TArgs
) => FetchSdkRequest<TResult> | Promise<FetchSdkRequest<TResult>>;

type FetchSdkRequests = Record<string, FetchSdkRequest<any> | FetchSdkRequestFactory<any, any>>;

type FetchSdkFunction<TResult, TArgs extends any[]> = (...args: TArgs) => Promise<TResult>;

type FetchSdkInstance<TDefinitions extends FetchSdkRequests> = {
  [P in keyof TDefinitions]: TDefinitions[P] extends string
    ? FetchSdkFunction<Response, []>
    : TDefinitions[P] extends FetchSdkRequestFactory<any, infer TArgs>
    ? ReturnType<TDefinitions[P]> extends { parse(...args: any[]): Promise<infer TResult> }
      ? FetchSdkFunction<TResult, TArgs>
      : FetchSdkFunction<Response, TArgs>
    : TDefinitions[P] extends { parse(...args: any[]): Promise<infer TResult> }
    ? FetchSdkFunction<TResult, []>
    : FetchSdkFunction<Response, []>;
};

type FetchSdkConstructor<TDefinitions extends FetchSdkRequests, TArgs extends any[]> = new (
  ...args: TArgs
) => FetchSdkInstance<TDefinitions>;

const getRequestIdDefault = (res: Response): string | null => {
  return res.headers.get('x-request-id');
};

const getErrorCodeDefault = async (res: Response): Promise<string | undefined> => {
  return (await res.json())?.error;
};

class FetchSdkError extends Error {
  name = 'FetchSdkError';
  id: string | undefined;
  code: number | string;
  reason: unknown;

  constructor({ method, url, status, id, code = 'unknown_error', reason }: FetchSdkErrorDetails) {
    super(`failed fetching ${method} ${url} (${status}, ${code}${id ? `, ${id}` : ''})`);
    this.id = id;
    this.code = code;
    this.reason = reason;
  }
}

/**
 * Helper for creating fetch SDK classes.
 *
 * ```ts
 * // Define an SDK.
 * const MySdk = createFetchSdk(
 *   // SDK definition factory arguments become class constructor arguments.
 *   (baseUrl: string) => {
 *     // Map of SDK request definitions.
 *     return {
 *       getRecords: (count: number) => {
 *         return {
 *           url: `${baseUrl}/collection/`,
 *           method: 'GET',
 *           query: { count },
 *           headers: { accept: 'application/json' },
 *           body: null,
 *           accept: (res): boolean => res.ok || res.status === 404,
 *           parse: async (res): string[] => res.status === 404 ? [] : await res.json(),
 *           // The following options would override the SDK defaults.
 *           //getRequestId: (res) => res.headers.get('x-request-id'),
 *           //getErrorCode: async (res) => (await res.json())?.error,
 *           //CustomError: FetchError,
 *         }
 *       }
 *     };
 *   },
 *   // SDK defaults.
 *   {
 *     getRequestId: (res) => res.headers.get('x-request-id'),
 *     getErrorCode: async (res) => (await res.json())?.error,
 *     CustomError: FetchError,
 *   }
 * );
 *
 * // Create an SDK instance.
 * const mySdk = new MySdk('https://example.com');
 *
 * // Invoke SDK methods.
 * const records = await mySdk.getRecords(10);
 * ```
 */
const createFetchSdk: {
  <TDefinitions extends FetchSdkRequests>(definitions: TDefinitions, defaults?: FetchSdkDefaults): FetchSdkConstructor<
    TDefinitions,
    []
  >;
  <TDefinitions extends FetchSdkRequests, TArgs extends any[] = []>(
    definitions: (...args: TArgs) => TDefinitions,
    defaults?: FetchSdkDefaults,
  ): FetchSdkConstructor<TDefinitions, TArgs>;
} = <TDefinitions extends FetchSdkRequests, TArgs extends any[] = []>(
  definitions: TDefinitions | ((...args: TArgs) => TDefinitions),
  defaults: FetchSdkDefaults = {},
): FetchSdkConstructor<TDefinitions, TArgs> => {
  class FetchSdk {
    constructor(...factoryArgs: TArgs) {
      Object.entries(typeof definitions === 'function' ? definitions(...factoryArgs) : definitions).forEach(
        ([name, init]) => {
          (this as any)[name] = async (...requestArgs: any[]) => {
            const {
              method = 'GET',
              url,
              query: rawQuery = {},
              headers: rawHeaders = {},
              body = undefined,
              accept = (res) => res.ok,
              parse = async (res) => res,
              getRequestId = defaults.getRequestId ?? getRequestIdDefault,
              getErrorCode = defaults.getErrorCode ?? getErrorCodeDefault,
              CustomError = defaults.CustomError ?? FetchSdkError,
            } = typeof init === 'function' ? await init(...requestArgs) : init;
            const [, urlString = '', urlQueryString] = String(url).match(/^([^?]*)([^#]*)/u) as string[];
            const query = new URLSearchParams(urlQueryString);
            const headers = new Headers(rawHeaders);

            for (const [key, value] of rawQuery instanceof URLSearchParams
              ? rawQuery.entries()
              : Object.entries(rawQuery)) {
              query.append(key, value);
            }

            const queryString = query.toString();
            const req = new Request(`${urlString}${queryString ? `?${queryString}` : ''}`, {
              method,
              body:
                body == null || typeof body === 'string' || body instanceof URLSearchParams
                  ? body
                  : JSON.stringify(body),
              headers,
            });

            let res: Response;
            let id: string | undefined = undefined;

            try {
              res = await fetch(req);
            } catch (error) {
              throw new CustomError({
                method: req.method,
                url: req.url,
                status: 0,
                headers: headers,
                id: '',
                code: 'network_error',
                reason: error,
              });
            }

            try {
              id = getRequestId(res) ?? undefined;
            } catch {
              // Ignore request ID parsing errors.
            }

            let accepted = false;
            let acceptError: unknown = undefined;

            try {
              accepted = accept(res, req);
            } catch (error) {
              acceptError = error;
            }

            if (!accepted) {
              let code: number | string | null | undefined;

              try {
                code = await getErrorCode(res);
              } catch {
                // Ignore error code parsing errors.
              }

              throw new CustomError({
                method: req.method,
                url: req.url,
                status: res.status,
                headers: res.headers,
                id,
                code: code != null && (typeof code === 'string' || typeof code === 'number') ? code : 'unacceptable',
                reason: acceptError,
              });
            }

            try {
              return await parse(res, req, id);
            } catch (error) {
              throw new CustomError({
                method: req.method,
                url: req.url,
                status: res.status,
                headers: headers,
                id,
                code: 'parse_error',
                reason: error,
              });
            }
          };
        },
      );
    }
  }

  return FetchSdk as FetchSdkConstructor<TDefinitions, TArgs>;
};

export { type FetchSdkErrorDetails, createFetchSdk };

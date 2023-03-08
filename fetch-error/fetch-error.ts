interface HeadersLike {
  get(key: string): string | null;
}

interface FetchErrorOptions {
  readonly method?: string | null;
  readonly url: string;
  readonly status: number;
  readonly headers?: Record<string, string> | { get(key: string): string | null } | null;
  readonly id?: string | null;
  readonly code?: number | string | null;
  readonly reason?: unknown;
}

const RESPONSE_HEADER_KEYS = [
  'allow',
  'content-range',
  'proxy-authenticate',
  'retry-after',
  'upgrade',
  'www-authenticate',
] as const;

const isHeadersLike = (headers: HeadersLike | Record<string, string> | null | undefined): headers is HeadersLike => {
  return headers != null && 'get' in headers && typeof headers.get === 'function';
};

class FetchError extends Error {
  public name = 'FetchError';
  /**
   * Request method (if available).
   */
  public method: string | undefined;
  /**
   * Response or request URL.
   */
  public url: string;
  /**
   * HTTP response status code.
   */
  public status: number;
  /**
   * Response headers (limited safe set).
   */
  public headers: Readonly<Partial<Record<(typeof RESPONSE_HEADER_KEYS)[number], string>>>;
  /**
   * Request ID which is attached to log messages related to the request.
   */
  public id: string | undefined;
  /**
   * Well known error code constant.
   */
  public code: number | string;
  /**
   * Error that triggered this error (if any).
   */
  public reason: unknown;

  constructor({ method, url, status, headers, id, code, reason }: FetchErrorOptions) {
    method = method?.toUpperCase() ?? undefined;
    headers = headers ?? undefined;
    id = id ?? undefined;
    code = code ?? 'unknown_error';

    super(`Failed fetching ${method ? `${method} ` : ''}${url} (${status}, ${code}${id ? `, ${id}` : ''})`);

    this.method = method;
    this.url = url;
    this.status = status;
    this.code = code;
    this.id = id;
    this.reason = reason;

    const allHeaders = isHeadersLike(headers) ? headers : new Headers(headers);
    const safeHeaders: Partial<Record<(typeof RESPONSE_HEADER_KEYS)[number], string>> = {};

    for (const key of RESPONSE_HEADER_KEYS) {
      const value = allHeaders.get(key);

      if (value) {
        safeHeaders[key] = value;
      }
    }

    this.headers = safeHeaders;
  }
}

export { type FetchErrorOptions, FetchError };

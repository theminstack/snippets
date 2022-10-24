type FetchResponseErrorHeaders = {
  readonly allow?: string;
  readonly contentRange?: string;
  readonly proxyAuthenticate?: string;
  readonly retryAfter?: number;
  readonly upgrade?: string;
  readonly wwwAuthenticate?: string;
};

type FetchResponseErrorDetails = {
  readonly headers?: FetchResponseErrorHeaders;
  readonly json?: unknown;
};

type ResponseLike = {
  readonly headers: { readonly get: (name: string) => string | null };
  readonly json: () => Promise<unknown>;
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
};

const TEMPORARY_ERROR_STATUS_CODES: readonly number[] = [404, 429, 500, 502, 503, 504];

class FetchResponseError extends Error {
  public name = 'FetchResponseError';
  public readonly status: number;
  public readonly url: string;
  public readonly isTemporary: boolean;
  public readonly headers: FetchResponseErrorHeaders;
  public readonly json: unknown;

  constructor(status: number, url: string, details?: FetchResponseErrorDetails) {
    super(`HTTP_STATUS_${status}`);
    this.status = status;
    this.url = url;
    this.isTemporary = TEMPORARY_ERROR_STATUS_CODES.includes(status);
    this.headers = details?.headers ?? {};
    this.json = details?.json;
  }
}

const assertFetchResponseOk = async (res: ResponseLike): Promise<void> => {
  if (!res.ok) {
    let json: unknown;

    try {
      json = await res.json();
    } catch {
      // Ignore failures to read the response body as JSON.
    }

    throw new FetchResponseError(res.status, res.url, {
      headers: {
        allow: res.headers.get('allow') ?? undefined,
        contentRange: res.headers.get('content-range') ?? undefined,
        proxyAuthenticate: res.headers.get('proxy-authenticate') ?? undefined,
        retryAfter: Math.max(0, Number.parseInt(res.headers.get('retry-after') ?? '', 10) >>> 0) || undefined,
        upgrade: res.headers.get('upgrade') ?? undefined,
        wwwAuthenticate: res.headers.get('www-authenticate') ?? undefined,
      },
      json,
    });
  }
};

export type { ResponseLike };
export { assertFetchResponseOk, FetchResponseError };

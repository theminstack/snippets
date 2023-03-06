# Fetch Error

Error type for failed fetch requests.

While not throwing on HTTP errors is a great default choice for the Fetch API, throwing is still very useful in some cases (eg. using query-hooks or retrying). When a fetch error is thrown, it should contain enough information to take an action like: retrying, displaying a message, redirecting, etc.

This error type captures the following information from fetch responses:

- `method` - HTTP request method.
- `url` - HTTP request URL.
- `status` - HTTP response status.
- `headers` - Limited safe set of HTTP headers (lowercase) commonly included with request failures.
  - `www-authenticate` - HTTP authentication methods ("challenges") that might be used to gain access to a specific resource. Usually returned by 401 responses.
  - `allow` - Valid methods for a specified resource. Usually returned by 405 responses.
  - `proxy-authenticate` - The authentication method that should be used to gain access to a resource behind a proxy server. Usually returned by 407 responses.
  - `content-range` - Indicates where in a full body message a partial message belongs. Usually returned by 416 responses.
  - `upgrade` - Indicates an upgraded protocol that can be used with the resource. Usually returned by 426 responses.
  - `retry-after` - A delay (in seconds) before retrying is suggested by the server. Usually used with 429 or 503 responses.
- `id` - Request ID which is attached to log messages related to the request.
- `code` - Well known error code constant.

The error `message` will be `Failed fetching ${method} ${url} (${status}, ${code}, ${id})`.

```tsx
throw new FetchResponseError({
  method: req.method,
  url: req.url,
  status: res.status,
  headers: res.headers,
  id: res.headers.get('x-request-id'),
  code: await getErrorCode(res),
  reason: err,
});
```

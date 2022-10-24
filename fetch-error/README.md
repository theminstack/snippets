# Fetch Error

Error type and utilities for failed fetch requests.

While not throwing on HTTP errors is a great default choice for the Fetch API, throwing is still very useful in some cases (eg. using query-hooks or retrying). When a fetch error is thrown, it should contain enough information to take an action like: retrying, displaying a message, redirecting, etc.

This error type captures the following information from fetch responses:

- `status` - The HTTP status code of the response
- `url` - The URL (after redirects) that returned the response
- `json` - The JSON body of the response (if available)
- `isTemporary` - A boolean indicating that the _unmodified_ request may
  succeed if retried later.
  - `404`: Not found (eg. due to _eventual_ consistency)
  - `429`: Rate limited
  - `500`: Server error (non-specific)
  - `502`: Invalid response received from upstream (proxy)
  - `503`: Service unavailable (eg. overloaded, starting up)
  - `504`: Timed out waiting for upstream response (proxy)
- `headers` - A limited set of headers related to HTTP failures.
  - `wwwAuthenticate` - HTTP authentication methods ("challenges") that might be used to gain access to a specific resource. Usually returned by 401 responses.
  - `allow` - Valid methods for a specified resource. Usually returned by 405 responses.
  - `proxyAuthenticate` - The authentication method that should be used to gain access to a resource behind a proxy server. Usually returned by 407 responses.
  - `contentRange` - Indicates where in a full body message a partial message belongs. Usually returned by 416 responses.
  - `upgrade` - Indicates an upgraded protocol that can be used with the resource. Usually returned by 426 responses.
  - `retryAfter` - A delay (in seconds) before retrying is suggested by the server. Usually used with 429 or 503 responses.


The error `message` will be `HTTP_STATUS_${status}`.

```tsx
throw new FetchResponseError(status, url, {
  json,
  isTemporary,
  headers: {
    wwwAuthenticate,
    allow,
    proxyAuthenticate,
    contentRange,
    upgrade,
    retryAfter,
  },
});
```

An assertion utility function is provided to simplify throwing an error decoded from a Fetch `Response`.

```tsx
await assertFetchResponseOk(response);
```

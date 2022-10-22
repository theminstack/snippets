# React query hook

Minimal asynchronous data fetching hook.

This hook is suitable for [safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) operations which should not have any side effects (eg. GET, HEAD, OPTIONS, and TRACE requests)

Inspired by (and API compatible with) React Query's [useQuery](https://tanstack.com/query/v4/docs/reference/useQuery) hook.

It includes:

- Simplified query results:
  - `data`
  - `error`
  - `isFetching`
  - `refetch()`
- Simplified query options:
  - `enabled`
  - `refetchInterval`
  - `refetchOnReconnect`
  - `refetchOnWindowFocus`

It does _not_ include:

- Retrying
- Caching

Retrying is useful, but there's no reason to build it in to a query hook. Just retry in the query function as needed.

In-memory caching (vs browser caching) is overrated. Consider leveraging browser caching, or hoisting a query if its state needs to be shared across separate parts of an app. Not including caching in the query hook avoids the need for a `QueryClient` context, which simplifies setup and testing.

The `useQuery` hook can be used directly in components, but generally you should wrap it in a custom hook.

```tsx
const useResource = (id: string): QueryResult<Resource> => {
  const result = useQuery(
    // The query will refetch if the serialized value of the query key changes.
    // NOTE: Query keys MUST be serializable!
    [id],
    // Query functions are always asynchronous. Changing the query function
    // does NOT cause a refetch, but the most up-to-date function will be
    // used whenever a refetch occurs. The query receives a context object
    // which includes an AbortSignal (ctx.signal), and the query key array
    // (ctx.queryKey).
    async (ctx) => {
      const response = await fetch('https://...', { signal: ctx.signal });

      if (!response.ok) {
        throw new Error(`Request failed (status: ${response.status}, key: ${JSON.stringify(ctx.key)})`);
      }

      return response.json();
    },
    {
      // When false, the query will only run when `result.refetch()` is called.
      enabled: true, // Default
      // When positive and non-zero, the query will refetch automatically.
      refetchInterval: 0, // Default
      // When true, the query will refetch when connectivity is regained.
      refetchOnReconnect: true, // Default
      // When true, the query will refetch when the window regains focus.
      refetchOnWindowFocus: true, // Default
    },
  );

  return result;
};
```

Use your custom query hook in a component.

```tsx
const Component = (props: Props): JSX.Element => {
  const { data, error, isFetching, refetch } = useResource(props.id);

  if (isFetching) {
    return <Loading />;
  }

  if (error != null) {
    return <Error error={error} />;
  }

  return <Resource data={data} onRefresh={refetch} />;
};
```

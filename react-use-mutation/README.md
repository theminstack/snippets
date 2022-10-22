# React mutation hook

Minimal asynchronous data create/update/delete hook.

This hook is suitable for operations which may be non-[safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) due to side effects (eg. POST, PUT, PATCH, and DELETE requests).

Inspired by (and API compatible with) React Query's [useMutation](https://tanstack.com/query/v4/docs/reference/useMutation) hook.

It includes:

- Simplified mutation results:
  - `data`
  - `error`
  - `isLoading`
  - `mutate()`

It does _not_ include:

- Mutation Options
- Retrying
- Caching

This mutation hook implementation is so simple, there's just not any reason to have options.

Retrying may be useful, but there's no reason to build it in to a mutation hook. Just retry in the mutation function as needed. Retrying un-safe operations can be dangerous if done incorrectly!

Mutations usually aren't cached. Not including the option to cache in the mutation hook avoids the need for a `QueryClient` context, which simplifies setup and testing.

The `useMutation` hook can be used directly in components, but generally you should wrap it in a custom hook.

```tsx
const useCreateResource = (): MutationResult<Resource> => {
  const result = useMutation(
    // Mutation functions are always asynchronous. The most up-to-date
    // function will be used when `result.mutate()` is called.
    async (resource: Resource): Resource => {
      const response = await fetch('https://...', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource),
      });

      if (!response.ok) {
        throw new Error(`Request failed (status: ${response.status})`);
      }

      return response.json();
    },
  );

  return result;
};
```

Use your custom mutation hook in a component.

```tsx
const Component = (props: Props): JSX.Element => {
  const { data, error, isLoading, mutate } = useCreateResource();
  const onSave = useCallback((resource: Resource) => {
    mutate(resource)
  }, [mutate]);

  return (
    <div>
      {isLoading && <Saving />}
      {error && <Error error={error} />}
      {data && <Success data={data} />}
      <CreateResourceForm enabled={!isLoading} onSave={onSave}>
    </div>
  )
};
```

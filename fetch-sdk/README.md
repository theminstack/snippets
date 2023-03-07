# Fetch SDK

Helper for creating fetch SDK classes.

Using the `fetch` function directly can result in extra verbosity. This helper creates declarative wrappers and reduces the boilerplate code necessary to call APIs.

Create an SDK class.

```ts
const MySdk = createFetchSdk(
  {
    create: (data: DataType) => ({
      url: `https://example.com/`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(data),
      parse: async (res): DataType => res.json(),
    }),
    read: (id: string) => ({
      url: `https://example.com/${id}`, // Relative to the base URL.
      method: 'GET',
      headers: { accept: 'application/json' },
      // Don't throw on 404 status.
      accept: async (res) => res.ok || res.status === 404,
      // Return undefined if the status code is not "ok".
      parse: async (res): DataType => res.ok ? res.json() : undefined,
    }),
    update: (id: string, data: Partial<Omit<DataType, 'id'>>) => ({
      url: `https://example.com/${id}`,
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...data }),
      parse: async (res): DataType => res.json(),
    }),
    delete: (id: string) => {
      url: `https://example.com/${id}`,
      method: 'DELETE',
    },
    // Request definition can be an object
    // instead of a function if no arguments are
    // required.
    list: {
      url: `https://example.com/`,
      method: 'GET',
      parse: async (res): { entries: DataType[] } => res.json(),
    }
  },
  {
    // Derive a request ID (optional, default implementation shown).
    getRequestId: (res) => res.headers.get('x-request-id'),
    // Derive an error code (optional, default implementation shown).
    getErrorCode: (res) => (await res.json()).error,
    // Custom Error class (optional)
    CustomError: MyFetchError
  },
);
```

Create instances of the created SDK class.

```ts
const mySdk = new MySdk();
```

Call request methods on the instance.

```ts
// Create a record.
const created: DataType = await mySdk.create({ ... });

// Read the record.
const read: DataType = await mySdk.read(created.id);

// Update the record.
const updated: DataType = await mySdk.update(created.id, { ... });

// Delete the record.
await mySdk.delete(created.id);
```

The `createFetchSdk` helper also accepts a function if the SDK class needs arguments.

```ts
const MySdk = createFetchSdk((url: string) => ({
  read: (id: string) => ({
    url: `${url}/${id}`,
    headers: { accept: 'application/json' },
    parse: async (res): DataType => res.json(),
  }),
}));
```

The SDK class constructor now has the same arguments as the function passed to the helper.

```ts
const mySdk = new MySdk('https://example.com');
```

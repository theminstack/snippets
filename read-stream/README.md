# Read Stream

Read all data from a stream.

```ts
const buffer: Buffer = await readStream(readable);
```

An `encoding` can be given to get `string` data instead of a `Buffer`.

```ts
const text: string = await readStream(readable, 'utf8');
```

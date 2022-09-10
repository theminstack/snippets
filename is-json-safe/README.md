# Is JSON Safe

Can a value be converted to and from JSON without data loss.

Things that are unsafe, even if they might (partially) serialize, because they would not un-serialize back to their original values.

- `function`, `bigint`, and `undefined` values.
- Instances of classes (eg. `Date`).
- Objects with extended prototypes (eg. `Object.create({ ... })`)
- Objects with non-enumerable own properties.
- Objects or arrays with (own) `symbol` properties.
- Arrays with extra static properties.

The `toJSON` method does not qualify any values as safe that would otherwise be unsafe, because it is one directional. Similarly, JSON serializers and revivers are not considered.

```ts
// This value is safe.
isJsonSafe({ null: null, number: 1, string: '', array: [] });
isJsonSafe(Object.create(null));

// These values are not safe.
isJsonSafe(Object.create({}));
isJsonSafe(new Date());
isJsonSafe(Symbol());
isJsonSafe({ [Symbol()]: false });
isJsonSafe(Object.assign([], { foo: false }));
isJsonSafe(() => {});
isJsonSafe(1n);
isJsonSafe(undefined);
```

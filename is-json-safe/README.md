# Is JSON Safe

Can a value be converted to and from JSON without data loss.

Things that are unsafe, even if they might (partially) serialize, because they would not un-serialize back to their original values.

- Instances of classes (eg. `Date`).
- Arrays with extra (own enumerable) static properties.
- Objects with `symbol` keys.
- `function`, `bigint`, and `undefined` values.

The `toJSON` method does not qualify any values as safe that would otherwise be unsafe, because it is one directional. Similarly, JSON serializers and revivers are not considered.

```ts
// This value is safe.
isJsonSafe({ null: null, number: 1, string: '', array: [] });

// These values are not safe.
isJsonSafe(new Date());
isJsonSafe(Symbol());
isJsonSafe({ [Symbol()]: false });
isJsonSafe(Object.assign([], { foo: false }));
isJsonSafe(() => {});
isJsonSafe(1n);
isJsonSafe(undefined);
```

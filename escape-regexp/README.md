# Escape RegExp

Escape all regular expression special/meta characters in a string so that they match literally when used to construct a regular expression from a string.

```ts
const literal = escapeRegExp('.*'); // "\\.\\*"
const rx = new RegExp(`^${literal}$`, 'u');
rx.test('.*'); // true
```

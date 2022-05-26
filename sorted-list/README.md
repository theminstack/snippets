# Sorted list

Always sorted list with binary searching.

This collection has almost the same prototype as `Set`. It's missing the `entries()` and `keys()` methods, and has additional `slice()` and `deleteAt()` methods.

Arrays can be sorted, but it can be useful to have a collection which is always in sort order. A binary sorted list also supports binary searching.

```ts
const list = new SortedList<string>();

list.add('foo');
list.add('bar');
list.add('baz');

console.log(list.toArray());
// stdout: [ 'bar', 'baz', 'foo' ]

list.search('baz'); // [index: 1, isExact: true]
list.search('bat'); // [index: 1, isExact: false]
list.search('cat'); // [index: 2, isExact: false]
```

A custom compare function can be passed to the constructor. Undefined values are never passed to compare functions, because undefined values are always considered to be greater than other values, and are therefore sorted last.

```ts
// This is the default compare algorithm (SortedList.defaultCompare).
const defaultCompare = (a_: any, b_: any): number => {
    const a = a_.toString();
    const b = b_.toString();

    return a < b ? -1 : a > b ? 1 : 0;
  };

const list = new SortedList<string>(defaultCompare);
```

By default, duplicate values (ie. equal according to the compare function) are not added. If you want to allow duplicates in the list, then set the `allowDuplicates` option. If duplicates are allowed, duplicate values are added _before_ other duplicates. This results in a LIFO behavior for duplicate values due to `delete()` always removing the _first_ duplicate.

```ts
new SortedList<string>({ allowDuplicates: true });
```

Initial values can be passed to the constructor as the first argument. If values are provided, then a custom compare or options object can be passed as the second argument.

```ts
new SortedList([1, 2, 3]);
new SortedList([1, 2, 3], compare);
new SortedList([1, 2, 3], options);
```

## Properties

- `size: number` - Count of entries in the list.

## Methods

- `add(value)` - Insert the `value` in order (before duplicates if they exist).
- `at(index)` - Get the value at the `index`.
- `has(value)` - Returns true if the `value` is in the list.
- `delete(value)` - Remove the `value` (only the first if duplicates exist).
- `deleteAt(index)` - Remove the value at the `index`.
- `clear()` - Remove all entries from the list.
- `slice(start?, end?)` - Get part the list as a new sorted list.
- `forEach(callback)` - Call the `callback` once for each entry in the list.
- `search(value)` - Find the entry (first if duplicates exist) that matches `value`, or the next greater entry if no exact match is found.
- `values()` - Returns a new iterator object that yields the list values.
- `[@@iterator]()` - Returns a new iterator object that yields the list values.

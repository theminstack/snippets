# To Array

Coerce a value to an array. Values that are iterable or array-like (excluding strings and functions) will be copied into a new array. Single values (including strings and functions) will be converted to single element arrays.

```ts
// Single string becomes an array containing the single string.
toArray('abc'); // ['abc']

// Arrays are copied to new arrays.
toArray([1, 2]); // [1, 2]

// Iterables are copied to new arrays.
toArray(new Set([1, 2, 3])); // [1, 2, 3]

// Array-like object values are copied to new arrays.
toArray({ 0: 'a', 1: 'b', length: 2 }); // ['a', 'b']
```

Strings and functions are "array-like" in JS because they have a `length` property. If you were to use the `Array.from` utility on a string or a function, you would _NOT_ get the single element array you might expect. A string will be split into an array of individual characters, and a function will produce an array of undefined values with a length equal to the number of function arguments.

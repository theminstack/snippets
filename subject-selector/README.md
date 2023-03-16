# Subject selector

React to a value computed from one or more subjects.

A Subject Selector is a computed, readonly, subject-like object with `value` and `subscribe()`, but no `next()`. It updates when any of the subjects used to compute it are changed.

```ts
const a = createSubject(1);
const b = createSubject(2);
const total = createSubjectSelector((get) => {
  return get(a) + get(b)
});

console.log(total.value);
// stdout: 3

total.subscribe((value) => {
  console.log(value);
});
a.next(3);
// stdout: 5
b.next(5);
// stdout: 8

total.subscribe(
  (value) => {
    console.log(value);
  },
  /* Immediate option invokes the callback immediately. */
  { immediate: true }
);
// stdout: 8
```

Using the `get()` function passed to the `createSubjectSelector()` callback automatically subscribes to all of the consumed subjects. The returned readonly subject has an `unsubscribe()` method that can be used to disconnect from all of those consumed subjects. After calling unsubscribe on the selector, it effectively becomes a static value, and will no longer be updated when subject dependencies are changed.

```ts
total.unsubscribe();

a.next(7);
// No output

console.log(total.value);
// stdout: 12

/*
 * Subscribing is still allowed, but only the immediate
 * option will call the callback, and then only once.
 */
total.subscribe(
  (value) => {
    console.log(value);
  },
  { immediate: true }
)
// stdout: 12
```

The selector callback also receives a second argument (after `get()`) which is the current value, or undefined on the first call. This can be used for progressive calculation, or to "cancel" updates by returning the previous value.

**NOTE:** Due to the way type inference works, you must explicitly set the selector generic type when using the `current` argument.

```ts
const progressive = createSubjectSelector<number>((get, current = 0) => {
  return current + get(numberSubject);
});
```

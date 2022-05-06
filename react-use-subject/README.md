# React subject hooks

Use an observable subject-like object (ie. the [subject](../subject) snippet, or an RxJS [BehaviorSubject](https://rxjs.dev/guide/subject#behaviorsubject)) as atomic, sharable, React state. Similar to [Jotai](https://www.npmjs.com/package/jotai).

This is more efficient than simply providing raw values in the context,
because only the components which are using the subject will be rerendered
when the subject value is changed.

**NOTE**: The returned `setValue()` function returns true if the subject is
writable (has a `next()` method). It is a no-op and returns false if the
subject is readonly.

```tsx
import { useSubject } from './use-subject';

const count = createSubject(0);

const useCounter = () => {
  return useSubject(count);
};

const Counter = () => {
  const [value, setValue] = useCounter();
  const increment = useCallback(() => {
    setValue((current) => {
      return current + 1;
    });
  }, [setValue]);

  return <div onClick={increment}>{value}</div>;
};
```

The above example allows a _singleton_ subject to be shared across an entire React app.

Create a subject context to provide different subject _instances_ at different places in the React tree.

```tsx
import { createSubjectContext } from './use-subject';

const [CounterContext, useCounter] = createSubjectContext(0);

const Counter = () => {
  const [value, setValue] = useCounter();
  const increment = useCallback(() => {
    setValue((current) => current + 1);
  }, [setValue]);

  return <div onClick={increment}>{value}</div>;
};

const count = createSubject(0);

render(
  <CounterContext.Provider value={count}>
    <Counter />
  </CounterContext.Provider>,
);
```

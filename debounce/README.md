# Debounce

Ignore repeating calls that happen too fast.

The debounce wrapper executes the wrapped callback, and then ignores calls for a given amount of time. After that time limit has expired, a call to the wrapper will again execute immediately, and begin ignoring extra calls until the time limit expires.

For example, users may double click on things that don't need to be double clicked. Occasionally, this can result in duplicated actions.

```tsx
const onClick = debounce(250, (e: MouseEvent<HTMLButtonElement>) => {
  handle(e);
});

render(<button onClick={onClick}>Do the thing</button>);
```

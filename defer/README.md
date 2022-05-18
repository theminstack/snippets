# Defer

Delay execution until idle.

When a deferred wrapper is called, execution is scheduled after a given amount of time has elapsed. The schedule is reset whenever the wrapper is called. **If the wrapper is always called sooner than the timeout, the wrapped callback may never be called!**

For example, performing auto complete as text is typed into a textbox. It's probably not a good idea to do the auto completion for every typed character. Instead, wait until no new text has been entered for a while, and then suggest completions.

```tsx
const onChange = debounce(1000, (e: ChangeEvent<HTMLInputElement>) => {
  suggest(e.value);
});

render(<input onChange={onChange} />);
```

Scheduled calls can also be canceled, or triggered immediately.

```ts
onChange.cancel();
onChange.flush();
```

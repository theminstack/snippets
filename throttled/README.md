# Throttled

Execute as fast as possible, but no faster.

When a throttled wrapper is called, execution is immediate if possible (ie. execution hasn't already happened within the time limit). If the last execution was too recent, then another execution is scheduled to run as soon as possible. If an execution is already scheduled, the scheduled arguments are updated, but the scheduled time stays the same.

For example, handling window resizes. While the window is resizing, events are constantly being fired. Rerendering on every event may bog down the browser. Instead, throttle the callback so that one rerender is immediate in case the resize is instant (eg. maximizing), and then rerender periodically (but not on every event) until resizing stops, so that users can see the effects of resizing. Throttling ensures that a final rerender will occur after resizing stops, because calling a throttled function is always guaranteed to trigger an execution in the future.

```tsx
const onResize = createThrottled(500, () => {
  rerender();
});

window.addEventListener('resize', onResize);
```

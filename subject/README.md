# Subject

Useful when you need to _react_ to a value change.

A Subject is a multicast observable. Another way to put it is that it's an emitter for a single event. It's a value, that can have zero or more subscribers, which are notified via callback when a new value is set. The "observer" part means that it can be subscribed to by registering a callback. The "multicast" part means that there can be more than one subscriber.

```ts
const subject = createSubject('first-value');

console.log(subject.value);
// stdout: first-value

const subscriptionA = subject.subscribe((value) => {
  console.log(`A ${value}`);
});
// No output

subject.next('second-value');
// stdout: A second-value

const subscriptionB = subject.subscribe(
  (value) => {
    console.log(`B ${value}`);
  },
  // Immediate option invokes the callback immediately.
  { immediate: true }
);
// stdout: B second-value

subject.next('third-value');
// stdout: A third-value
// stdout: B third-value

subscriptionA.unsubscribe();
// No output

subject.next('fourth-value');
// stdout: B fourth-value
```

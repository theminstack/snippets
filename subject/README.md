# Subject

React to a value being set.

A Subject is a multicast observable. The "observable" part means that it can be subscribed to by registering a callback. The "multicast" part means that there can be more than one subscriber.

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

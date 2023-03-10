# Events

Typed events class.

Use the `Events` class as a base class.

```ts
class MyClass extends Events<{
  foo: (value: number) => void;
  bar: (value: string) => void;
}> {
  // ...
}

const myClass = new MyClass();
```

Use the `on` method to receive events. The method returns a function which removes the listener when called.

```ts
const offFoo = myClass.on('foo', (value: number) => { ... });
const offBar = myClass.on('bar', (value: string) => { ... });

// Call a returned function to remove the
// associated listener.
offBar();
```

Use the `emit` method to send events. The method returns true if there are listeners, or false if there are no listeners.

```ts
events.emit('foo', 42); // true
events.emit('bar', 'Hello, world!'); // false
```

# Events

Publish and subscribe to named events.

Similar to [browser DOM events](https://developer.mozilla.org/en-US/docs/Web/Events) and [NodeJS events](https://nodejs.org/api/events.html#events), but strongly typed and not tied to either a browser or NodeJS environment.

```ts
type EventTypes = {
  foo: number;
  bar: string;
};

const events = createEvents<EventTypes>();

const fooListener = (value: number) => {
  console.log(value);
};
events.on('foo', fooListener);

const barListener = (value: string) => {
  console.log(value);
}
events.on('bar', barListener);

events.emit('foo', 42);
// stdout: 42

events.emit('bar', 'Hello, world!');
// stdout: Hello, world!

events.off('bar', barListener);
events.emit('bar', 'Nobody is listening');
// No output
```

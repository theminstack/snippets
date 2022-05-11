# Finite state machine (FSM)

Store the current state of a stepwise operation.

An [finite state machine](https://en.wikipedia.org/wiki/Finite-state_machine) is datatype that represents a [directed graph](https://en.wikipedia.org/wiki/Directed_graph), where the graph nodes are a finite set of states, and the graph edges are transitions between those states.

Define a state machine with state types and the transitions between states.

```ts
const water = createFsm<{
  solid: void,
  liquid: void,
  gas: void,
}>()
  .transition('melt', { from: 'solid', to: 'liquid' })
  .transition('boil', { from: 'liquid', to: 'gas' })
  .transition('condense', { from: 'gas', to: 'liquid' })
  .transition('freeze', { from: 'liquid', to: 'solid' });
```

Infer a union of all possible state instance types from the FSM.

```ts
type Water = InferFsmStates<typeof water>;
```

Create an initial FSM state instance.

```ts
let puddle: Water = water.start('solid');
puddle.state; // solid
```

Use the transition methods to traverse the different states.

```ts
puddle = puddle.transitions.melt();
puddle.state; // liquid

puddle = puddle.transitions.boil();
puddle.state; // gas
```

FSMs and FSM state instances are immutable. The `start()` method and all transition methods return new state instances, which must be assigned to a variable or they will be lost.

In the above example, the new state is always re-assigned to the `let puddle: Water` variable. The variable type begins as type `Water` which is a union of all the state types. Typescript is smart enough to narrow the type when you use `start()`, a transition method, or check the `state` property value.

The above states are all value-less (`void`), but each state can have a value associated with it.

```ts
const bus = createFsm<{
  parked: void,
  driving: { passengers: number, speed: number },
  stopped: { passengers: number },
}>()
  .transition('go', { from: 'parked', to: 'driving' });
  .transition('go', { from: 'stopped', to: 'driving' });
  .transition('go', { from: 'driving', to: 'driving' });
  .transition('stop', { from: 'driving' to: 'stopped' });
  .transition('park', { from: 'driving', to: 'parked' });

type Bus = InferFsmStates<typeof bus>;

let bus1: Bus = bus.start('parked');

bus1 = bus1.transitions.go({ passengers: 0, speed: 15 });
bus1 = bus1.transitions.stop({ passengers: 5 });
bus1 = bus1.transitions.go({ passengers: bus1.value.passengers, speed: 25 });
bus1 = bus1.transitions.go({ passengers: bus1.value.passengers, speed: 55 });
bus1 = bus1.transitions.go({ passengers: bus1.value.passengers, speed: 25 });
bus1 = bus1.transitions.stop({ passengers: 2 });
bus1 = bus1.transitions.go({ passengers: bus1.value.passengers, speed: 25 });
bus1 = bus1.transitions.stop({ passengers: 0 });
bus1 = bus1.transitions.go({ passengers: bus1.value.passengers, speed: 15 });
bus1 = bus1.transitions.park();
```

Subsets of the state instance types can also be inferred, which can be useful for creating functions which accept specific states.

```ts
type ParkedOrStoppedBus = InferFsmStates<typeof bus, 'parked' | 'stopped'>;
type DrivingBus = InferFsmStates<typeof bus, 'driving'>;

function startDriving(bus: ParkedOrStoppedBus): DrivingBus {
  return bus.transitions.go({ passengers: 0, speed: 5 });
}
```

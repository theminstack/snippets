# Limiter

Run asynchronous tasks with limited concurrency.

A limiter only allows a specific number of asynchronous tasks to be run in parallel. Limiting concurrency can avoid overloading a resource (eg. an API or a database), and can also be a way to reduce unnecessary work when failures occur.

Create a limiter with a maximum concurrency (eg. 2).

```ts
const limiter = createLimiter(2);
```

Execute asynchronous tasks and await the returned promises as usual.

```ts
const promises = [
  limiter.run(() => fetch('https://...')),
  limiter.run(() => fetch('https://...')),
  limiter.run(() => fetch('https://...')),
];

// Only two fetches will run concurrently.
const result = await Promise.all(promises);
```

Functionally, this is the same pattern with and without the limiter. If the fetch calls were not wrapped by `limiter.run()`, everything would work exactly the same, but all the fetch calls would be in flight at the same time.

The limiter can also be configured to resolve task promises sequentially (tasks are always started sequentially), in the order that `run()` is called. This might reduce concurrency if an earlier task takes longer than a later task, due to the later task's resolution being delayed until the earlier task is resolved. But, the maximum concurrency will still be enforced.

```ts
const limiter = createLimiter(2, { sequential: true });
```

Limiters can be paused and resumed. While paused, active tasks can resolve, and new pending tasks can be added, but no pending tasks will be started until the limiter is resumed.

```ts
limiter.isPaused; // false
limiter.pending; // 0
limiter.active; // 0
limiter.size; // 0

limiter.pause();
limiter.run(task);

limiter.isPaused; // true
limiter.pending; // 1
limiter.active; // 0
limiter.size; // 1

limiter.resume();

limiter.isPaused; // false
limiter.pending; // 0
limiter.active; // 1
limiter.size; // 1
```

Limiters can be paused on creation.

```ts
const limiter = createLimiter(2, { paused: true });
```

Pending promises can be cleared, but any promises which have already started running will continue running.

```ts
limiter.pending; // 1
limiter.active; // 1
limiter.size; // 2

limiter.clear();

limiter.pending; // 0
limiter.active; // 1
limiter.size; // 1
```

After clearing, tasks that were pending will never be run, and the associated promises (returned by `run()`) will never resolve or reject. If you need the promises to reject, pass a rejection "reason" to the `clear(reason)` method.

```ts
limiter.clear(new Error('Limiter cleared'));
```

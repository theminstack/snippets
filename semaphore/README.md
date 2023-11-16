# Semaphore

Limit the concurrency of asynchronous tasks.

Create a semaphore with a size of 3. This semaphore will allow up to 3 locks to be acquired at any given time.

```tsx
const semaphore = new Semaphore(3);
```

The following for loop runs 10 asynchronous tasks, but only the first 3 will run immediately, and only 3 will ever be running simultaneously. The 4th iteration will wait until one of the first 3 iterations releases a lock, and the 5th will wait until another one of the first 4 iterations releases a lock, and so on.

```tsx
const promises: Promise<void>[] = [];

for (let i = 0; i < 10; ++i) {
  const lock = await semaphore.acquire();
  const promise = doAsyncTask().finally(lock.release);

  promises.push(promise);
}

await Promise.all(promises);
```

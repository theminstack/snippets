import { Semaphore } from './semaphore.js';

describe('Semaphore', () => {
  test('size is truncated to an integer >= 1', () => {
    expect(new Semaphore(0).size).toBe(1);
    expect(new Semaphore(-1).size).toBe(1);
    expect(new Semaphore(2.2).size).toBe(2);
    expect(new Semaphore(2.8).size).toBe(2);
  });

  test('available and waiting counts are correct', async () => {
    const semaphore = new Semaphore(1);
    expect(semaphore.available).toBe(1);
    expect(semaphore.waiting).toBe(0);

    const p0 = semaphore.acquire();

    expect(semaphore.available).toBe(0);
    expect(semaphore.waiting).toBe(0);

    const p1 = semaphore.acquire();

    expect(semaphore.available).toBe(0);
    expect(semaphore.waiting).toBe(1);

    const p2 = semaphore.acquire();

    expect(semaphore.available).toBe(0);
    expect(semaphore.waiting).toBe(2);

    (await p0).release();

    expect(semaphore.available).toBe(0);
    expect(semaphore.waiting).toBe(1);

    (await p1).release();

    expect(semaphore.available).toBe(0);
    expect(semaphore.waiting).toBe(0);

    (await p2).release();

    expect(semaphore.available).toBe(1);
    expect(semaphore.waiting).toBe(0);
  });

  test('parallelism is limited by the semaphore size', async () => {
    const semaphore = new Semaphore(3);
    const promises: Promise<number>[] = [];

    let maxConcurrency = 0;
    let concurrency = 0;

    for (let i = 0; i < 10; ++i) {
      const index = i;
      const lock = await semaphore.acquire();
      const promise = new Promise<number>((resolve) => {
        concurrency += 1;
        maxConcurrency = Math.max(maxConcurrency, concurrency);
        setTimeout(() => {
          concurrency -= 1;
          resolve(index);
        });
      }).finally(lock.release);

      promises.push(promise);
    }

    expect(maxConcurrency).toBe(3);
    expect(await Promise.all(promises)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('release() is a no-op when called twice', async () => {
    const semaphore = new Semaphore(1);
    const lock = await semaphore.acquire();

    lock.release();
    lock.release();

    expect(semaphore.available).toBe(1);
  });
});

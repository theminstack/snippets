/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createLimiter } from './limiter.js';

const tasks: { reject(): void; resolve(): void }[] = [];
const nextTick = (): Promise<void> => new Promise(process.nextTick);
let task: any;

beforeEach(() => {
  tasks.length = 0;
  task = vi
    .fn()
    .mockImplementation(
      (arg) =>
        new Promise<unknown>((resolve, reject) =>
          tasks.push({ reject: () => reject(arg), resolve: () => resolve(arg) }),
        ),
    );
});

describe('limit', () => {
  test('non-sequential', async () => {
    const limiter = createLimiter(2);
    const a = limiter.run(task, 'a');
    const b = limiter.run(task, 'b');
    const c = limiter.run(task, 'c');
    const d = limiter.run(task, 'd');
    expect(limiter.pending).toBe(2);
    expect(limiter.active).toBe(2);
    expect(limiter.size).toBe(4);

    await nextTick();
    expect(task).toHaveBeenCalledTimes(2);

    tasks[0]!.resolve();
    await expect(a).resolves.toBe('a');
    await nextTick();
    expect(task).toHaveBeenCalledTimes(3);

    tasks[2]!.resolve();
    await expect(c).resolves.toBe('c');
    await nextTick();
    expect(task).toHaveBeenCalledTimes(4);

    tasks[1]!.reject();
    await expect(b).rejects.toBe('b');
    await nextTick();

    tasks[3]!.resolve();
    await expect(d).resolves.toBe('d');
    await nextTick();

    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    expect(limiter.size).toBe(0);
  });

  test('sequential', async () => {
    const limiter = createLimiter(2, { sequential: true });
    const order: string[] = [];
    const a = limiter.run(task).then(() => order.push('a'));
    const b = limiter.run(task).then(() => order.push('b'));
    const c = limiter.run(task).then(() => order.push('c'));

    await nextTick();
    tasks[1]!.resolve();
    await nextTick();
    tasks[2]!.resolve();
    await nextTick();
    tasks[0]!.resolve();
    await Promise.allSettled([a, b, c]);
    expect(order).toStrictEqual(['a', 'b', 'c']);
  });

  test('states', async () => {
    const limiter = createLimiter(2, { paused: true });
    expect(limiter.isPaused).toBe(true);

    void limiter.run(task);
    void limiter.run(task);
    void limiter.run(task);
    expect(limiter.pending).toBe(3);
    expect(limiter.active).toBe(0);

    limiter.resume();
    expect(limiter.isPaused).toBe(false);
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(2);

    limiter.pause();
    expect(limiter.isPaused).toBe(true);
    void limiter.run(task);
    tasks[0]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(2);
    expect(limiter.active).toBe(1);

    limiter.resume();
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(2);

    limiter.pause();
    tasks[1]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(1);

    limiter.resume();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(2);

    limiter.pause();
    tasks[2]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);

    limiter.resume();
    tasks[3]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
  });

  test('clear', async () => {
    const limiter = createLimiter(1);
    void limiter.run(task);
    const a = limiter.run(task);
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(1);

    limiter.clear();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);
    await nextTick();

    tasks[0]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    await expect(Promise.race([a.then(() => false), nextTick().then(() => true)])).resolves.toBe(true);

    void limiter.run(task);
    const b = limiter.run(task);
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(1);

    limiter.clear('error');
    await expect(b).rejects.toBe('error');
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);

    tasks[1]!.resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    expect(task).toHaveBeenCalledTimes(2);
  });
});

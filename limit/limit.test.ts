/* eslint-disable max-lines */
import { limit } from './limit';

// eslint-disable-next-line functional/prefer-readonly-type
const tasks: { readonly reject: () => void; readonly resolve: () => void }[] = [];
const task = jest
  .fn()
  .mockImplementation(
    (arg) =>
      new Promise<unknown>((resolve, reject) => tasks.push({ reject: () => reject(arg), resolve: () => resolve(arg) })),
  );
const nextTick = () => new Promise(process.nextTick);

beforeEach(() => {
  tasks.length = 0;
  task.mockClear();
});

describe('limit', () => {
  test('non-sequential', async () => {
    const limiter = limit(2);
    const a = limiter.run(task, 'a');
    const b = limiter.run(task, 'b');
    const c = limiter.run(task, 'c');
    const d = limiter.run(task, 'd');
    expect(limiter.concurrency).toBe(2);
    expect(limiter.pending).toBe(2);
    expect(limiter.active).toBe(2);
    expect(limiter.size).toBe(4);

    await nextTick();
    expect(task).toHaveBeenCalledTimes(2);

    tasks[0].resolve();
    await expect(a).resolves.toBe('a');
    await nextTick();
    expect(task).toHaveBeenCalledTimes(3);

    tasks[2].resolve();
    await expect(c).resolves.toBe('c');
    await nextTick();
    expect(task).toHaveBeenCalledTimes(4);

    tasks[1].reject();
    await expect(b).rejects.toBe('b');
    await nextTick();

    tasks[3].resolve();
    await expect(d).resolves.toBe('d');
    await nextTick();

    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    expect(limiter.size).toBe(0);
  });

  test('sequential', async () => {
    const limiter = limit(2, { sequential: true });
    const a = limiter.run(task);
    const b = limiter.run(task);
    const c = limiter.run(task);

    await nextTick();
    tasks[1].resolve();
    await b;
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(2);

    tasks[0].resolve();
    await a;
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);

    tasks[2].resolve();
    await c;
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
  });

  test('states', async () => {
    const limiter = limit(2, { paused: true });
    expect(limiter.isPaused).toBe(true);
    await expect(limiter.onPending(0)).resolves.toBe(undefined);
    await expect(limiter.onActive(0)).resolves.toBe(undefined);
    await expect(limiter.onSize(0)).resolves.toBe(undefined);
    await expect(limiter.onEmpty()).resolves.toBe(undefined);

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
    tasks[0].resolve();
    await nextTick();
    expect(limiter.pending).toBe(2);
    expect(limiter.active).toBe(1);

    limiter.resume();
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(2);

    const onPending = jest.fn();
    const onActive = jest.fn();
    const onSize = jest.fn();
    const onEmpty = jest.fn();
    void limiter.onPending(0).then(onPending);
    void limiter.onActive(1).then(onActive);
    void limiter.onSize(2).then(onSize);
    void limiter.onEmpty().then(onEmpty);
    await nextTick();
    expect(onPending).not.toHaveBeenCalled();
    expect(onActive).not.toHaveBeenCalled();
    expect(onSize).not.toHaveBeenCalled();
    expect(onEmpty).not.toHaveBeenCalled();

    limiter.pause();
    tasks[1].resolve();
    await nextTick();
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(1);
    expect(onPending).not.toHaveBeenCalled();
    expect(onActive).not.toHaveBeenCalled();
    expect(onSize).toHaveBeenCalled();
    expect(onEmpty).not.toHaveBeenCalled();

    limiter.resume();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(2);
    expect(onPending).toHaveBeenCalled();
    expect(onActive).not.toHaveBeenCalled();
    expect(onEmpty).not.toHaveBeenCalled();

    limiter.pause();
    tasks[2].resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);
    expect(onActive).toHaveBeenCalled();
    expect(onEmpty).not.toHaveBeenCalled();

    limiter.resume();
    tasks[3].resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    expect(onEmpty).toHaveBeenCalled();
  });

  test('clear', async () => {
    const limiter = limit(1);
    void limiter.run(task);
    const a = limiter.run(task);
    expect(limiter.pending).toBe(1);
    expect(limiter.active).toBe(1);

    const onPending = jest.fn();
    void limiter.onPending(0).then(onPending);
    limiter.clear();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(1);
    await nextTick();
    expect(onPending).toHaveBeenCalled();

    tasks[0].resolve();
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

    tasks[1].resolve();
    await nextTick();
    expect(limiter.pending).toBe(0);
    expect(limiter.active).toBe(0);
    expect(task).toHaveBeenCalledTimes(2);
  });
});

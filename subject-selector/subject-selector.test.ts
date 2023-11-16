import { createSubject } from '../subject/subject.js';
import { createSubjectSelector } from './subject-selector.js';

test('subject-selector', () => {
  const a = createSubject(1);
  const b = createSubject(1);
  const c = createSubject(100);
  let lastCurrent = 0;
  const expected = (): number => {
    return a.value + b.value + (b.value % 2 ? c.value : 0);
  };
  const sum = createSubjectSelector<number>((get, current) => {
    lastCurrent = current ?? 0;

    if (a.value % 2 === 0) {
      // Should not cause recursion.
      a.next(a.value + 2);
    }

    return get(a) + get(b) + (get(b) % 2 ? get(c) : 0);
  });
  let lastValue = expected();
  expect(sum.value).toBe(lastValue);

  a.next(a.value + 1);
  expect(sum.value).toBe(expected());
  expect(lastCurrent).toBe(lastValue);

  b.next(b.value + 1);
  expect(sum.value).toBe(expected());

  const next0 = vi.fn();
  const subscription0 = sum.subscribe(next0);
  // Not an immediate subscription.
  expect(next0).not.toHaveBeenCalled();

  const next1 = vi.fn();
  sum.subscribe(next1, { immediate: true });
  // Immediate subscription.
  expect(next1).toHaveBeenCalledTimes(1);
  expect(next1).toHaveBeenLastCalledWith(expected());

  c.next(2);
  // b is even, so c isn't used, so no updates.
  expect(next0).toHaveBeenCalledTimes(0);
  expect(next1).toHaveBeenCalledTimes(1);

  a.next(a.value + 1);
  expect(next0).toHaveBeenLastCalledWith(expected());
  expect(next1).toHaveBeenLastCalledWith(expected());

  b.next(b.value + 1);
  expect(next0).toHaveBeenLastCalledWith(expected());
  expect(next1).toHaveBeenLastCalledWith(expected());

  c.next(200);
  expect(next0).toHaveBeenCalledTimes(3);
  expect(next1).toHaveBeenCalledTimes(4);
  expect(next0).toHaveBeenLastCalledWith(expected());
  expect(next1).toHaveBeenLastCalledWith(expected());

  b.next(b.value);
  // No change, so no updates.
  expect(next0).toHaveBeenCalledTimes(3);
  expect(next1).toHaveBeenCalledTimes(4);
  expect(next0).toHaveBeenLastCalledWith(expected());
  expect(next1).toHaveBeenLastCalledWith(expected());

  subscription0.unsubscribe();
  a.next(4);
  expect(next0).toHaveBeenCalledTimes(3);
  expect(next1).toHaveBeenCalledTimes(5);
  expect(next1).toHaveBeenLastCalledWith(expected());

  sum.unsubscribe();
  lastValue = expected();
  b.next(b.value + 1);
  expect(next1).toHaveBeenCalledTimes(5);
  expect(sum.value).toBe(lastValue);
  const next2 = vi.fn();
  const subscription2 = sum.subscribe(next2);
  subscription2.unsubscribe();
  expect(next2).not.toHaveBeenCalled();
  sum.subscribe(next2, { immediate: true });
  expect(next2).toHaveBeenLastCalledWith(lastValue);
});

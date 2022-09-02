import { createSubject } from './subject.js';

test('subject', () => {
  const subject = createSubject('first-value');
  expect(subject.value).toBe('first-value');

  const nextA = jest.fn();
  const subscription = subject.subscribe(nextA);
  expect(nextA).toHaveBeenCalledTimes(0);

  subject.next('second-value');
  expect(nextA).toHaveBeenLastCalledWith('second-value');

  const nextB = jest.fn();
  subject.subscribe(nextB, { immediate: true });
  expect(nextB).toHaveBeenLastCalledWith('second-value');

  subject.next('third-value');
  expect(nextA).toHaveBeenCalledTimes(2);
  expect(nextA).toHaveBeenLastCalledWith('third-value');
  expect(nextB).toHaveBeenCalledTimes(2);
  expect(nextB).toHaveBeenLastCalledWith('third-value');

  subscription.unsubscribe();
  expect(nextA).toHaveBeenCalledTimes(2);
  expect(nextB).toHaveBeenCalledTimes(2);

  subject.next('fourth-value');
  expect(nextB).toHaveBeenLastCalledWith('fourth-value');
});

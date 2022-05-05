import { createSubject } from './subject';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
});

describe('subject', () => {
  test('subscribe and unsubscribe', () => {
    const subject = createSubject('first-value');
    expect(subject.value).toBe('first-value');

    const listenerA = jest.fn();
    const subscription = subject.subscribe(listenerA);
    expect(listenerA).toHaveBeenCalledTimes(0);

    subject.next('second-value');
    expect(listenerA).toHaveBeenLastCalledWith('second-value');

    const listenerB = jest.fn();
    subject.subscribe(listenerB, { immediate: true });
    expect(listenerB).toHaveBeenCalledWith('second-value');

    subject.next('third-value');
    expect(listenerA).toHaveBeenCalledWith('third-value');
    expect(listenerB).toHaveBeenCalledWith('third-value');

    subscription.unsubscribe();
    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledTimes(2);

    subject.next('fourth-value');
    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenCalledTimes(3);
    expect(jest.mocked(listenerB).mock.calls.at(-1)).toEqual(['fourth-value']);
  });

  test('change detection', () => {
    const listener = jest.fn();

    const subjectA = createSubject(1);
    subjectA.subscribe(listener);
    subjectA.next(1);
    expect(listener).toBeCalledTimes(0);

    const subjectB = createSubject(1, { changed: () => false });
    subjectB.subscribe(listener);
    subjectB.next(2);
    expect(listener).toBeCalledTimes(0);
  });
});

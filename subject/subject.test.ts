import { createSubject } from './subject';

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
});

test('subject', () => {
  const subject = createSubject('first-value');
  expect(subject.value).toBe('first-value');

  const subscription = subject.subscribe((value) => {
    console.log(`A ${value}`);
  });
  expect(console.log).toHaveBeenCalledTimes(0);

  subject.next('second-value');
  expect(jest.mocked(console.log).mock.calls.at(-1)).toEqual(['A second-value']);

  subject.subscribe(
    (value) => {
      console.log(`B ${value}`);
    },
    { immediate: true },
  );
  expect(jest.mocked(console.log).mock.calls.at(-1)).toEqual(['B second-value']);

  subject.next('third-value');
  expect(jest.mocked(console.log).mock.calls.at(-2)).toEqual(['A third-value']);
  expect(jest.mocked(console.log).mock.calls.at(-1)).toEqual(['B third-value']);

  subscription.unsubscribe();
  expect(console.log).toHaveBeenCalledTimes(4);

  subject.next('fourth-value');
  expect(jest.mocked(console.log).mock.calls.at(-1)).toEqual(['B fourth-value']);
});

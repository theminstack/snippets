import { createDebounced } from './debounced.js';

test('debounced', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const debounced = createDebounced(250, callback);
  debounced(1);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith(1);
  debounced(2);
  expect(callback).toHaveBeenCalledTimes(1);
  vi.runAllTimers();
  debounced(3);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith(3);
});

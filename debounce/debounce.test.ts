import { debounce } from './debounce.js';

test('debounce', () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const debounced = debounce(250, callback);
  debounced(1);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith(1);
  debounced(2);
  expect(callback).toHaveBeenCalledTimes(1);
  jest.runAllTimers();
  debounced(3);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith(3);
});

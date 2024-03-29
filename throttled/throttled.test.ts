import { createThrottled } from './throttled.js';

test('throttled', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const throttled = createThrottled(100, callback);
  throttled(1);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith(1);
  vi.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);
  throttled(2);
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith(2);
  throttled(3);
  vi.advanceTimersByTime(99);
  throttled(4);
  expect(callback).toHaveBeenCalledTimes(2);
  vi.advanceTimersByTime(1);
  expect(callback).toHaveBeenCalledTimes(3);
  expect(callback).toHaveBeenLastCalledWith(4);
  throttled(5);
  expect(callback).toHaveBeenCalledTimes(3);
  throttled.flush();
  expect(callback).toHaveBeenCalledTimes(4);
  expect(callback).toHaveBeenLastCalledWith(5);
  throttled(6);
  expect(callback).toHaveBeenCalledTimes(4);
  throttled.cancel();
  vi.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(4);
  throttled(7);
  expect(callback).toHaveBeenCalledTimes(5);
  expect(callback).toHaveBeenLastCalledWith(7);
  throttled(8);
  expect(callback).toHaveBeenCalledTimes(5);
  throttled.cancel();
  throttled(9);
  vi.advanceTimersByTime(100);
  expect(callback).toHaveBeenCalledTimes(6);
  expect(callback).toHaveBeenLastCalledWith(9);
});

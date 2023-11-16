import { createDeferred } from './deferred.js';

test('deferred', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const deferred = createDeferred(1000, callback);
  deferred(1);
  expect(callback).not.toHaveBeenCalled();
  deferred(2);
  expect(callback).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith(2);
  deferred(3);
  deferred.flush();
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith(3);
  deferred(4);
  deferred.cancel();
  vi.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(2);
});

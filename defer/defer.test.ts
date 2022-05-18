import { defer } from './defer';

test('defer', () => {
  jest.useFakeTimers();
  const callback = jest.fn();
  const deferred = defer(1000, callback);
  deferred(1);
  expect(callback).not.toHaveBeenCalled();
  deferred(2);
  expect(callback).not.toHaveBeenCalled();
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith(2);
  deferred(3);
  deferred.flush();
  expect(callback).toHaveBeenCalledTimes(2);
  expect(callback).toHaveBeenLastCalledWith(3);
  deferred(4);
  deferred.cancel();
  jest.runAllTimers();
  expect(callback).toHaveBeenCalledTimes(2);
});

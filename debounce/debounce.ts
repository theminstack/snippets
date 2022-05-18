/**
 * Wrap a callback so that repeated calls to the wrapper will not re-call the
 * wrapped callback until the `timeout` has expired.
 *
 * @param timeout Debounce timeout in milliseconds
 * @param callback Wrapped callback
 */
const debounce = <TReturn, TArgs extends readonly unknown[] = readonly []>(
  timeout: number,
  callback: (...args: TArgs) => TReturn,
): ((...args: TArgs) => TReturn) => {
  let value: { current: TReturn } | undefined;

  return (...args) => {
    if (value == null) {
      value = { current: callback(...args) };
      setTimeout(() => {
        value = undefined;
      }, timeout);
    }

    return value.current;
  };
};

export { debounce };

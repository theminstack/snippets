# Retry

Retry asynchronous actions on error (rejection).

Supports signals, delays, max retries, and custom retry handling. If all tries fail, the last error will be thrown.

```ts
const response: Response = retry(
  async (): Response => {
    const res = await fetch('...');

    if (!res.ok) {
      throw new Error('...');
    }

    return res;
  },
  {
    // If the signal is aborted, retrying is canceled and the next error will
    // be thrown.
    signal, // Default: undefined
    // Default delay, used unless onRetry returns a custom delay. It can also
    // be an array to provide different default values based on the number of
    // previous retries.
    delay: 0, // Default
    // Maximum number of retries (not including the first try).
    retries: 2, // Default
    // Can return a custom delay (number), true, or undefined to allow
    // retrying. Returning false or throwing will skip retrying. The count
    // will be 1 on the first error
    onRetry: (error: unknown, count: number): number | boolean | undefined => {
      // Default: Any error except AbortError is retried.
      return !(error instanceof Error) || error.name !== 'AbortError';
    },
  },
);
```

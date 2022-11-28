/* eslint-disable canonical/sort-keys */
import { fireEvent, renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { type QueryFn, type QueryOptions, useQuery, useStableQueryKey } from './use-query.js';

describe('useStableQueryKey', () => {
  const key = [1, { b: 1, c: 'string', a: { f: true, d: null, e: undefined } }];

  it('should JSON serialize', () => {
    const { result } = renderHook(() => useStableQueryKey(key));
    expect(result.current).toEqual(JSON.parse(JSON.stringify(key)));
  });

  it('should order object keys', () => {
    const { result } = renderHook(() => useStableQueryKey(key));
    expect(result.current).toMatchInlineSnapshot(`
      [
        1,
        {
          "a": {
            "d": null,
            "f": true,
          },
          "b": 1,
          "c": "string",
        },
      ]
    `);
  });
});

describe('useQuery', () => {
  let queryFnMock: jest.Mock;

  beforeEach(() => {
    queryFnMock = jest.fn().mockResolvedValue('foo');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should query on mount and not on rerender', async () => {
    const { result, rerender } = renderHook((props: { key: unknown[] } = { key: ['a'] }) =>
      useQuery(props.key, queryFnMock),
    );

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    expect(result.current.isFetching).toEqual(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toEqual('foo');
    expect(result.current.error).toBeUndefined();

    rerender();
    expect(queryFnMock).toHaveBeenCalledTimes(1);
    expect(result.current.isFetching).toEqual(false);
  });

  it('should query on key change', async () => {
    const { result, rerender } = renderHook((props: { key: unknown[] } = { key: ['a'] }) =>
      useQuery(props.key, queryFnMock),
    );

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toEqual('foo');

    queryFnMock.mockRejectedValueOnce(new Error('error'));
    rerender({ key: [{ a: 1 }] });
    expect(queryFnMock).toHaveBeenCalledTimes(2);
    // Should clear data if the key changes.
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);

    rerender({ key: [{ a: 1, b: 2 }] });
    expect(queryFnMock).toHaveBeenCalledTimes(3);
    // Should clear error if the key changes.
    expect(result.current.error).toBeUndefined();
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toEqual('foo');
    expect(result.current.error).toBeUndefined();

    rerender({ key: [{ b: 2, a: 1 }] });
    // Property order isn't a key "change"
    expect(queryFnMock).toHaveBeenCalledTimes(3);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should query when imperatively triggered', async () => {
    const { result } = renderHook(() => useQuery(['a'], queryFnMock));

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toEqual('foo');

    // Should keep previous data, because the key didn't change.
    queryFnMock.mockRejectedValueOnce(new Error('error'));
    act(() => result.current.refetch());
    expect(queryFnMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual('foo');
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    // Keep the data if an error occurs too.
    expect(result.current.data).toEqual('foo');
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => result.current.refetch());
    expect(queryFnMock).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBeInstanceOf(Error);
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(result.current.data).toEqual('foo');
    // Error is cleared when the query succeeds.
    expect(result.current.error).toBeUndefined();

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should query when the refresh interval elapses', async () => {
    const { result } = renderHook(() => useQuery([], queryFnMock, { refetchInterval: 1000 }));

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(queryFnMock).toHaveBeenCalledTimes(1);

    // Not elapsed yet.
    act(() => void jest.advanceTimersByTime(500));
    expect(queryFnMock).toHaveBeenCalledTimes(1);

    // Now the refetch interval has elapsed, so refetch should be in progress.
    act(() => void jest.advanceTimersByTime(501));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should query when reconnected', async () => {
    const { result, rerender } = renderHook((options: QueryOptions) => useQuery([], queryFnMock, options));

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isFetching).toEqual(false));

    act(() => void fireEvent(window, new Event('online')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    // Not when already fetching.
    act(() => void fireEvent(window, new Event('online')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    // Not when disabled
    await waitFor(() => expect(result.current.isFetching).toEqual(false));

    // Not when disabled
    rerender({ refetchOnReconnect: false });
    act(() => void fireEvent(window, new Event('online')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should query when the window is focused', async () => {
    const { result, rerender } = renderHook((options: QueryOptions) => useQuery([], queryFnMock, options));

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isFetching).toEqual(false));

    act(() => void fireEvent(window, new Event('focus')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    // Not when already fetching.
    act(() => void fireEvent(window, new Event('focus')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    // Not when disabled
    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    rerender({ refetchOnWindowFocus: false });
    act(() => void fireEvent(window, new Event('focus')));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should cancel the previous query when a new query starts', async () => {
    const { result, rerender } = renderHook((key: unknown[] = ['a']) => useQuery(key, queryFnMock));

    expect(queryFnMock).toHaveBeenCalledTimes(1);

    // Manual refetch
    act(() => result.current.refetch());
    expect(queryFnMock).toHaveBeenCalledTimes(2);
    expect(queryFnMock.mock.calls.at(-2)?.[0].signal.aborted).toEqual(true);

    // NOT on manual refetch with cancelRefetch set to false.
    act(() => result.current.refetch({ cancelRefetch: false }));
    expect(queryFnMock).toHaveBeenCalledTimes(2);

    // Key change refetch
    rerender(['b']);
    expect(queryFnMock).toHaveBeenCalledTimes(3);
    expect(queryFnMock.mock.calls.at(-2)?.[0].signal.aborted).toEqual(true);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should always use the most recent query function instance', async () => {
    const queryFnUpdate = jest.fn().mockResolvedValue('bar');
    const { result, rerender } = renderHook((queryFn: QueryFn = queryFnMock) => useQuery(['a'], queryFn));

    expect(queryFnMock).toHaveBeenCalledTimes(1);

    // Changing the function shouldn't cause a refetch.
    rerender(queryFnUpdate);
    expect(queryFnMock).toHaveBeenCalledTimes(1);

    // The next fetch should use the updated query function.
    act(() => result.current.refetch());
    expect(queryFnMock).toHaveBeenCalledTimes(1);
    expect(queryFnUpdate).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
  });

  it('should abort fetch on unmount', async () => {
    const { unmount } = renderHook(() => useQuery(['a'], queryFnMock));

    expect(queryFnMock).toHaveBeenCalledTimes(1);
    unmount();
    expect(queryFnMock.mock.calls.at(-1)?.[0].signal.aborted).toEqual(true);
  });

  it('should unmount without error when no query is running', async () => {
    jest.useRealTimers();
    const { result, unmount } = renderHook(() => useQuery(['a'], queryFnMock));

    await waitFor(() => expect(result.current.isFetching).toEqual(false));
    expect(queryFnMock).toHaveBeenCalledTimes(1);
    expect(queryFnMock.mock.calls.at(-1)?.[0].signal.aborted).toEqual(false);
    unmount();
    await new Promise((resolve) => setTimeout(resolve));
  });
});

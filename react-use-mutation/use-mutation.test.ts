/* eslint-disable canonical/sort-keys */
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import { useMutation } from './use-mutation.js';

describe('useQuery', () => {
  let mutationFnMock: jest.Mock;

  beforeEach(() => {
    mutationFnMock = jest.fn().mockResolvedValue('foo');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should imperatively mutate', async () => {
    const { result } = renderHook(() => useMutation(mutationFnMock));

    // Does nothing on mount
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Begin the mutation, passing variables through to the mutationFn
    act(() => result.current.mutate('variables'));
    expect(mutationFnMock).toHaveBeenCalledTimes(1);
    expect(mutationFnMock).toHaveBeenCalledWith('variables');
    expect(result.current.isLoading).toEqual(true);

    // Has success state on resolve
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toEqual('foo');
    expect(result.current.error).toBeUndefined();

    // Clears data on mutate
    mutationFnMock.mockRejectedValueOnce(new Error('error'));
    act(() => result.current.mutate());
    expect(mutationFnMock).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toEqual(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Has error state on reject
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);

    // Clears error on mutate
    act(() => result.current.mutate());
    expect(mutationFnMock).toHaveBeenCalledTimes(3);
    expect(result.current.isLoading).toEqual(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should ignore the previous mutation when a new mutation starts', async () => {
    mutationFnMock.mockReturnValueOnce(new Promise((resolve) => setTimeout(() => resolve('bar'), 1000)));

    const { result } = renderHook(() => useMutation(mutationFnMock));

    act(() => result.current.mutate());
    act(() => result.current.mutate());
    expect(mutationFnMock).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.data).toEqual('foo');

    act(() => void jest.advanceTimersByTime(2000));
    await expect(mutationFnMock.mock.results[0].value).resolves.toEqual('bar');
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.data).toEqual('foo');
  });

  it('should ignore mutate after unmount', async () => {
    const { result, unmount } = renderHook(() => useMutation(mutationFnMock));

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(mutationFnMock).toHaveBeenCalledTimes(1);

    unmount();
    act(() => result.current.mutate());
    expect(mutationFnMock).toHaveBeenCalledTimes(1);
  });
});

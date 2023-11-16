import { act, renderHook } from '@testing-library/react';

import { useMutation } from './use-mutation.js';

describe('useMutation', () => {
  let mutationFnMock: any;

  beforeEach(() => {
    mutationFnMock = vi.fn().mockResolvedValue('foo');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should imperatively mutate', async () => {
    const onMutate = vi.fn().mockResolvedValue('context');
    const onSettled = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMutation(mutationFnMock, { onMutate, onSettled }));

    // Does nothing on mount
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Begin the mutation, passing variables through to the mutationFn
    act(() => result.current.mutate('variables'));
    expect(result.current.isLoading).toEqual(true);

    await act(() => vi.waitFor(() => !result.current.isLoading));

    // Has success state on resolve
    expect(onMutate).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenLastCalledWith('foo', undefined, 'variables', 'context');
    expect(mutationFnMock).toHaveBeenCalledTimes(1);
    expect(mutationFnMock).toHaveBeenCalledWith('variables');
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toEqual('foo');
    expect(result.current.error).toBeUndefined();

    // Clears data on mutate
    mutationFnMock.mockRejectedValueOnce(new Error('error'));
    act(() => result.current.mutate('variables2'));
    expect(result.current.isLoading).toEqual(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    // Has error state on reject
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(onMutate).toHaveBeenCalledTimes(2);
    expect(onSettled).toHaveBeenCalledTimes(2);
    expect(onSettled).toHaveBeenLastCalledWith(undefined, expect.any(Error), 'variables2', 'context');
    expect(mutationFnMock).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);

    // Clears error on mutate
    act(() => result.current.mutate());
    expect(result.current.isLoading).toEqual(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(mutationFnMock).toHaveBeenCalledTimes(3);
  });

  it('should clear value and error when reset is called', async () => {
    const { result } = renderHook(() => useMutation(mutationFnMock));

    // Do a successful mutation.
    act(() => result.current.mutate());
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(result.current.data).toBeDefined();

    // Reset should clear the data.
    act(() => result.current.reset());
    expect(result.current.data).toBeUndefined();

    // Do a failed mutation.
    mutationFnMock.mockRejectedValueOnce(new Error('error'));
    act(() => result.current.mutate());
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(result.current.error).toBeDefined();

    // Reset should clear the error.
    act(() => result.current.reset());
    expect(result.current.error).toBeUndefined();
  });

  it('should ignore the previous mutation when a new mutation starts', async () => {
    mutationFnMock.mockReturnValueOnce(new Promise((resolve) => setTimeout(() => resolve('bar'), 1000)));

    const { result } = renderHook(() => useMutation(mutationFnMock));

    act(() => result.current.mutate());
    expect(result.current.isLoading).toEqual(true);
    act(() => result.current.mutate());
    expect(result.current.isLoading).toEqual(true);
    await act(() => vi.waitFor(() => !result.current.isLoading));

    expect(mutationFnMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual('foo');

    act(() => void vi.advanceTimersByTime(2000));
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(mutationFnMock.mock.results[0]!.value).toEqual('bar');
    expect(result.current.data).toEqual('foo');
  });

  it('should ignore mutate after unmount', async () => {
    const { result, unmount } = renderHook(() => useMutation(mutationFnMock));

    act(() => result.current.mutate());
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(mutationFnMock).toHaveBeenCalledTimes(1);

    unmount();
    act(() => result.current.mutate());
    await act(() => vi.waitFor(() => !result.current.isLoading));
    expect(mutationFnMock).toHaveBeenCalledTimes(1);
  });
});

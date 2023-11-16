import { retry } from './retry.js';

describe('retry', () => {
  let handler: any;
  let setTimeoutSpy: any;

  beforeEach(() => {
    setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((callback): any => void callback());
    handler = vi.fn().mockResolvedValue('success');
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  it('should not retry on success', async () => {
    await expect(retry(handler)).resolves.toEqual('success');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  [undefined, 0, 2, 3].forEach((retries) => {
    it(`should retry ${retries ?? '2 (default)'} times on failure`, async () => {
      const expectedRetries = retries ?? 2;
      for (let i = expectedRetries; i > 0; i--) {
        handler.mockRejectedValueOnce(new Error('wrong'));
      }
      handler.mockRejectedValueOnce(new Error('right'));
      const promise = retry(handler, { retries });
      await expect(promise).rejects.toBeInstanceOf(Error);
      await expect(promise).rejects.toEqual(expect.objectContaining({ message: 'right' }));
      expect(handler).toHaveBeenCalledTimes(expectedRetries + 1);
    });
  });

  it('should use a delay number', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, { delay: 1000, retries: 1 });
    await expect(promise).resolves.toEqual('success');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.anything(), 1000);
  });

  it('should use a delay number array', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    handler.mockRejectedValueOnce(new Error('failed'));
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, { delay: [1000, 2000], retries: 3 });
    await expect(promise).resolves.toEqual('success');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(1, expect.anything(), 1000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(2, expect.anything(), 2000);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(3, expect.anything(), 2000);
  });

  it('should use the custom onRetry handler delay', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, { onRetry: () => 2000, retries: 1 });
    await expect(promise).resolves.toEqual('success');
    expect(handler).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.anything(), 2000);
  });

  it('should use the default delay (none) when the custom onRetry handler returns true', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, { onRetry: () => true, retries: 1 });
    await expect(promise).resolves.toEqual('success');
    expect(handler).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  it('should not retry when the custom onRetry handler returns false', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, { onRetry: () => false, retries: 1 });
    await expect(promise).rejects.toBeInstanceOf(Error);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  [true, undefined].forEach((onRetryReturn) => {
    it(`should retry when the custom onRetry handler returns ${onRetryReturn}`, async () => {
      handler.mockRejectedValueOnce(new Error('failed'));
      const promise = retry(handler, { onRetry: () => onRetryReturn, retries: 1 });
      await expect(promise).resolves.toEqual('success');
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  it('should not retry when the custom onRetry handler throws', async () => {
    handler.mockRejectedValueOnce(new Error('failed'));
    const promise = retry(handler, {
      onRetry: () => {
        throw new Error('onRetry failed');
      },
      retries: 1,
    });
    await expect(promise).rejects.toBeInstanceOf(Error);
    await expect(promise).rejects.toMatchObject({ message: 'onRetry failed' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should throw AbortError if the signal is aborted before the handler is called', async () => {
    const ac = new AbortController();
    ac.abort();
    const promise = retry(handler, { retries: 1, signal: ac.signal });
    await expect(promise).rejects.toBeInstanceOf(Error);
    await expect(promise).rejects.toMatchObject({ code: 20, message: 'ABORT_ERR', name: 'AbortError' });
  });

  it('should not retry when signal is aborted', async () => {
    const ac = new AbortController();
    handler.mockImplementationOnce(async () => {
      ac.abort();
      throw new Error('failed');
    });
    const promise = retry(handler, { retries: 1, signal: ac.signal });
    await expect(promise).rejects.toBeInstanceOf(Error);
    await expect(promise).rejects.toMatchObject({ message: 'failed' });
  });
});

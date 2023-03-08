import { act, renderHook } from '@testing-library/react';

import { useViewportSize } from './use-viewport-size.js';

describe('react-use-viewport-size', () => {
  test('updates on widow resize', () => {
    jest.useFakeTimers();
    Object.assign(window, { innerHeight: 100, innerWidth: 200 });

    const addEventListener = jest.spyOn(window, 'addEventListener');
    const removeEventListener = jest.spyOn(window, 'removeEventListener');
    const requestAnimationFrame = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => window.setTimeout(callback));
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle) => clearTimeout(handle));

    const { result, unmount } = renderHook(() => useViewportSize());

    expect(result.current).toMatchObject({ height: 100, width: 200 });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current).toMatchObject({ height: 100, width: 200 });

    act(() => {
      Object.assign(window, { innerHeight: 150, innerWidth: 250 });
      window.dispatchEvent(new Event('resize'));
      jest.runAllTimers();
    });

    expect(result.current).toMatchObject({ height: 150, width: 250 });

    const updateCount = requestAnimationFrame.mock.calls.length;

    act(() => {
      Object.assign(window, { innerHeight: 150, innerWidth: 250 });
      window.dispatchEvent(new Event('resize'));
      Object.assign(window, { innerHeight: 125, innerWidth: 225 });
      window.dispatchEvent(new Event('resize'));
      jest.runAllTimers();
    });

    expect(result.current).toMatchObject({ height: 125, width: 225 });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(updateCount + 1);

    unmount();

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });

  test('cancels animation frame on unmount', () => {
    jest.useFakeTimers();
    Object.assign(window, { innerHeight: 100, innerWidth: 200 });

    const requestAnimationFrame = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => window.setTimeout(callback));
    const cancelAnimationFrame = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((handle) => clearTimeout(handle));

    const { unmount } = renderHook(() => useViewportSize());

    act(() => {
      Object.assign(window, { innerHeight: 150, innerWidth: 250 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    unmount();

    expect(cancelAnimationFrame).toBeCalledTimes(1);
  });
});

import { act, renderHook } from '@testing-library/react-hooks';

import { useBoolean } from './use-boolean';

describe('use-boolean', () => {
  test('default initial value', () => {
    const { result } = renderHook(useBoolean);
    expect(result.current.value).toBe(false);
  });

  test('initial state false', () => {
    const { result } = renderHook(() => useBoolean(false));
    expect(result.current.value).toBe(false);
  });

  test('initial state true', () => {
    const { result } = renderHook(() => useBoolean(true));
    expect(result.current.value).toBe(true);
  });

  test('changing initial state value has no effect', () => {
    const { result, rerender } = renderHook((props: { initialValue: boolean }) => useBoolean(props.initialValue), {
      initialProps: { initialValue: true },
    });
    expect(result.current.value).toBe(true);
    rerender({ initialValue: false });
    expect(result.current.value).toBe(true);
  });

  test('setters', () => {
    const { result } = renderHook(useBoolean);
    expect(result.current.value).toBe(false);
    act(() => result.current.setTrue());
    expect(result.current.value).toBe(true);
    act(() => result.current.setFalse());
    expect(result.current.value).toBe(false);
    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.value).toBe(false);
    act(() => result.current.setValue(true));
    expect(result.current.value).toBe(true);
    act(() => result.current.setValue(false));
    expect(result.current.value).toBe(false);
  });
});

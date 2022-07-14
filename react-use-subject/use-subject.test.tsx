import { act, renderHook } from '@testing-library/react';
import { type FC, type PropsWithChildren } from 'react';

import { type SubjectLike, createSubjectContext, useSubject } from './use-subject';

const createMockSubject = ({
  value = 0,
  subscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  next,
}: Partial<SubjectLike<number>> = {}): SubjectLike<number> => {
  return { next, subscribe, value };
};

describe('react-use-subject', () => {
  test('useSubject (readonly)', () => {
    const subject = createMockSubject();
    const { result, unmount } = renderHook(() => useSubject(subject));
    expect(subject.subscribe).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual(0);
    expect(result.current[1](1)).toBe(false);
    act(() => {
      jest.mocked(subject.subscribe).mock.calls.at(-1)?.[0](2);
    });
    expect(result.current[0]).toBe(2);
    unmount();
    expect(subject.subscribe(() => undefined).unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('useSubject (writable)', () => {
    const subject = createMockSubject({ next: jest.fn() });
    const { result, unmount } = renderHook(() => useSubject(subject));
    expect(subject.subscribe).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toEqual(0);
    expect(result.current[1](1)).toBe(true);
    expect(subject.next).toHaveBeenCalledTimes(1);
    expect(subject.next).toHaveBeenLastCalledWith(1);
    Object.assign(subject, { value: 1 });
    const setter = jest.fn().mockReturnValue(2);
    result.current[1](setter);
    expect(setter).toHaveBeenCalledTimes(1);
    expect(setter).toHaveBeenLastCalledWith(1);
    expect(subject.next).toHaveBeenCalledTimes(2);
    expect(subject.next).toHaveBeenLastCalledWith(2);
    unmount();
    expect(subject.subscribe(() => undefined).unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('useSubject (immediate)', () => {
    const subject = createMockSubject();
    let value = 0;
    jest.mocked(subject.subscribe).mockImplementation((next) => {
      next(value++);
      return { unsubscribe: jest.fn() };
    });
    const { result } = renderHook(() => useSubject(subject));
    expect(result.current[0]).toBe(0);
  });

  test('createSubjectContext', () => {
    const [useTest] = createSubjectContext(1);
    const { result } = renderHook(useTest);
    expect(result.current[0]).toBe(1);
  });

  test('createSubjectContext with context', () => {
    const [useTest, TestContext] = createSubjectContext(1);
    const subject = createMockSubject({ next: jest.fn() });
    const wrapper: FC<PropsWithChildren> = ({ children }) => {
      return <TestContext.Provider value={subject}>{children}</TestContext.Provider>;
    };
    const { result } = renderHook(useTest, { wrapper });
    expect(result.current[0]).toBe(0);
    act(() => {
      result.current[1](2);
    });
    expect(subject.next).toHaveBeenCalledTimes(1);
    expect(subject.next).toHaveBeenLastCalledWith(2);
  });
});

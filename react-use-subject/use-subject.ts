import { type Context, createContext, useCallback, useContext, useEffect, useState } from 'react';

type SubjectLike<TValue> = {
  readonly next?: (nextValue: TValue) => void;
  readonly subscribe: (listener: (value: TValue) => void) => { readonly unsubscribe: () => void };
  readonly value: TValue;
};

type SubjectHookResult<TValue> = readonly [
  value: TValue,
  setValue: (dispatch: TValue | ((current: TValue) => TValue)) => boolean,
];

const isDispatchFunction = <TValue>(
  value: TValue | ((current: TValue) => TValue),
): value is (current: TValue) => TValue => {
  return typeof value === 'function';
};

/**
 * Subscribe to a subject for the lifetime of a React component.
 *
 * @param subject Subject-like object (`value`, `subscribe`, and optionally `next` properties).
 */
const useSubject = <TValue>(subject: SubjectLike<TValue>): SubjectHookResult<TValue> => {
  const [value, setValueInternal] = useState(subject.value);
  const setValue = useCallback(
    (dispatch: TValue | ((current: TValue) => TValue)): boolean => {
      if (typeof subject.next !== 'function') {
        return false;
      }

      subject.next(isDispatchFunction(dispatch) ? dispatch(subject.value) : dispatch);

      return true;
    },
    [subject],
  );

  useEffect(() => {
    /**
     * Ignore the first callback if the subject calls the listener immediately
     * (eg. RxJS BehaviorSubject).
     */
    let set: (newValue: TValue) => void = () => {
      return;
    };

    const subscription = subject.subscribe((newValue) => {
      set(newValue);
    });

    set = setValueInternal;
    set(subject.value);

    return () => {
      subscription.unsubscribe();
    };
  }, [subject]);

  return [value, setValue];
};

/**
 * Create a React context and hook for a subject type.
 */
type createSubjectContext = {
  /**
   * Create a React context and hook for a subject type.
   *
   * Returns undefined if no subject is provided by the current React context.
   */
  <TValue = undefined>(): readonly [
    hook: () => SubjectHookResult<TValue | undefined>,
    context: Context<SubjectLike<TValue | undefined>>,
  ];
  /**
   * Create a React context and hook for a subject type.
   *
   * Returns the `defaultValue` if no subject is provided by the current React
   * context.
   */
  <TValue = undefined>(defaultValue?: TValue): readonly [
    hook: () => SubjectHookResult<TValue>,
    context: Context<SubjectLike<TValue>>,
  ];
};

const createSubjectContext: createSubjectContext = <TValue = undefined>(
  defaultValue?: TValue,
): [hook: () => SubjectHookResult<TValue>, context: Context<SubjectLike<TValue>>] => {
  const context = createContext<SubjectLike<TValue>>({
    subscribe: () => {
      return {
        unsubscribe: () => {
          return;
        },
      };
    },
    value: defaultValue as unknown as TValue,
  });
  const useSubjectContext = () => {
    return useSubject(useContext(context));
  };

  return [useSubjectContext, context];
};

export { type SubjectLike, createSubjectContext, useSubject };

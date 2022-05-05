import { type Dispatch, type SetStateAction, useCallback, useState } from 'react';

/**
 * State returned by the {@link useBoolean} hook.
 */
type BooleanState = {
  /**
   * Set the boolean state to false.
   */
  readonly setFalse: () => void;
  /**
   * Set the boolean state to true.
   */
  readonly setTrue: () => void;
  /**
   * Set the boolean state to a specific value.
   */
  readonly setValue: Dispatch<SetStateAction<boolean>>;
  /**
   * Switch the state from true to false, or false to true.
   */
  readonly toggle: () => void;
  /**
   * Current boolean state value.
   */
  readonly value: boolean;
};

/**
 * Use a boolean state value.
 *
 * All methods returned by this hook are stable, and will not change during
 * the lifetime of the component instance.
 *
 * @param initialValue Set the initial state value (Default: false)
 */
const useBoolean = (initialValue = false): BooleanState => {
  const [value, setValue] = useState(initialValue);
  const setTrue = useCallback(() => {
    setValue(true);
  }, []);
  const setFalse = useCallback(() => {
    setValue(false);
  }, []);
  const toggle = useCallback(() => {
    setValue((current) => !current);
  }, []);

  return { setFalse, setTrue, setValue, toggle, value };
};

export { type BooleanState, useBoolean };

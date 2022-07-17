import { type CSSProperties, type ReactElement, type ReactNode, useEffect, useState } from 'react';

type FillWindowProps = {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly style?: CSSProperties;
};

/**
 * Use the `window.innerHeight value, updated when the window resizes.
 */
const useWindowInnerHeight = (): number => {
  const [height, setHeight] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => {
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return height;
};

/**
 * A `div` that fills the browser window _without_ scroll bars, even on mobile
 * devices with browser navigation controls that are dynamically visible.
 *
 * The `min-height` value of the `div` is always equal to `window.innerHeight`.
 * Using `min-height` (instead of `height`) allows the container to grow if its
 * content is larger than the visible content area of the window.
 */
const FillWindow = ({ style, children, ...props }: FillWindowProps): ReactElement => {
  const innerHeight = useWindowInnerHeight();

  return (
    <div {...props} style={{ boxSizing: 'border-box', minHeight: innerHeight, ...style }}>
      {children}
    </div>
  );
};

export { type FillWindowProps, FillWindow, useWindowInnerHeight };

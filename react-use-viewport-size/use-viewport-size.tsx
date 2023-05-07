import { useEffect, useRef, useState } from 'react';

/**
 * Use the viewport dimensions (window inner height and width).
 *
 * Returns a new value when the window is resized. Updates are slightly
 * throttled by deferring to the next animation frame.
 */
const useViewportSize = (): { height: number; width: number } => {
  const af = useRef<number | undefined>();
  const [size, setSize] = useState({ height: window.innerHeight, width: window.innerWidth });

  useEffect(() => {
    const update = (): void => {
      if (af.current != null) {
        return;
      }

      af.current = requestAnimationFrame(() => {
        af.current = undefined;
        setSize((current) => {
          return current.height !== window.innerHeight && current.width !== window.innerWidth
            ? { height: window.innerHeight, width: window.innerWidth }
            : current;
        });
      });
    };

    update();
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);

      if (af.current != null) {
        cancelAnimationFrame(af.current);
      }
    };
  }, []);

  return size;
};

export { useViewportSize };

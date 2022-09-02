import { act, render, renderHook } from '@testing-library/react';

import { FillWindow, useWindowInnerHeight } from './fill-window.js';

test('useWindowInnerHeight', () => {
  Object.assign(window, { innerHeight: 100 });

  const addEventListener = jest.spyOn(window, 'addEventListener');
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const { result, unmount } = renderHook(() => useWindowInnerHeight());

  expect(result.current).toBe(100);

  Object.assign(window, { innerHeight: 200 });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });

  expect(result.current).toBe(200);

  unmount();

  expect(addEventListener).toHaveBeenCalledTimes(1);
  expect(removeEventListener).toHaveBeenCalledTimes(1);
});

test('FillWindow', () => {
  Object.assign(window, { innerHeight: 100 });

  const { container } = render(
    <FillWindow id="a" className="b" style={{ color: 'red' }}>
      foo
    </FillWindow>,
  );

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="b"
        id="a"
        style="box-sizing: border-box; min-height: 100px; color: red;"
      >
        foo
      </div>
    </div>
  `);

  Object.assign(window, { innerHeight: 200 });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="b"
        id="a"
        style="box-sizing: border-box; min-height: 200px; color: red;"
      >
        foo
      </div>
    </div>
  `);
});

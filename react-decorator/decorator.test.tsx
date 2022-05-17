import { act, render } from '@testing-library/react';
import { type ReactNode, type VFC } from 'react';

import { Decorator } from './decorator';

const Decoration: VFC<{ readonly children?: ReactNode; readonly id?: string }> = ({ id, children }) => {
  return (
    <div id={id} className="decoration">
      {children}
    </div>
  );
};

const Empty = () => null;
const NotEmpty = () => <div>not empty</div>;
const RealMutationObserver = global.MutationObserver;
const FakeMutationObserver = jest.fn().mockReturnValue({
  disconnect: jest.fn(),
  observe: jest.fn(),
});

beforeEach(() => {
  global.MutationObserver = FakeMutationObserver;
});

afterEach(() => {
  global.MutationObserver = RealMutationObserver;
});

test('decorator', () => {
  const { container, rerender } = render(
    <Decorator decoration={Decoration}>
      <Empty />
    </Decorator>,
  );

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        data-decorator="empty"
        style="display: none;"
      />
    </div>
  `);

  rerender(
    <Decorator decoration={Decoration}>
      <NotEmpty />
    </Decorator>,
  );

  act(() => {
    FakeMutationObserver.mock.calls.at(-1)[0]();
  });

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="decoration"
      >
        <div
          data-decorator="not-empty"
        >
          <div>
            not empty
          </div>
        </div>
      </div>
    </div>
  `);

  rerender(
    <Decorator
      decoration={Decoration}
      decorationProps={{ id: 'decoration' }}
      container="section"
      containerProps={{ style: { margin: '1px' } }}
    >
      <NotEmpty />
    </Decorator>,
  );

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="decoration"
        id="decoration"
      >
        <section
          data-decorator="not-empty"
          style="margin: 1px;"
        >
          <div>
            not empty
          </div>
        </section>
      </div>
    </div>
  `);

  rerender(
    <Decorator decoration={Decoration}>
      <NotEmpty />
      <NotEmpty />
    </Decorator>,
  );

  act(() => {
    FakeMutationObserver.mock.calls.at(-1)[0]();
  });

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="decoration"
      >
        <div
          data-decorator="not-empty"
        >
          <div>
            not empty
          </div>
          <div>
            not empty
          </div>
        </div>
      </div>
    </div>
  `);

  rerender(
    <Decorator decoration={Decoration} containerProps={{ style: { margin: '1px' } }}>
      <Empty />
    </Decorator>,
  );

  act(() => {
    FakeMutationObserver.mock.calls.at(-1)[0]();
  });

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        data-decorator="empty"
        style="margin: 1px; display: none;"
      />
    </div>
  `);
});

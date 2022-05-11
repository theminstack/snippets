import { type InferFsmStates, createFsm } from './fsm';

describe('fsm', () => {
  test('creation and transitions', () => {
    const water = createFsm<{
      liquid: string;
      solid: number;
    }>()
      .transition('melt', { from: 'solid', to: 'liquid' })
      .transition('freeze', { from: 'liquid', to: 'solid' });

    const puddle: InferFsmStates<typeof water> = water.start('liquid', 'foo');
    const liquidPuddle: InferFsmStates<typeof water, 'liquid'> = puddle;

    expect(liquidPuddle).toEqual({
      state: 'liquid',
      transitions: { freeze: expect.any(Function) },
      value: 'foo',
    });

    const frozenPuddle: InferFsmStates<typeof water, 'solid'> = puddle.transitions.freeze(1);

    expect(frozenPuddle).toEqual({
      state: 'solid',
      transitions: { melt: expect.any(Function) },
      value: 1,
    });
  });

  test('ignore transition conflict', () => {
    const water = createFsm<{
      liquid: void;
      solid: void;
    }>()
      .transition('melt', { from: 'solid', to: 'liquid' })
      .transition('freeze', { from: 'liquid', to: 'solid' })
      .transition('freeze', { from: 'liquid', to: 'liquid' as never });

    const liquid = water.start('liquid');

    expect(liquid.transitions.freeze()).toEqual({
      state: 'solid',
      transitions: { melt: expect.any(Function) },
      value: undefined,
    });
  });
});

import { createEvents } from './events';

describe('events', () => {
  test('emit returns false if no listeners are registered', () => {
    const events = createEvents();
    expect(events.emit('event', undefined)).toBe(false);
  });

  test('emit calls listeners in order and returns true if listeners are registered', () => {
    const events = createEvents();
    let a = 0;
    let b = 0;
    const listenerA = jest.fn().mockImplementation(() => {
      a++;
    });
    const listenerB = jest.fn().mockImplementation(() => {
      expect(a - 1).toBe(b);
      b++;
    });
    events.on('event', listenerA);
    events.on('event', listenerB);
    expect(events.emit('event', 42)).toBe(true);
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerA).toHaveBeenLastCalledWith(42);
    expect(listenerB).toHaveBeenLastCalledWith(42);
  });

  test('emit only calls listeners for the emitted event', () => {
    const events = createEvents();
    const listener = jest.fn();
    events.on('event', listener);
    events.emit('other', 13);
    expect(listener).not.toHaveBeenCalled();
  });

  test('off removes listeners in the order they were added', () => {
    const events = createEvents();
    const order: string[] = [];
    const listenerA = () => {
      order.push('a');
    };
    const listenerB = () => {
      order.push('b');
    };
    events.on('event', listenerA);
    events.on('event', listenerB);
    events.on('event', listenerA);
    events.emit('event', 18);
    expect(order).toEqual(['a', 'b', 'a']);
    order.length = 0;
    events.off('event', listenerA);
    events.emit('event', 18);
    expect(order).toEqual(['b', 'a']);
  });

  test('off only removes matching listeners', () => {
    const events = createEvents();
    const listener = jest.fn();
    events.on('event', listener);
    events.off('other', listener);
    events.off('event', () => undefined);
    expect(events.emit('event', 7)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    events.off('event', listener);
    expect(events.emit('event', 7)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

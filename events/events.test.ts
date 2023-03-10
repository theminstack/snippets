import { Events } from './events.js';

describe('Events', () => {
  test('emit returns true or false', () => {
    const events = new Events();
    expect(events.emit('event')).toBe(false);
    const off = events.on('event', () => {});
    expect(events.emit('event')).toBe(true);
    off();
    expect(events.emit('event')).toBe(false);
  });

  test('emit calls listeners', () => {
    const events = new Events();
    const a = jest.fn();
    const b = jest.fn();
    const off = events.on('event', a);
    events.on('event', b);
    events.emit('event', 1, 2);
    expect(a).toHaveBeenLastCalledWith(1, 2);
    expect(b).toHaveBeenLastCalledWith(1, 2);
    a.mockClear();
    b.mockClear();
    off();
    events.emit('event', 'a', 'b');
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenLastCalledWith('a', 'b');
  });

  test('emit only calls listeners for the emitted event', () => {
    const events = new Events();
    const a = jest.fn();
    events.on('event', a);
    events.emit('other');
    expect(a).not.toHaveBeenCalled();
  });
});

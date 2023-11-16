import { hello } from './hello-world.js';

describe('hello-world', () => {
  ['world', 'jane', 'john'].forEach((who) => {
    test(`who: ${who}`, () => {
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
      hello('world');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenLastCalledWith('Hello, world!');
    });
  });
});

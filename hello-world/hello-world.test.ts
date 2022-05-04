import { hello } from './hello-world';

describe('hello-world', () => {
  ['world', 'jane', 'john'].forEach((who) => {
    test(`who: ${who}`, () => {
      jest.spyOn(console, 'log').mockImplementation();
      hello('world');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenLastCalledWith('Hello, world!');
    });
  });
});

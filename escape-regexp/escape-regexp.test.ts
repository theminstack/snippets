import { escapeRegExp } from './escape-regexp.js';

test('escape-regexp', () => {
  expect(escapeRegExp('|\\{}()[]^$+*?.-abc')).toBe('\\|\\\\\\{\\}\\(\\)\\[\\]\\^\\$\\+\\*\\?\\.\\x2dabc');

  const literal = escapeRegExp('.*');
  const rx = new RegExp(`^${literal}$`);
  expect(rx.test('.*')).toBe(true);
});

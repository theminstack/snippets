/**
 * Escape all regular expression special/meta characters in a string, such
 * that `new RegExp(escapeRegExp(value))` will match the `value` string
 * literally.
 *
 * **NOTE:** Uses a hex escape for hyphens, because a simple backslash escape
 * is not valid  with the unicode flag set (ie. `/\-/u` will throw an error).
 */
const escapeRegExp = (literal: string): string => {
  return literal.replace(/[|\\{}()[\]^$+*?.]/gu, '\\$&').replace(/-/gu, '\\x2d');
};

export { escapeRegExp };

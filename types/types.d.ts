/**
 * JS primitive types.
 */
type Primitive = bigint | boolean | number | string | symbol | null | undefined;
/**
 * Only allows assignment of anything nullish.
 */
type Nullish = null | undefined | void;
/**
 * Allows assignment of anything except nullish values.
 */
type NonNullish = {};
/**
 * Exclude nullish values from a type.
 */
type Mandatory<TValue> = Exclude<TValue, Nullish>;

/**
 * Convert a union type (`|`) to an intersection type (`&`).
 */
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer V) => any ? V : never;

/**
 * Get the keys of an object which allow undefined value assignment.
 */
type OptionalKeys<T> = { readonly [P in keyof T]: undefined extends T[P] ? P : never }[keyof T];
/**
 * Get the keys of an object which do not allow undefined value assignment.
 */
type RequiredKeys<T> = { readonly [P in keyof T]: undefined extends T[P] ? never : P }[keyof T];
/**
 * Make optional the keys of an object which allow undefined value assignment.
 */
type SmartPartial<T> = Partial<Pick<T, OptionalKeys<T>>> & Pick<T, RequiredKeys<T>>;

/**
 * If two or more objects are intersected (`{ foo: string } & { bar: string }`),
 * simplify the type to a single object with all the properties
 * (`{ foo: string; bar: string }`).
 */
// eslint-disable-next-line functional/prefer-readonly-type
type Simplify<T> = T extends Record<string, unknown> ? { [P in keyof T]: T[P] } : T;

export type {
  Mandatory,
  NonNullish,
  Nullish,
  OptionalKeys,
  Primitive,
  RequiredKeys,
  Simplify,
  SmartPartial,
  UnionToIntersection,
};

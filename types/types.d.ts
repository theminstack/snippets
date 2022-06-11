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
 * Strings which can be used with `typeof` operator.
 */
type TypeOfString = 'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined';

/**
 * Infer the `typeof` type from a `typeof` string.
 */
type TypeOfType<TString> = TString extends 'string'
  ? string
  : TString extends 'number'
  ? number
  : TString extends 'boolean'
  ? boolean
  : TString extends 'object'
  ? object
  : TString extends 'function'
  ? Function
  : TString extends 'bigint'
  ? bigint
  : TString extends 'symbol'
  ? symbol
  : TString extends 'undefined'
  ? undefined
  : unknown;

/**
 * Convert a union type (`|`) to an intersection type (`&`).
 */
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer V) => any ? V : never;

/**
 * Make optional the keys of an object which allow undefined value assignment.
 */
type SmartPartial<T> = Simplify<
  // eslint-disable-next-line functional/prefer-readonly-type
  UnionToIntersection<{ [P in keyof T]: undefined extends T[P] ? { [K in P]?: T[P] } : { [K in P]: T[P] } }[keyof T]>
>;

/**
 * _Developer Experience_
 *
 * If two or more objects are intersected (`{ foo: string } & { bar: string }`),
 * simplify the type to a single object with all the properties
 * (`{ foo: string; bar: string }`).
 */
// eslint-disable-next-line functional/prefer-readonly-type
type Simplify<T> = T extends Record<string, unknown> ? { [P in keyof T]: T[P] } : T;

// eslint-disable-next-line @typescript-eslint/sort-type-union-intersection-members
type _OverloadUnion<TOverload, TPartialOverload = unknown> = TPartialOverload & TOverload extends (
  ...args: infer TArgs
) => infer TReturn
  ? TPartialOverload extends TOverload
    ? never
    :
        | _OverloadUnion<TOverload, Pick<TOverload, keyof TOverload> & TPartialOverload & ((...args: TArgs) => TReturn)>
        | ((...args: TArgs) => TReturn)
  : never;

/**
 * Convert a function overload (aka: an intersection of function signatures)
 * into a union of the signatures.
 *
 * ```ts
 * type U = OverloadUnion<(() => 1) & ((a: 2) => 2)>;
 * // type U = (() => 1) | ((a: 2) => 2))
 * ```
 */
// eslint-disable-next-line functional/prefer-readonly-type
type OverloadUnion<TOverload extends (...args: any[]) => any> = Exclude<
  // eslint-disable-next-line @typescript-eslint/sort-type-union-intersection-members
  _OverloadUnion<(() => never) & TOverload>,
  TOverload extends () => never ? never : () => never
>;

export type {
  Mandatory,
  NonNullish,
  Nullish,
  OverloadUnion,
  Primitive,
  Simplify,
  SmartPartial,
  TypeOfString,
  TypeOfType,
  UnionToIntersection,
};

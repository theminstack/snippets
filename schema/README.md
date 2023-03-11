# Schema

Composable [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) for runtime type checking.

## Getting Started

Import the schema namespace. Using `$` is recommended for brevity.

```ts
import * as $ from './schema.js';
// Or, as an NPM package.
import * as $ from '@minstack/schema';
```

Construct a new custom schema from pre-existing schemas.

```ts
const isPerson = $.object({
  name: $.string(),
  age: $.number(),
});
```

Infer the typescript type from the custom schema (if required).

```ts
type Person = $.SchemaType<typeof isPerson>;
```

Use the custom schema to narrow the type of a variable.

```ts
if (isPersion(value)) {
  // Value type is narrowed to: Person
}
```

## Included Schemas

Simple schemas match the basic TS types.

- `string()`
- `number()`
- `bigint()`
- `boolean()`
- `symbol()`
- `callable()`
  - Match functions or constructors.
- `notDefined()`
- `defined`
- `nul()`
- `notNul()`
- `nil()`
  - Match null or undefined.
- `notNil()`
- `any()`
  - Match anything as type `any`.
- `unknown()`
  - Match anything as type `unknown`.

Configurable schemas accept values for matching.

- `enumeration(enumType: EnumLike)`
- `literal(...primitives: Primitive[])`
- `instance(...constructors: AnyConstructor[])`

Composition schemas merge other schemas (or predicates) into more complex schemas.

- `union(...predicates: AnyPredicate[])`
- `intersection(...predicates: AnyPredicate[])`
- `object(shape: Record<string, AnyPredicate>)`
- `tuple(...shape: AnyPredicate[])`
- `record(type?: AnyPredicate)`
- `array(type?: AnyPredicate)`

Utilities which are less commonly used, or normally only used internally.

- `schema<T>(predicate: (value: unknown) => value is T)`
  - Create a custom schema.
- `predicate<T>(predicate: (value: unknown) => value is T)`
  - Create a predicate (copy).
- `lazy(resolve: () => AnyPredicate)`
  - Delay resolving a predicate until needed (for recursive types).
- `assert(predicate: AnyPredicate, value: unknown, error?: ErrorLike)`
  - Throw if the predicate does not match the value.

## Custom Schema

Use the `schema` utility to create custom schemas with arbitrary validation logic. Creating a factory function which returns a new schema is recommended.

```ts
const isNumericString = () => {
  return $.schema<`${number}`>((value) => {
    return (
      typeof value === 'string' &&
      value.trim() !== '' &&
      !Number.isNaN(value as unknown as number);
  });
};
```

Use the custom schema like any other schema.

```ts
const isNumeric = $.union($.number(), isNumericString());

if (isNumeric(value)) {
  // Value type is narrowed to: number | `${number}`
}
```

## Extension Methods

All schemas have basic extension methods.

- `.or(predicate: AnyPredicate)`
  - Union.
- `.and(predicate: AnyPredicate)`
  - Intersection.
- `.optional()`
  - Union with `undefined`.

An optional string scheme could be created as follows.

```ts
const isOptionalString = $.string().optional();
```

All collection schemas (`object`, `tuple`, `record`, `array`) have additional extension methods.

- `.partial()`
  - Make all entries optional.
- `.required()`
  - Make all entries required.

The `array` schema has an additional extension.

- `.nonEmpty()`
  - Match arrays with length > 0.

The `object` schema has an additional extension.

- `.extend(shape: Record<string, AnyPredicate>)`
  - Add new properties or additional constraints (intersections) on existing properties.

## Type Assertions

It can be useful to throw an error when a predicate does not match a value.

```ts
$.assert($.string(), value, 'value is not a string');
```

After the assert, the type of `value` will be narrowed to the predicate type.

The above assertion is equivalent to the following conditional throw.

```ts
if (!$.string()(value)) {
  throw new TypeError('value is not a string');
}
```

## Recursive Types

Recursive (self referential) types are possible, but require a few extra steps because type inference doesn't handle self references (Errors: [TS7022](https://github.com/microsoft/TypeScript/blob/v4.9.5/src/compiler/diagnosticMessages.json#L6108), [TS2454](https://github.com/microsoft/TypeScript/blob/v4.9.5/src/compiler/diagnosticMessages.json#L2193)).

First, define the non-recursive part of the schema.

```ts
const isNode = $.object({ name: $.string() });
```

Then, derive the recursive type. This type is needed to explicitly type the recursive schema.

```ts
type Node = $.SchemaType<typeof isNode>;
type Tree = Node & { children: Tree[] };
```

And finally, extend the non-recursive schema to add recursion, and assign the final schema to an explicitly typed variable.

```ts
const isTree: $.ObjectSchema<Tree> = isNode.extend({
  children: $.array($.lazy(() => isTree)),
});
```

### Wrong ways to make recursive types

A `TS2454` error is raised without the `$.lazy` wrapper around the self reference. This is because the schema is used before it is defined.

```ts
const isTree: $.ObjectSchema<Tree> = isNode.extend({
  // Error: Variable 'isTree' is used before being assigned. ts(2454)
  children: $.array(isTree),
});
```

A `TS7022` error is raised when defining the recursive type in a single step. This is because typescript cannot automatically infer a type which references itself.

```ts
// Error: 'isTree' implicitly has type 'any' because it does not have a
//        type annotation and is referenced directly or indirectly in its
//        own initializer. ts(7022)
const isTree = $.object({
  name: $.string(),
  children: $.array($.lazy(() => isTree)),
});
```

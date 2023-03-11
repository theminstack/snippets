# Schema

Composable [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) for runtime type checking.

## Getting Started

Import the schema namespace (I recommend naming it `$` for brevity).

```ts
import * as $ from './schema.js';
```

Construct a custom schema by composing built-in schemas.

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
  // The value type is narrowed to Person here.
}
```

## Included Schemas

Simple schemas match the basic TS types.

- `string()`
- `number()`
- `bigint()`
- `boolean()`
- `symbol()`
- `callable()` - functions and constructors
- `notDefined()`
- `defined`
- `nul()`
- `notNul()`
- `nil()` - null or undefined
- `notNil()`
- `any()` - anything (as type `any`)
- `unknown()` - anything (as type `unknown`)

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
  - Delay use of a predicate until needed (allows for recursive types).
- `assert(predicate: AnyPredicate, value: unknown, error?: ErrorLike)`
  - Throw if the predicate does not match the value.

## Custom Schema

Use the `schema` utility to create custom schemas with arbitrary validation logic. Creating a factory function which returns the schema is recommended.

```ts
const isNumberString = () => {
  return $.schema<`${number}`>((value) => {
    return typeof value === 'string' && /^\d*$/.test(value);
  });
};
```

Use the custom schema like any other schema.

```ts
const isNumberLike = $.union($.number(), isNumberString());

if (isNumberLike(value)) {
  // The value type is narrowed to: number | `${number}`
}
```

## Extension Methods

All schemas have the following extension methods.

- `.or(predicate: AnyPredicate)` - union
- `.and(predicate: AnyPredicate)` - intersection
- `.optional()` - union with `undefined`

For instance, make a string or undefined schema.

```ts
const isOptionalString = $.string().optional();
```

All collection schemas (`object`, `tuple`, `record`, `array`) have special extension methods.

- `.partial()`
- `.required()`

The `array` schema has one additional extension which creates an array schema that must contain at least one entry.

- `.nonEmpty()`

The `object` schema has one additional extension adds new properties or additional constraints (intersections) on existing properties.

- `.extend(shape: Record<string, AnyPredicate>)`

## Type Assertions

Sometimes you just want to throw an error when a predicate does not match a value.

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

Then, derive the recursive type. We need this type so that the recursive schema's type is explicit.

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

Without the `$.lazy` wrapper around the self reference, you will see a `TS2454` error, which means you're trying to use the schema before it's defined.

```ts
const isTree: $.ObjectSchema<Tree> = isNode.extend({
  // Error: Variable 'isTree' is used before being assigned. ts(2454)
  children: $.array(isTree),
});
```

If you just try to define the recursive type in a single step, you will see a `TS7022` error, which means the schema type is implicitly `any`, because typescript has failed to automatically infer a type which references itself.

```ts
// Error: 'isTree' implicitly has type 'any' because it does not have a
//        type annotation and is referenced directly or indirectly in its
//        own initializer. ts(7022)
const isTree = $.object({
  name: $.string(),
  children: $.array($.lazy(() => isTree)),
});
```

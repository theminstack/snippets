# Schema

Complex runtime type checking with TypeScript type inference.

A schema is a complex [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates), which can be created by nesting other schemas.

For example, when calling an API and deserializing the response, the response type will be `any` (unknown). You have to check the structure of the data before it's safe to use.

```ts
const $articles = $.array(
  $.object({
    id: $.number,
    url: $.string,
    launches: $.array(
      $.object({
        id: $.number,
        provider: $.string,
      }),
    ),
  }),
);
```

This creates an `$articles` schema which (partially) matches the response from https://api.spaceflightnewsapi.net/v3/articles.

```ts
const response = await fetch('https://api.spaceflightnewsapi.net/v3/articles');
const articles = await response.json();

if ($articles.test(articles)) {
  // The "articles" variable is strongly typed here.
}
```

You can also infer the TypeScript type from the schema.

```ts
type Articles = SchemaType<typeof $articles>;
```

Which would give you a type equivalent to...

```ts
type Articles = [
  {
    id: number;
    url: string;
    launches: [
      {
        id: number;
        provider: string;
      }
    ];
  }
]
```

If you want to throw an error when validation fails, you can use the `parse` method instead of the `test` method.

```ts
const articles: Articles = $articles.parse(await response.json());
```

## Basic schemas

The following basic schemas are "built-in" and can be used to compose more complex schemas.

- `$.string` - String or boxed string.
- `$.number` - Number or boxed number.
- `$.bigint` - Big integer or boxed big integer.
- `$.boolean` - Boolean or boxed boolean.
- `$.symbol` - Symbol or boxed symbol.
- `$.null` - Match `null` exactly.
- `$.undefined` - Match `undefined` exactly.
- `$.enum(...values)` - Any of the (primitive) `values`, matched exactly.
- `$.function` - Any function, cast as `Function`.
- `$.array(schema?)` - An array with elements matching an (optional) element `schema`.
- `$.tuple(...schemas)` - A tuple with elements matching the `schemas`.
- `$.record(schema?)` - An indexed object with values matching an (optional) element `schema`.
- `$.object(schemas, index?)` - An object with known properties matching the `schemas` map, and unknown properties matching the (optional) `index` schema.
- `$.instance(class)` - An instance of a `class`.
- `$.unknown` - Anything, cast as `unknown`.
- `$.any` - Anything, cast as `any`.
- `$.union(...schemas)` - Anything matching at least one of the `schemas`.
- `$.intersection(...schemas)` - Anything matching all of the `schemas`.
- `$.custom(predicate)` - Anything matching a custom type `predicate`.

## Optional

Any schema can be made "optional", which adds `undefined` to the allowed types.

```ts
const $base = $.string; // Schema<string>
const $optional = $base.optional(); // Schema<string | undefined>

$base.test('string'); // true
$base.test(1); // false
$base.test(undefined); // false

$optional.test('string'); // true
$optional.test(1); // false
$optional.test(undefined); // true
```

This is equivalent to the following.

```ts
const $optionalString = $.union($.string, $.undefined);
```

## Partial

Object (`$.object`) and record (`$.record`) schemas can be made "partial", which makes all properties optional.

```ts
const $base = $.object({ foo: $.string }); // Schema<{ foo: string }>
const $partial = $base.partial(); // Schema<{ foo?: string | undefined }>

$base.test({ foo: '' }); // true
$base.test({ foo: 1 }); // false
$base.test({ foo: undefined }); // false
$base.test({}); // false

$partial.test({ foo: '' }); // true
$partial.test({ foo: 1 }); // false
$partial.test({ foo: undefined }); // true
$partial.test({}); // true
```
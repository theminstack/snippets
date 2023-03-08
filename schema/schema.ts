/* eslint max-lines: ["warn", 220] */
type Primitive = bigint | boolean | number | string | symbol | null | undefined;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer V) => any ? V : never;

type SmartPartial<T> = Simplify<
  UnionToIntersection<{ [P in keyof T]: undefined extends T[P] ? { [K in P]?: T[P] } : { [K in P]: T[P] } }[keyof T]>
>;

type Simplify<T> = T extends Record<string, unknown> ? { [P in keyof T]: T[P] } : T;

/**
 * Infer the parsed type from a schema.
 */
type SchemaType<TSchema> = TSchema extends Schema<infer TType> ? TType : never;
type SchemaTupleType<TSchemas> = { [P in keyof TSchemas]: SchemaType<TSchemas[P]> };
type SchemaObjectType<TSchemas, TIndexType> = Simplify<
  Record<string, TIndexType> & SmartPartial<SchemaTupleType<TSchemas>>
>;

type SchemaOptions = {
  onInvalid?(reason: string): void;
  readonly path?: readonly (number | string)[];
};

type SchemaContext = {
  onInvalid(reason?: string): void;
  /**
   * Readonly string/number array which stringifies to a JSON path.
   */
  readonly path: readonly (number | string)[];
};

type Schema<TType> = {
  /**
   * Shortcut to union this schema with `$.undefined`.
   */
  optional(): Schema<TType | undefined>;
  /**
   * Return the unmodified `value` if it matches the schema. Otherwise, throw
   * an error.
   */
  parse(value: unknown): TType;
  /**
   * Returns true if the `value` matches the schema. Otherwise, return false.
   * The `onInvalid` callback will be called for each JSON path that does not
   * match the schema.
   */
  test(value: unknown, options?: SchemaOptions): value is TType;
};
type SchemaObject<TType> = Schema<TType> & {
  /**
   * Re-construct the object/record schema with all properties as optional.
   */
  partial(): SchemaObject<Simplify<Partial<TType>>>;
};

const isObject = (value: any): value is Record<string, any> => typeof value === 'object' && value !== null;

const lazy = <TType>(callback: () => TType): (() => TType) => {
  let cached: { value: TType } | undefined;

  return () => {
    if (!cached) {
      cached = { value: callback() };
    }

    return cached.value;
  };
};

const create = <TType>(test: (value: unknown, context: SchemaContext) => value is TType): Schema<TType> => {
  const schema: Schema<TType> = {
    optional: lazy(() => $.union(schema, $.undefined)),
    parse: (value) => {
      schema.test(value, {
        onInvalid: (reason) => {
          throw new Error(reason);
        },
      });

      return value as TType;
    },
    test: (value, options = {}): value is TType => {
      let valid = true;
      let pathString: string | undefined;

      const { onInvalid, path = [] } = options;
      const context: SchemaContext = {
        onInvalid: (reason) => {
          valid = false;

          if (onInvalid) {
            onInvalid(reason ?? `Unexpected type at ${context.path}`);
          }
        },
        path: Object.assign(path, {
          toString: () => {
            if (pathString == null) {
              pathString = path.reduce<string>((result, segment) => {
                return (
                  result +
                  (typeof segment === 'string' && /^[a-z0-9_]+$/gi.test(segment)
                    ? `.${segment}`
                    : `[${JSON.stringify(segment)}]`)
                );
              }, '$');
            }

            return pathString;
          },
        }),
      };
      const success = test(value, context);

      if (!success && valid) {
        context.onInvalid();
      }

      return valid;
    },
  };

  return schema;
};

const createObject = <TPropSchemas extends Record<string, Schema<any>>, TIndexType>(
  props: TPropSchemas,
  index: Schema<TIndexType> | undefined,
): SchemaObject<SchemaObjectType<TPropSchemas, TIndexType>> => {
  const objectSchema: SchemaObject<SchemaObjectType<TPropSchemas, TIndexType>> = {
    ...create((value, context): value is SchemaObjectType<TPropSchemas, TIndexType> => {
      return (
        isObject(value) &&
        Object.entries(props).every(([key, schema]) =>
          schema.test(value[key], { ...context, path: [...context.path, key] }),
        ) &&
        (!index ||
          Object.entries(value).every(
            ([key, value_]) => key in props || index.test(value_, { ...context, path: [...context.path, key] }),
          ))
      );
    }),
    partial: lazy(() => {
      const partialProps: Record<string, Schema<any>> = {};
      Object.entries(props).forEach(([key, schema]) => (partialProps[key] = schema.optional()));
      return createObject(partialProps, index && index.optional()) as never;
    }),
  };

  return objectSchema;
};

// Memoized
const string = create((value): value is string => typeof value === 'string' || value instanceof String);
const number = create((value): value is number => typeof value === 'number' || value instanceof Number);
const bigint = create((value): value is bigint => typeof value === 'bigint' || value instanceof BigInt);
const boolean = create((value): value is boolean => typeof value === 'boolean' || value instanceof Boolean);
const symbol = create((value): value is symbol => typeof value === 'symbol' || value instanceof Symbol);
const undefined_ = create((value): value is undefined => typeof value === 'undefined');
const null_ = create((value): value is null => value === null);
const unknown = create((_value): _value is unknown => true);
const any = unknown as Schema<any>;
const function_ = create(
  (value): value is (...args: unknown[]) => unknown => typeof value === 'function' || value instanceof Function,
);

// Non-memoized
const instance = <TType>(constructor: new (...args: readonly any[]) => TType) =>
  create((value): value is TType => value instanceof constructor);
const enum_ = <TType extends readonly [Primitive, ...(readonly Primitive[])]>(...values: TType) =>
  create((value): value is TType[number] => values.includes(value as never));
const array = <TType>(schema?: Schema<TType>) =>
  create(
    (value, context): value is TType[] =>
      Array.isArray(value) &&
      (!schema || value.every((item, index) => schema.test(item, { ...context, path: [...context.path, index] }))),
  );
const tuple = <TSchemas extends readonly Schema<any>[]>(...elements: TSchemas) =>
  create(
    (value, context): value is SchemaTupleType<TSchemas> =>
      Array.isArray(value) &&
      elements.length === value.length &&
      elements.every((element, index) => element.test(value[index], { ...context, path: [...context.path, index] })),
  );
const record = <TType>(index?: Schema<TType>) => createObject({}, index);
const object = <TPropSchemas extends Record<string, Schema<any>>, TIndexType>(
  props: TPropSchemas,
  index?: Schema<TIndexType>,
) => createObject(props, index);

// Combinatorial
const union = <TSchemas extends readonly [Schema<any>, ...(readonly Schema<any>[])]>(...schemas: TSchemas) =>
  create((value): value is SchemaType<TSchemas[number]> => schemas.some((schema) => schema.test(value)));
const intersection = <TSchemas extends readonly [Schema<any>, ...(readonly Schema<any>[])]>(...schemas: TSchemas) =>
  create((value, context): value is UnionToIntersection<SchemaType<TSchemas[number]>> =>
    schemas.every((schema) => schema.test(value, context)),
  );

const $ = {
  ...{ any, array, bigint, boolean, custom: create, enum: enum_, function: function_, instance, intersection },
  ...{ null: null_, number, object, record, string, symbol, tuple, undefined: undefined_, union, unknown },
} as const;

export { type Schema, type SchemaContext, type SchemaObject, type SchemaOptions, type SchemaType, $ };

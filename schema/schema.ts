type Primitive = bigint | boolean | number | string | symbol | null | undefined;

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (x: infer V) => any ? V : never;

type OptionalKeys<T> = { readonly [P in keyof T]: undefined extends T[P] ? P : never }[keyof T];
type RequiredKeys<T> = { readonly [P in keyof T]: undefined extends T[P] ? never : P }[keyof T];
type SmartPartial<T> = Partial<Pick<T, OptionalKeys<T>>> & Pick<T, RequiredKeys<T>>;

// eslint-disable-next-line functional/prefer-readonly-type
type Simplify<T> = T extends Record<string, unknown> ? { [P in keyof T]: T[P] } : T;

/**
 * Infer the parsed type from a schema.
 */
type SchemaType<TSchema> = TSchema extends Schema<infer TType> ? TType : never;
// eslint-disable-next-line functional/prefer-readonly-type
type SchemaTupleType<TSchemas> = { [P in keyof TSchemas]: SchemaType<TSchemas[P]> };
type SchemaObjectType<TSchemas, TIndexType> = Simplify<
  Record<string, TIndexType> & SmartPartial<SchemaTupleType<TSchemas>>
>;

type SchemaOptions = {
  readonly onInvalid?: (reason: string) => void;
  readonly path?: readonly (number | string)[];
};

type SchemaContext = {
  readonly onInvalid: (reason?: string) => void;
  /**
   * Readonly string/number array which stringifies to a JSON path.
   */
  readonly path: readonly (number | string)[];
};

type Schema<TType> = {
  /**
   * Return the unmodified `value` if it matches the schema. Otherwise, throw
   * an error.
   */
  readonly parse: (value: unknown) => TType;
  /**
   * Returns true if the `value` matches the schema. Otherwise, return false.
   * The `onInvalid` callback will be called for each JSON path that does not
   * match the schema.
   */
  readonly test: (value: unknown, options?: SchemaOptions) => value is TType;
};

const isObject = (value: any): value is Record<string, any> => typeof value === 'object' && value !== null;

const custom = <TType>(test: (value: unknown, context: SchemaContext) => value is TType): Schema<TType> => {
  const schema: Schema<TType> = {
    parse: (value) => {
      schema.test(value, {
        onInvalid: (reason) => {
          throw new Error(reason);
        },
      });

      return value as TType;
    },
    test: (value, { onInvalid, path = [] } = {}): value is TType => {
      let valid = true;
      let pathString: string | undefined;

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

// Memoized
const string = custom((value): value is string => typeof value === 'string' || value instanceof String);
const number = custom((value): value is number => typeof value === 'number' || value instanceof Number);
const bigint = custom((value): value is bigint => typeof value === 'bigint' || value instanceof BigInt);
const boolean = custom((value): value is boolean => typeof value === 'boolean' || value instanceof Boolean);
const symbol = custom((value): value is symbol => typeof value === 'symbol' || value instanceof Symbol);
const undefined_ = custom((value): value is undefined => typeof value === 'undefined');
const null_ = custom((value): value is null => value === null);
const unknown = custom((_value): _value is unknown => true);
const any = unknown as Schema<any>;
const function_ = custom((value): value is Function => typeof value === 'function' || value instanceof Function);

// Non-memoized
const instance = <TType>(constructor: new (...args: readonly any[]) => TType) =>
  custom((value): value is TType => value instanceof constructor);
const enum_ = <TType extends readonly [Primitive, ...(readonly Primitive[])]>(...values: TType) =>
  custom((value): value is TType[number] => values.includes(value as never));
const array = <TType>(schema?: Schema<TType>) =>
  custom(
    (value, { path, ...context }): value is TType[] =>
      Array.isArray(value) &&
      (!schema || value.every((item, index) => schema.test(item, { path: [...path, index], ...context }))),
  );
const tuple = <TSchemas extends readonly Schema<any>[]>(...elements: TSchemas) =>
  custom(
    (value, { path, ...context }): value is SchemaTupleType<TSchemas> =>
      Array.isArray(value) &&
      elements.length === value.length &&
      elements.every((element, index) => element.test(value[index], { path: [...path, index], ...context })),
  );
const record = <TType>(index?: Schema<TType>) =>
  custom(
    (value, { path, ...context }): value is Record<string, TType> =>
      isObject(value) &&
      (!index || Object.entries(value).every(([key, item]) => index.test(item, { path: [...path, key], ...context }))),
  );
const object = <TPropSchemas extends Record<string, Schema<any>>, TIndexType>(
  props: TPropSchemas,
  index?: Schema<TIndexType>,
) =>
  custom(
    (value, { path, ...context }): value is SchemaObjectType<TPropSchemas, TIndexType> =>
      isObject(value) &&
      Object.entries(props).every(([key, schema]) => schema.test(value[key], { path: [...path, key], ...context })) &&
      (!index ||
        Object.entries(value).every(
          ([key, value_]) => key in props || index.test(value_, { path: [...path, key], ...context }),
        )),
  );

// Combinatorial
const union = <TSchemas extends readonly [Schema<any>, ...(readonly Schema<any>[])]>(...schemas: TSchemas) =>
  custom((value): value is SchemaType<TSchemas[number]> => schemas.some((schema) => schema.test(value)));
const intersection = <TSchemas extends readonly [Schema<any>, ...(readonly Schema<any>[])]>(...schemas: TSchemas) =>
  custom((value, context): value is UnionToIntersection<SchemaType<TSchemas[number]>> =>
    schemas.every((schema) => schema.test(value, context)),
  );

const $ = {
  ...{ any, array, bigint, boolean, custom, enum: enum_, function: function_, instance, intersection, null: null_ },
  ...{ number, object, record, string, symbol, tuple, undefined: undefined_, union, unknown },
} as const;

export { type Schema, type SchemaContext, type SchemaOptions, type SchemaType, $ };

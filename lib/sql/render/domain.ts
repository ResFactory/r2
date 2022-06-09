import * as safety from "../../safety/mod.ts";
import * as ax from "../../safety/axiom.ts";
import * as tmpl from "./template/mod.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

// ESSENTIAL TODO:do we need to "manually" compute the TsType through
// conditional types or can we infer it from ax.Axiom<?>
export type AxiomPrimitive<
  TPropAxioms,
  Property extends keyof TPropAxioms,
  Else = Any,
> = TPropAxioms[Property] extends ax.Axiom<string> ? string
  : (TPropAxioms[Property] extends ax.Axiom<number> ? number
    : (TPropAxioms[Property] extends ax.Axiom<bigint> ? bigint : Else));

interface DomainDefn {
  [key: string]: Any;
  length?: never;
}

type DomainIntersection<U> = (
  U extends Any ? (k: U) => void : never
) extends (k: infer I) => void ? I
  : never;

// istanbul ignore next
const isObject = (obj: Any) => {
  if (typeof obj === "object" && obj !== null) {
    if (typeof Object.getPrototypeOf === "function") {
      const prototype = Object.getPrototypeOf(obj);
      return prototype === Object.prototype || prototype === null;
    }

    return Object.prototype.toString.call(obj) === "[object Object]";
  }

  return false;
};

const mergeArrays = true;
export const mergeDomain = <T extends DomainDefn[]>(
  ...objects: T
): DomainIntersection<T[number]> =>
  objects.reduce((result, current) => {
    Object.keys(current).forEach((key) => {
      if (Array.isArray(result[key]) && Array.isArray(current[key])) {
        result[key] = mergeArrays
          ? Array.from(new Set((result[key] as unknown[]).concat(current[key])))
          : current[key];
      } else if (isObject(result[key]) && isObject(current[key])) {
        result[key] = mergeDomain(
          result[key] as DomainDefn,
          current[key] as DomainDefn,
        );
      } else {
        result[key] = current[key];
      }
    });

    return result;
  }, {}) as Any;

export type AxiomSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = ax.Axiom<TsValueType> & {
  readonly sqlDataType: (
    purpose:
      | "create table column"
      | "stored routine arg"
      | "table foreign key ref"
      | "PostgreSQL domain",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlPartial?: (
    destination:
      | "create table, full column defn"
      | "create table, column defn decorators"
      | "create table, after all column definitions",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>[] | undefined;
  readonly referenceASD: () => AxiomSqlDomain<
    TsValueType,
    EmitOptions,
    Context
  >;
  readonly isNullable: boolean;
};

export function isAxiomSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(o: unknown): o is AxiomSqlDomain<TsValueType, EmitOptions, Context> {
  const isASD = safety.typeGuard<
    AxiomSqlDomain<TsValueType, EmitOptions, Context>
  >("sqlDataType");
  return isASD(o);
}

export type IdentifiableSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  DomainIdentity extends string = string,
> =
  & AxiomSqlDomain<TsValueType, EmitOptions, Context>
  & {
    readonly reference: <ForeignIdentity>(
      options?: {
        readonly foreignIdentity?: ForeignIdentity;
      },
    ) => Omit<IdentifiableSqlDomain<Any, EmitOptions, Context>, "reference">;
    readonly identity: DomainIdentity;
  };

export function isIdentifiableSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  DomainIdentity extends string = string,
>(
  o: unknown,
): o is IdentifiableSqlDomain<
  TsValueType,
  EmitOptions,
  Context,
  DomainIdentity
> {
  const isISD = safety.typeGuard<
    IdentifiableSqlDomain<TsValueType, EmitOptions, Context, DomainIdentity>
  >("identity");
  return isAxiomSqlDomain(o) && isISD(o);
}

export function textNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: true,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function text<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: () => text(),
    ...asdOptions,
  };
}

export function date<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, EmitOptions, Context>>,
): AxiomSqlDomain<Date, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: false,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, EmitOptions, Context>>,
): AxiomSqlDomain<Date | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATE` }),
    isNullable: true,
    referenceASD: () => date(),
    ...asdOptions,
  };
}

export function dateTime<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date> = ax.$.date,
  asdOptions?: Partial<AxiomSqlDomain<Date, EmitOptions, Context>>,
): AxiomSqlDomain<Date, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: false,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function dateTimeNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  asdOptions?: Partial<AxiomSqlDomain<Date | undefined, EmitOptions, Context>>,
): AxiomSqlDomain<Date | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `DATETIME` }),
    isNullable: true,
    referenceASD: () => dateTime(),
    ...asdOptions,
  };
}

export function integer<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<number> = ax.$.number,
  asdOptions?: Partial<AxiomSqlDomain<number, EmitOptions, Context>>,
): AxiomSqlDomain<number, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: false,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function integerNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  asdOptions?: Partial<AxiomSqlDomain<number, EmitOptions, Context>>,
): AxiomSqlDomain<number | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: true,
    referenceASD: () => integer(),
    ...asdOptions,
  };
}

export function jsonText<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: false,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export function jsonTextNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: true,
    referenceASD: () => jsonText(),
    ...asdOptions,
  };
}

export function sqlDomains<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  props: TPropAxioms,
  sdOptions?: {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotAxiomSqlDomain } = sdOptions ?? {};
  const domains: IdentifiableSqlDomain<
    Any,
    EmitOptions,
    Context
  >[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomSqlDomain<Any, EmitOptions, Context>(axiom)) {
      const mutatableISD = axiom as safety.Writeable<
        IdentifiableSqlDomain<Any, EmitOptions, Context>
      >;
      mutatableISD.identity = name as Any;
      mutatableISD.reference = (rOptions) => {
        const result: Omit<
          IdentifiableSqlDomain<Any, EmitOptions, Context>,
          "reference"
        > = {
          identity: (rOptions?.foreignIdentity ?? name) as string,
          ...axiom.referenceASD(),
        };
        return result;
      };
      domains.push(mutatableISD);
    } else {
      onPropertyNotAxiomSqlDomain?.(name, axiom, domains);
    }
  });

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  return {
    ...axiom,
    domains,
  };
}

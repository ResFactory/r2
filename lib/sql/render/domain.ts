import * as safety from "../../safety/mod.ts";
import * as ax from "../../safety/axiom.ts";
import * as tmpl from "./template/mod.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export type AxiomSqlDomain<
  TsValueType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = ax.Axiom<TsValueType> & {
  readonly sqlDataType: (
    purpose:
      | "create table column"
      | "stored routine arg"
      | "table foreign key ref",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly referenceASD: (
    options?: { readonly isNullable?: boolean },
  ) => AxiomSqlDomain<Any, EmitOptions, Context>;
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
        readonly isNullable?: boolean;
      },
    ) => Omit<IdentifiableSqlDomain<Any, EmitOptions, Context>, "reference">;
    readonly identity: DomainIdentity;
  };

export type IdentifiableSqlDomains<
  Object,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  PropertyName extends keyof Object & string = keyof Object & string,
> = ax.AxiomObject<Object> & {
  readonly domains: IdentifiableSqlDomain<
    Any,
    EmitOptions,
    Context,
    PropertyName
  >[];
};

export function textNullable<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: ax.Axiom<string | undefined> = ax.$.string,
  asdOptions?: Partial<AxiomSqlDomain<string, EmitOptions, Context>>,
): AxiomSqlDomain<string | undefined, EmitOptions, Context> {
  return {
    ...axiom,
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: true,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? textNullable() : text();
    },
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
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? textNullable() : text();
    },
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
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: false,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? integerNullable() : integer();
    },
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
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `INTEGER` }),
    isNullable: true,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? integerNullable() : integer();
    },
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
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: false,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? jsonTextNullable() : jsonText();
    },
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
    ...asdOptions,
    sqlDataType: () => ({ SQL: () => `JSON` }),
    isNullable: true,
    referenceASD: (rasdOptions?) => {
      return rasdOptions?.isNullable ? jsonTextNullable() : jsonText();
    },
  };
}

export function sqlDomains<
  Object,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  PropertyName extends keyof Object & string = keyof Object & string,
>(
  axiom: ax.AxiomObject<Object>,
  sdOptions?: {
    readonly onPropertyNotAxiomSqlDomain?: (
      prop: ax.AxiomObjectProperty<Object>,
      domains: IdentifiableSqlDomain<Any, EmitOptions, Context, PropertyName>[],
    ) => void;
  },
): IdentifiableSqlDomains<Object, EmitOptions, Context> {
  const { onPropertyNotAxiomSqlDomain } = sdOptions ?? {};
  const domains: IdentifiableSqlDomain<
    Any,
    EmitOptions,
    Context,
    PropertyName
  >[] = [];
  axiom.properties.forEach((prop) => {
    if (isAxiomSqlDomain<Any, EmitOptions, Context>(prop.axiom)) {
      const typedAxiom = prop.axiom;
      domains.push({
        ...typedAxiom,
        identity: prop.axiomPropertyName as PropertyName,
        reference: (rOptions) => {
          const result: Omit<
            IdentifiableSqlDomain<Any, EmitOptions, Context>,
            "reference"
          > = {
            identity:
              (rOptions?.foreignIdentity ?? prop.axiomPropertyName) as string,
            ...typedAxiom.referenceASD(rOptions),
          };
          return result;
        },
      });
    } else {
      onPropertyNotAxiomSqlDomain?.(prop, domains);
    }
  });
  return {
    ...axiom,
    domains,
  };
}

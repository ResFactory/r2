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
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly sqlDefaultValue?: (
    purpose: "create table column" | "stored routine arg",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
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
  & { readonly identity: DomainIdentity };

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
      domains.push({
        ...prop.axiom,
        identity: prop.axiomPropertyName as PropertyName,
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

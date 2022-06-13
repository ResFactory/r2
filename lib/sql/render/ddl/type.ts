import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlTypeDefinition<
  TypeName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context> {
  readonly typeName: TypeName;
}

export function isSqlTypeDefinition<
  TypeName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is SqlTypeDefinition<TypeName, Context> {
  const isViewDefn = safety.typeGuard<
    SqlTypeDefinition<TypeName, Context>
  >("typeName", "SQL");
  return isViewDefn(o);
}

export interface SqlTypeDefnOptions<
  TypeName extends string,
  FieldName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplierOptions<Context> {
  readonly before?: (
    viewName: TypeName,
    vdOptions: SqlTypeDefnOptions<TypeName, FieldName, Context>,
  ) => tmpl.SqlTextSupplier<Context>;
}

export function sqlTypeDefinition<
  TypeName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  typeName: TypeName,
  props: TPropAxioms,
  vdOptions?: SqlTypeDefnOptions<TypeName, ColumnName, Context> & {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: d.IdentifiableSqlDomain<Any, Context>[],
    ) => void;
  },
) {
  const sd = d.sqlDomains(props, vdOptions);
  const typeDefn: SqlTypeDefinition<TypeName, Context> = {
    typeName,
    SQL: (ctx) => {
      const { sqlTextEmitOptions: steOptions } = ctx;
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
      });
      const ctfi = steOptions.indentation("define type field");
      const create = steOptions.indentation(
        "create type",
        `CREATE TYPE ${ns.typeName(typeName)} AS (\n${ctfi}${
          sd.domains.map((
            r,
          ) => (`${ns.typeFieldName({ typeName, fieldName: r.identity })} ${
            r.sqlDataType("type field").SQL(
              ctx,
            )
          }`)).join(`,\n${ctfi}`)
        }\n)`,
      );
      return vdOptions?.before
        ? ctx.embeddedSQL<Context>()`${[
          vdOptions.before(typeName, vdOptions),
          create,
        ]}`.SQL(ctx)
        : create;
    },
  };
  return {
    ...sd,
    ...typeDefn,
    drop: (options?: { ifExists?: boolean }) => dropType(typeName, options),
  };
}

export function dropType<
  ViewName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  viewName: ViewName,
  dvOptions?: { ifExists?: boolean },
): tmpl.SqlTextSupplier<Context> {
  const { ifExists = true } = dvOptions ?? {};
  return {
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
      });
      return `DROP TYPE ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}

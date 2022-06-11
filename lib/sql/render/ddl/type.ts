import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlTypeDefinition<
  TypeName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly typeName: TypeName;
}

export function isSqlTypeDefinition<
  TypeName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is SqlTypeDefinition<TypeName, EmitOptions, Context> {
  const isViewDefn = safety.typeGuard<
    SqlTypeDefinition<TypeName, EmitOptions, Context>
  >(
    "typeName",
    "SQL",
  );
  return isViewDefn(o);
}

export interface SqlTypeDefnOptions<
  TypeName extends string,
  FieldName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly before?: (
    viewName: TypeName,
    vdOptions: SqlTypeDefnOptions<TypeName, FieldName, EmitOptions, Context>,
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
}

export function sqlTypeDefinition<
  TypeName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  typeName: TypeName,
  props: TPropAxioms,
  vdOptions?: SqlTypeDefnOptions<TypeName, ColumnName, EmitOptions, Context> & {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) {
  const sd = d.sqlDomains(props, vdOptions);
  const typeDefn: SqlTypeDefinition<TypeName, EmitOptions, Context> = {
    typeName,
    SQL: (ctx, steOptions) => {
      const ns = steOptions.namingStrategy(ctx, {
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
              steOptions,
            )
          }`)).join(`,\n${ctfi}`)
        }\n)`,
      );
      return vdOptions?.before
        ? tmpl.SQL<Context, EmitOptions>(ctx)`${[
          vdOptions.before(typeName, vdOptions),
          create,
        ]}`
          .SQL(ctx, steOptions)
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  viewName: ViewName,
  dvOptions?: { ifExists?: boolean },
): tmpl.SqlTextSupplier<Context, EmitOptions> {
  const { ifExists = true } = dvOptions ?? {};
  return {
    SQL: (ctx, steOptions) => {
      const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
      return `DROP TYPE ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}

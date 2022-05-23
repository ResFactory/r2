import * as safety from "../../safety/mod.ts";
import * as govn from "./governance.ts";
import * as t from "./table.ts";

export function isSqlDialectSupplier<Context extends govn.SqlAssemblerContext>(
  o: unknown,
): o is govn.SqlDialectSupplier<Context> {
  const isSDS = safety.typeGuard<govn.SqlDialectSupplier<Context>>("dialect");
  return isSDS(o);
}

export function sqliteDialect<
  Context extends govn.SqlAssemblerContext,
>(): govn.SqlDialect<
  Context
> {
  return {
    tableColumnsFactory: (tableDefn) => t.typicalTableColumnsFactory(tableDefn),
    tableColumnDefnSqlTextSupplier: t.typicalTableColumnDefnSqlTextSupplier<
      Context,
      // deno-lint-ignore no-explicit-any
      any,
      // deno-lint-ignore no-explicit-any
      any
    >(),
    tableDecoratorsFactory: t.typicalTableDecoratorsFactory,
  };
}

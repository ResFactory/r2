import * as s from "./storage.ts";

export function sqliteTableDefnFactories<
  Context,
>(): s.TableDefnFactoriesSupplier<Context> {
  const tdfs: s.TableDefnFactoriesSupplier<Context> = {
    tableColumnsFactory: (tableDefn) =>
      s.typicalTableColumnsFactory(tableDefn, tdfs),
    tableColumnDefnSqlTextSupplier: s.typicalTableColumnDefnSqlTextSupplier<
      Context,
      // deno-lint-ignore no-explicit-any
      any,
      // deno-lint-ignore no-explicit-any
      any
    >(),
    tableDefnDecoratorsFactory: s.typicalTableDefnDecoratorsFactory,
  };
  return tdfs;
}

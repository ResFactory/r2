import * as s from "./storage/mod.ts";

export function sqliteDialect<
  Context extends s.StorageContext,
>(): s.StorageFactoriesSupplier<Context> {
  return {
    tableColumnsFactory: (tableDefn) => s.typicalTableColumnsFactory(tableDefn),
    tableColumnDefnSqlTextSupplier: s.typicalTableColumnDefnSqlTextSupplier<
      Context,
      // deno-lint-ignore no-explicit-any
      any,
      // deno-lint-ignore no-explicit-any
      any
    >(),
    tableDefnDecoratorsFactory: s.typicalTableDefnDecoratorsFactory,
  };
}

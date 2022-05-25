import * as s from "./storage.ts";
import * as t from "../text.ts";

export function sqliteTableDefnFactories<
  Context,
  EmitOptions extends t.SqlTextEmitOptions,
>(): s.TableDefnFactoriesSupplier<Context, EmitOptions> {
  const tdfs: s.TableDefnFactoriesSupplier<Context, EmitOptions> = {
    tableColumnsFactory: (tableDefn) =>
      s.typicalTableColumnsFactory(tableDefn, tdfs),
    tableColumnDefnSqlTextSupplier: s.typicalTableColumnDefnSqlTextSupplier<
      Context,
      // deno-lint-ignore no-explicit-any
      any,
      // deno-lint-ignore no-explicit-any
      any,
      EmitOptions
    >(),
    tableDefnDecoratorsFactory: s.typicalTableDefnDecoratorsFactory,
  };
  return tdfs;
}

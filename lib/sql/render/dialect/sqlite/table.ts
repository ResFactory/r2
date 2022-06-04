import * as tbl from "../../ddl/table/mod.ts";
import * as tmpl from "../../template/mod.ts";

export function sqliteTableDefnFactories<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(): tbl.TableDefnFactoriesSupplier<Context, EmitOptions> {
  const tdfs: tbl.TableDefnFactoriesSupplier<Context, EmitOptions> = {
    tableColumnsFactory: (tableDefn) =>
      tbl.typicalTableColumnsFactory(tableDefn),
    tableDefnDecoratorsFactory: tbl.typicalTableDefnDecoratorsFactory,
  };
  return tdfs;
}

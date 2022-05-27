import * as s from "./storage.ts";
import * as t from "../text.ts";

export function sqliteTableDefnFactories<
  Context,
  EmitOptions extends t.SqlTextEmitOptions<Context> = t.SqlTextEmitOptions<
    Context
  >,
>(): s.TableDefnFactoriesSupplier<Context, EmitOptions> {
  const tdfs: s.TableDefnFactoriesSupplier<Context, EmitOptions> = {
    tableColumnsFactory: (tableDefn) => s.typicalTableColumnsFactory(tableDefn),
    tableDefnDecoratorsFactory: s.typicalTableDefnDecoratorsFactory,
  };
  return tdfs;
}

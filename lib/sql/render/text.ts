import * as safety from "../../safety/mod.ts";
import * as govn from "./governance.ts";

export function isSqlTextSupplier<Context extends govn.SqlAssemblerContext>(
  o: unknown,
): o is govn.SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<govn.SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

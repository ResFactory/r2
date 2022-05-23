import * as safety from "../../safety/mod.ts";

export interface SqlTextEmitOptions {
  readonly tableName?: (tableName: string) => string;
  readonly columnName?: (
    column: { tableName: string; columnName: string },
  ) => string;
  readonly indentation?: (
    nature: "create table" | "define table column",
  ) => string;
}

export interface SqlTextSupplier<Context> {
  readonly SQL: (ctx: Context, options?: SqlTextEmitOptions) => string;
}

export function isSqlTextSupplier<Context>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

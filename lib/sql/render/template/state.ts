import * as tmpl from "./sql.ts";

export type SqlTextMemoizer<Context extends tmpl.SqlEmitContext> = {
  readonly memoizeSQL: <STS extends tmpl.SqlTextSupplier<Context>>(
    sts: STS,
  ) => STS;
};

export type SqlTextCollection = {
  readonly uniqueSQL: Iterable<string>;
};

export function typicalSqlTextState<Context extends tmpl.SqlEmitContext>(
  ctx: Context,
) {
  const uniqueSQL = new Set<string>();
  const result: SqlTextMemoizer<Context> & SqlTextCollection = {
    uniqueSQL,
    memoizeSQL: <STS extends tmpl.SqlTextSupplier<Context>>(sts: STS) => {
      uniqueSQL.add(sts.SQL(ctx));
      return sts;
    },
  };
  return result;
}

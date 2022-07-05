import * as safety from "../../safety/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as p from "./parameter.ts";

/**
 * The default type for returned rows.
 */
export type SqlRow = Array<unknown>;

/**
 * The default type for row returned
 * as objects.
 */
export type SqlRecord = Record<string, unknown>;

export interface QueryExecutionRowsSupplier<
  R extends SqlRow,
  Context extends SQLa.SqlEmitContext,
> {
  readonly rows: Array<R>;
  readonly query: p.SqlBindParamsTextSupplier<Context>;
}

export interface QueryExecutionRecordsSupplier<
  O extends SqlRecord,
  Context extends SQLa.SqlEmitContext,
> {
  readonly records: Array<O>;
  readonly query: p.SqlBindParamsTextSupplier<Context>;
}

export interface QueryExecutionRecordSupplier<
  O extends SqlRecord,
  Context extends SQLa.SqlEmitContext,
> extends QueryExecutionRecordsSupplier<O, Context> {
  readonly record: O;
}

export type QueryRowsExecutor<
  Context extends SQLa.SqlEmitContext,
> = <R extends SqlRow>(
  ctx: Context,
  query: p.SqlBindParamsTextSupplier<Context>,
) => Promise<QueryExecutionRowsSupplier<R, Context>>;

export type QueryRecordsExecutor<
  Context extends SQLa.SqlEmitContext,
> = <O extends SqlRecord>(
  ctx: Context,
  query: p.SqlBindParamsTextSupplier<Context>,
) => Promise<QueryExecutionRecordsSupplier<O, Context>>;

export function isQueryExecutionRowsSupplier<
  R extends SqlRow,
  Context extends SQLa.SqlEmitContext,
>(o: unknown): o is QueryExecutionRowsSupplier<R, Context> {
  const isQERS = safety.typeGuard<QueryExecutionRowsSupplier<R, Context>>(
    "rows",
    "query",
  );
  return isQERS(o);
}

export function isQueryExecutionRecordsSupplier<
  O extends SqlRecord,
  Context extends SQLa.SqlEmitContext,
>(o: unknown): o is QueryExecutionRecordsSupplier<O, Context> {
  const isQERS = safety.typeGuard<QueryExecutionRecordsSupplier<O, Context>>(
    "records",
    "query",
  );
  return isQERS(o);
}

export async function firstRecordDQL<
  Object extends SqlRecord,
  Context extends SQLa.SqlEmitContext,
>(
  ctx: Context,
  query: p.SqlBindParamsTextSupplier<Context>,
  qre: QueryRecordsExecutor<Context>,
  options?: {
    readonly enhance?: (record: Record<string, unknown>) => Object;
    readonly onNotFound?: () => Object | undefined;
    readonly autoLimitSQL?: (
      SQL: SQLa.SqlTextSupplier<Context>,
    ) => SQLa.SqlTextSupplier<Context>;
  },
): Promise<Object | undefined> {
  const {
    autoLimitSQL = (() => ({
      ...query,
      SQL: (ctx: Context) => `${query.SQL(ctx)} LIMIT 1`,
    })),
  } = options ?? {};
  const selected = await qre<Object>(ctx, autoLimitSQL(query));
  if (selected.records.length > 0) {
    const record = selected.records[0];
    if (options?.enhance) return options.enhance(record);
    return record;
  }
  return options?.onNotFound ? options.onNotFound() : undefined;
}

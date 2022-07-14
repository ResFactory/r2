import * as safety from "../../safety/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type SqlEngineIdentity = string;

export interface SqlEngine {
  readonly identity: SqlEngineIdentity;
}

export type SqlEngineInstanceIdentity = string;

export interface SqlEngineInstance<Engine extends SqlEngine> {
  readonly identity: SqlEngineInstanceIdentity;
}

export type SqlEngineInstanceConnIdentity = string;

export interface SqlEngineConnection<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
> {
  readonly identity: SqlEngineInstanceConnIdentity;
}

export interface SqlDefineConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
> extends SqlEngineConnection<Engine, Instance> {
  readonly rowsDDL: ex.QueryRowsExecutor<Context>;
}

export interface SqlReadConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
> extends SqlEngineConnection<Engine, Instance> {
  readonly rowsDQL: ex.QueryRowsExecutor<Context>;
  readonly recordsDQL: ex.QueryRecordsExecutor<Context>;
  readonly firstRecordDQL: <Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: ex.QueryRecordsExecutorOptions<Object, Context> & {
      readonly reportRecordsDQL?: (
        selected: ex.QueryExecutionRecordsSupplier<Object, Context>,
      ) => Promise<void>;
      readonly onNotFound?: () => Promise<
        | ex.QueryExecutionRecordSupplier<Object, Context>
        | undefined
      >;
      readonly autoLimitSQL?: (
        SQL: SQLa.SqlTextSupplier<Context>,
      ) => SQLa.SqlTextSupplier<Context>;
    },
  ) => Promise<ex.QueryExecutionRecordSupplier<Object, Context> | undefined>;
}

export interface SqlReflectConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
> extends SqlEngineConnection<Engine, Instance> {
  readonly reflectTables: <TableName extends string>(
    options?: {
      readonly filter?: { readonly tableName?: (name: string) => boolean };
      readonly enrich?: (
        td: SQLa.TableDefinition<TableName, Context>,
      ) => SQLa.TableDefinition<TableName, Context>;
    },
  ) => Generator<SQLa.TableDefinition<TableName, Context>>;
  readonly reflectViews: <ViewName extends string>(
    options?: {
      readonly filter?: { readonly viewName?: (name: string) => boolean };
      readonly enrich?: (
        vd: SQLa.ViewDefinition<ViewName, Context>,
      ) => SQLa.ViewDefinition<ViewName, Context>;
    },
  ) => Generator<SQLa.ViewDefinition<ViewName, Context>>;
}

export interface SqlWriteConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
> extends SqlEngineConnection<Engine, Instance> {
  readonly rowsDML: ex.QueryRowsExecutor<Context>;
  readonly recordsDML: ex.QueryRecordsExecutor<Context>;
}

export function isSqlDefineConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
>(o: unknown): o is SqlDefineConn<
  Engine,
  Instance,
  Context
> {
  const isSDC = safety.typeGuard<
    SqlDefineConn<
      Engine,
      Instance,
      Context
    >
  >("rowsDDL");
  return isSDC(o);
}

export function isSqlReadConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
>(o: unknown): o is SqlReadConn<
  Engine,
  Instance,
  Context
> {
  const isSRC = safety.typeGuard<
    SqlReadConn<
      Engine,
      Instance,
      Context
    >
  >("rowsDQL", "recordsDQL", "firstRecordDQL");
  return isSRC(o);
}

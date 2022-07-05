import { events } from "../deps.ts";
import * as sqlite from "https://deno.land/x/sqlite@v3.4.0/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";
import * as eng from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export class SqliteEventEmitter<
  Context extends SQLa.SqlEmitContext,
  Engine extends eng.SqlEngine = eng.SqlEngine,
  Instance extends SqliteInstance<Context> = SqliteInstance<Context>,
  Connection extends SqliteInstance<Context> = SqliteInstance<Context>,
> extends events.EventEmitter<{
  openingDatabase(i: Instance): void;
  openedDatabase(i: Instance): void;
  closingDatabase(i: Instance): void;
  closedDatabase(i: Instance): void;

  connectedSession(c: Connection): void;
  closingSession(c: Connection): void;
  closedSession(c: Connection): void;

  constructStorage(cc: eng.SqlDefineConn<Engine, Instance, Context>): void;
  constructIdempotent(cc: eng.SqlReadConn<Engine, Instance, Context>): void;
  populateSeedData(cc: eng.SqlWriteConn<Engine, Instance, Context>): void;

  executedDDL(result: ex.QueryExecutionRowsSupplier<Any, Context>): void;
  executedDQL(
    result:
      | ex.QueryExecutionRowsSupplier<Any, Context>
      | ex.QueryExecutionRecordSupplier<Any, Context>
      | ex.QueryExecutionRecordsSupplier<Any, Context>,
  ): void;
  executedDML(
    result:
      | ex.QueryExecutionRowsSupplier<Any, Context>
      | ex.QueryExecutionRecordSupplier<Any, Context>
      | ex.QueryExecutionRecordsSupplier<Any, Context>,
  ): void;
}> {
}

export interface SqliteInstanceInit<Context extends SQLa.SqlEmitContext> {
  readonly storageFileName: () => string;
  readonly autoCloseOnUnload?: boolean;
  readonly prepareEE?: (
    suggested: SqliteEventEmitter<Context>,
  ) => SqliteEventEmitter<Context>;
}

export type SqliteEngine = eng.SqlEngine;

export function sqliteEngine<Context extends SQLa.SqlEmitContext>() {
  const instances = new Map<string, SqliteInstance<Context>>();
  const result: SqliteEngine = {
    identity: "SQLite Deno WASM Engine",
  };
  return {
    ...result,
    instance: (ii: SqliteInstanceInit<Context>) => {
      const sfn = ii.storageFileName();
      let instance = instances.get(sfn);
      if (!instance) {
        instance = new SqliteInstance(ii);
        instances.set(sfn, instance);
      }
      return instance;
    },
  };
}

export function sqliteRowsExecutor<Context extends SQLa.SqlEmitContext>(
  db: sqlite.DB,
) {
  // deno-lint-ignore require-await
  const result: ex.QueryRowsExecutor<Context> = async <Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> => {
    const rows = db.query<Row>(query.SQL(ctx), query.sqlQueryParams);
    const result: ex.QueryExecutionRowsSupplier<Row, Context> = {
      rows,
      query,
    };
    return result;
  };
  return result;
}

export function sqliteRecordsExecutor<Context extends SQLa.SqlEmitContext>(
  db: sqlite.DB,
) {
  // deno-lint-ignore require-await
  const result: ex.QueryRecordsExecutor<Context> = async <
    Object extends ex.SqlRecord,
  >(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> => {
    const records = db.queryEntries<Object>(
      query.SQL(ctx),
      query.sqlQueryParams,
    );
    const result: ex.QueryExecutionRecordsSupplier<Object, Context> = {
      records,
      query,
    };
    return result;
  };
  return result;
}

export class SqliteInstance<Context extends SQLa.SqlEmitContext>
  implements
    eng.SqlEngineInstance<SqliteEngine>,
    eng.SqlDefineConn<SqliteEngine, SqliteInstance<Context>, Context>,
    eng.SqlReadConn<SqliteEngine, SqliteInstance<Context>, Context>,
    eng.SqlWriteConn<SqliteEngine, SqliteInstance<Context>, Context> {
  readonly identity: string;
  readonly dbStoreFsPath: string;
  readonly dbStore: sqlite.DB;
  readonly sqliteEE: SqliteEventEmitter<Context>;
  readonly rowsExec: ex.QueryRowsExecutor<Context>;
  readonly recordsExec: ex.QueryRecordsExecutor<Context>;

  constructor(sii: SqliteInstanceInit<Context>) {
    this.dbStoreFsPath = sii.storageFileName();
    this.dbStore = new sqlite.DB(this.dbStoreFsPath, { mode: "create" });
    this.identity = `SQLite::${this.dbStoreFsPath}`;

    this.rowsExec = sqliteRowsExecutor(this.dbStore);
    this.recordsExec = sqliteRecordsExecutor(this.dbStore);

    const sqlELCEE = new SqliteEventEmitter<Context>();
    this.sqliteEE = sii.prepareEE?.(sqlELCEE) ?? sqlELCEE;

    if (sii.autoCloseOnUnload) {
      globalThis.addEventListener("unload", () => this.close());
    }
  }

  close() {
    this.sqliteEE.emitSync("closingDatabase", this);
    this.dbStore.close(true);
    this.sqliteEE.emitSync("closedDatabase", this);
  }

  init() {
    this.sqliteEE.emitSync("openingDatabase", this);

    this.sqliteEE.on("openedDatabase", async () => {
      await this.sqliteEE.emit("constructStorage", this);
      await this.sqliteEE.emit("constructIdempotent", this);
      await this.sqliteEE.emit("populateSeedData", this);
    });

    this.sqliteEE.emitSync("openedDatabase", this);
  }

  async rowsDDL<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.sqliteEE.emit("executedDDL", result);
    return result;
  }

  async rowsDML<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.sqliteEE.emit("executedDML", result);
    return result;
  }

  async recordsDML<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> {
    const result = await this.recordsExec<Object>(ctx, query);
    this.sqliteEE.emit("executedDML", result);
    return result;
  }

  async rowsDQL<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.sqliteEE.emit("executedDQL", result);
    return result;
  }

  async recordsDQL<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> {
    const result = await this.recordsExec<Object>(ctx, query);
    this.sqliteEE.emit("executedDQL", result);
    return result;
  }

  async firstRecordDQL<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: {
      readonly enhance?: (record: Record<string, unknown>) => Object;
      readonly onNotFound?: () => Object | undefined;
      readonly autoLimitSQL?: (
        SQL: SQLa.SqlTextSupplier<Context>,
      ) => SQLa.SqlTextSupplier<Context>;
    },
  ): Promise<Object | undefined> {
    return await ex.firstRecordDQL(ctx, query, this.recordsDQL, options);
  }
}

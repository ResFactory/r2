import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { events } from "../deps.ts";
import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";
import * as eng from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface QueryExecutionProxyStore<Context extends SQLa.SqlEmitContext> {
  persistExecutedRows: <Row extends ex.SqlRow>(
    ctx: Context,
    qers: ex.QueryExecutionRowsSupplier<Row, Context>,
  ) => Promise<ex.QueryExecutionRowsSupplier<Row, Context>>;
  persistExecutedRecords: <Object extends ex.SqlRecord>(
    ctx: Context,
    qers: ex.QueryExecutionRecordsSupplier<Object, Context>,
  ) => Promise<ex.QueryExecutionRecordsSupplier<Object, Context>>;
}

export type QueryExecutionProxy<Context extends SQLa.SqlEmitContext> =
  QueryExecutionProxyStore<Context>;

export class FileSysSqlProxyEventEmitter<Context extends SQLa.SqlEmitContext>
  extends events.EventEmitter<{
    executedDQL(
      result:
        | ex.QueryExecutionRowsSupplier<Any, Context>
        | ex.QueryExecutionRecordSupplier<Any, Context>
        | ex.QueryExecutionRecordsSupplier<Any, Context>,
    ): void;
    persistedExecutedRows(
      ctx: Context,
      rows: ex.QueryExecutionRowsSupplier<Any, Context>,
      fsPath: string,
    ): void;
    persistedExecutedRecords(
      ctx: Context,
      records: ex.QueryExecutionRecordsSupplier<Any, Context>,
      fsPath: string,
    ): void;
  }> {
}

export interface FileSysSqlProxyInit<Context extends SQLa.SqlEmitContext> {
  readonly resultsStoreHome: (
    exec?: {
      readonly ctx: Context;
      readonly query: ex.SqlBindParamsTextSupplier<Context>;
    },
  ) => string;
  readonly onResultsStoreHomeStatError?: (home: string, err: Error) => void;
  readonly prepareEE?: (
    suggested: FileSysSqlProxyEventEmitter<Context>,
  ) => FileSysSqlProxyEventEmitter<Context>;
}

export type FileSysSqlProxyEngine = eng.SqlEngine;

export function fileSysSqlProxyEngine<Context extends SQLa.SqlEmitContext>() {
  const instances = new Map<string, FileSysSqlProxy<Context>>();
  const result: FileSysSqlProxyEngine = {
    identity: "File System Proxy SQL Engine",
  };
  return {
    ...result,
    instance: (rssPI: FileSysSqlProxyInit<Context>) => {
      const home = rssPI.resultsStoreHome();
      let instance = instances.get(home);
      if (!instance) {
        instance = new FileSysSqlProxy(rssPI);
        instances.set(home, instance);
      }
      return instance;
    },
  };
}

export function fsSqlProxyRowsExecutor<Context extends SQLa.SqlEmitContext>(
  fsRevivedJsonSupplier: <Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ) => Promise<ex.QueryExecutionRowsSupplier<Row, Context>>,
) {
  const result: ex.QueryRowsExecutor<Context> = async <Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: ex.QueryRowsExecutorOptions<Row, Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> => {
    // a "proxy" can be a local cache or any other store
    if (options?.proxy) {
      const proxy = await options?.proxy();
      if (proxy) return proxy;
    }

    let result: ex.QueryExecutionRowsSupplier<Row, Context>;
    try {
      result = await fsRevivedJsonSupplier(ctx, query);
    } catch (error) {
      result = { query, rows: [], error };
    }

    // "enriching" can be a transformation function, cache store, etc.
    const { enrich } = options ?? {};
    return enrich ? enrich(result) : result;
  };
  return result;
}

export function fsSqlProxyRecordsExecutor<Context extends SQLa.SqlEmitContext>(
  fsRevivedJsonSupplier: <Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ) => Promise<ex.QueryExecutionRecordsSupplier<Object, Context>>,
) {
  const result: ex.QueryRecordsExecutor<Context> = async <
    Object extends ex.SqlRecord,
  >(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: ex.QueryRecordsExecutorOptions<Object, Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> => {
    // a "proxy" can be a local cache or any other store
    if (options?.proxy) {
      const proxy = await options?.proxy();
      if (proxy) return proxy;
    }

    let result: ex.QueryExecutionRecordsSupplier<Object, Context>;
    try {
      result = await fsRevivedJsonSupplier(ctx, query);
    } catch (error) {
      result = { query, records: [], error };
    }

    // "enriching" can be a transformation function, cache store, etc.
    const { enrich } = options ?? {};
    return enrich ? enrich(result) : result;
  };
  return result;
}

export class FileSysSqlProxy<Context extends SQLa.SqlEmitContext>
  implements
    eng.SqlEngineInstance<FileSysSqlProxyEngine>,
    eng.SqlReadConn<FileSysSqlProxyEngine, FileSysSqlProxy<Context>, Context>,
    QueryExecutionProxyStore<Context> {
  readonly identity: string;
  readonly resultsStoreHome: string;
  readonly fsspEE: FileSysSqlProxyEventEmitter<Context>;
  readonly rowsExec: ex.QueryRowsExecutor<Context>;
  readonly recordsExec: ex.QueryRecordsExecutor<Context>;

  constructor(readonly fsqEI: FileSysSqlProxyInit<Context>) {
    this.resultsStoreHome = fsqEI.resultsStoreHome();
    try {
      const stat = Deno.statSync(this.resultsStoreHome);
      if (!stat.isDirectory) {
        throw new Error(
          `${this.resultsStoreHome} is not a directory, FileSysSqlProxy is not properly configured`,
        );
      }
    } catch (err) {
      if (fsqEI.onResultsStoreHomeStatError) {
        fsqEI.onResultsStoreHomeStatError(this.resultsStoreHome, err);
      } else {
        throw err;
      }
    }
    this.identity = `FileSysSQL::${this.resultsStoreHome}`;

    const sqlELCEE = new FileSysSqlProxyEventEmitter<Context>();
    this.fsspEE = fsqEI.prepareEE?.(sqlELCEE) ?? sqlELCEE;

    this.rowsExec = fsSqlProxyRowsExecutor(async (ctx, query) => {
      return this.reviveQueryExecResult(
        path.join(
          fsqEI.resultsStoreHome({ ctx, query }),
          (await ex.sqlQueryIdentity(query, ctx)) + ".rows.json",
        ),
        ctx,
        query,
      );
    });
    this.recordsExec = fsSqlProxyRecordsExecutor(async (ctx, query) => {
      return this.reviveQueryExecResult(
        path.join(
          fsqEI.resultsStoreHome({ ctx, query }),
          (await ex.sqlQueryIdentity(query, ctx)) + ".records.json",
        ),
        ctx,
        query,
      );
    });
  }

  async reviveQueryExecResult(
    fsJsonPath: string,
    _ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ) {
    const json = await Deno.readTextFile(fsJsonPath);
    return JSON.parse(json, (key, value) => {
      if (key == "query") return query;
      return value;
    });
  }

  stringifyQueryExecResult(
    ctx: Context,
    qers:
      | ex.QueryExecutionRowsSupplier<Any, Context>
      | ex.QueryExecutionRecordsSupplier<Any, Context>,
  ) {
    return JSON.stringify(qers, (key, value) => {
      if (key == "SQL" && typeof value === "function") return value(ctx);
      return value;
    });
  }

  async persistExecutedRows<Row extends ex.SqlRow>(
    ctx: Context,
    qers: ex.QueryExecutionRowsSupplier<Row, Context>,
  ) {
    const fsPath = path.join(
      this.fsqEI.resultsStoreHome({ ctx, query: qers.query }),
      (await ex.sqlQueryIdentity(qers.query, ctx)) + ".rows.json",
    );
    await Deno.writeTextFile(fsPath, this.stringifyQueryExecResult(ctx, qers));
    await this.fsspEE.emit("persistedExecutedRows", ctx, qers, fsPath);
    return qers;
  }

  async persistExecutedRecords<Object extends ex.SqlRecord>(
    ctx: Context,
    qers: ex.QueryExecutionRecordsSupplier<Object, Context>,
  ) {
    const fsPath = path.join(
      this.fsqEI.resultsStoreHome({ ctx, query: qers.query }),
      (await ex.sqlQueryIdentity(qers.query, ctx)) + ".records.json",
    );
    await Deno.writeTextFile(fsPath, this.stringifyQueryExecResult(ctx, qers));
    await this.fsspEE.emit("persistedExecutedRecords", ctx, qers, fsPath);
    return qers;
  }

  async rowsDQL<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: ex.QueryRowsExecutorOptions<Row, Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query, options);
    this.fsspEE.emit("executedDQL", result);
    return result;
  }

  async recordsDQL<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?: ex.QueryRecordsExecutorOptions<Object, Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> {
    const result = await this.recordsExec<Object>(ctx, query, options);
    this.fsspEE.emit("executedDQL", result);
    return result;
  }

  async firstRecordDQL<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
    options?:
      & ex.QueryRecordsExecutorOptions<Object, Context>
      & {
        readonly onNotFound?: () => Promise<
          | ex.QueryExecutionRecordSupplier<Object, Context>
          | undefined
        >;
        readonly autoLimitSQL?: (
          SQL: SQLa.SqlTextSupplier<Context>,
        ) => SQLa.SqlTextSupplier<Context>;
      },
  ): Promise<ex.QueryExecutionRecordSupplier<Object, Context> | undefined> {
    const result = await ex.firstRecordDQL(
      ctx,
      query,
      this.recordsExec,
      {
        reportRecordsDQL: async (result) => {
          await this.fsspEE.emit("executedDQL", result);
        },
        ...options,
      },
    );
    return result;
  }
}

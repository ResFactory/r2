import * as path from "https://deno.land/std@0.147.0/path/mod.ts";
import { events } from "../deps.ts";
import * as safety from "../../safety/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";
import * as eng from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SqlRunCmdOptionsSupplier {
  (
    SQL: string,
    resultNature: "rows" | "records",
  ): Deno.RunOptions;
}

export interface SqlCmdExecResult {
  readonly status: Deno.ProcessStatus;
}

export interface SqlCmdSuccessResult extends SqlCmdExecResult {
  readonly stdOut: string;
  readonly json: <TypedResult = unknown>() => TypedResult;
}

export const isSqlCmdSuccessful = safety.typeGuard<SqlCmdSuccessResult>(
  "stdOut",
);

export interface SqlCmdFailureResult extends SqlCmdExecResult {
  readonly stdErr: string;
}

export const isSqlCmdFailure = safety.typeGuard<SqlCmdFailureResult>(
  "stdErr",
);

export class SqlShellCmdEventEmitter<Context extends SQLa.SqlEmitContext>
  extends events.EventEmitter<{
    executedDQL(
      result:
        | ex.QueryExecutionRowsSupplier<Any, Context>
        | ex.QueryExecutionRecordSupplier<Any, Context>
        | ex.QueryExecutionRecordsSupplier<Any, Context>,
    ): void;
  }> {
}

export interface SqlShellCmdInit<Context extends SQLa.SqlEmitContext> {
  readonly identity: string;
  readonly prepareExecuteSqlCmd: SqlRunCmdOptionsSupplier;
  readonly prepareEE?: (
    suggested: SqlShellCmdEventEmitter<Context>,
  ) => SqlShellCmdEventEmitter<Context>;
}

export type SqlShellCmdsEngine = eng.SqlEngine;

export async function executeShellCmd<TypedResult = unknown>(
  runOptsSupplier: () => Deno.RunOptions,
  onCmdFail: (
    status: Deno.ProcessStatus,
    stdErr: string,
    // deno-lint-ignore require-await
  ) => Promise<SqlCmdSuccessResult | SqlCmdFailureResult> = async (
    status,
    stdErr,
  ) => ({ status, stdErr }),
): Promise<SqlCmdSuccessResult | SqlCmdFailureResult> {
  let result: SqlCmdSuccessResult | SqlCmdFailureResult;
  const cmd = Deno.run(runOptsSupplier());

  // see https://github.com/denoland/deno/issues/4568 why this is necessary
  const [stdErrRaw, stdOutRaw, status] = await Promise.all([
    cmd.stderrOutput(),
    cmd.output(),
    cmd.status(),
  ]);
  if (status.success) {
    const stdOut = new TextDecoder().decode(stdOutRaw);
    result = {
      status,
      stdOut,
      json: <JsonResult = TypedResult>() => (JSON.parse(stdOut) as JsonResult),
    };
  } else {
    const stdErr = new TextDecoder().decode(stdErrRaw);
    result = await onCmdFail(status, stdErr);
  }
  cmd.close();
  return result;
}

export function sqlShellCmdRowsExecutor<Context extends SQLa.SqlEmitContext>(
  prepareExecuteSqlCmd: SqlRunCmdOptionsSupplier,
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
      const shellCmdResult = await executeShellCmd(
        () => prepareExecuteSqlCmd(query.SQL(ctx), "rows"),
      );
      if (isSqlCmdSuccessful(shellCmdResult)) {
        result = { query, rows: shellCmdResult.json<Array<Row>>() };
      } else {
        result = { query, rows: [], error: new Error(shellCmdResult.stdErr) };
      }
    } catch (error) {
      result = { query, rows: [], error };
    }

    // "enriching" can be a transformation function, cache store, etc.
    const { enrich } = options ?? {};
    return enrich ? enrich(result) : result;
  };
  return result;
}

export function sqlShellCmdRecordsExecutor<Context extends SQLa.SqlEmitContext>(
  prepareExecuteSqlCmd: SqlRunCmdOptionsSupplier,
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
      const shellCmdResult = await executeShellCmd(
        () => prepareExecuteSqlCmd(query.SQL(ctx), "rows"),
      );
      if (isSqlCmdSuccessful(shellCmdResult)) {
        result = { query, records: shellCmdResult.json<Array<Object>>() };
      } else {
        result = {
          query,
          records: [],
          error: new Error(shellCmdResult.stdErr),
        };
      }
    } catch (error) {
      result = { query, records: [], error };
    }

    // "enriching" can be a transformation function, cache store, etc.
    const { enrich } = options ?? {};
    return enrich ? enrich(result) : result;
  };
  return result;
}

export class SqlShellCmdExecutive<Context extends SQLa.SqlEmitContext>
  implements
    eng.SqlEngineInstance<SqlShellCmdsEngine>,
    eng.SqlReadConn<
      SqlShellCmdsEngine,
      SqlShellCmdExecutive<Context>,
      Context
    > {
  readonly identity: string;
  readonly prepareExecuteSqlCmd: SqlRunCmdOptionsSupplier;
  readonly fsspEE: SqlShellCmdEventEmitter<Context>;
  readonly rowsExec: ex.QueryRowsExecutor<Context>;
  readonly recordsExec: ex.QueryRecordsExecutor<Context>;

  constructor(readonly ssCI: SqlShellCmdInit<Context>) {
    this.identity = ssCI.identity;
    this.prepareExecuteSqlCmd = ssCI.prepareExecuteSqlCmd;

    const sqlELCEE = new SqlShellCmdEventEmitter<Context>();
    this.fsspEE = ssCI.prepareEE?.(sqlELCEE) ?? sqlELCEE;

    this.rowsExec = sqlShellCmdRowsExecutor(this.prepareExecuteSqlCmd);
    this.recordsExec = sqlShellCmdRecordsExecutor(this.prepareExecuteSqlCmd);
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

export class FileSysQueryCmdExecutive<Context extends SQLa.SqlEmitContext>
  extends SqlShellCmdExecutive<Context> {
  static firstWordRegEx = /^\s*([a-zA-Z0-9]+)/;
  constructor(
    ssCI: Partial<Omit<SqlShellCmdInit<Context>, "prepareExecuteSqlCmd">> & {
      readonly felectCmdPath?: string;
    },
  ) {
    const identity = ssCI.identity ?? `osQueryi`;
    const felectCmdPath = ssCI.felectCmdPath ??
      Deno.env.get("RF_SQL_SHELL_FSELECT_LOCATION") ??
      path.join(
        path.dirname(path.fromFileUrl(import.meta.url)),
        "..",
        "shell",
        "bin",
        "fselect",
      );
    super({
      identity,
      prepareExecuteSqlCmd: (suppliedSQL) => {
        // https://github.com/jhspetersson/fselect
        // fselect does not support comments
        let SQL = suppliedSQL.replaceAll(/\-\-.*$/mg, " ");
        // fselect does not like line breaks between SQL tokens
        SQL = SQL.replaceAll(/(\r\n|\r|\n)/mg, " ");
        // fselect does not start with "select" SQL, it goes straight into columns
        const firstWordMatch = SQL.match(
          FileSysQueryCmdExecutive.firstWordRegEx,
        );
        if (firstWordMatch && firstWordMatch.length > 1) {
          if (firstWordMatch[1].toUpperCase() == "SELECT") {
            SQL = SQL.replace(FileSysQueryCmdExecutive.firstWordRegEx, "");
          }
        }
        return {
          cmd: [felectCmdPath, SQL, "into", "json"],
          stdout: "piped",
          stderr: "piped",
        };
      },
    });
  }
}

export class GitQueryCmdExecutive<Context extends SQLa.SqlEmitContext>
  extends SqlShellCmdExecutive<Context> {
  constructor(
    ssCI: Partial<Omit<SqlShellCmdInit<Context>, "prepareExecuteSqlCmd">> & {
      readonly mergeStatCmdPath?: string;
    },
  ) {
    const identity = ssCI.identity ?? `mergestat`;
    const mergeStatCmdPath = ssCI.mergeStatCmdPath ??
      Deno.env.get("RF_SQL_SHELL_MERGESTAT_LOCATION") ??
      path.join(
        path.dirname(path.fromFileUrl(import.meta.url)),
        "..",
        "shell",
        "bin",
        "mergestat",
      );
    super({
      identity,
      prepareExecuteSqlCmd: (SQL) => {
        return {
          cmd: [mergeStatCmdPath, "-f", "json", SQL],
          stdout: "piped",
          stderr: "piped",
        };
      },
    });
  }
}

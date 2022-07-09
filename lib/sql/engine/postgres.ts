import { events } from "../deps.ts";
import * as ax from "../../axiom/mod.ts";
import * as axEnv from "../../axiom/axiom-serde-env.ts";
import * as pg from "https://deno.land/x/postgres@v0.16.1/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";
import * as eng from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function pgDatabaseConnConfig(
  options?: { readonly ens?: axEnv.EnvVarNamingStrategy },
) {
  const envBuilder = axEnv.envBuilder(options);
  const dbConnAxioms = ax.serDeAxioms({
    identity: envBuilder.text("IDENTITY", "PGAPPNAME"),
    database: envBuilder.text("PGDATABASE"),
    hostname: envBuilder.text("PGHOST", "PGHOSTADDR"),
    port: envBuilder.integer("PGPORT"),
    user: envBuilder.text("PGUSER"),
    password: envBuilder.text("PGPASSWORD"),
    dbConnPoolCount: envBuilder.integer("PGCONNPOOL_COUNT"),
  });
  const dbcAOD = ax.$.object(dbConnAxioms.axiomObjectDecl);
  type DbConnConfig = ax.AxiomType<typeof dbcAOD>;
  return {
    envBuilder,
    dbConnAxioms,
    configure: (init?: DbConnConfig) => {
      return ax.axiomSerDeDefaults(dbConnAxioms.axiomObjectDecl, init);
    },
    pgClientOptions: (configured: DbConnConfig) => {
      const textValue = (text: string) =>
        text == envBuilder.textUndefined ? undefined : text;
      const intValue = (int: number) =>
        int == envBuilder.intUndefined ? undefined : int;
      const pgco: pg.ClientOptions = {
        applicationName: textValue(configured.identity),
        database: textValue(configured.database),
        hostname: textValue(configured.hostname),
        port: intValue(configured.port),
        user: textValue(configured.user),
        password: textValue(configured.password),
        tls: { enabled: false },
      };
      return pgco;
    },
    missingProperties: (
      dbc: DbConnConfig,
      ...validate: (keyof DbConnConfig)[]
    ) => {
      return ax.missingAxiomValues(
        dbc,
        dbConnAxioms.axiomObjectDecl,
        ...validate,
      );
    },
  };
}

export class PostgreSqlEventEmitter<
  Context extends SQLa.SqlEmitContext,
  Engine extends eng.SqlEngine = eng.SqlEngine,
  Instance extends PostgreSqlInstance<Context> = PostgreSqlInstance<Context>,
  Connection extends pg.Client = pg.Client,
> extends events.EventEmitter<{
  openingDatabase(i: Instance): void;
  openedDatabase(i: Instance): void;
  closingDatabase(i: Instance): void;
  closedDatabase(i: Instance): void;

  testingConnection(SQL: string): void;
  testedConnValid(c: Connection, SQL: string): void;
  testedConnInvalid(error: Error, SQL: string): void;

  connected(c: Connection): void;
  releasing(c: Connection): void;

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

export interface PostgreSqlInstanceInit<Context extends SQLa.SqlEmitContext> {
  readonly instanceID?: string;
  readonly clientOptions: () => pg.ClientOptions;
  readonly poolCount?: number;
  readonly prepareEE?: (
    suggested: PostgreSqlEventEmitter<Context>,
  ) => PostgreSqlEventEmitter<Context>;
  readonly autoCloseOnUnload?: boolean;
}

export type PostgreSqlEngine = eng.SqlEngine;

export function postgreSqlEngine<Context extends SQLa.SqlEmitContext>() {
  const instances = new Map<string, PostgreSqlInstance<Context>>();
  const result: PostgreSqlEngine = {
    identity: "PostgreSQL `deno-postgres` Engine",
  };
  return {
    ...result,
    instance: (ii: PostgreSqlInstanceInit<Context>) => {
      const sfn = ii.instanceID;
      let instance = sfn ? instances.get(sfn) : undefined;
      if (!instance) {
        instance = new PostgreSqlInstance(ii);
        if (sfn) instances.set(sfn, instance);
      }
      return instance;
    },
  };
}

export function postgreSqlRowsExecutor<Context extends SQLa.SqlEmitContext>(
  acquireConn: () => Promise<pg.PoolClient>,
  releaseConn: (c: pg.PoolClient) => void = (c) => c.release(),
) {
  const result: ex.QueryRowsExecutor<Context> = async <Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> => {
    const conn = await acquireConn();
    const qaResult = await conn.queryArray<Row>(
      query.SQL(ctx),
      query.sqlQueryParams,
    );
    const result: ex.QueryExecutionRowsSupplier<Row, Context> = {
      rows: qaResult.rows,
      query,
    };
    releaseConn(conn);
    return result;
  };
  return result;
}

export function postgreSqlRecordsExecutor<Context extends SQLa.SqlEmitContext>(
  acquireConn: () => Promise<pg.PoolClient>,
  releaseConn: (c: pg.PoolClient) => void = (c) => c.release(),
) {
  const result: ex.QueryRecordsExecutor<Context> = async <
    Object extends ex.SqlRecord,
  >(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> => {
    const conn = await acquireConn();
    const qoResult = await conn.queryObject<Object>(
      query.SQL(ctx),
      query.sqlQueryParams,
    );
    const result: ex.QueryExecutionRecordsSupplier<Object, Context> = {
      records: qoResult.rows,
      query,
    };
    releaseConn(conn);
    return result;
  };
  return result;
}

export class PostgreSqlInstance<Context extends SQLa.SqlEmitContext>
  implements
    eng.SqlEngineInstance<PostgreSqlEngine>,
    eng.SqlDefineConn<PostgreSqlEngine, PostgreSqlInstance<Context>, Context>,
    eng.SqlReadConn<PostgreSqlEngine, PostgreSqlInstance<Context>, Context>,
    eng.SqlWriteConn<PostgreSqlEngine, PostgreSqlInstance<Context>, Context> {
  readonly identity: string;
  readonly dbClientOptions: pg.ClientOptions;
  readonly dbPool: pg.Pool;
  readonly pgEE: PostgreSqlEventEmitter<Context>;
  readonly rowsExec: ex.QueryRowsExecutor<Context>;
  readonly recordsExec: ex.QueryRecordsExecutor<Context>;

  constructor(pgii: PostgreSqlInstanceInit<Context>) {
    const pgco = pgii.clientOptions();
    this.dbPool = new pg.Pool(pgco, pgii.poolCount ?? 1, true);
    this.identity =
      `PostgreSQL::${pgco.hostname}:${pgco.port} ${pgco.database}:${pgco.user}`;
    this.dbClientOptions = pgco;

    const pgEE = new PostgreSqlEventEmitter<Context>();
    this.pgEE = pgii.prepareEE?.(pgEE) ?? pgEE;

    this.rowsExec = postgreSqlRowsExecutor(
      async () => {
        const conn = await this.dbPool.connect();
        await pgEE.emit("connected", conn);
        return conn;
      },
      (conn) => {
        pgEE.emitSync("releasing", conn);
        conn.release();
      },
    );
    this.recordsExec = postgreSqlRecordsExecutor(
      async () => {
        const conn = await this.dbPool.connect();
        await pgEE.emit("connected", conn);
        return conn;
      },
      (conn) => {
        pgEE.emitSync("releasing", conn);
        conn.release();
      },
    );

    if (pgii.autoCloseOnUnload) {
      globalThis.addEventListener("unload", async () => await this.close());
    }
  }

  async isConnectable() {
    const testSQL = `SELECT 1`;
    this.pgEE.emitSync("testingConnection", testSQL);
    try {
      const conn = await this.dbPool.connect();
      await conn.queryArray(testSQL);
      this.pgEE.emit("testedConnValid", conn, testSQL);
      conn.release();
      return true;
    } catch (err) {
      this.pgEE.emit("testedConnInvalid", err, testSQL);
      return false;
    }
  }

  async close() {
    await this.pgEE.emit("closingDatabase", this);
    await this.dbPool.end();
    await this.pgEE.emit("closedDatabase", this);
  }

  async init() {
    await this.pgEE.emit("openingDatabase", this);

    this.pgEE.on("openedDatabase", async () => {
      await this.pgEE.emit("constructStorage", this);
      await this.pgEE.emit("constructIdempotent", this);
      await this.pgEE.emit("populateSeedData", this);
    });

    await this.pgEE.emit("openedDatabase", this);
  }

  async rowsDDL<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.pgEE.emit("executedDDL", result);
    return result;
  }

  async rowsDML<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.pgEE.emit("executedDML", result);
    return result;
  }

  async recordsDML<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> {
    const result = await this.recordsExec<Object>(ctx, query);
    this.pgEE.emit("executedDML", result);
    return result;
  }

  async rowsDQL<Row extends ex.SqlRow>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRowsSupplier<Row, Context>> {
    const result = await this.rowsExec<Row>(ctx, query);
    this.pgEE.emit("executedDQL", result);
    return result;
  }

  async recordsDQL<Object extends ex.SqlRecord>(
    ctx: Context,
    query: ex.SqlBindParamsTextSupplier<Context>,
  ): Promise<ex.QueryExecutionRecordsSupplier<Object, Context>> {
    const result = await this.recordsExec<Object>(ctx, query);
    this.pgEE.emit("executedDQL", result);
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

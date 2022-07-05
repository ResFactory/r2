import * as SQLa from "../render/mod.ts";
import * as ex from "../execute/mod.ts";

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
}

export interface SqlWriteConn<
  Engine extends SqlEngine,
  Instance extends SqlEngineInstance<Engine>,
  Context extends SQLa.SqlEmitContext,
> extends SqlEngineConnection<Engine, Instance> {
  readonly rowsDML: ex.QueryRowsExecutor<Context>;
  readonly recordsDML: ex.QueryRecordsExecutor<Context>;
}

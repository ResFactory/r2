import * as ax from "../../safety/axiom.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

export function syntheticTableDefns<
  Context,
  EmitOptions extends mod.SqlTextEmitOptions<Context>,
  >() {
  const primaryKey = () =>
    mod.autoIncPrimaryKey<number, EmitOptions, Context>(mod.integer());

  /**
   * All of our tables will follow a specific format, namely that they will have
   * a single primary key with the same name as the table with _id appended and
   * common "houskeeping" columns like created_at.
   * TODO: figure out how to automatically add ...housekeeping() to the end of
   * each table (it's easy to add at the start of each table, but we want them
   * at the end after all the "content" columns).
   * @param tableName
   * @param props
   * @returns
   */
  const table = <
    TableName extends string,
    TPropAxioms extends
    & Record<string, ax.Axiom<Any>>
    & Record<`${TableName}_id`, ax.Axiom<Any>>,
    >(
      tableName: TableName,
      props: TPropAxioms,
  ) => {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    const defaultIspOptions: mod.InsertStmtPreparerOptions<
      Context,
      TableName,
      Any,
      Any,
      EmitOptions
    > = { isColumnEmittable: (name) => name == "created_at" ? false : true };
    return {
      ...mod.tableDefinition(tableName, props, {
        isIdempotent: true,
      }),
      ...mod.tableDomainsRowFactory(tableName, props, { defaultIspOptions }),
      view: mod.tableDomainsViewWrapper(
        `${tableName}_vw`,
        tableName,
        props,
      ),
      defaultIspOptions // in case others need to wrap the call
    };
  };

  const publHost = table("publ_host", {
    publ_host_id: primaryKey(),
    host: mod.unique(mod.text()),
    host_identity: mod.jsonTextNullable(),
    mutation_count: mod.integer(),
    ...mod.housekeeping(),
  });

  const publBuildEvent = table("publ_build_event", {
    publ_build_event_id: primaryKey(),
    publ_host_id: publHost.foreignKeyRef.publ_host_id(),
    iteration_index: mod.integer(),
    build_initiated_at: mod.dateTime(),
    build_completed_at: mod.dateTime(),
    build_duration_ms: mod.integer(),
    resources_originated_count: mod.integer(),
    resources_persisted_count: mod.integer(),
    resources_memoized_count: mod.integer(),
    ...mod.housekeeping(),
  });

  const publServerService = table("publ_server_service", {
    publ_server_service_id: primaryKey(),
    service_started_at: mod.dateTime(),
    listen_host: mod.text(),
    listen_port: mod.integer(),
    publish_url: mod.text(),
    publ_build_event_id: publBuildEvent.foreignKeyRef.publ_build_event_id(),
    ...mod.housekeeping(),
  });

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = table(
    "publ_server_static_access_log",
    {
      publ_server_static_access_log_id: primaryKey(),
      status: mod.integer(),
      asset_nature: mod.text(),
      location_href: mod.text(),
      filesys_target_path: mod.text(),
      filesys_target_symlink: mod.textNullable(),
      publ_server_service_id: publServerService.foreignKeyRef
        .publ_server_service_id(),
      ...mod.housekeeping(),
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = table("publ_server_error_log", {
    publ_server_error_log_id: primaryKey(),
    location_href: mod.text(),
    error_summary: mod.text(),
    error_elaboration: mod.jsonTextNullable(),
    publ_server_service_id: publServerService.foreignKeyRef
      .publ_server_service_id(),
    ...mod.housekeeping(),
  });

  // this is added for testing purposes to make sure Axiom/Domain is creating
  // proper type-safe objects, otherwise will result in Typescript compile error;
  // expectType calls are not required for non-test or production use cases
  type tablePK = mod.TablePrimaryKeyColumnDefn<
    number,
    mod.SqlTextEmitOptions<Any>,
    Any
  >;
  expectType<tablePK>(publHost.primaryKey.publ_host_id);
  expectType<
    mod.AxiomSqlDomain<Date | undefined, mod.SqlTextEmitOptions<Any>, Any>
  >(publHost.axiomObjectDecl.created_at);
  expectType<tablePK>(publBuildEvent.primaryKey.publ_build_event_id);
  expectType<
    mod.TableForeignKeyColumnDefn<
      number,
      "publ_host",
      mod.SqlTextEmitOptions<Any>,
      Any
    >
  >(publBuildEvent.axiomObjectDecl.publ_host_id);

  return {
    publHost,
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  };
}

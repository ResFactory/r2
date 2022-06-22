import { path } from "./deps-test.ts";
import * as mod from "./mod.ts";

// typical.ts is not auto-exported in ./mod.ts because it's not universally
// applicable, so it should be imported explictly by consumers
import * as typ from "./typical.ts";

const expectType = <T>(_value: T) => {
  // Do nothing, the TypeScript compiler handles this for us
};

export function syntheticDatabaseDefn<Context extends mod.SqlEmitContext>(
  ddlOptions?: mod.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: mod.SqlNamespaceSupplier;
  },
) {
  const mg = typ.typicalLookupsGovn(ddlOptions);

  enum syntheticEnum1 {
    code1, // code is text, value is a number
    code2,
  }
  enum syntheticEnum2 {
    code1 = "value1",
    code2 = "value2",
  }
  const numericEnumModel = mg.enumTable(
    "synthetic_enum_numeric",
    syntheticEnum1,
  );
  const textEnumModel = mg.enumTable(
    "synthetic_enum_text",
    syntheticEnum2,
  );

  const publHost = mg.table("publ_host", {
    publ_host_id: mg.primaryKey(),
    host: mod.unique(mod.text()),
    host_identity: mod.jsonTextNullable(),
    mutation_count: mod.integer(),
    ...mg.housekeeping(),
  });

  const publBuildEvent = mg.table("publ_build_event", {
    publ_build_event_id: mg.primaryKey(),
    publ_host_id: publHost.foreignKeyRef.publ_host_id(),
    iteration_index: mod.integer(),
    build_initiated_at: mod.dateTime(),
    build_completed_at: mod.dateTime(),
    build_duration_ms: mod.integer(),
    resources_originated_count: mod.integer(),
    resources_persisted_count: mod.integer(),
    resources_memoized_count: mod.integer(),
    ...mg.housekeeping(),
  });

  const publServerService = mg.table("publ_server_service", {
    publ_server_service_id: mg.primaryKey(),
    service_started_at: mod.dateTime(),
    listen_host: mod.text(),
    listen_port: mod.integer(),
    publish_url: mod.text(),
    publ_build_event_id: publBuildEvent.foreignKeyRef.publ_build_event_id(),
    ...mg.housekeeping(),
  });

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = mg.table(
    "publ_server_static_access_log",
    {
      publ_server_static_access_log_id: mg.primaryKey(),
      status: mod.integer(),
      asset_nature: mod.text(),
      location_href: mod.text(),
      filesys_target_path: mod.text(),
      filesys_target_symlink: mod.textNullable(),
      publ_server_service_id: publServerService.foreignKeyRef
        .publ_server_service_id(),
      ...mg.housekeeping(),
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = mg.table("publ_server_error_log", {
    publ_server_error_log_id: mg.primaryKey(),
    location_href: mod.text(),
    error_summary: mod.text(),
    error_elaboration: mod.jsonTextNullable(),
    publ_server_service_id: publServerService.foreignKeyRef
      .publ_server_service_id(),
    ...mg.housekeeping(),
  });

  // this is added for testing purposes to make sure Axiom/Domain is creating
  // proper type-safe objects, otherwise will result in Typescript compile error;
  // expectType calls are not required for non-test or production use cases
  type tablePK = mod.TablePrimaryKeyColumnDefn<number, Context>;
  expectType<tablePK>(publHost.primaryKey.publ_host_id);
  expectType<
    mod.AxiomSqlDomain<Date | undefined, Context>
  >(publHost.axiomObjectDecl.created_at);
  expectType<tablePK>(publBuildEvent.primaryKey.publ_build_event_id);
  expectType<
    mod.TableForeignKeyColumnDefn<
      number,
      "publ_host",
      Context
    >
  >(publBuildEvent.axiomObjectDecl.publ_host_id);

  // deno-fmt-ignore
  const DDL = mod.SQL<Context>(ddlOptions)`
      -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.

      ${mod.typicalSqlTextLintSummary}

      ${publHost}

      ${publHost.view}

      ${publBuildEvent}

      ${publServerService}

      ${publServerStaticAccessLog}

      ${publServerErrorLog}

      ${mod.typicalSqlTmplEngineLintSummary}`;

  return {
    publHost,
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
    numericEnumModel,
    textEnumModel,
    DDL,
  };
}

if (import.meta.main) {
  // if we're being called as a CLI, just emit the DDL SQL:
  //    deno run -A lib/sql/render/mod_test-fixtures.ts > synthetic.sql
  //    deno run -A lib/sql/render/mod_test-fixtures.ts | sqlite3 synthetic.sqlite.db
  const dbDefn = syntheticDatabaseDefn();
  const ctx = mod.typicalSqlEmitContext();
  console.log(dbDefn.DDL.SQL(ctx));
}

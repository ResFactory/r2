// TODO: put these into mod.ts and use mod.* after migration
import * as tbl from "./ddl/table.ts";
import * as ax from "../../safety/axiom.ts";
import * as d from "./domain.ts";
import * as tmpl from "./template/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function syntheticTableDefns<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>() {
  const primaryKey = () =>
    tbl.autoIncPrimaryKey<number, EmitOptions, Context>(d.integer());

  const table = <
    TableName extends string,
    TPropAxioms extends
      & Record<string, ax.Axiom<Any>>
      & Record<`${TableName}_id`, ax.Axiom<Any>>,
  >(
    tableName: TableName,
    props: TPropAxioms,
  ) => {
    return {
      ...tbl.tableDefinition(tableName, props, {
        isIdempotent: true,
      }),
      ...tbl.tableDomainsRowFactory(tableName, props),
      view: tbl.tableDomainsViewWrapper(
        `${tableName}_vw`,
        tableName,
        props,
      ),
    };
  };

  // TODO: new view wrapper for publHost

  const publHost = table("publ_host", {
    publ_host_id: primaryKey(),
    host: tbl.unique(d.text()),
    host_identity: d.jsonTextNullable(),
    mutation_count: d.integer(),
    ...tbl.housekeeping(),
  });
  if (!publHost.primaryKey.publ_host_id.isPrimaryKey) {
    // for testing purposes only, publHost.primaryKey.publ_host_id.isPrimaryKey
    // should not cause compiler error
    throw new Error(`PK access, and all other properties should be type-safe`);
  }

  const publBuildEvent = table("publ_build_event", {
    publ_build_event_id: primaryKey(),
    publ_host_id: publHost.foreignKeyRef.publ_host_id(),
    iteration_index: d.integer(),
    build_initiated_at: d.dateTime(),
    build_completed_at: d.dateTime(),
    build_duration_ms: d.integer(),
    resources_originated_count: d.integer(),
    resources_persisted_count: d.integer(),
    resources_memoized_count: d.integer(),
    ...tbl.housekeeping(),
  });

  const publServerService = table("publ_server_service", {
    publ_server_service_id: primaryKey(),
    service_started_at: d.dateTime(),
    listen_host: d.text(),
    listen_port: d.integer(),
    publish_url: d.text(),
    publ_build_event_id: publBuildEvent.foreignKeyRef.publ_build_event_id(),
    ...tbl.housekeeping(),
  });

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = table(
    "publ_server_static_access_log",
    {
      publ_server_static_access_log_id: primaryKey(),
      status: d.integer(),
      asset_nature: d.text(),
      location_href: d.text(),
      filesys_target_path: d.text(),
      filesys_target_symlink: d.textNullable(),
      publ_server_service_id: publServerService.foreignKeyRef
        .publ_server_service_id(),
      ...tbl.housekeeping(),
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = table("publ_server_error_log", {
    publ_server_error_log_id: primaryKey(),
    location_href: d.text(),
    error_summary: d.text(),
    error_elaboration: d.jsonTextNullable(),
    publ_server_service_id: publServerService.foreignKeyRef
      .publ_server_service_id(),
    ...tbl.housekeeping(),
  });

  return {
    publHost,
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  };
}

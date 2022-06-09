// TODO: put these into mod.ts and use mod.* after migration
import * as tbl from "./ddl/table.ts";
import * as d from "./domain.ts";
import * as tmpl from "./template/mod.ts";

export function syntheticTableDefns<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>() {
  const tableDefnOptions: tbl.TableDefnOptions<EmitOptions, Context> = {
    isIdempotent: true,
  };
  const primaryKey = () =>
    tbl.autoIncPrimaryKey<number, EmitOptions, Context>(d.integer());

  // TODO: new view wrapper for publHost

  const publHost = tbl.tableDefnRowFactory("publ_host", {
    publ_host_id: primaryKey(),
    host: tbl.unique(d.text()),
    host_identity: d.jsonTextNullable(),
    mutation_count: d.integer(),
    ...tbl.housekeeping(),
  }, tableDefnOptions);
  publHost.primaryKey.publ_host_id; // example of type-safe PK access
  const publHostView = tbl.tableDefnViewWrapper(
    "publ_host_vw",
    publHost.tableName,
    publHost.axiomObjectDecl,
  );

  const publBuildEvent = tbl.tableDefnRowFactory("publ_build_event", {
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
  }, tableDefnOptions);

  const publServerService = tbl.tableDefnRowFactory("publ_server_service", {
    publ_server_service_id: primaryKey(),
    service_started_at: d.dateTime(),
    listen_host: d.text(),
    listen_port: d.integer(),
    publish_url: d.text(),
    publ_build_event_id: publBuildEvent.foreignKeyRef.publ_build_event_id(),
    ...tbl.housekeeping(),
  }, tableDefnOptions);

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = tbl.tableDefnRowFactory(
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
    tableDefnOptions,
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = tbl.tableDefnRowFactory("publ_server_error_log", {
    publ_server_error_log_id: primaryKey(),
    location_href: d.text(),
    error_summary: d.text(),
    error_elaboration: d.jsonTextNullable(),
    publ_server_service_id: publServerService.foreignKeyRef
      .publ_server_service_id(),
    ...tbl.housekeeping(),
  }, tableDefnOptions);

  return {
    publHost: { tableDefn: publHost, tableViewWrapper: publHostView },
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  };
}

import * as mod from "./mod.ts";
import * as v from "../view.ts";

export interface SyntheticStorageContext {
  readonly tdfs: mod.TableDefnFactoriesSupplier<SyntheticStorageContext>;
  readonly vdf: v.ViewDefnFactory<SyntheticStorageContext>;
}

export function syntheticTableDefns(ctx: SyntheticStorageContext) {
  const { tdfs } = ctx;

  const publHost = mod.typicalTableDefnDML<
    { host: string; host_identity: unknown; mutation_count: number },
    SyntheticStorageContext,
    "publ_host"
  >(
    ctx,
    "publ_host",
    ["host", "host_identity", "mutation_count"],
    tdfs,
    mod.typicalDefineTableOptions({ isIdempotent: true }),
  )(
    (
      defineColumns,
      { columnsFactory: cf, decoratorsFactory: df },
    ) => {
      defineColumns(
        cf.text("host"),
        cf.JSON("host_identity", { isNullable: true }),
        cf.integer("mutation_count"),
      );
      df.unique("host");
    },
  );
  const publHostView = mod.tableDefnViewWrapper(
    ctx,
    publHost.tableDefn,
    "publ_host_vw",
    ctx.vdf,
  );

  const publBuildEvent = mod.typicalStaticTableDefn(
    ctx,
    "publ_build_event",
    [
      "publ_host_id",
      "iteration_index",
      "build_initiated_at",
      "build_completed_at",
      "build_duration_ms",
      "resources_originated_count",
      "resources_persisted_count",
      "resources_memoized_count",
    ],
    tdfs,
    mod.typicalDefineTableOptions({ isIdempotent: true }),
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        publHost.primaryKeyColDefn.foreignKeyTableColDefn(),
        cf.integer("iteration_index"),
        cf.dateTime("build_initiated_at"),
        cf.dateTime("build_completed_at"),
        cf.integer("build_duration_ms"),
        cf.integer("resources_originated_count"),
        cf.integer("resources_persisted_count"),
        cf.integer("resources_memoized_count"),
      );
    },
  );

  const publServerService = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_service",
    [
      "service_started_at",
      "listen_host",
      "listen_port",
      "publish_url",
      "publ_build_event_id",
    ],
    tdfs,
    mod.typicalDefineTableOptions({ isIdempotent: true }),
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.dateTime("service_started_at"),
        cf.text("listen_host"),
        cf.integer("listen_port"),
        cf.text("publish_url"),
        publBuildEvent.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerStaticAccessLog = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_static_access_log",
    [
      "status",
      "asset_nature",
      "location_href",
      "filesys_target_path",
      "filesys_target_symlink",
      "publ_server_service_id",
    ],
    tdfs,
    mod.typicalDefineTableOptions({ isIdempotent: true }),
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.integer("status"),
        cf.text("asset_nature"),
        cf.text("location_href"),
        cf.text("filesys_target_path"),
        cf.text("filesys_target_symlink", { isNullable: true }),
        publServerService.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const publServerErrorLog = mod.typicalStaticTableDefn(
    ctx,
    "publ_server_error_log",
    [
      "location_href",
      "error_summary",
      "error_elaboration",
      "publ_server_service_id",
    ],
    tdfs,
    mod.typicalDefineTableOptions({ isIdempotent: true }),
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.text("location_href"),
        cf.text("error_summary"),
        cf.JSON("error_elaboration", { isNullable: true }),
        publServerService.primaryKeyColDefn.foreignKeyTableColDefn(),
      );
    },
  );

  return {
    publHost: { ...publHost, viewWrapper: publHostView },
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  };
}

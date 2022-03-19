// generated by rdbms-schema-ts.ts. DO NOT EDIT.

export type CamelCase<S extends string> = S extends
  `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;
export type TableToObject<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Date ? T[K]
    : // deno-lint-ignore ban-types
    (T[K] extends object ? TableToObject<T[K]> : T[K]);
};
export type UnknownJSON = string;

export interface mutable_publ_host {
  publ_host_id: number; // primary key
  created_at?: Date; // default value: CURRENT_TIMESTAMP
  host: string;
  host_identity?: UnknownJSON;
  mutation_count?: number;
}

export const PublHostTableName = "publ_host";
export type publ_host = Readonly<mutable_publ_host>;
export type MutablePublHost = TableToObject<mutable_publ_host>;
export type PublHost = Readonly<MutablePublHost>;
export type publ_host_insertable =
  & Omit<publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<publ_host, "created_at">>;
export type mutable_publ_host_insertable =
  & Omit<mutable_publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<mutable_publ_host, "created_at">>;
export type PublHostInsertable =
  & Omit<PublHost, "publHostId" | "createdAt">
  & Partial<Pick<PublHost, "createdAt">>;
export type publ_host_updateable =
  & Omit<publ_host, "publ_host_id" | "created_at">
  & Partial<Pick<publ_host, "created_at">>;
export type PublHostUpdatable =
  & Omit<PublHost, "publHostId" | "createdAt">
  & Partial<Pick<PublHost, "createdAt">>;

export const transformPublHost = {
  tableName: "publ_host",
  fromTable: (t: publ_host): PublHost => ({
    publHostId: t.publ_host_id,
    createdAt: t.created_at,
    host: t.host,
    hostIdentity: t.host_identity,
    mutationCount: t.mutation_count,
  }),
  toTable: (o: PublHost): publ_host => ({
    publ_host_id: o.publHostId,
    created_at: o.createdAt,
    host: o.host,
    host_identity: o.hostIdentity,
    mutation_count: o.mutationCount,
  }),
  insertable: (o: PublHostInsertable): publ_host_insertable => {
    const insertable: mutable_publ_host_insertable = {
      created_at: o.createdAt,
      host: o.host,
      host_identity: o.hostIdentity,
      mutation_count: o.mutationCount,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export interface mutable_publ_build_event {
  publ_build_event_id: number; // primary key
  created_at?: Date; // default value: CURRENT_TIMESTAMP
  publ_host_id: number;
  iteration_index: number;
  build_initiated_at: Date;
  build_completed_at: Date;
  build_duration_ms: number;
  resources_originated_count: number;
  resources_persisted_count: number;
  resources_memoized_count?: number;
}

export const PublBuildEventTableName = "publ_build_event";
export type publ_build_event = Readonly<mutable_publ_build_event>;
export type MutablePublBuildEvent = TableToObject<mutable_publ_build_event>;
export type PublBuildEvent = Readonly<MutablePublBuildEvent>;
export type publ_build_event_insertable =
  & Omit<publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<publ_build_event, "created_at">>;
export type mutable_publ_build_event_insertable =
  & Omit<mutable_publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<mutable_publ_build_event, "created_at">>;
export type PublBuildEventInsertable =
  & Omit<PublBuildEvent, "publBuildEventId" | "createdAt">
  & Partial<Pick<PublBuildEvent, "createdAt">>;
export type publ_build_event_updateable =
  & Omit<publ_build_event, "publ_build_event_id" | "created_at">
  & Partial<Pick<publ_build_event, "created_at">>;
export type PublBuildEventUpdatable =
  & Omit<PublBuildEvent, "publBuildEventId" | "createdAt">
  & Partial<Pick<PublBuildEvent, "createdAt">>;

export const transformPublBuildEvent = {
  tableName: "publ_build_event",
  fromTable: (t: publ_build_event): PublBuildEvent => ({
    publBuildEventId: t.publ_build_event_id,
    createdAt: t.created_at,
    publHostId: t.publ_host_id,
    iterationIndex: t.iteration_index,
    buildInitiatedAt: t.build_initiated_at,
    buildCompletedAt: t.build_completed_at,
    buildDurationMs: t.build_duration_ms,
    resourcesOriginatedCount: t.resources_originated_count,
    resourcesPersistedCount: t.resources_persisted_count,
    resourcesMemoizedCount: t.resources_memoized_count,
  }),
  toTable: (o: PublBuildEvent): publ_build_event => ({
    publ_build_event_id: o.publBuildEventId,
    created_at: o.createdAt,
    publ_host_id: o.publHostId,
    iteration_index: o.iterationIndex,
    build_initiated_at: o.buildInitiatedAt,
    build_completed_at: o.buildCompletedAt,
    build_duration_ms: o.buildDurationMs,
    resources_originated_count: o.resourcesOriginatedCount,
    resources_persisted_count: o.resourcesPersistedCount,
    resources_memoized_count: o.resourcesMemoizedCount,
  }),
  insertable: (o: PublBuildEventInsertable): publ_build_event_insertable => {
    const insertable: mutable_publ_build_event_insertable = {
      created_at: o.createdAt,
      publ_host_id: o.publHostId,
      iteration_index: o.iterationIndex,
      build_initiated_at: o.buildInitiatedAt,
      build_completed_at: o.buildCompletedAt,
      build_duration_ms: o.buildDurationMs,
      resources_originated_count: o.resourcesOriginatedCount,
      resources_persisted_count: o.resourcesPersistedCount,
      resources_memoized_count: o.resourcesMemoizedCount,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export interface mutable_publ_server_service {
  publ_server_service_id: number; // primary key
  created_at?: Date; // default value: CURRENT_TIMESTAMP
  service_started_at?: Date;
  listen_host: string;
  listen_port: number;
  publish_url: string;
  publ_build_event_id: number;
}

export const PublServerServiceTableName = "publ_server_service";
export type publ_server_service = Readonly<mutable_publ_server_service>;
export type MutablePublServerService = TableToObject<
  mutable_publ_server_service
>;
export type PublServerService = Readonly<MutablePublServerService>;
export type publ_server_service_insertable =
  & Omit<publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<publ_server_service, "created_at">>;
export type mutable_publ_server_service_insertable =
  & Omit<mutable_publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<mutable_publ_server_service, "created_at">>;
export type PublServerServiceInsertable =
  & Omit<PublServerService, "publServerServiceId" | "createdAt">
  & Partial<Pick<PublServerService, "createdAt">>;
export type publ_server_service_updateable =
  & Omit<publ_server_service, "publ_server_service_id" | "created_at">
  & Partial<Pick<publ_server_service, "created_at">>;
export type PublServerServiceUpdatable =
  & Omit<PublServerService, "publServerServiceId" | "createdAt">
  & Partial<Pick<PublServerService, "createdAt">>;

export const transformPublServerService = {
  tableName: "publ_server_service",
  fromTable: (t: publ_server_service): PublServerService => ({
    publServerServiceId: t.publ_server_service_id,
    createdAt: t.created_at,
    serviceStartedAt: t.service_started_at,
    listenHost: t.listen_host,
    listenPort: t.listen_port,
    publishUrl: t.publish_url,
    publBuildEventId: t.publ_build_event_id,
  }),
  toTable: (o: PublServerService): publ_server_service => ({
    publ_server_service_id: o.publServerServiceId,
    created_at: o.createdAt,
    service_started_at: o.serviceStartedAt,
    listen_host: o.listenHost,
    listen_port: o.listenPort,
    publish_url: o.publishUrl,
    publ_build_event_id: o.publBuildEventId,
  }),
  insertable: (
    o: PublServerServiceInsertable,
  ): publ_server_service_insertable => {
    const insertable: mutable_publ_server_service_insertable = {
      created_at: o.createdAt,
      service_started_at: o.serviceStartedAt,
      listen_host: o.listenHost,
      listen_port: o.listenPort,
      publish_url: o.publishUrl,
      publ_build_event_id: o.publBuildEventId,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export interface mutable_publ_server_static_access_log {
  publ_server_static_access_log_id: number; // primary key
  created_at?: Date; // default value: CURRENT_TIMESTAMP
  status: number;
  asset_nature: string;
  location_href: string;
  filesys_target_path: string;
  filesys_target_symlink?: string;
  publ_server_service_id: number;
}

export const PublServerStaticAccessLogTableName =
  "publ_server_static_access_log";
export type publ_server_static_access_log = Readonly<
  mutable_publ_server_static_access_log
>;
export type MutablePublServerStaticAccessLog = TableToObject<
  mutable_publ_server_static_access_log
>;
export type PublServerStaticAccessLog = Readonly<
  MutablePublServerStaticAccessLog
>;
export type publ_server_static_access_log_insertable =
  & Omit<
    publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<publ_server_static_access_log, "created_at">>;
export type mutable_publ_server_static_access_log_insertable =
  & Omit<
    mutable_publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<mutable_publ_server_static_access_log, "created_at">>;
export type PublServerStaticAccessLogInsertable =
  & Omit<PublServerStaticAccessLog, "publServerStaticAccessLogId" | "createdAt">
  & Partial<Pick<PublServerStaticAccessLog, "createdAt">>;
export type publ_server_static_access_log_updateable =
  & Omit<
    publ_server_static_access_log,
    "publ_server_static_access_log_id" | "created_at"
  >
  & Partial<Pick<publ_server_static_access_log, "created_at">>;
export type PublServerStaticAccessLogUpdatable =
  & Omit<PublServerStaticAccessLog, "publServerStaticAccessLogId" | "createdAt">
  & Partial<Pick<PublServerStaticAccessLog, "createdAt">>;

export const transformPublServerStaticAccessLog = {
  tableName: "publ_server_static_access_log",
  fromTable: (t: publ_server_static_access_log): PublServerStaticAccessLog => ({
    publServerStaticAccessLogId: t.publ_server_static_access_log_id,
    createdAt: t.created_at,
    status: t.status,
    assetNature: t.asset_nature,
    locationHref: t.location_href,
    filesysTargetPath: t.filesys_target_path,
    filesysTargetSymlink: t.filesys_target_symlink,
    publServerServiceId: t.publ_server_service_id,
  }),
  toTable: (o: PublServerStaticAccessLog): publ_server_static_access_log => ({
    publ_server_static_access_log_id: o.publServerStaticAccessLogId,
    created_at: o.createdAt,
    status: o.status,
    asset_nature: o.assetNature,
    location_href: o.locationHref,
    filesys_target_path: o.filesysTargetPath,
    filesys_target_symlink: o.filesysTargetSymlink,
    publ_server_service_id: o.publServerServiceId,
  }),
  insertable: (
    o: PublServerStaticAccessLogInsertable,
  ): publ_server_static_access_log_insertable => {
    const insertable: mutable_publ_server_static_access_log_insertable = {
      created_at: o.createdAt,
      status: o.status,
      asset_nature: o.assetNature,
      location_href: o.locationHref,
      filesys_target_path: o.filesysTargetPath,
      filesys_target_symlink: o.filesysTargetSymlink,
      publ_server_service_id: o.publServerServiceId,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

export interface mutable_publ_server_error_log {
  publ_server_error_log_id: number; // primary key
  created_at?: Date; // default value: CURRENT_TIMESTAMP
  location_href: string;
  error_summary: string;
  error_elaboration?: UnknownJSON;
  publ_server_service_id: number;
}

export const PublServerErrorLogTableName = "publ_server_error_log";
export type publ_server_error_log = Readonly<mutable_publ_server_error_log>;
export type MutablePublServerErrorLog = TableToObject<
  mutable_publ_server_error_log
>;
export type PublServerErrorLog = Readonly<MutablePublServerErrorLog>;
export type publ_server_error_log_insertable =
  & Omit<publ_server_error_log, "publ_server_error_log_id" | "created_at">
  & Partial<Pick<publ_server_error_log, "created_at">>;
export type mutable_publ_server_error_log_insertable =
  & Omit<
    mutable_publ_server_error_log,
    "publ_server_error_log_id" | "created_at"
  >
  & Partial<Pick<mutable_publ_server_error_log, "created_at">>;
export type PublServerErrorLogInsertable =
  & Omit<PublServerErrorLog, "publServerErrorLogId" | "createdAt">
  & Partial<Pick<PublServerErrorLog, "createdAt">>;
export type publ_server_error_log_updateable =
  & Omit<publ_server_error_log, "publ_server_error_log_id" | "created_at">
  & Partial<Pick<publ_server_error_log, "created_at">>;
export type PublServerErrorLogUpdatable =
  & Omit<PublServerErrorLog, "publServerErrorLogId" | "createdAt">
  & Partial<Pick<PublServerErrorLog, "createdAt">>;

export const transformPublServerErrorLog = {
  tableName: "publ_server_error_log",
  fromTable: (t: publ_server_error_log): PublServerErrorLog => ({
    publServerErrorLogId: t.publ_server_error_log_id,
    createdAt: t.created_at,
    locationHref: t.location_href,
    errorSummary: t.error_summary,
    errorElaboration: t.error_elaboration,
    publServerServiceId: t.publ_server_service_id,
  }),
  toTable: (o: PublServerErrorLog): publ_server_error_log => ({
    publ_server_error_log_id: o.publServerErrorLogId,
    created_at: o.createdAt,
    location_href: o.locationHref,
    error_summary: o.errorSummary,
    error_elaboration: o.errorElaboration,
    publ_server_service_id: o.publServerServiceId,
  }),
  insertable: (
    o: PublServerErrorLogInsertable,
  ): publ_server_error_log_insertable => {
    const insertable: mutable_publ_server_error_log_insertable = {
      created_at: o.createdAt,
      location_href: o.locationHref,
      error_summary: o.errorSummary,
      error_elaboration: o.errorElaboration,
      publ_server_service_id: o.publServerServiceId,
    };
    if (typeof insertable.created_at === "undefined") {
      delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
    }
    return insertable;
  },
};

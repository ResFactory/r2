import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./mod.ts";
import * as tf from "./test-fixtures.ts";
import * as v from "../view.ts";
import * as t from "../template/mod.ts";

Deno.test("SQL assember (SQLa) storage", async (tc) => {
  const ctx: tf.SyntheticStorageContext = {
    tdfs: mod.sqliteTableDefnFactories<tf.SyntheticStorageContext>(),
    vdf: v.typicalSqlViewDefnFactory<tf.SyntheticStorageContext>(),
  };

  const syntheticTD = tf.syntheticTableDefns(ctx);
  const emitOptions = t.typicalSqlTextEmitOptions();

  await tc.step("table", () => {
    ta.assertEquals(
      syntheticTD.publHost.tableDefn.SQL(ctx, emitOptions),
      uws(`
        CREATE TABLE IF NOT EXISTS publ_host (
            publ_host_id INTEGER PRIMARY KEY AUTOINCREMENT,
            host TEXT NOT NULL,
            host_identity JSON,
            mutation_count INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(host)
        )`),
    );
  });

  await tc.step("table wrapper view", () => {
    ta.assertEquals(
      syntheticTD.publHost.viewWrapper.SQL(ctx, emitOptions),
      uws(`
        CREATE VIEW IF NOT EXISTS publ_host_vw AS
            SELECT publ_host_id, host, host_identity, mutation_count, created_at
            FROM publ_host`),
    );
  });

  await tc.step("table referencing foreign key", () => {
    ta.assertEquals(
      syntheticTD.publBuildEvent.tableDefn.SQL(ctx, emitOptions),
      uws(`
        CREATE TABLE IF NOT EXISTS publ_build_event (
            publ_build_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
            publ_host_id INTEGER NOT NULL,
            iteration_index INTEGER NOT NULL,
            build_initiated_at DATETIME NOT NULL,
            build_completed_at DATETIME NOT NULL,
            build_duration_ms INTEGER NOT NULL,
            resources_originated_count INTEGER NOT NULL,
            resources_persisted_count INTEGER NOT NULL,
            resources_memoized_count INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(publ_host_id) REFERENCES publ_host(publ_host_id)
        )`),
    );
  });

  await tc.step("table insert DML", () => {
    ta.assertEquals(
      syntheticTD.publHost.insertDML({
        host: "test",
        hostIdentity: "testHI",
        mutationCount: 0,
      }).SQL(ctx, emitOptions),
      `INSERT INTO publ_host (host, host_identity, mutation_count) VALUES ('test', 'testHI', 0)`,
    );
  });
});

Deno.test("Typescript generator", async (tc) => {
  const ctx: tf.SyntheticStorageContext = {
    tdfs: mod.sqliteTableDefnFactories<tf.SyntheticStorageContext>(),
    vdf: v.typicalSqlViewDefnFactory<tf.SyntheticStorageContext>(),
  };

  const syntheticTD = tf.syntheticTableDefns(ctx);
  const emitOptions = t.typicalSqlTextEmitOptions();

  await tc.step("dependencies", () => {
    ta.assertEquals(
      mod.tableTypescriptDeps({ tsSharedDeclarations: new Set([`export type UnknownJSON = string;`]) }).typescriptCode(ctx),
      uws(`
        export type CamelCase<S extends string> = S extends
          \`\${infer P1}_\${infer P2}\${infer P3}\`
          ? \`\${Lowercase<P1>}\${Uppercase<P2>}\${CamelCase<P3>}\`
          : Lowercase<S>;
        export type TableToObject<T> = {
          [K in keyof T as CamelCase<string & K>]: T[K] extends Date ? T[K]
            : // deno-lint-ignore ban-types
            (T[K] extends object ? TableToObject<T[K]> : T[K]);
        };
        export type UnknownJSON = string;`),
    );
  });

  await tc.step("table.ts", () => {
    ta.assertEquals(
      mod.tableTypescript(syntheticTD.publHost.tableDefn, emitOptions).typescriptCode(ctx),
      uws(`
        export interface mutable_publ_host {
          publ_host_id: number; // INTEGER, NOT NULL, primary key
          host: string; // TEXT, NOT NULL
          host_identity?: UnknownJSON; // JSON
          mutation_count: number; // INTEGER, NOT NULL
          created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
        }

        export const PublHostTableName = "publ_host";
        export type publ_host = Readonly<mutable_publ_host>;
        export type MutablePublHost = TableToObject<mutable_publ_host>;
        export type PublHost = Readonly<MutablePublHost>;
        export type publ_host_insertable = Omit<publ_host, "publ_host_id" | "created_at"> & Partial<Pick<publ_host, "created_at">>;
        export type mutable_publ_host_insertable = Omit<mutable_publ_host, "publ_host_id" | "created_at"> & Partial<Pick<mutable_publ_host, "created_at">>;
        export type PublHostInsertable = Omit<PublHost, "publHostId" | "createdAt"> & Partial<Pick<PublHost, "createdAt">>;
        export type publ_host_updateable = Omit<publ_host, "publ_host_id" | "created_at"> & Partial<Pick<publ_host, "created_at">>;
        export type PublHostUpdatable = Omit<PublHost, "publHostId" | "createdAt"> & Partial<Pick<PublHost, "createdAt">>;

        export const transformPublHost = {
          tableName: "publ_host",
          fromTable: (t: publ_host): PublHost => ({
            publHostId: t.publ_host_id,
            host: t.host,
            hostIdentity: t.host_identity,
            mutationCount: t.mutation_count,
            createdAt: t.created_at
          }),
          toTable: (o: PublHost): publ_host => ({
            publ_host_id: o.publHostId,
            host: o.host,
            host_identity: o.hostIdentity,
            mutation_count: o.mutationCount,
            created_at: o.createdAt
          }),
          insertable: (o: PublHostInsertable): publ_host_insertable => {
            const insertable: mutable_publ_host_insertable = {
              host: o.host,
              host_identity: o.hostIdentity,
              mutation_count: o.mutationCount,
              created_at: o.createdAt
            };
            if(typeof insertable.created_at === "undefined") delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
            return insertable;
          },
        };`),
    );
  });

  await tc.step("table.ts table referencing foreign key", () => {
    // const tts = mod.tableTypescript(syntheticTD.publBuildEvent.tableDefn, emitOptions);
    // Deno.writeTextFileSync("test.ts", mod.tableTypescriptDeps({ tsSharedDeclarations: tts.tsSharedDeclarations ? new Set<string>(tts.tsSharedDeclarations.values()) : undefined }).typescriptCode(ctx) + "\n" + mod.tableTypescript(syntheticTD.publBuildEvent.tableDefn, emitOptions).typescriptCode(ctx))
    ta.assertEquals(
      mod.tableTypescript(syntheticTD.publBuildEvent.tableDefn, emitOptions).typescriptCode(ctx),
      uws(`
        export interface mutable_publ_build_event {
          publ_build_event_id: number; // INTEGER, NOT NULL, primary key
          publ_host_id: number; // INTEGER, NOT NULL, FK: publ_host.publ_host_id
          iteration_index: number; // INTEGER, NOT NULL
          build_initiated_at: Date; // DATETIME, NOT NULL
          build_completed_at: Date; // DATETIME, NOT NULL
          build_duration_ms: number; // INTEGER, NOT NULL
          resources_originated_count: number; // INTEGER, NOT NULL
          resources_persisted_count: number; // INTEGER, NOT NULL
          resources_memoized_count: number; // INTEGER, NOT NULL
          created_at?: Date; // DATETIME, default: CURRENT_TIMESTAMP
        }

        export const PublBuildEventTableName = "publ_build_event";
        export type publ_build_event = Readonly<mutable_publ_build_event>;
        export type MutablePublBuildEvent = TableToObject<mutable_publ_build_event>;
        export type PublBuildEvent = Readonly<MutablePublBuildEvent>;
        export type publ_build_event_insertable = Omit<publ_build_event, "publ_build_event_id" | "created_at"> & Partial<Pick<publ_build_event, "created_at">>;
        export type mutable_publ_build_event_insertable = Omit<mutable_publ_build_event, "publ_build_event_id" | "created_at"> & Partial<Pick<mutable_publ_build_event, "created_at">>;
        export type PublBuildEventInsertable = Omit<PublBuildEvent, "publBuildEventId" | "createdAt"> & Partial<Pick<PublBuildEvent, "createdAt">>;
        export type publ_build_event_updateable = Omit<publ_build_event, "publ_build_event_id" | "created_at"> & Partial<Pick<publ_build_event, "created_at">>;
        export type PublBuildEventUpdatable = Omit<PublBuildEvent, "publBuildEventId" | "createdAt"> & Partial<Pick<PublBuildEvent, "createdAt">>;

        export const transformPublBuildEvent = {
          tableName: "publ_build_event",
          fromTable: (t: publ_build_event): PublBuildEvent => ({
            publBuildEventId: t.publ_build_event_id,
            publHostId: t.publ_host_id,
            iterationIndex: t.iteration_index,
            buildInitiatedAt: t.build_initiated_at,
            buildCompletedAt: t.build_completed_at,
            buildDurationMs: t.build_duration_ms,
            resourcesOriginatedCount: t.resources_originated_count,
            resourcesPersistedCount: t.resources_persisted_count,
            resourcesMemoizedCount: t.resources_memoized_count,
            createdAt: t.created_at
          }),
          toTable: (o: PublBuildEvent): publ_build_event => ({
            publ_build_event_id: o.publBuildEventId,
            publ_host_id: o.publHostId,
            iteration_index: o.iterationIndex,
            build_initiated_at: o.buildInitiatedAt,
            build_completed_at: o.buildCompletedAt,
            build_duration_ms: o.buildDurationMs,
            resources_originated_count: o.resourcesOriginatedCount,
            resources_persisted_count: o.resourcesPersistedCount,
            resources_memoized_count: o.resourcesMemoizedCount,
            created_at: o.createdAt
          }),
          insertable: (o: PublBuildEventInsertable): publ_build_event_insertable => {
            const insertable: mutable_publ_build_event_insertable = {
              publ_host_id: o.publHostId,
              iteration_index: o.iterationIndex,
              build_initiated_at: o.buildInitiatedAt,
              build_completed_at: o.buildCompletedAt,
              build_duration_ms: o.buildDurationMs,
              resources_originated_count: o.resourcesOriginatedCount,
              resources_persisted_count: o.resourcesPersistedCount,
              resources_memoized_count: o.resourcesMemoizedCount,
              created_at: o.createdAt
            };
            if(typeof insertable.created_at === "undefined") delete insertable.created_at; // allow RDBMS to supply the defaultValue CURRENT_TIMESTAMP
            return insertable;
          },
        };`),
    );
  });
});

import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./mod.ts";
import * as tf from "./test-fixtures.ts";
import * as v from "../view.ts";
import * as t from "../text.ts";

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

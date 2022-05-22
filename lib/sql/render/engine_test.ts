import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./mod.ts";
import * as ws from "../../text/whitespace.ts";

// CREATE TABLE IF NOT EXISTS publ_host (
//   publ_host_id INTEGER PRIMARY KEY AUTOINCREMENT,
//   host TEXT NOT NULL,
//   host_identity JSON,
//   mutation_count INTEGER,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
//   UNIQUE(host)
// );

// CREATE TABLE IF NOT EXISTS publ_build_event (
//   publ_build_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
//   publ_host_id INTEGER NOT NULL,
//   iteration_index INTEGER NOT NULL,
//   build_initiated_at DATETIME NOT NULL,
//   build_completed_at DATETIME NOT NULL,
//   build_duration_ms INTEGER NOT NULL,
//   resources_originated_count INTEGER NOT NULL,
//   resources_persisted_count INTEGER NOT NULL,
//   resources_memoized_count INTEGER, -- NULL if not memoizing, non-zero if memoized
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
//   FOREIGN KEY(publ_host_id) REFERENCES publ_host(publ_host_id)
// );

// CREATE TABLE IF NOT EXISTS publ_server_service (
//   publ_server_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
//   service_started_at DATETIME,
//   listen_host TEXT NOT NULL,
//   listen_port INTEGER NOT NULL,
//   publish_url TEXT NOT NULL,
//   publ_build_event_id INTEGER NOT NULL,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
//   FOREIGN KEY(publ_build_event_id) REFERENCES publ_build_event(publ_build_event_id)
// );

// -- TODO: add indexes to improve query performance
// CREATE TABLE IF NOT EXISTS publ_server_static_access_log (
//   publ_server_static_access_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
//   status INTEGER NOT NULL,
//   asset_nature TEXT NOT NULL,
//   location_href TEXT NOT NULL,
//   filesys_target_path TEXT NOT NULL,
//   filesys_target_symlink TEXT,
//   publ_server_service_id INTEGER NOT NULL,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
//   FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
// );

// CREATE TABLE IF NOT EXISTS publ_server_error_log (
//   publ_server_error_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
//   location_href TEXT NOT NULL,
//   error_summary TEXT NOT NULL,
//   error_elaboration JSON,
//   publ_server_service_id INTEGER NOT NULL,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
//   FOREIGN KEY(publ_server_service_id) REFERENCES publ_server_service(publ_server_service_id)
// );

interface TestContext
  extends mod.EngineContext, mod.UnindentSupplier, mod.SqlLintIssuesSupplier {
}

export function allTableDefns(ctx: TestContext) {
  const publHost = mod.typicalTablePreparer(ctx, "publ_host", [
    "host",
    "host_identity",
    "mutation_count",
  ])(
    (defineColumns, { columnsFactory: cf, decoratorsFactory: df }) => {
      defineColumns(
        cf.text("host"),
        cf.JSON("host_identity", { isNullable: true }),
        cf.integer("mutation_count"),
      );
      df.unique("host");
    },
  );

  const publBuildEvent = mod.typicalTablePreparer(ctx, "publ_build_event", [
    "publ_host_id",
    "iteration_index",
    "build_initiated_at",
    "build_completed_at",
    "build_duration_ms",
    "resources_originated_count",
    "resources_persisted_count",
    "resources_memoized_count",
  ])(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        { fkeyTable: publHost }, // calls cf.foreignKey()
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

  return [publHost, publBuildEvent];
}

Deno.test("idempotent SQL DDL", () => {
  // deno-lint-ignore no-explicit-any
  const tables = new Map<string, mod.TableDefinition<TestContext, any, any>>();
  const lintIssues: mod.SqlLintIssueSupplier[] = [];
  const ctx: TestContext = {
    dialect: mod.sqliteDialect<TestContext>(),
    registerTable: (table) => {
      tables.set(table.tableName, table);
    },
    reference: (tableName, columnName) => {
      const tableDefn = tables.get(tableName);
      if (tableDefn) return tableDefn.foreignKeyReference(columnName);
      return undefined;
    },
    unindentWhitespace: (text) => ws.unindentWhitespace(text, true),
    lintIssues,
  };

  const [publHost, publBuildEvent] = allTableDefns(ctx);
  const DDL = mod.sqlText<TestContext>()`
    ${publHost}
    ${publBuildEvent}`;

  console.log(DDL.SQL(ctx, {
    indentation: (nature) => {
      switch (nature) {
        case "create table":
          return "";
        case "define table column":
          return "    ";
      }
    },
  }));
  if (DDL.lintIssues?.length) {
    console.dir(DDL.lintIssues);
  }
  //ta.assertEquals(0, DDL.lintIssues?.length);
});

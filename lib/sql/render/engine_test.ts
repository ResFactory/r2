import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./mod.ts";
import { typicalTablePreparer } from "./mod.ts";
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

interface TestContext extends mod.EngineContext, mod.UnindentSupplier {
}

export function publHost(ctx: TestContext) {
  const result = typicalTablePreparer(ctx, "publ_host", [
    "host",
    "host_identity",
    "mutation_count",
  ])();
  const [tc, td] = [result.columnsHelpers(), result.defnHelpers()];
  result.define`
      ${tc.text("host")}
      ${tc.JSON("host_identity", { isNullable: true })}
      ${tc.integer("mutation_count")}
      ${td.unique("host")}
    `;
  return result;
}

export function publBuildEvent(ctx: TestContext) {
  const result = typicalTablePreparer(ctx, "publ_build_event", [
    "publ_host_id",
    "iteration_index",
    "build_initiated_at",
    "build_completed_at",
    "build_duration_ms",
    "resources_originated_count",
    "resources_persisted_count",
    "resources_memoized_count",
  ])();
  const [tc, td] = [
    result.columnsHelpers(),
    result.defnHelpers(),
  ];
  const publHostRef = ctx.reference("publ_host");
  if (publHostRef) {
    result.define`
      ${tc.foreignKey(publHostRef)}
    `;
  }
  result.define`
      ${tc.integer("iteration_index")}
      ${tc.dateTime("build_initiated_at")}
      ${tc.dateTime("build_completed_at")}
      ${tc.integer("build_duration_ms")}
      ${tc.integer("resources_originated_count")}
      ${tc.integer("resources_persisted_count")}
      ${tc.integer("resources_memoized_count")}
      `;
  return result;
}

Deno.test("idempotent SQL DDL", () => {
  // deno-lint-ignore no-explicit-any
  const tables = new Map<string, mod.CreateTableRequest<TestContext, any>>();
  const ctx: TestContext = {
    registerTable: (table) => {
      tables.set(table.tableName, table);
    },
    reference: (tableName, columnName) => {
      const createTableRequest = tables.get(tableName);
      if (createTableRequest) {
        if (!columnName) {
          const tableColumnDefn = createTableRequest.columns.find((fc) =>
            mod.isTableColumnPrimaryKeySupplier(fc) &&
            mod.isTableColumnDataTypeSupplier(fc)
          ) as
            | (
              & mod.TableColumnNameSupplier
              // deno-lint-ignore no-explicit-any
              & mod.TableColumnDataTypeSupplier<TestContext, any>
            )
            | undefined;
          if (tableColumnDefn) {
            return {
              createTableRequest,
              tableColumnDefn,
            };
          }
        } else {
          const tableColumnDefn = createTableRequest.columns.find((fc) =>
            mod.isTableColumnNameSupplier(fc) &&
            fc.columnName == columnName
          ) as
            | (
              & mod.TableColumnNameSupplier
              // deno-lint-ignore no-explicit-any
              & mod.TableColumnDataTypeSupplier<TestContext, any>
            )
            | undefined;
          if (tableColumnDefn) {
            return {
              createTableRequest,
              tableColumnDefn,
            };
          }
        }
      }
      return undefined;
    },
    unindentWhitespace: (text) => ws.unindentWhitespace(text, true),
  };

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

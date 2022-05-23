import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./mod.ts";
import * as ws from "../../text/whitespace.ts";

interface TestContext
  extends mod.EngineContext, mod.UnindentSupplier, mod.SqlLintIssuesSupplier {
}

export function allTableDefns(ctx: TestContext) {
  const { tableDefn: publHost, primaryKeyColDefn: publHostPK } = mod
    .typicalTableDefn(ctx, "publ_host", [
      "host",
      "host_identity",
      "mutation_count",
    ])(
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

  const { tableDefn: publBuildEvent, primaryKeyColDefn: publBuildEventPK } = mod
    .typicalTableDefn(
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
    )(
      (defineColumns, { columnsFactory: cf }) => {
        defineColumns(
          publHostPK.foreignKeyTableColDefn(),
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

  const {
    tableDefn: publServerService,
    primaryKeyColDefn: publServerServicePK,
  } = mod.typicalTableDefn(
    ctx,
    "publ_server_service",
    [
      "service_started_at",
      "listen_host",
      "listen_port",
      "publish_url",
      "publ_build_event_id",
    ],
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.dateTime("service_started_at"),
        cf.text("listen_host"),
        cf.integer("listen_port"),
        cf.text("publish_url"),
        publBuildEventPK.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const { tableDefn: publServerStaticAccessLog } = mod.typicalTableDefn(
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
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.integer("status"),
        cf.text("asset_nature"),
        cf.text("location_href"),
        cf.text("filesys_target_path"),
        cf.text("filesys_target_symlink", { isNullable: true }),
        publServerServicePK.foreignKeyTableColDefn(),
      );
    },
  );

  // -- TODO: add indexes to improve query performance
  const { tableDefn: publServerErrorLog } = mod.typicalTableDefn(
    ctx,
    "publ_server_error_log",
    [
      "location_href",
      "error_summary",
      "error_elaboration",
      "publ_server_service_id",
    ],
  )(
    (defineColumns, { columnsFactory: cf }) => {
      defineColumns(
        cf.text("location_href"),
        cf.text("error_summary"),
        cf.JSON("error_elaboration", { isNullable: true }),
        publServerServicePK.foreignKeyTableColDefn(),
      );
    },
  );

  return [
    publHost,
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  ];
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
    unindentWhitespace: (text) => ws.unindentWhitespace(text, true),
    lintIssues,
  };

  const [
    publHost,
    publBuildEvent,
    publServerService,
    publServerStaticAccessLog,
    publServerErrorLog,
  ] = allTableDefns(ctx);
  const DDL = mod.sqlText<TestContext>()`
    -- This SQL is auto-generated and may be version-controlled but not human edited.
    -- Source: ${import.meta.url}

    -- Governance:
    -- * use 3rd normal form for tables
    -- * use views to wrap business logic
    -- * when denormalizing is required, use views (don't denormalize tables)
    -- * each table name MUST be singular (not plural) noun
    -- * each table MUST have a \`table_name\`_id primary key (typicalTableDefn will do this automatically)
    -- * each table MUST have \`created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\` column (typicalTableDefn will do this automatically)
    -- * if table's rows are mutable, it MUST have a \`updated_at DATETIME\` column (not having an updated_at means it's immutable)
    -- * if table's rows are deleteable, it MUST have a \`deleted_at DATETIME\` column for soft deletes (not having an deleted_at means it's immutable)

    -- TODO: create a govn_* set of tables that would contain business logic, assurance, presentation, and other details
    --       govn_entity would be a table that stores table meta data (descriptions, immutability, presentation, migration instructions, etc.)
    --       govn_entity_property would be a table that stores table column meta data (descriptions, immutability, presentation, migration instructions, etc.)
    --       govn_entity_relationship would be a table that stores entity/property relationships (1:N, 1:M, etc.) for literate programming documentation, etc.
    --       govn_entity_activity would be a table that stores governance history and activity data in JSON format for documentation, migration status, etc.

    ${publHost}

    ${publBuildEvent}

    ${publServerService}

    ${publServerStaticAccessLog}

    ${publServerErrorLog}`;

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

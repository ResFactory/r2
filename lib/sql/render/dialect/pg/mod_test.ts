import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./mod.ts";
import * as tmpl from "../../template/mod.ts";

Deno.test("TODO: SQL assembler (SQLa) PostgreSQL extension", async (tc) => {
  // const sdf = mod.typicalSqlSchemaDefnFactory();
  // const ctx = undefined;
  // const emitOptions = tmpl.typicalSqlTextEmitOptions();

  // await tc.step("idempotent schema declaration", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema");
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA IF NOT EXISTS "synthetic_schema"`,
  //   );
  // });

  // await tc.step("schema declaration (non-idempotent)", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema", {
  //     isIdempotent: false,
  //   });
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA "synthetic_schema"`,
  //   );
  // });
});

Deno.test("TODO: SQL assembler (SQLa) PostgreSQL stored procedure", async (tc) => {
  // const sdf = mod.typicalSqlSchemaDefnFactory();
  // const ctx = undefined;
  // const emitOptions = tmpl.typicalSqlTextEmitOptions();

  // await tc.step("idempotent schema declaration", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema");
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA IF NOT EXISTS "synthetic_schema"`,
  //   );
  // });

  // await tc.step("schema declaration (non-idempotent)", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema", {
  //     isIdempotent: false,
  //   });
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA "synthetic_schema"`,
  //   );
  // });
});

Deno.test("TODO: SQL assembler (SQLa) PostgreSQL stored function", async (tc) => {
  // const sdf = mod.typicalSqlSchemaDefnFactory();
  // const ctx = undefined;
  // const emitOptions = tmpl.typicalSqlTextEmitOptions();

  // await tc.step("idempotent schema declaration", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema");
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA IF NOT EXISTS "synthetic_schema"`,
  //   );
  // });

  // await tc.step("schema declaration (non-idempotent)", () => {
  //   const view = sdf.sqlSchemaDefn("synthetic_schema", {
  //     isIdempotent: false,
  //   });
  //   ta.assertEquals(
  //     view.SQL(ctx, emitOptions),
  //     `CREATE SCHEMA "synthetic_schema"`,
  //   );
  // });
});

import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./schema.ts";
import * as t from "./template/mod.ts";

Deno.test("SQL assembler (SQLa) schema", async (tc) => {
  const sdf = mod.typicalSqlSchemaDefnFactory();
  const ctx = undefined;
  const emitOptions = t.typicalSqlTextEmitOptions();

  await tc.step("idempotent schema declaration", () => {
    const view = sdf.sqlSchemaDefn("synthetic_schema");
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      `CREATE SCHEMA IF NOT EXISTS synthetic_schema`,
    );
  });

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = sdf.sqlSchemaDefn("synthetic_schema", {
      isIdempotent: false,
    });
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      `CREATE SCHEMA synthetic_schema`,
    );
  });
});

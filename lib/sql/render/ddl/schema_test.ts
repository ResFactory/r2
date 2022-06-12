import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./schema.ts";
import * as tmpl from "../template/mod.ts";

type SchemaName = "synthetic_schema1" | "synthetic_schema2";

Deno.test("SQL Aide (SQLa) schema", async (tc) => {
  const sdf = mod.typicalSqlSchemaDefnFactory();
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("idempotent schema declaration", () => {
    const view = sdf.sqlSchemaDefn<SchemaName>("synthetic_schema1", {
      isIdempotent: true,
    });
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      `CREATE SCHEMA IF NOT EXISTS "synthetic_schema1"`,
    );
  });

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = sdf.sqlSchemaDefn<SchemaName>("synthetic_schema2");
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      `CREATE SCHEMA "synthetic_schema2"`,
    );
  });
});

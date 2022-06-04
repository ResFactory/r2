import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./extension.ts";
import * as sch from "../../ddl/schema.ts";
import * as tmpl from "../../template/mod.ts";

Deno.test("SQL assembler (SQLa) PostgreSQL extension", async (tc) => {
  const sdf = sch.typicalSqlSchemaDefnFactory();
  const edf = mod.typicalPgExtensionDefnFactory();
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("idempotent extension declaration", () => {
    const extn = edf.pgExtensionDefn(
      sdf.sqlSchemaDefn("synthetic_schema"),
      "synthetic_extension",
    );
    ta.assertEquals(
      extn.SQL(ctx, emitOptions),
      `CREATE EXTENSION IF NOT EXISTS synthetic_extension SCHEMA "synthetic_schema"`,
    );
  });

  await tc.step("non-idempotent extension declaration", () => {
    const extn = edf.pgExtensionDefn(
      sdf.sqlSchemaDefn("synthetic_schema"),
      "synthetic_extension",
      { isIdempotent: false },
    );
    ta.assertEquals(
      extn.SQL(ctx, emitOptions),
      `CREATE EXTENSION synthetic_extension SCHEMA "synthetic_schema"`,
    );
  });

  await tc.step("TODO drop extension", () => {
  });
});

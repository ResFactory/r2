import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./search_path.ts";
import * as tmpl from "../../template/mod.ts";

type SchemaName = "synthetic_schema1" | "synthetic_schema2";

Deno.test("SQL Aide (SQLa) schema", async (tc) => {
  const ctx = undefined;
  const pgSDF = mod.typicalPostgresSchemaSearchPathDefnFactory();
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("schema search path declaration", () => {
    const schema1 = pgSDF.sqlSchemaDefn<SchemaName>("synthetic_schema1");
    const schema2 = pgSDF.sqlSchemaDefn<SchemaName>("synthetic_schema2");

    const searchPath = pgSDF.pgSearchPath<SchemaName>([schema1, schema2]);
    ta.assertEquals(
      searchPath.SQL(ctx, emitOptions),
      `SET search_path TO "synthetic_schema1", "synthetic_schema2"`,
    );
  });
});

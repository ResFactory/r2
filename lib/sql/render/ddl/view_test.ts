import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./view.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";

Deno.test("SQL assembler (SQLa) views", async (tc) => {
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("idempotent view with columns inferred from select", () => {
    const view = mod.viewDefinition("synthetic_view")`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step("idempotent view with type-safe columns specified", () => {
    const view = mod.viewDefinition("synthetic_view", {
      this: d.text(),
      that: d.text(),
      the_other: d.integer(),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    // view.axiomObjectDecl?.the_other

    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      uws(`
         CREATE VIEW IF NOT EXISTS "synthetic_view"("this", "that", "the_other") AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step("temp view (non-idempotent)", () => {
    const view = mod.viewDefinition("synthetic_view", undefined, {
      isIdempotent: false,
      isTemp: true,
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      uws(`
         CREATE TEMP VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });

  await tc.step("drop first then create then drop", () => {
    const view = mod.viewDefinition("synthetic_view", undefined, {
      isIdempotent: false,
      before: (viewName) => mod.dropView(viewName),
    })`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      uws(`
         DROP VIEW IF EXISTS "synthetic_view";
         CREATE VIEW "synthetic_view" AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );

    ta.assertEquals(
      view.drop().SQL(ctx, emitOptions),
      `DROP VIEW IF EXISTS "synthetic_view"`,
    );
    ta.assertEquals(
      view.drop({ ifExists: false }).SQL(ctx, emitOptions),
      `DROP VIEW "synthetic_view"`,
    );
  });
});

import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./view.ts";
import * as tmpl from "../template/mod.ts";

Deno.test("SQL assembler (SQLa) views", async (tc) => {
  const vdf = mod.typicalSqlViewDefnFactory();
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("idempotent view", () => {
    const view = vdf.sqlViewStrTmplLiteral("synthetic_view")`
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

  await tc.step("temp view (non-idempotent)", () => {
    const view = vdf.sqlViewStrTmplLiteral("synthetic_view", {
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

  await tc.step("drop first then create", () => {
    const view = vdf.sqlViewStrTmplLiteral("synthetic_view", {
      isIdempotent: false,
      before: (viewName) => vdf.dropView(viewName),
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
  });

  await tc.step("drop view", () => {
    const dv = vdf.dropView("synthetic_view");
    const dvIE = vdf.dropView("synthetic_view", { ifExists: false });
    ta.assertEquals(
      dv.SQL(ctx, emitOptions),
      `DROP VIEW IF EXISTS "synthetic_view"`,
    );
    ta.assertEquals(
      dvIE.SQL(ctx, emitOptions),
      `DROP VIEW "synthetic_view"`,
    );
  });
});

import { testingAsserts as ta } from "./deps-test.ts";
import { unindentWhitespace as uws } from "../../text/whitespace.ts";
import * as mod from "./view.ts";
import * as t from "./text.ts";

Deno.test("SQL assembler (SQLa) views", async (tc) => {
  const vdf = mod.typicalSqlViewDefnFactory();
  const ctx = undefined;
  const emitOptions = t.typicalSqlTextEmitOptions();

  await tc.step("idempotent view", () => {
    const view = vdf.sqlViewStrTmplLiteral("synthetic_view")`
      SELECT this, that, the_other
        FROM table
       WHERE something = 'true'`;
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      uws(`
         CREATE VIEW IF NOT EXISTS synthetic_view AS
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
         CREATE TEMP VIEW synthetic_view AS
             SELECT this, that, the_other
               FROM table
              WHERE something = 'true'`),
    );
  });
});

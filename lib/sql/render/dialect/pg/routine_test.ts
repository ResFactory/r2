import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./routine.ts";
import * as tmpl from "../../template/mod.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";
import * as d from "../../domain.ts";

Deno.test("SQL assembler (SQLa) anonymous stored routine", async (tc) => {
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("typical anonymous block (auto begin/end)", () => {
    const autoBeginEndAnonBlock = mod.anonymousPlPgSqlRoutine()`
        CREATE DOMAIN custom_type_1 AS TEXT;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "custom_type_1" already exists, skipping';`;
    ta.assertEquals(
      autoBeginEndAnonBlock.SQL(ctx, emitOptions),
      uws(`
        DO $$
          BEGIN
              CREATE DOMAIN custom_type_1 AS TEXT;
            EXCEPTION
              WHEN DUPLICATE_OBJECT THEN
                RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END;
        $$`),
    );
  });

  await tc.step("typical anonymous block (manual begin/end)", () => {
    const anonBlock = mod.anonymousPlPgSqlRoutine({ autoBeginEnd: false })`
      BEGIN
        CREATE DOMAIN custom_type_1 AS TEXT;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
      END;`;
    ta.assertEquals(
      anonBlock.SQL(ctx, emitOptions),
      uws(`
        DO $$
            BEGIN
              CREATE DOMAIN custom_type_1 AS TEXT;
            EXCEPTION
              WHEN DUPLICATE_OBJECT THEN
                RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
            END;
        $$`),
    );
  });

  await tc.step("typical stored procedure (idempotent, auto begin/end)", () => {
    const sp = mod.pgPlSqlStoredProcedure("synthetic_sp1", {
      arg1: d.text(),
    })`
      -- this is the stored procedure body`;
    ta.assertEquals(
      sp.SQL(ctx, emitOptions),
      uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT) AS $$
        BEGIN
          -- this is the stored procedure body
        END;
        $$LANGUAGE PLPGSQL;`),
    );
  });
});

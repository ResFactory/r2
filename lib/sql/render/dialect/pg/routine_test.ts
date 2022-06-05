import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./routine.ts";
import * as tmpl from "../../template/mod.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";

Deno.test("SQL assembler (SQLa) anonymous stored routine", async (tc) => {
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("typical anonymous block", () => {
    const anonBlock = mod.anonymousRoutine()`
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
});

import { testingAsserts as ta } from "../../deps-test.ts";
import * as mod from "./routine.ts";
import * as tmpl from "../../template/mod.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";
import * as d from "../../domain.ts";

Deno.test("SQL assembler (SQLa) anonymous stored routine", async (tc) => {
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("PL/pgSQL anonymous block (auto begin/end)", () => {
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

  await tc.step(
    "PL/pgSQL DO block with safe duplicate exception dismissal",
    () => {
      const doSafeDupe = mod.doIgnoreDuplicate()`
        CREATE DOMAIN custom_type_1 AS TEXT;`;
      ta.assertEquals(
        doSafeDupe.SQL(ctx, emitOptions),
        uws(`
          DO $$ BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN duplicate_object THEN NULL
          END; $$`),
      );
    },
  );

  await tc.step("PL/pgSQL anonymous block (manual begin/end)", () => {
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

  await tc.step(
    "PL/SQL stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure("synthetic_sp1", {
        arg1: d.text(),
      }, (name, args) => mod.typedPlSqlBody(name, args))`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx, emitOptions),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT) AS $$
          -- this is the stored procedure body
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL stored procedure (idempotent, auto begin/end)",
    () => {
      const sp = mod.storedProcedure("synthetic_sp1", {
        arg1: d.text(),
        arg2: mod.IN(d.integer()),
        arg3: mod.OUT(d.bigint()),
        arg4: mod.IN_OUT(d.date()),
      }, (name, args, bo) => mod.typedPlPgSqlBody(name, args, bo))`
      -- this is the stored procedure body`;
      ta.assertEquals(
        sp.SQL(ctx, emitOptions),
        uws(`
        CREATE OR REPLACE PROCEDURE "synthetic_sp1"("arg1" TEXT, IN "arg2" INTEGER, OUT "arg3" BIGINT, IN OUT "arg4" DATE) AS $$
        BEGIN
          -- this is the stored procedure body
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

  await tc.step(
    "PL/SQL stored function returns TABLE (idempotent, auto begin/end)",
    () => {
      const sf = mod.storedFunction(
        "Repeat",
        {
          fromDate: d.date(),
          toDate: d.date(undefined, {
            sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
          }),
        },
        { label: d.text(), cnt: d.bigint() },
        (name, args) => mod.typedPlSqlBody(name, args),
      )`
        SELECT label, count(*) AS Cnt
          FROM test
         WHERE date between fromDate and toDate
         GROUP BY label;`;
      ta.assertEquals(
        sf.SQL(ctx, emitOptions),
        uws(`
        CREATE OR REPLACE FUNCTION "Repeat"("fromDate" DATE, "toDate" DATE = CURRENT_TIMESTAMP) RETURNS TABLE("label" TEXT, "cnt" BIGINT) AS $$
          SELECT label, count(*) AS Cnt
            FROM test
           WHERE date between fromDate and toDate
           GROUP BY label;
        $$ LANGUAGE SQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL stored function returns TABLE (idempotent, auto begin/end)",
    () => {
      const sf = mod.storedFunction(
        "Repeat",
        {
          fromDate: d.date(),
          toDate: d.date(),
        },
        { label: d.text(), cnt: d.bigint() },
        (name, args, _, bo) => mod.typedPlPgSqlBody(name, args, bo),
      )`
        RETURN query
          SELECT label, count(*) AS Cnt
            FROM test
           WHERE date between fromDate and toDate
           GROUP BY label;`;
      ta.assertEquals(
        sf.SQL(ctx, emitOptions),
        uws(`
        CREATE OR REPLACE FUNCTION "Repeat"("fromDate" DATE, "toDate" DATE) RETURNS TABLE("label" TEXT, "cnt" BIGINT) AS $$
        BEGIN
          RETURN query
            SELECT label, count(*) AS Cnt
              FROM test
             WHERE date between fromDate and toDate
             GROUP BY label;
        END;
        $$ LANGUAGE PLPGSQL;`),
      );
    },
  );

  await tc.step(
    "PL/pgSQL stored function returns RECORD (non-idempotent, manual begin/end)",
    () => {
      const sf = mod.storedFunction(
        "Return_Record",
        {
          a: d.text(),
          b: d.text(),
        },
        "RECORD",
        (name, args, _, bo) => mod.typedPlPgSqlBody(name, args, bo),
        { autoBeginEnd: false, isIdempotent: false },
      )`
        DECLARE
          ret RECORD;
        BEGIN
          -- Arbitrary expression to change the first parameter
          IF LENGTH(a) < LENGTH(b) THEN
              SELECT TRUE, a || b, 'a shorter than b' INTO ret;
          ELSE
              SELECT FALSE, b || a INTO ret;
          END IF;
          RETURN ret;
        END;`;
      ta.assertEquals(
        sf.SQL(ctx, emitOptions),
        uws(`
          CREATE FUNCTION "Return_Record"("a" TEXT, "b" TEXT) RETURNS RECORD AS $$
          DECLARE
            ret RECORD;
          BEGIN
            -- Arbitrary expression to change the first parameter
            IF LENGTH(a) < LENGTH(b) THEN
                SELECT TRUE, a || b, 'a shorter than b' INTO ret;
            ELSE
                SELECT FALSE, b || a INTO ret;
            END IF;
            RETURN ret;
          END;
          $$ LANGUAGE PLPGSQL;`),
      );
    },
  );
});

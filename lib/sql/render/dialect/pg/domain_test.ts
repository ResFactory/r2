import { testingAsserts as ta } from "../../deps-test.ts";
import * as d from "../../ddl/domain.ts";
import * as mod from "./domain.ts";
import * as tmpl from "../../template/mod.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";

Deno.test("SQL assembler (SQLa) custom data type (domain)", async (tc) => {
  const sdf = mod.typicalDomainDefnFactory();
  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("idempotent domain declaration", () => {
    const domain = sdf.pgDomainDefn(d.text(), "custom_type_1");
    ta.assertEquals(
      domain.SQL(ctx, emitOptions),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END`,
    );
  });

  await tc.step("idempotent domain declaration with warning", () => {
    const domain = sdf.pgDomainDefn(d.text(), "custom_type_1", {
      warnOnDuplicate: (identifier) =>
        `domain "${identifier}" already exists, skipping`,
    });
    ta.assertEquals(
      domain.SQL(ctx, emitOptions),
      `BEGIN CREATE DOMAIN custom_type_1 AS TEXT; EXCEPTION WHEN DUPLICATE_OBJECT THEN RAISE NOTICE 'domain "custom_type_1" already exists, skipping'; END`,
    );
  });

  await tc.step(
    "idempotent domain declaration with warning, human friendly format",
    () => {
      const domain = sdf.pgDomainDefn(d.text(), "custom_type_1", {
        warnOnDuplicate: (identifier) =>
          `domain "${identifier}" already exists, skipping`,
        humanFriendlyFmtIndent: "  ",
      });
      ta.assertEquals(
        domain.SQL(ctx, emitOptions),
        uws(`
          BEGIN
            CREATE DOMAIN custom_type_1 AS TEXT;
          EXCEPTION
            WHEN DUPLICATE_OBJECT THEN
              RAISE NOTICE 'domain "custom_type_1" already exists, skipping';
          END`),
      );
    },
  );

  await tc.step("schema declaration (non-idempotent)", () => {
    const view = sdf.pgDomainDefn(d.integer(), "custom_type_2", {
      isIdempotent: false,
    });
    ta.assertEquals(
      view.SQL(ctx, emitOptions),
      `CREATE DOMAIN custom_type_2 AS INTEGER`,
    );
  });
});

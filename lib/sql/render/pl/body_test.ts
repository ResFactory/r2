import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./body.ts";
import * as tmpl from "../template/mod.ts";

Deno.test("SQL assembler (SQLa) programming language body", async (tc) => {
  const rawBodySQL = mod.body();
  const indent = (text: string, indent = "  ") =>
    text.replaceAll(/^/gm, `${indent}`);
  const surroundDo = (content: string) => `DO \$\$\n${content}\n$$`;
  const surroundBeginEnd = (content: string) =>
    indent(`BEGIN\n${indent(content)}\nEND`);
  const surroundDoBESQL = mod.body({
    identity: "synthetic",
    surround: (SQL) => surroundDo(surroundBeginEnd(SQL)),
  });
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("valid, untyped, PL raw body with no auto-surround", () => {
    const body = rawBodySQL`
      DO $$
        BEGIN
          CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
        EXCEPTION
          WHEN DUPLICATE_OBJECT THEN
            RAISE NOTICE 'domain "execution_context" already exists, skipping';
        END
      $$`;
    ta.assert(mod.isBody(body));
  });

  await tc.step("valid named PL body with automatic surround SQL", () => {
    const body = surroundDoBESQL`
      CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
      EXCEPTION
        WHEN DUPLICATE_OBJECT THEN
          RAISE NOTICE 'domain "execution_context" already exists, skipping';`;
    ta.assert(mod.isBody(body));
    ta.assert(body.isValid);
    ta.assertEquals(body.identity, "synthetic");
    ta.assertEquals(
      body.SQL(undefined, emitOptions),
      uws(`
        DO $$
          BEGIN
            CREATE DOMAIN dcp_context.execution_context as dcp_extensions.ltree;
            EXCEPTION
              WHEN DUPLICATE_OBJECT THEN
                RAISE NOTICE 'domain "execution_context" already exists, skipping';
          END
        $$`),
    );
  });
});

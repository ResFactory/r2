import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./select.ts";
import * as tmpl from "../template/mod.ts";

Deno.test("SQL assembler (SQLa) select statement", async (tc) => {
  const SQL = mod.select();
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("invalid SELECT statement (misspelled token)", () => {
    const select = SQL`
      SELExT CustomerName, City
        FROM Customers`;
    ta.assert(!select.isValid);
  });

  await tc.step("valid, untyped, SELECT statement", () => {
    const select = SQL`
      SELECT CustomerName, City
        FROM Customers`;
    ta.assert(select.isValid);
  });

  await tc.step("valid named SELECT statement with typed column names", () => {
    const select = mod.select<
      unknown,
      "ss_name",
      "CustomerName" | "City",
      tmpl.SqlTextEmitOptions<unknown>
    >({ selectStmtName: "ss_name", selectColumns: ["CustomerName", "City"] })`
      SELECT CustomerName, City
        FROM Customers`;
    ta.assert(select.isValid);
    ta.assertEquals(select.selectStmtName, "ss_name");
    ta.assertEquals(select.columns, ["CustomerName", "City"]);
    ta.assertEquals(
      select.SQL(undefined, emitOptions),
      uws(`
        SELECT CustomerName, City
          FROM Customers`),
    );
  });
});

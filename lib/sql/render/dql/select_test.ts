import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./select.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";

Deno.test("SQL Aide (SQLa) select statement", async (tc) => {
  const SQL = mod.select();
  const ctx: tmpl.SqlEmitContext = {
    sqlTextEmitOptions: tmpl.typicalSqlTextEmitOptions(),
  };

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
    const select = mod.safeSelect({
      customer_name: d.text(),
      order_count: d.integerNullable(),
      city: d.text(),
    }, { selectStmtName: "ss_name" })`
      SELECT customer_name, order_count, city
        FROM customers`;
    ta.assert(select.isValid);
    ta.assertEquals(select.selectStmtName, "ss_name");
    ta.assertEquals(select.domains.map((d) => d.identity), [
      "customer_name",
      "order_count",
      "city",
    ]);
    ta.assertEquals(
      select.SQL(ctx),
      uws(`
        SELECT customer_name, order_count, city
          FROM customers`),
    );
  });
});

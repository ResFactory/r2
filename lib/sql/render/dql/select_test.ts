import { testingAsserts as ta } from "../deps-test.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as mod from "./select.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";
import * as cr from "./criteria.ts";

Deno.test("SQL Aide (SQLa) custom SELECT statement", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  const SQL = mod.untypedSelect(ctx);

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
    const select = mod.typedSelect(
      {
        customer_name: d.text(),
        order_count: d.integerNullable(),
        city: d.text(),
      },
      ctx,
      { selectStmtName: "ss_name" },
    )`
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

Deno.test("SQL Aide (SQLa) entity SELECT statement", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  const sch = mod.selectCriteriaHelpers();
  type EntityName = "customers";
  type EntireRecord = {
    customer_id?: number;
    first_name: string | cr.FilterCriteriaValue;
    last_name: string | cr.FilterCriteriaValue;
    address?: string | cr.FilterCriteriaValue;
    zip_code?: number | cr.FilterCriteriaValue;
  };
  type FilterableRecord = EntireRecord;
  const essp = mod.entitySelectStmtPreparer<
    EntityName,
    FilterableRecord,
    EntireRecord,
    typeof ctx
  >(
    "customers",
    cr.filterCriteriaPreparer((group) => {
      if (group === "primary-keys") {
        return ["customer_id"];
      }
      return ["customer_id", "first_name", "last_name", "address", "zip_code"];
    }),
  );

  await tc.step("return *", () => {
    const select = essp({
      customer_id: 1,
      first_name: "Shahid",
      last_name: "Shah",
    }, { returning: "*" });
    console.log(select.SQL(ctx));
  });

  await tc.step("return primary key(s)", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: "Shah",
    });
    console.log(select.SQL(ctx));
  });

  await tc.step("return primary key(s), explicit NULL for zip_code", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: "Shah",
      zip_code: undefined,
    });
    console.log(select.SQL(ctx));
  });

  await tc.step("return specific custom columns (explicit return)", () => {
    const select = essp({
      first_name: "Shahid",
      last_name: "Shah",
      zip_code: undefined,
    }, { returning: ["first_name", "last_name"] });
    console.log(select.SQL(ctx));
  });

  await tc.step("return specific custom columns (implicit return)", () => {
    const select = essp({
      first_name: sch.return("Shahid"),
      last_name: sch.return("Shah"),
      zip_code: undefined,
    });
    console.log(select.SQL(ctx));
  });
});

import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./criteria.ts";
import * as tmpl from "../template/mod.ts";

Deno.test("SQL Aide (SQLa) where-like criteria SQL fragments", async (tc) => {
  const ctx = tmpl.typicalSqlEmitContext();
  const fch = mod.filterCriteriaHelpers();
  type FilterableRecord = {
    customer_id?: number;
    first_name: string;
    last_name: string | mod.FilterCriteriaValue;
    address?: string;
    zip_code?: number;
  };
  const fcp = mod.filterCriteriaPreparer<FilterableRecord, typeof ctx>(
    (group) => {
      if (group === "primary-keys") {
        return ["customer_id"];
      }
      return ["customer_id", "first_name", "last_name", "address", "zip_code"];
    },
  );

  await tc.step("some with no NULL values", () => {
    const where = mod.filterCriteriaSQL(fcp(ctx, {
      customer_id: 1,
      first_name: "Shahid",
      last_name: fch.or("Shah"),
    }));
    ta.assertEquals(
      where.SQL(ctx),
      `"customer_id" = 1 AND "first_name" = 'Shahid' OR "last_name" = 'Shah'`,
    );
  });

  await tc.step("some with explicit NULL for zip_code", () => {
    const where = mod.filterCriteriaSQL(fcp(ctx, {
      first_name: "Shahid",
      last_name: "Shah",
      zip_code: undefined,
    }));
    ta.assertEquals(
      where.SQL(ctx),
      `"first_name" = 'Shahid' AND "last_name" = 'Shah' AND "zip_code" = NULL`,
    );
  });
});

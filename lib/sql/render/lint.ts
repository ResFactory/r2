import * as safety from "../../safety/mod.ts";
import * as govn from "./governance.ts";

export const isSqlLintIssuesSupplier = safety.typeGuard<
  govn.SqlLintIssuesSupplier
>("lintIssues");

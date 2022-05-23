import * as safety from "../../safety/mod.ts";

export interface SqlLintIssueSupplier {
  readonly lintIssue: string;
}

export interface SqlLintIssuesSupplier {
  readonly lintIssues: SqlLintIssueSupplier[];
}

export const isSqlLintIssuesSupplier = safety.typeGuard<SqlLintIssuesSupplier>(
  "lintIssues",
);

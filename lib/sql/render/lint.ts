import * as safety from "../../safety/mod.ts";

export interface SqlLintIssueSupplier {
  readonly lintIssue: string;
  readonly location?: (options?: { maxLength?: number }) => string;
}

export interface TemplateStringSqlLintIssue extends SqlLintIssueSupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export function templateStringLintIssue(
  lintIssue: string,
  templateLiterals: TemplateStringsArray,
  templateExprs: unknown[],
): TemplateStringSqlLintIssue {
  return {
    lintIssue,
    templateLiterals,
    templateExprs,
    location: ({ maxLength } = {}) => {
      const result = templateLiterals.join("${}").replaceAll(
        /(\n|\r\n)/gm,
        " ",
      );
      return maxLength ? `${result.substring(0, maxLength)}...` : result;
    },
  };
}

export const isTemplateStringLintIssue = safety.typeGuard<
  TemplateStringSqlLintIssue
>("lintIssue", "templateLiterals", "templateExprs");

export interface SqlLintIssuesSupplier {
  readonly lintIssues: SqlLintIssueSupplier[];
}

export const isSqlLintIssuesSupplier = safety.typeGuard<SqlLintIssuesSupplier>(
  "lintIssues",
);

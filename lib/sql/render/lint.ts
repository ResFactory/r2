import * as safety from "../../safety/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

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
  readonly registerLintIssue: (...slis: SqlLintIssueSupplier[]) => void;
  readonly lintIssues: SqlLintIssueSupplier[];
}

export const isSqlLintIssuesSupplier = safety.typeGuard<SqlLintIssuesSupplier>(
  "registerLintIssue",
  "lintIssues",
);

export interface SqlLintRule<Options = unknown> {
  readonly lint: (lis: SqlLintIssuesSupplier, options?: Options) => void;
}

export function aggregatedSqlLintRules<Options = Any>(
  ...rules: SqlLintRule<Options>[]
) {
  const rule: SqlLintRule<Options> = {
    lint: (lis, lOptions) => rules.forEach((r) => r.lint(lis, lOptions)),
  };
  return rule;
}

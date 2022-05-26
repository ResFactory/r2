import { fs } from "./deps.ts";
import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";
import * as l from "./lint.ts";
import * as ws from "../../text/whitespace.ts";

export interface SqlTextEmitOptions {
  readonly comments?: (text: string, indent?: string) => string;
  readonly tableName?: (tableName: string) => string;
  readonly tableColumnName?: (
    column: { tableName: string; columnName: string },
  ) => string;
  readonly viewName?: (viewName: string) => string;
  readonly viewDefnColumnName?: (
    column: { viewName: string; columnName: string },
  ) => string;
  readonly indentation?: (
    nature:
      | "create table"
      | "define table column"
      | "create view"
      | "create view select statement",
    content?: string,
  ) => string;
}

export function typicalSqlTextEmitOptions(): SqlTextEmitOptions {
  return {
    comments: (text, indent = "") => `${indent}-- ${text}`,
    indentation: (nature, content) => {
      let indent = "";
      switch (nature) {
        case "create table":
          indent = "";
          break;

        case "define table column":
          indent = "    ";
          break;

        case "create view":
          indent = "";
          break;

        case "create view select statement":
          indent = "    ";
          break;
      }
      if (content) {
        return indent.length > 0 ? content.replaceAll(/^/gm, indent) : content;
      }
      return indent;
    },
  };
}

export interface SqlTextPersistOptions {
  readonly ensureDirSync?: (destFileName: string) => void;
}

export function typicalSqlTextPersistOptions(): SqlTextPersistOptions {
  return {
    ensureDirSync: fs.ensureDirSync,
  };
}

export interface SqlTextSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> {
  readonly SQL: (ctx: Context, options?: EmitOptions) => string;
}

export function isSqlTextSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  o: unknown,
): o is SqlTextSupplier<Context, EmitOptions> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context, EmitOptions>>("SQL");
  return isSTS(o);
}

export interface SqlTextLintIssuesSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> {
  readonly populateSqlTextLintIssues: (
    lintIssues: l.SqlLintIssueSupplier[],
    ctx: Context,
    options?: EmitOptions,
  ) => void;
}

export function isSqlTextLintIssuesSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  o: unknown,
): o is SqlTextLintIssuesSupplier<Context, EmitOptions> {
  const isSTLIS = safety.typeGuard<
    SqlTextLintIssuesSupplier<Context, EmitOptions>
  >("populateSqlTextLintIssues");
  return isSTLIS(o);
}

export interface PersistableSqlText<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> {
  readonly sqlTextSupplier: SqlTextSupplier<Context, EmitOptions>;
  readonly persistDest: (
    ctx: Context,
    index: number,
    options?: SqlTextPersistOptions,
  ) => string;
}

export function isPersistableSqlText<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  o: unknown,
): o is PersistableSqlText<Context, EmitOptions> {
  const isPSTS = safety.typeGuard<PersistableSqlText<Context, EmitOptions>>(
    "sqlTextSupplier",
    "persistDest",
  );
  return isPSTS(o);
}

export interface SqlTextLintSummarySupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> {
  readonly sqlTextLintSummary: (
    lintIssues: l.SqlLintIssueSupplier[],
  ) => SqlTextSupplier<Context, EmitOptions>;
}

export function isSqlTextLintSummarySupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  o: unknown,
): o is SqlTextLintSummarySupplier<Context, EmitOptions> {
  const isSLSTS = safety.typeGuard<
    SqlTextLintSummarySupplier<Context, EmitOptions>
  >(
    "sqlTextLintSummary",
  );
  return isSLSTS(o);
}

export function sqlTextLintSummary<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  options?: {
    noIssuesText?: string;
    transform?: (
      suggested: SqlTextSupplier<Context, EmitOptions>,
      lintIssues: l.SqlLintIssueSupplier[],
    ) => SqlTextSupplier<Context, EmitOptions>;
  },
): SqlTextLintSummarySupplier<Context, EmitOptions> {
  const { noIssuesText = "no SQL lint issues", transform } = options ?? {};
  return {
    sqlTextLintSummary: (lintIssues) => {
      const result: SqlTextSupplier<Context, EmitOptions> = {
        SQL: (_, steOptions) => {
          return lintIssues.length > 0
            ? lintIssues.map((li) =>
              steOptions?.comments?.(li.lintIssue) ?? `-- ${li.lintIssue}`
            ).join("\n")
            : steOptions?.comments?.(noIssuesText) ?? `-- ${noIssuesText}`;
        },
      };
      return transform ? transform(result, lintIssues) : result;
    },
  };
}

export interface PersistableSqlTextIndexSupplier {
  readonly persistableSqlTextIndex: number;
}

export const isPersistableSqlTextIndexSupplier = safety.typeGuard<
  PersistableSqlTextIndexSupplier
>("persistableSqlTextIndex");

export type SqlPartialExpression<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  | ((ctx: Context) => SqlTextSupplier<Context, EmitOptions>)
  | ((ctx: Context) => PersistableSqlText<Context, EmitOptions>)
  | ((ctx: Context) => SqlTextLintSummarySupplier<Context, EmitOptions>)
  | SqlTextSupplier<Context, EmitOptions>
  | PersistableSqlText<Context, EmitOptions>
  | SqlTextLintSummarySupplier<Context, EmitOptions>
  | string;

export interface SqlPartialOptions<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> {
  readonly sqlSuppliersDelimText?: string;
  readonly literalSupplier?: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
  readonly persistIndexer?: { activeIndex: number };
  readonly persist?: (
    ctx: Context,
    psts: PersistableSqlText<Context, EmitOptions>,
    indexer: { activeIndex: number },
    steOptions?: EmitOptions,
  ) => SqlTextSupplier<Context, EmitOptions> | undefined;
}

export function sqlPartial<Context, EmitOptions extends SqlTextEmitOptions>(
  options?: SqlPartialOptions<Context, EmitOptions>,
): (
  literals: TemplateStringsArray,
  ...expressions: SqlPartialExpression<Context, EmitOptions>[]
) => SqlTextSupplier<Context, EmitOptions> & Partial<l.SqlLintIssuesSupplier> {
  const sqlTextLintIssues: l.SqlLintIssueSupplier[] = [];
  const tmplLiteralLintIssues: l.SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const { sqlSuppliersDelimText, persistIndexer = { activeIndex: 0 } } =
      options ?? {};
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = options?.literalSupplier
      ? options?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (
      ctx: Context,
      steOptions?: EmitOptions,
    ) => string = (
      ctx,
      steOptions,
    ) => {
      // evaluate expressions and look for contribution placeholders;
      // we pre-evaluate expressions so that text at the beginning of
      // a template could refer to expressions at the bottom.
      const placeholders: number[] = [];
      const expressions: unknown[] = [];
      let exprIndex = 0;
      for (let i = 0; i < suppliedExprs.length; i++) {
        const expr = suppliedExprs[i];
        if (typeof expr === "function") {
          const exprValue = expr(ctx);
          if (c.isTextContributionsPlaceholder(exprValue)) {
            placeholders.push(exprIndex);
            expressions[exprIndex] = expr; // we're going to run the function later
          } else {
            // either a string, TableDefinition, or arbitrary SqlTextSupplier
            expressions[exprIndex] = exprValue;
          }
        } else {
          expressions[exprIndex] = expr;
        }
        exprIndex++;
      }
      if (placeholders.length > 0) {
        for (const ph of placeholders) {
          const expr = expressions[ph];
          if (typeof expr === "function") {
            const tcph = expr(ctx);
            expressions[ph] = c.isTextContributionsPlaceholder(tcph)
              ? tcph.contributions.map((c) => c.content).join("\n")
              : tcph;
          }
        }
      }

      for (const expr of expressions) {
        if (isSqlTextLintIssuesSupplier(expr)) {
          expr.populateSqlTextLintIssues(sqlTextLintIssues, ctx, steOptions);
        }
      }

      let interpolated = "";
      for (let i = 0; i < expressions.length; i++) {
        interpolated += literalSupplier(i);
        const expr = expressions[i];

        if (isPersistableSqlText<Context, EmitOptions>(expr)) {
          persistIndexer.activeIndex++;
          if (options?.persist) {
            const persistenceSqlText = options.persist(
              ctx,
              expr,
              persistIndexer,
              steOptions,
            );
            if (persistenceSqlText) {
              // after persistence, if we want to store a remark or other SQL
              interpolated += persistenceSqlText.SQL(ctx, steOptions);
            }
          } else {
            tmplLiteralLintIssues.push({
              lintIssue:
                `persistable SQL encountered but no persistence handler available: '${
                  Deno.inspect(expr)
                }'`,
            });
          }
        } else if (isSqlTextSupplier<Context, EmitOptions>(expr)) {
          interpolated += expr.SQL(ctx, steOptions);
          if (sqlSuppliersDelimText) interpolated += sqlSuppliersDelimText;
        } else if (typeof expr === "string") {
          interpolated += expr;
        } else if (isSqlTextLintSummarySupplier(expr)) {
          interpolated += expr.sqlTextLintSummary(sqlTextLintIssues).SQL(
            ctx,
            steOptions,
          );
        } else {
          interpolated += Deno.inspect(expr);
        }
      }
      interpolated += literalSupplier(literals.length - 1);
      return interpolated;
    };
    return {
      SQL: (ctx, steOptions) => {
        return interpolate(ctx, steOptions);
      },
      lintIssues: tmplLiteralLintIssues,
    };
  };
}

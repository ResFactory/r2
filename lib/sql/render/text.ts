import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";
import * as t from "./text.ts";
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

export interface SqlTextSupplier<Context> {
  readonly SQL: (ctx: Context, options?: SqlTextEmitOptions) => string;
}

export function isSqlTextSupplier<Context>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export type SqlPartialExpression<Context> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  | ((ctx: Context) => t.SqlTextSupplier<Context>)
  | t.SqlTextSupplier<Context>
  | string;

export interface SqlPartialOptions<Context> {
  readonly sqlSuppliersDelimText?: string;
  readonly literalSupplier?: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
}

export function sqlPartial<Context>(options?: SqlPartialOptions<Context>): (
  literals: TemplateStringsArray,
  ...expressions: SqlPartialExpression<Context>[]
) => t.SqlTextSupplier<Context> & Partial<l.SqlLintIssuesSupplier> {
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const { sqlSuppliersDelimText } = options ?? {};
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = options?.literalSupplier
      ? options?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (
      ctx: Context,
      steOptions?: t.SqlTextEmitOptions,
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

      let interpolated = "";
      for (let i = 0; i < expressions.length; i++) {
        interpolated += literalSupplier(i);
        const expr = expressions[i];

        if (t.isSqlTextSupplier<Context>(expr)) {
          interpolated += expr.SQL(ctx, steOptions);
          if (sqlSuppliersDelimText) interpolated += sqlSuppliersDelimText;
        } else if (typeof expr === "string") {
          interpolated += expr;
        } else {
          interpolated += Deno.inspect(expr);
        }

        if (l.isSqlLintIssuesSupplier(expr)) {
          lintIssues.push(...expr.lintIssues);
        }
      }
      interpolated += literalSupplier(literals.length - 1);
      return interpolated;
    };
    return {
      SQL: (ctx, steOptions) => {
        return interpolate(ctx, steOptions);
      },
      lintIssues,
    };
  };
}

import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";
import * as ws from "../../text/whitespace.ts";
import * as govn from "./governance.ts";
import * as t from "./table.ts";
import * as l from "./lint.ts";

export function isSqlTextSupplier<Context extends govn.EngineContext>(
  o: unknown,
): o is govn.SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<govn.SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export type SqlTextPartial<Context extends govn.EngineContext> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  // deno-lint-ignore no-explicit-any
  | ((ctx: Context) => govn.TableDefinition<Context, any, any>)
  // deno-lint-ignore no-explicit-any
  | govn.TableDefinition<Context, any, any>
  | string;

export interface SqlTextOptions {
  readonly literalSupplier: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
}

export function sqlText<Context extends govn.EngineContext>(
  options?: SqlTextOptions,
): (
  literals: TemplateStringsArray,
  ...expressions: SqlTextPartial<Context>[]
) => govn.SqlTextSupplier<Context> & Partial<govn.SqlLintIssuesSupplier> {
  const lintIssues: govn.SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = options?.literalSupplier
      ? options?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (
      ctx: Context,
      steOptions?: govn.SqlTextEmitOptions,
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
          // deno-lint-ignore no-explicit-any
          if (t.isTableDefinition<Context, any, any>(exprValue)) {
            ctx.registerTable(exprValue);
            expressions[exprIndex] = exprValue;
          } else if (c.isTextContributionsPlaceholder(exprValue)) {
            placeholders.push(exprIndex);
            expressions[exprIndex] = expr; // we're going to run the function later
          } else {
            expressions[exprIndex] = exprValue;
          }
        } else {
          // deno-lint-ignore no-explicit-any
          if (t.isTableDefinition<Context, any, any>(expr)) {
            ctx.registerTable(expr);
            expressions[exprIndex] = expr;
          } else {
            expressions[exprIndex] = expr;
          }
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

        if (t.isTableDefinition(expr)) {
          interpolated += expr.SQL(ctx, steOptions);
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

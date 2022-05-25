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

export interface SqlTextSupplier<Context> {
  readonly SQL: (ctx: Context, options?: SqlTextEmitOptions) => string;
}

export function isSqlTextSupplier<Context>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export interface PersistableSqlText<Context> {
  readonly sqlTextSupplier: SqlTextSupplier<Context>;
  readonly persistDest: (
    ctx: Context,
    index: number,
    options?: SqlTextPersistOptions,
  ) => string;
}

export function isPersistableSqlText<Context>(
  o: unknown,
): o is PersistableSqlText<Context> {
  const isPSTS = safety.typeGuard<PersistableSqlText<Context>>(
    "sqlTextSupplier",
    "persistDest",
  );
  return isPSTS(o);
}

export interface PersistableSqlTextIndexSupplier {
  readonly persistableSqlTextIndex: number;
}

export const isPersistableSqlTextIndexSupplier = safety.typeGuard<
  PersistableSqlTextIndexSupplier
>("persistableSqlTextIndex");

export type SqlPartialExpression<Context> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  | ((ctx: Context) => SqlTextSupplier<Context>)
  | ((ctx: Context) => PersistableSqlText<Context>)
  | SqlTextSupplier<Context>
  | PersistableSqlText<Context>
  | string;

export interface SqlPartialOptions<Context> {
  readonly sqlSuppliersDelimText?: string;
  readonly literalSupplier?: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
  readonly persistIndexer?: { activeIndex: number };
  readonly persist?: (
    ctx: Context,
    psts: PersistableSqlText<Context>,
    indexer: { activeIndex: number },
    steOptions?: SqlTextEmitOptions,
  ) => SqlTextSupplier<Context> | undefined;
}

export function sqlPartial<Context>(options?: SqlPartialOptions<Context>): (
  literals: TemplateStringsArray,
  ...expressions: SqlPartialExpression<Context>[]
) => SqlTextSupplier<Context> & Partial<l.SqlLintIssuesSupplier> {
  const lintIssues: l.SqlLintIssueSupplier[] = [];
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
      steOptions?: SqlTextEmitOptions,
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

        if (isPersistableSqlText<Context>(expr)) {
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
            lintIssues.push({
              lintIssue:
                `persistable SQL encountered but no persistence handler available: '${
                  Deno.inspect(expr)
                }'`,
            });
          }
        } else if (isSqlTextSupplier<Context>(expr)) {
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

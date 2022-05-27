import { events, fs } from "./deps.ts";
import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";
import * as l from "./lint.ts";
import * as ws from "../../text/whitespace.ts";

export interface SqlObjectNamingStrategy {
  readonly tableName?: (tableName: string) => string;
  readonly tableColumnName?: (
    column: { tableName: string; columnName: string },
  ) => string;
  readonly viewName?: (viewName: string) => string;
  readonly viewColumnName?: (
    column: { viewName: string; columnName: string },
  ) => string;
}

export interface SqlTextEmitOptions extends SqlObjectNamingStrategy {
  readonly comments?: (text: string, indent?: string) => string;
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
    comments: (text, indent = "") => text.replaceAll(/^/gm, `${indent}-- `),
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

export interface PersistableSqlTextIndexSupplier {
  readonly persistableSqlTextIndex: number;
}

export const isPersistableSqlTextIndexSupplier = safety.typeGuard<
  PersistableSqlTextIndexSupplier
>("persistableSqlTextIndex");

export class SqlPartialExprEventEmitter<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> extends events.EventEmitter<{
  sqlEmitted(
    ctx: Context,
    sts: SqlTextSupplier<Context, EmitOptions>,
    sql: string,
  ): void;
  sqlPersisted(
    ctx: Context,
    destPath: string,
    pst: PersistableSqlText<Context, EmitOptions>,
    persistResultEmitSTS: SqlTextSupplier<Context, EmitOptions>,
  ): void;
}> {}

export interface SqlTextSupplierOptions<
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
    speEE?: SqlPartialExprEventEmitter<Context, EmitOptions>,
  ) => SqlTextSupplier<Context, EmitOptions> | undefined;
  readonly sqlTextLintSummary?: (
    options?: {
      noIssuesText?: string;
      transform?: (
        suggested: SqlTextSupplier<Context, EmitOptions>,
        lintIssues: l.SqlLintIssueSupplier[],
      ) => SqlTextSupplier<Context, EmitOptions>;
    },
  ) => SqlTextLintSummarySupplier<Context, EmitOptions>;
  readonly prepareEvents?: (
    speEE: SqlPartialExprEventEmitter<Context, EmitOptions>,
  ) => SqlPartialExprEventEmitter<Context, EmitOptions>;
}

export function typicalSqlTextSupplierOptions<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(): SqlTextSupplierOptions<Context, EmitOptions> {
  return {
    sqlSuppliersDelimText: ";",
    // we want to auto-unindent our string literals and remove initial newline
    literalSupplier: (literals, expressions) =>
      ws.whitespaceSensitiveTemplateLiteralSupplier(literals, expressions),
    persist: (ctx, psts, indexer, _steOptions, steEE) => {
      const destPath = psts.persistDest(ctx, indexer.activeIndex);
      const emit = {
        SQL: () => `-- encountered persistence request for ${destPath}`,
      };
      steEE?.emit("sqlPersisted", ctx, destPath, psts, emit);
      return emit;
    },
    sqlTextLintSummary: (options) => {
      const { noIssuesText = "no SQL lint issues", transform } = options ?? {};
      return {
        sqlTextLintSummary: (lintIssues) => {
          const result: SqlTextSupplier<Context, EmitOptions> = {
            SQL: (_, steOptions) => {
              return lintIssues.length > 0
                ? lintIssues.map((li) => {
                  // deno-fmt-ignore
                  const message = `${li.lintIssue}${li.location ? ` (${li.location({ maxLength: 50 })})` : ""}`;
                  return steOptions?.comments?.(message) ?? `-- ${message}`;
                }).join("\n")
                : steOptions?.comments?.(noIssuesText) ?? `-- ${noIssuesText}`;
            },
          };
          return transform ? transform(result, lintIssues) : result;
        },
      };
    },
  };
}

export function typicalSqlTextLintSummary<
  Context,
  EmitOptions extends SqlTextEmitOptions,
>(
  _: Context,
  options: SqlTextSupplierOptions<Context, EmitOptions>,
): SqlTextLintSummarySupplier<Context, EmitOptions> {
  return options?.sqlTextLintSummary?.() ?? {
    sqlTextLintSummary: () => {
      return {
        SQL: () => `-- no SQL lint summary supplier`,
      };
    },
  };
}

export type SqlPartialExpression<
  Context,
  EmitOptions extends SqlTextEmitOptions,
> =
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => c.TextContributionsPlaceholder)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => SqlTextSupplier<Context, EmitOptions>)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => PersistableSqlText<Context, EmitOptions>)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => SqlTextLintSummarySupplier<Context, EmitOptions>)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => string)
  | SqlTextSupplier<Context, EmitOptions>
  | PersistableSqlText<Context, EmitOptions>
  | SqlTextLintSummarySupplier<Context, EmitOptions>
  | string;

export function SQL<Context, EmitOptions extends SqlTextEmitOptions>(
  options = typicalSqlTextSupplierOptions<Context, EmitOptions>(),
): (
  literals: TemplateStringsArray,
  ...expressions: SqlPartialExpression<Context, EmitOptions>[]
) => SqlTextSupplier<Context, EmitOptions> & Partial<l.SqlLintIssuesSupplier> {
  const sqlTextLintIssues: l.SqlLintIssueSupplier[] = [];
  const tmplLiteralLintIssues: l.SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const {
      sqlSuppliersDelimText,
      persistIndexer = { activeIndex: 0 },
      prepareEvents,
    } = options ?? {};
    const speEE = prepareEvents
      ? prepareEvents(new SqlPartialExprEventEmitter<Context, EmitOptions>())
      : undefined;
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
          const exprValue = expr(ctx, options);
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

        // if SQL is wrapped in a persistence handler it means that the content
        // should be written to a file and, optionally, the same or alternate
        // content should be emitted as part of this template string
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
          const SQL = expr.SQL(ctx, steOptions);
          interpolated += SQL;
          if (sqlSuppliersDelimText) interpolated += sqlSuppliersDelimText;
          speEE?.emitSync("sqlEmitted", ctx, expr, SQL);
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

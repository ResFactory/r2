import { events, fs } from "../deps.ts";
import * as safety from "../../../safety/mod.ts";
import * as c from "../../../text/contributions.ts";
import * as l from "../lint.ts";
import * as ws from "../../../text/whitespace.ts";

export interface SqlObjectNamingStrategy {
  readonly schemaName: (schemaName: string) => string;
  readonly tableName: (tableName: string) => string;
  readonly tableColumnName: (
    tc: { tableName: string; columnName: string },
  ) => string;
  readonly viewName: (viewName: string) => string;
  readonly viewColumnName: (
    vc: { viewName: string; columnName: string },
  ) => string;
}

// deno-lint-ignore no-empty-interface
export interface SqlObjectNamingStrategyOptions<Context> {
  // readonly qualifyTableName: boolean;
  // readonly qualifyViewName: boolean;
}

export interface SqlObjectNamingStrategySupplier<Context> {
  (
    ctx: Context,
    nsOptions?: SqlObjectNamingStrategyOptions<Context>,
  ): SqlObjectNamingStrategy;
}

export interface SqlTextEmitOptions<Context> {
  readonly namingStrategy: SqlObjectNamingStrategySupplier<Context>;
  readonly quotedLiteral: (value: unknown) => [value: unknown, quoted: string];
  readonly comments: (text: string, indent?: string) => string;
  readonly indentation: (
    nature:
      | "create table"
      | "define table column"
      | "create view"
      | "create view select statement",
    content?: string,
  ) => string;
}

export function typicalQuotedSqlLiteral(
  value: unknown,
): [value: unknown, quoted: string] {
  if (typeof value === "undefined") return [value, "NULL"];
  if (typeof value === "string") {
    return [value, `'${value.replaceAll("'", "''")}'`];
  }
  return [value, String(value)];
}

export function typicalSqlTextEmitOptions<Context>(): SqlTextEmitOptions<
  Context
> {
  const namingStrategy: SqlObjectNamingStrategySupplier<Context> = () => {
    return {
      schemaName: (name) => name,
      tableName: (name) => name,
      tableColumnName: (tc) => tc.columnName,
      viewName: (name) => name,
      viewColumnName: (vc) => vc.columnName,
    };
  };

  return {
    namingStrategy,
    quotedLiteral: typicalQuotedSqlLiteral,
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
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
> {
  readonly SQL: (ctx: Context, options: EmitOptions) => string;
}

export function isSqlTextSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is SqlTextSupplier<Context, EmitOptions> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context, EmitOptions>>("SQL");
  return isSTS(o);
}

export interface SqlTextLintIssuesSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
> {
  readonly populateSqlTextLintIssues: (
    lintIssues: l.SqlLintIssueSupplier[],
    ctx: Context,
    options?: EmitOptions,
  ) => void;
}

export function isSqlTextLintIssuesSupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
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
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
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
  EmitOptions extends SqlTextEmitOptions<Context>,
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
  EmitOptions extends SqlTextEmitOptions<Context>,
> {
  readonly sqlTextLintSummary: (
    lintIssues: l.SqlLintIssueSupplier[],
  ) => SqlTextSupplier<Context, EmitOptions>;
}

export function isSqlTextLintSummarySupplier<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
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
  EmitOptions extends SqlTextEmitOptions<Context>,
> extends events.EventEmitter<{
  sqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context, EmitOptions>,
  ): void;
  persistableSqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context, EmitOptions>,
  ): void;
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
  EmitOptions extends SqlTextEmitOptions<Context>,
> {
  readonly sqlSuppliersDelimText?: string;
  readonly exprInArrayDelim?: (entry: unknown, isLast: boolean) => string;
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
  EmitOptions extends SqlTextEmitOptions<Context>,
>(
  inherit?: Partial<SqlTextSupplierOptions<Context, EmitOptions>>,
): SqlTextSupplierOptions<Context, EmitOptions> {
  return {
    sqlSuppliersDelimText: ";",
    exprInArrayDelim: (_, isLast) => isLast ? "" : "\n",
    // we want to auto-unindent our string literals and remove initial newline
    literalSupplier: (literals, expressions) =>
      ws.whitespaceSensitiveTemplateLiteralSupplier(literals, expressions),
    persist: (ctx, psts, indexer, _steOptions, steEE) => {
      const destPath = psts.persistDest(ctx, indexer.activeIndex);
      const emit = {
        SQL: () => `-- encountered persistence request for ${destPath}`,
      };
      steEE?.emitSync("sqlPersisted", ctx, destPath, psts, emit);
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
                  return steOptions.comments(message);
                }).join("\n")
                : steOptions.comments(noIssuesText);
            },
          };
          return transform ? transform(result, lintIssues) : result;
        },
      };
    },
    ...inherit,
  };
}

export function typicalSqlTextLintSummary<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context>,
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
  EmitOptions extends SqlTextEmitOptions<Context>,
> =
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => c.TextContributionsPlaceholder)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => SqlTextSupplier<Context, EmitOptions> | SqlTextSupplier<
    Context,
    EmitOptions
  >[])
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context, EmitOptions>,
  ) => PersistableSqlText<Context, EmitOptions> | PersistableSqlText<
    Context,
    EmitOptions
  >[])
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
  | (
    | SqlTextSupplier<Context, EmitOptions>
    | PersistableSqlText<Context, EmitOptions>
    | string
  )[]
  | SqlTextLintSummarySupplier<Context, EmitOptions>
  | string;

export function SQL<
  Context,
  EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>,
  Expressions extends SqlPartialExpression<Context, EmitOptions> =
    SqlPartialExpression<Context, EmitOptions>,
>(
  stsOptions = typicalSqlTextSupplierOptions<Context, EmitOptions>(),
): (
  literals: TemplateStringsArray,
  ...expressions: Expressions[]
) => SqlTextSupplier<Context, EmitOptions> & Partial<l.SqlLintIssuesSupplier> {
  const sqlTextLintIssues: l.SqlLintIssueSupplier[] = [];
  const tmplLiteralLintIssues: l.SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const {
      sqlSuppliersDelimText,
      exprInArrayDelim = (_entry: unknown, isLast: boolean) =>
        isLast ? "" : "\n",
      persistIndexer = { activeIndex: 0 },
      prepareEvents,
    } = stsOptions ?? {};
    const speEE = prepareEvents
      ? prepareEvents(new SqlPartialExprEventEmitter<Context, EmitOptions>())
      : undefined;
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = stsOptions?.literalSupplier
      ? stsOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (
      ctx: Context,
      steOptions: EmitOptions,
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
          const exprValue = expr(ctx, stsOptions);
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

      const preprocessSingleExpr = (expr: unknown) => {
        if (isSqlTextLintIssuesSupplier<Context, EmitOptions>(expr)) {
          expr.populateSqlTextLintIssues(sqlTextLintIssues, ctx, steOptions);
        }
        if (isPersistableSqlText<Context, EmitOptions>(expr)) {
          speEE?.emitSync(
            "persistableSqlEncountered",
            ctx,
            expr.sqlTextSupplier,
          );
        } else if (isSqlTextSupplier<Context, EmitOptions>(expr)) {
          speEE?.emitSync("sqlEncountered", ctx, expr);
        }
      };

      for (const expr of expressions) {
        if (Array.isArray(expr)) {
          for (const e of expr) preprocessSingleExpr(e);
        } else {
          preprocessSingleExpr(expr);
        }
      }

      let interpolated = "";
      const processSingleExpr = (
        expr: unknown,
        inArray?: boolean,
        isLastArrayEntry?: boolean,
      ) => {
        // if SQL is wrapped in a persistence handler it means that the content
        // should be written to a file and, optionally, the same or alternate
        // content should be emitted as part of this template string
        if (isPersistableSqlText<Context, EmitOptions>(expr)) {
          persistIndexer.activeIndex++;
          if (stsOptions?.persist) {
            const persistenceSqlText = stsOptions.persist(
              ctx,
              expr,
              persistIndexer,
              steOptions,
              speEE,
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
        } else if (isSqlTextLintSummarySupplier<Context, EmitOptions>(expr)) {
          interpolated += expr.sqlTextLintSummary(sqlTextLintIssues).SQL(
            ctx,
            steOptions,
          );
        } else {
          interpolated += Deno.inspect(expr);
        }
        if (inArray) {
          const delim = exprInArrayDelim(expr, isLastArrayEntry ?? false);
          if (delim && delim.length > 0) interpolated += delim;
        }
      };

      for (let i = 0; i < expressions.length; i++) {
        interpolated += literalSupplier(i);
        const expr = expressions[i];
        if (Array.isArray(expr)) {
          const lastIndex = expr.length - 1;
          for (let eIndex = 0; eIndex < expr.length; eIndex++) {
            processSingleExpr(expr[eIndex], true, eIndex == lastIndex);
          }
        } else {
          processSingleExpr(expr);
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

import { events, fs } from "../deps.ts";
import * as safety from "../../../safety/mod.ts";
import * as c from "../../../text/contributions.ts";
import * as l from "../lint.ts";
import * as ws from "../../../text/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type SafeTemplateStringReturnType<
  T extends (...args: Any) => Any,
> = T extends (...args: Any) => infer R ? R
  : Any;

export type SafeTemplateString<Expressions, ReturnType> = (
  literals: TemplateStringsArray,
  ...expressions: Expressions[]
) => ReturnType;

/** in case the name should be "qualified" for a schema/namespace */
export type NameQualifier = (unqualifiedName: string) => string;

export interface SqlObjectNames {
  readonly schemaName: (schemaName: string) => string;
  readonly tableName: (tableName: string) => string;
  readonly tableColumnName: (
    tc: { tableName: string; columnName: string },
    qualifyTableName?: false | ".",
  ) => string;
  readonly viewName: (viewName: string) => string;
  readonly viewColumnName: (
    vc: { viewName: string; columnName: string },
    qualifyViewName?: false | ".",
  ) => string;
  readonly typeName: (typeName: string) => string;
  readonly typeFieldName: (
    vc: { typeName: string; fieldName: string },
    qualifyTypeName?: false | ".",
  ) => string;
  readonly storedRoutineName: (name: string) => string;
  readonly storedRoutineArgName: (name: string) => string;
  readonly storedRoutineReturns: (name: string) => string;
}

export function qualifyName(qualifier: string, delim = "."): NameQualifier {
  return (name) => `${qualifier}${delim}${name}`;
}

export function qualifiedNamingStrategy(
  ns: SqlObjectNames,
  q: NameQualifier,
): SqlObjectNames {
  return {
    schemaName: (name) => q(ns.schemaName(name)),
    tableName: (name) => q(ns.tableName(name)),
    tableColumnName: (tc, qtn) => q(ns.tableColumnName(tc, qtn)),
    viewName: (name) => q(ns.viewName(name)),
    viewColumnName: (vc, qtn) => q(ns.viewColumnName(vc, qtn)),
    typeName: (name) => q(ns.typeName(name)),
    typeFieldName: (tf, qtn) => q(ns.typeFieldName(tf, qtn)),
    storedRoutineName: (name) => q(ns.storedRoutineName(name)),
    storedRoutineArgName: (name) => q(ns.storedRoutineArgName(name)),
    storedRoutineReturns: (name) => q(ns.storedRoutineReturns(name)),
  };
}

export interface SqlObjectNamingStrategyOptions {
  readonly quoteIdentifiers?: boolean;
  readonly qualifyNames?: NameQualifier;
}

export interface SqlObjectNamesSupplier {
  (
    ctx: SqlEmitContext,
    nsOptions?: SqlObjectNamingStrategyOptions,
  ): SqlObjectNames;
}

export interface SqlNamingStrategySupplier {
  readonly sqlNamingStrategy: SqlObjectNamesSupplier;
}

export interface SqlTextEmitOptions {
  readonly quotedLiteral: (value: unknown) => [value: unknown, quoted: string];
  readonly comments: (text: string, indent?: string) => string;
  readonly indentation: (
    nature:
      | "create table"
      | "define table column"
      | "create view"
      | "create type"
      | "define type field"
      | "create view select statement"
      | "create routine"
      | "create routine body",
    content?: string,
  ) => string;
}

export interface EmbeddedSqlSupplier {
  readonly embeddedSQL: <
    Context extends SqlEmitContext,
    Expressions extends SqlPartialExpression<Context> = SqlPartialExpression<
      Context
    >,
  >(stsOptions?: SqlTextSupplierOptions<Context>) => (
    literals: TemplateStringsArray,
    ...expressions: Expressions[]
  ) => SqlTextSupplier<Context> & Partial<l.SqlLintIssuesSupplier>;
}

export interface SqlEmitContext
  extends EmbeddedSqlSupplier, SqlNamingStrategySupplier {
  readonly sqlTextEmitOptions: SqlTextEmitOptions;
}

export function typicalSqlEmitContext(
  inherit?: Partial<SqlEmitContext>,
): SqlEmitContext {
  const result: SqlEmitContext = {
    embeddedSQL: SQL,
    sqlNamingStrategy: typicalSqlNamingStrategy(),
    sqlTextEmitOptions: typicalSqlTextEmitOptions(),
    ...inherit,
  };
  return result;
}

export function typicalQuotedSqlLiteral(
  value: unknown,
): [value: unknown, quoted: string] {
  if (typeof value === "undefined") return [value, "NULL"];
  if (typeof value === "string") {
    return [value, `'${value.replaceAll("'", "''")}'`];
  }
  if (value instanceof Date) {
    // TODO: add date formatting options
    return [value, `'${String(value)}'`];
  }
  return [value, String(value)];
}

export function typicalSqlNamingStrategy(): SqlObjectNamesSupplier {
  const quotedIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => `"${name}"`,
    tableName: (name) => `"${name}"`,
    tableColumnName: (tc, qtn) =>
      qtn
        // deno-fmt-ignore
        ? `${quotedIdentifiersNS.tableName(tc.tableName)}${qtn}"${tc.columnName}"`
        : `"${tc.columnName}"`,
    viewName: (name) => `"${name}"`,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${quotedIdentifiersNS.viewName(vc.viewName)}${qvn}"${vc.columnName}"`
        : `"${vc.columnName}"`,
    typeName: (name) => `"${name}"`,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${quotedIdentifiersNS.typeName(tf.typeName)}${qtn}"${tf.fieldName}"`
        : `"${tf.fieldName}"`,
    storedRoutineName: (name) => `"${name}"`,
    storedRoutineArgName: (name) => `"${name}"`,
    storedRoutineReturns: (name) => `"${name}"`,
  };

  const bareIdentifiersNS: SqlObjectNames = {
    schemaName: (name) => name,
    tableName: (name) => name,
    tableColumnName: (tc, qtn) =>
      qtn
        ? `${bareIdentifiersNS.tableName(tc.tableName)}${qtn}${tc.columnName}`
        : tc.columnName,
    viewName: (name) => name,
    viewColumnName: (vc, qvn) =>
      qvn
        ? `${bareIdentifiersNS.viewName(vc.viewName)}${qvn}${vc.columnName}`
        : vc.columnName,
    typeName: (name) => name,
    typeFieldName: (tf, qtn) =>
      qtn
        ? `${bareIdentifiersNS.typeName(tf.fieldName)}${qtn}${tf.fieldName}`
        : tf.fieldName,
    storedRoutineName: (name) => name,
    storedRoutineArgName: (name) => name,
    storedRoutineReturns: (name) => name,
  };

  const result: SqlObjectNamesSupplier = (
    _,
    nsOptions,
  ) => {
    const ns = nsOptions?.quoteIdentifiers
      ? quotedIdentifiersNS
      : bareIdentifiersNS;
    return nsOptions?.qualifyNames
      ? qualifiedNamingStrategy(ns, nsOptions.qualifyNames)
      : ns;
  };

  return result;
}

export function typicalSqlTextEmitOptions(): SqlTextEmitOptions {
  return {
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

        case "create type":
          indent = "";
          break;

        case "define type field":
          indent = "    ";
          break;

        case "create routine":
          indent = "";
          break;

        case "create routine body":
          indent = "  ";
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

export interface RenderedSqlText<Context extends SqlEmitContext> {
  (ctx: Context): string;
}

export interface SqlTextSupplier<
  Context extends SqlEmitContext,
> {
  readonly SQL: RenderedSqlText<Context>;
}

export function isSqlTextSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export interface SqlTextLintIssuesSupplier<
  Context extends SqlEmitContext,
> {
  readonly populateSqlTextLintIssues: (
    lintIssues: l.SqlLintIssueSupplier[],
    ctx: Context,
  ) => void;
}

export function isSqlTextLintIssuesSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextLintIssuesSupplier<Context> {
  const isSTLIS = safety.typeGuard<
    SqlTextLintIssuesSupplier<Context>
  >("populateSqlTextLintIssues");
  return isSTLIS(o);
}

export interface PersistableSqlText<
  Context extends SqlEmitContext,
> {
  readonly sqlTextSupplier: SqlTextSupplier<Context>;
  readonly persistDest: (
    ctx: Context,
    index: number,
    options?: SqlTextPersistOptions,
  ) => string;
}

export function isPersistableSqlText<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is PersistableSqlText<Context> {
  const isPSTS = safety.typeGuard<PersistableSqlText<Context>>(
    "sqlTextSupplier",
    "persistDest",
  );
  return isPSTS(o);
}

export interface SqlTextBehaviorEmitTransformer {
  before: (interpolationSoFar: string, exprIdx: number) => string;
  after: (nextLiteral: string, exprIdx: number) => string;
}

export const removeLineFromEmitStream: SqlTextBehaviorEmitTransformer = {
  before: (isf) => {
    // remove the last line in the interpolation stream
    return isf.replace(/\n.*?$/, "");
  },
  after: (literal) => {
    // remove everything up to and including the line break
    return literal.replace(/.*?\n/, "\n");
  },
};

export interface SqlTextBehaviorSupplier<
  Context extends SqlEmitContext,
> {
  readonly executeSqlBehavior: (
    context: Context,
  ) => SqlTextBehaviorEmitTransformer | SqlTextSupplier<Context>;
}

export function isSqlTextBehaviorSupplier<
  Context extends SqlEmitContext,
>(
  o: unknown,
): o is SqlTextBehaviorSupplier<Context> {
  const isSTBS = safety.typeGuard<
    SqlTextBehaviorSupplier<Context>
  >("executeSqlBehavior");
  return isSTBS(o);
}

export interface PersistableSqlTextIndexSupplier {
  readonly persistableSqlTextIndex: number;
}

export const isPersistableSqlTextIndexSupplier = safety.typeGuard<
  PersistableSqlTextIndexSupplier
>("persistableSqlTextIndex");

export class SqlPartialExprEventEmitter<
  Context extends SqlEmitContext,
> extends events.EventEmitter<{
  sqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
  ): void;
  persistableSqlEncountered(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
  ): void;
  sqlBehaviorEncountered(
    ctx: Context,
    sts: SqlTextBehaviorSupplier<Context>,
  ): void;
  sqlEmitted(
    ctx: Context,
    sts: SqlTextSupplier<Context>,
    sql: string,
  ): void;
  sqlPersisted(
    ctx: Context,
    destPath: string,
    pst: PersistableSqlText<Context>,
    persistResultEmitSTS: SqlTextSupplier<Context>,
  ): void;
  behaviorActivity(
    ctx: Context,
    sts: SqlTextBehaviorSupplier<Context>,
    behaviorResult?: SqlTextBehaviorEmitTransformer | SqlTextSupplier<Context>,
  ): void;
}> {}

export interface SqlTextSupplierOptions<Context extends SqlEmitContext> {
  readonly sqlSuppliersDelimText?: string;
  readonly exprInArrayDelim?: (entry: unknown, isLast: boolean) => string;
  readonly literalSupplier?: (
    literals: TemplateStringsArray,
    suppliedExprs: unknown[],
  ) => ws.TemplateLiteralIndexedTextSupplier;
  readonly persistIndexer?: { activeIndex: number };
  readonly persist?: (
    ctx: Context,
    psts: PersistableSqlText<Context>,
    indexer: { activeIndex: number },
    speEE?: SqlPartialExprEventEmitter<Context>,
  ) => SqlTextSupplier<Context> | undefined;
  readonly sqlTextLintIssues?: l.SqlLintIssueSupplier[];
  readonly sqlTextLintSummary?: (
    options?: {
      noIssuesText?: string;
      transform?: (
        suggested: SqlTextSupplier<Context>,
        lintIssues: l.SqlLintIssueSupplier[],
      ) => SqlTextSupplier<Context>;
    },
  ) => SqlTextBehaviorSupplier<Context>;
  readonly tmplEngineLintIssues?: l.SqlLintIssueSupplier[];
  readonly prepareEvents?: (
    speEE: SqlPartialExprEventEmitter<Context>,
  ) => SqlPartialExprEventEmitter<Context>;
}

export function typicalSqlTextSupplierOptions<Context extends SqlEmitContext>(
  inherit?: Partial<SqlTextSupplierOptions<Context>>,
): SqlTextSupplierOptions<Context> {
  const sqlTextLintIssues: l.SqlLintIssueSupplier[] = [];
  const tmplEngineLintIssues: l.SqlLintIssueSupplier[] = [];
  return {
    sqlSuppliersDelimText: ";",
    exprInArrayDelim: (_, isLast) => isLast ? "" : "\n",
    // we want to auto-unindent our string literals and remove initial newline
    literalSupplier: (literals, expressions) =>
      ws.whitespaceSensitiveTemplateLiteralSupplier(literals, expressions),
    persist: (ctx, psts, indexer, steEE) => {
      const destPath = psts.persistDest(ctx, indexer.activeIndex);
      const emit = {
        SQL: () => `-- encountered persistence request for ${destPath}`,
      };
      steEE?.emitSync("sqlPersisted", ctx, destPath, psts, emit);
      return emit;
    },
    sqlTextLintIssues,
    sqlTextLintSummary: (options) => {
      const { noIssuesText = "no SQL lint issues", transform } = options ?? {};
      return {
        executeSqlBehavior: () => {
          const result: SqlTextSupplier<Context> = {
            SQL: (ctx) => {
              const steOptions = ctx.sqlTextEmitOptions;
              return sqlTextLintIssues.length > 0
                ? sqlTextLintIssues.map((li) => {
                  // deno-fmt-ignore
                  const message = `${li.lintIssue}${li.location ? ` (${li.location({ maxLength: 50 })})` : ""}`;
                  return steOptions.comments(message);
                }).join("\n")
                : steOptions.comments(noIssuesText);
            },
          };
          return transform ? transform(result, sqlTextLintIssues) : result;
        },
      };
    },
    tmplEngineLintIssues,
    ...inherit,
  };
}

export function typicalSqlTextLintSummary<
  Context extends SqlEmitContext,
>(
  _: Context,
  options: SqlTextSupplierOptions<Context>,
): SqlTextBehaviorSupplier<Context> {
  return options?.sqlTextLintSummary?.() ?? {
    executeSqlBehavior: () => {
      return {
        SQL: () => `-- no SQL lint summary supplier`,
      };
    },
  };
}

export type SqlPartialExpression<
  Context extends SqlEmitContext,
> =
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context>,
  ) => c.TextContributionsPlaceholder)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context>,
  ) => SqlTextSupplier<Context> | SqlTextSupplier<
    Context
  >[])
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context>,
  ) => PersistableSqlText<Context> | PersistableSqlText<
    Context
  >[])
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context>,
  ) => SqlTextBehaviorSupplier<Context>)
  | ((
    ctx: Context,
    options: SqlTextSupplierOptions<Context>,
  ) => string)
  | SqlTextSupplier<Context>
  | PersistableSqlText<Context>
  | SqlTextBehaviorSupplier<Context>
  | (
    | SqlTextSupplier<Context>
    | PersistableSqlText<Context>
    | SqlTextBehaviorSupplier<Context>
    | string
  )[]
  | string;

export function SQL<
  Context extends SqlEmitContext,
  Expressions extends SqlPartialExpression<Context> = SqlPartialExpression<
    Context
  >,
>(
  stsOptions: SqlTextSupplierOptions<Context> = typicalSqlTextSupplierOptions<
    Context
  >(),
): (
  literals: TemplateStringsArray,
  ...expressions: Expressions[]
) => SqlTextSupplier<Context> & Partial<l.SqlLintIssuesSupplier> {
  const { sqlTextLintIssues, tmplEngineLintIssues } = stsOptions;
  return (literals, ...suppliedExprs) => {
    const {
      sqlSuppliersDelimText,
      exprInArrayDelim = (_entry: unknown, isLast: boolean) =>
        isLast ? "" : "\n",
      persistIndexer = { activeIndex: 0 },
      prepareEvents,
    } = stsOptions ?? {};
    const speEE = prepareEvents
      ? prepareEvents(new SqlPartialExprEventEmitter<Context>())
      : undefined;
    // by default no pre-processing of text literals are done; if auto-unindent is desired pass in
    //   options.literalSupplier = (literals, suppliedExprs) => ws.whitespaceSensitiveTemplateLiteralSupplier(literals, suppliedExprs)
    const literalSupplier = stsOptions?.literalSupplier
      ? stsOptions?.literalSupplier(literals, suppliedExprs)
      : (index: number) => literals[index];
    const interpolate: (ctx: Context) => string = (ctx) => {
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
            // either a string, SqlTextSupplier (e.g. TableDefinition, et. al.), SqlTextBehavior
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
        if (sqlTextLintIssues && isSqlTextLintIssuesSupplier<Context>(expr)) {
          expr.populateSqlTextLintIssues(sqlTextLintIssues, ctx);
        }
        if (isPersistableSqlText<Context>(expr)) {
          speEE?.emitSync(
            "persistableSqlEncountered",
            ctx,
            expr.sqlTextSupplier,
          );
        } else if (isSqlTextSupplier<Context>(expr)) {
          speEE?.emitSync("sqlEncountered", ctx, expr);
        } else if (isSqlTextBehaviorSupplier<Context>(expr)) {
          speEE?.emitSync("sqlBehaviorEncountered", ctx, expr);
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
      let recentSTBET: SqlTextBehaviorEmitTransformer | undefined;
      const processSingleExpr = (
        expr: unknown,
        exprIndex: number,
        inArray?: boolean,
        isLastArrayEntry?: boolean,
      ) => {
        // if SQL is wrapped in a persistence handler it means that the content
        // should be written to a file and, optionally, the same or alternate
        // content should be emitted as part of this template string
        if (isPersistableSqlText<Context>(expr)) {
          persistIndexer.activeIndex++;
          if (stsOptions?.persist) {
            const persistenceSqlText = stsOptions.persist(
              ctx,
              expr,
              persistIndexer,
              speEE,
            );
            if (persistenceSqlText) {
              // after persistence, if we want to store a remark or other SQL
              interpolated += persistenceSqlText.SQL(ctx);
            }
          } else if (tmplEngineLintIssues) {
            tmplEngineLintIssues.push({
              lintIssue:
                `persistable SQL encountered but no persistence handler available: '${
                  Deno.inspect(expr)
                }'`,
            });
          }
        } else if (isSqlTextSupplier<Context>(expr)) {
          const SQL = expr.SQL(ctx);
          interpolated += SQL;
          if (sqlSuppliersDelimText) interpolated += sqlSuppliersDelimText;
          speEE?.emitSync("sqlEmitted", ctx, expr, SQL);
        } else if (typeof expr === "string") {
          interpolated += expr;
        } else if (isSqlTextBehaviorSupplier<Context>(expr)) {
          const behaviorResult = expr.executeSqlBehavior(ctx);
          if (isSqlTextSupplier<Context>(behaviorResult)) {
            interpolated += behaviorResult.SQL(ctx);
          } else {
            recentSTBET = behaviorResult;
            interpolated = recentSTBET.before(interpolated, exprIndex);
          }
          speEE?.emitSync("behaviorActivity", ctx, expr, behaviorResult);
        } else {
          interpolated += Deno.inspect(expr);
        }
        if (inArray) {
          const delim = exprInArrayDelim(expr, isLastArrayEntry ?? false);
          if (delim && delim.length > 0) interpolated += delim;
        }
      };

      let activeLiteral: string;
      for (let i = 0; i < expressions.length; i++) {
        // we have two main types of text that we emit: SqlTextSupplier ("STS")
        // and SqlTextBehaviorEmitTransformer ("STBET"); behaviors are arbitary
        // and can (optionally) change the emit stream or they can supplyer SQL
        // like like an STS. If we have a non-null recentSTBET it means that a
        // behavior emit transformer wants to change the stream otherwise we
        // just have a "normal" expression where the text is emitted without
        // changing what's already been prepared.
        activeLiteral = literalSupplier(i);
        if (recentSTBET) {
          activeLiteral = recentSTBET.after(activeLiteral, i);
          recentSTBET = undefined;
        }
        interpolated += activeLiteral;
        const expr = expressions[i];
        if (Array.isArray(expr)) {
          const lastIndex = expr.length - 1;
          for (let eIndex = 0; eIndex < expr.length; eIndex++) {
            processSingleExpr(expr[eIndex], eIndex, true, eIndex == lastIndex);
          }
        } else {
          processSingleExpr(expr, i);
        }
      }
      activeLiteral = literalSupplier(literals.length - 1);
      if (recentSTBET) {
        interpolated = recentSTBET.after(interpolated, literals.length - 1);
      }
      interpolated += activeLiteral;
      return interpolated;
    };
    return {
      SQL: (ctx) => {
        return interpolate(ctx);
      },
      lintIssues: tmplEngineLintIssues,
    };
  };
}

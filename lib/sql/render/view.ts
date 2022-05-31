import * as safety from "../../safety/mod.ts";
import * as ws from "../../text/whitespace.ts";
import * as t from "./template/mod.ts";
import * as ss from "./select-stmt.ts";

export interface ViewDefinition<
  Context,
  ViewName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
> extends t.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly viewName: ViewName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns?: ColumnName[];
  // deno-lint-ignore no-explicit-any
  readonly selectStmt: ss.SelectStatement<Context, any, any, EmitOptions>;
}

export function isViewDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is ViewDefinition<Context, TableName, ColumnName, EmitOptions> {
  const isViewDefn = safety.typeGuard<
    ViewDefinition<Context, TableName, ColumnName, EmitOptions>
  >(
    "viewName",
    "selectStmt",
    "SQL",
  );
  return isViewDefn(o);
}

export interface ViewDefnOptions<
  Context,
  ViewName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
> extends t.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly viewColumns?: ColumnName[];
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly before?: (
    viewName: ViewName,
    vdOptions: ViewDefnOptions<Context, ViewName, ColumnName, EmitOptions>,
  ) => t.SqlTextSupplier<Context, EmitOptions>;
}

export interface ViewDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions<Context> = t.SqlTextEmitOptions<
    Context
  >,
> {
  sqlViewStrTmplLiteral: <
    ViewName extends string,
    ColumnName extends string,
  >(
    viewName: ViewName,
    viewOptions?: ViewDefnOptions<
      Context,
      ViewName,
      ColumnName,
      EmitOptions
    >,
  ) => (
    literals: TemplateStringsArray,
    ...expressions: t.SqlPartialExpression<Context, EmitOptions>[]
  ) =>
    & ViewDefinition<Context, ViewName, ColumnName, EmitOptions>
    & t.SqlTextLintIssuesSupplier<Context, EmitOptions>;
  dropView: <ViewName extends string>(
    viewName: ViewName,
    options?: { ifExists?: boolean },
  ) => t.SqlTextSupplier<Context, EmitOptions>;
}

export function typicalSqlViewDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions<Context> = t.SqlTextEmitOptions<
    Context
  >,
>(): ViewDefnFactory<Context, EmitOptions> {
  return {
    sqlViewStrTmplLiteral: (viewName, viewOptions) => {
      return (literals, ...expressions) => {
        // deno-lint-ignore no-explicit-any
        const partial = ss.selectStmt<Context, any, any, EmitOptions>({
          literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
        });
        const selectStmt = partial(literals, ...expressions);
        const { isTemp, isIdempotent = true, viewColumns } = viewOptions ?? {};
        return {
          isValid: selectStmt.isValid,
          viewName,
          columns: viewColumns,
          isTemp,
          isIdempotent,
          selectStmt,
          populateSqlTextLintIssues: (lintIssues, steOptions) =>
            selectStmt.populateSqlTextLintIssues(lintIssues, steOptions),
          SQL: (ctx, steOptions) => {
            const rawSelectStmtSqlText = selectStmt.SQL(ctx, steOptions);
            const viewSelectStmtSqlText = steOptions.indentation(
              "create view select statement",
              rawSelectStmtSqlText,
            );
            const ns = steOptions.namingStrategy(ctx, {
              quoteIdentifiers: true,
            });
            const create = `CREATE ${isTemp ? "TEMP " : ""}VIEW ${
              isIdempotent ? "IF NOT EXISTS " : ""
            }${ns.viewName(viewName)}${
              viewColumns
                ? `(${
                  viewColumns.map((cn) =>
                    ns.viewColumnName({
                      viewName,
                      columnName: cn,
                    })
                  ).join(", ")
                })`
                : ""
            } AS\n${viewSelectStmtSqlText}`;
            return viewOptions?.before
              ? t.SQL<Context, EmitOptions>(ctx)`${[
                viewOptions.before(viewName, viewOptions),
                create,
              ]}`
                .SQL(ctx, steOptions)
              : create;
          },
        };
      };
    },
    dropView: (viewName, dvOptions) => {
      const { ifExists = true } = dvOptions ?? {};
      return {
        SQL: (ctx, steOptions) => {
          const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
          return `DROP VIEW ${ifExists ? "IF EXISTS " : ""}${
            ns.viewName(viewName)
          }`;
        },
      };
    },
  };
}

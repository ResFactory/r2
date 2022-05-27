import * as safety from "../../safety/mod.ts";
import * as ws from "../../text/whitespace.ts";
import * as t from "./text.ts";
import * as ss from "./select-stmt.ts";

export interface ViewDefinition<
  Context,
  ViewName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
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
  EmitOptions extends t.SqlTextEmitOptions,
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
  EmitOptions extends t.SqlTextEmitOptions,
> extends t.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly viewColumns?: ColumnName[];
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
}

export interface ViewDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
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
}

export function typicalSqlViewDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
>(): ViewDefnFactory<Context, EmitOptions> {
  return {
    sqlViewStrTmplLiteral: (viewName, viewOptions) => {
      return (literals, ...expressions) => {
        // deno-lint-ignore no-explicit-any
        const partial = ss.selectStmt<Context, any, any, EmitOptions>({
          literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
        });
        const selectStmt = partial(literals, ...expressions);
        const { isTemp, isIdempotent, viewColumns } = viewOptions ?? {};
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
            return `CREATE ${isTemp ? "TEMP " : ""}VIEW ${
              isIdempotent ? "IF NOT EXISTS " : ""
            }${steOptions.viewName(viewName)}${
              viewColumns
                ? `(${
                  viewColumns.map((cn) =>
                    steOptions.viewColumnName({
                      viewName,
                      columnName: cn,
                    })
                  ).join(", ")
                })`
                : ""
            } AS\n${viewSelectStmtSqlText}`;
          },
        };
      };
    },
  };
}

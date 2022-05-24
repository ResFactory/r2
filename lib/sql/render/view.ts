import * as safety from "../../safety/mod.ts";
import * as ws from "../../text/whitespace.ts";
import * as t from "./text.ts";
import * as l from "./lint.ts";
import * as ss from "./select-stmt.ts";

export interface ViewDefinition<
  Context,
  ViewName extends string,
  ColumnName extends string,
> extends t.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly viewName: ViewName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns?: ColumnName[];
  // deno-lint-ignore no-explicit-any
  readonly selectStmt: ss.SelectStatement<Context, any, any>;
}

export function isViewDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
>(
  o: unknown,
): o is ViewDefinition<Context, TableName, ColumnName> {
  const isViewDefn = safety.typeGuard<
    ViewDefinition<Context, TableName, ColumnName>
  >(
    "viewName",
    "selectStmt",
  );
  return isViewDefn(o);
}

export interface SqlViewDefnOptions<
  Context,
  ViewName extends string,
  ColumnName extends string,
> extends t.SqlPartialOptions<Context> {
  readonly viewColumns?: ColumnName[];
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
}

export function sqlView<
  Context,
  ViewName extends string,
  ColumnName extends string,
>(
  viewName: ViewName,
  viewOptions?: SqlViewDefnOptions<Context, ViewName, ColumnName>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: t.SqlPartialExpression<Context>[]
  ):
    & ViewDefinition<Context, ViewName, ColumnName>
    & Partial<l.SqlLintIssuesSupplier> => {
    // deno-lint-ignore no-explicit-any
    const partial = ss.selectStmt<Context, any, any>({
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
      SQL: (ctx, steOptions) => {
        const rawSelectStmtSqlText = selectStmt.SQL(ctx, steOptions);
        const viewSelectStmtSqlText = steOptions?.indentation?.(
          "create view select statement",
          rawSelectStmtSqlText,
        ) ?? rawSelectStmtSqlText;
        return `CREATE ${isTemp ? "TEMP " : ""}VIEW ${
          isIdempotent ? "IF NOT EXISTS " : ""
        }${steOptions?.viewName?.(viewName) ?? viewName}${
          viewColumns
            ? `(${
              viewColumns.map((cn) =>
                steOptions?.viewDefnColumnName?.({
                  viewName,
                  columnName: cn,
                }) ?? cn
              ).join(", ")
            })`
            : ""
        } AS\n${viewSelectStmtSqlText}`;
      },
      lintIssues: selectStmt.lintIssues,
    };
  };
}

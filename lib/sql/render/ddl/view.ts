import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as tmpl from "../template/mod.ts";
import * as ss from "../dql/select.ts";
import * as d from "../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface ViewDefinition<
  ViewName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly viewName: ViewName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
}

export function isViewDefinition<
  ViewName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is ViewDefinition<ViewName, Context> {
  const isViewDefn = safety.typeGuard<
    ViewDefinition<ViewName, Context>
  >(
    "viewName",
    "SQL",
  );
  return isViewDefn(o);
}

export interface ViewDefnOptions<
  ViewName extends string,
  ColumnName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplierOptions<Context> {
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly before?: (
    viewName: ViewName,
    vdOptions: ViewDefnOptions<ViewName, ColumnName, Context>,
  ) => tmpl.SqlTextSupplier<Context>;
}

export function viewDefinition<
  ViewName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  viewName: ViewName,
  vdOptions?:
    & ViewDefnOptions<ViewName, Any, Context>
    & Partial<tmpl.EmbeddedSqlSupplier>
    & {
      readonly onPropertyNotAxiomSqlDomain?: (
        name: string,
        axiom: Any,
        domains: d.IdentifiableSqlDomain<Any, Context>[],
      ) => void;
    },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    const { isTemp, isIdempotent = true, embeddedSQL = tmpl.SQL } = vdOptions ??
      {};
    const ssPartial = ss.select<Any, Context>({ embeddedSQL });
    const selectStmt = ssPartial(literals, ...expressions);
    const viewDefn:
      & ViewDefinition<ViewName, Context>
      & tmpl.SqlTextLintIssuesSupplier<Context> = {
        isValid: selectStmt.isValid,
        viewName,
        isTemp,
        isIdempotent,
        populateSqlTextLintIssues: (lintIssues, steOptions) =>
          selectStmt.populateSqlTextLintIssues(lintIssues, steOptions),
        SQL: (ctx) => {
          const { sqlTextEmitOptions: steOptions } = ctx;
          const rawSelectStmtSqlText = selectStmt.SQL(ctx);
          const viewSelectStmtSqlText = steOptions.indentation(
            "create view select statement",
            rawSelectStmtSqlText,
          );
          const ns = steOptions.namingStrategy(ctx, {
            quoteIdentifiers: true,
          });
          const create = `CREATE ${isTemp ? "TEMP " : ""}VIEW ${
            isIdempotent ? "IF NOT EXISTS " : ""
          }${ns.viewName(viewName)} AS\n${viewSelectStmtSqlText}`;
          return vdOptions?.before
            ? ctx.embeddedSQL<Context>()`${[
              vdOptions.before(viewName, vdOptions),
              create,
            ]}`
              .SQL(ctx)
            : create;
        },
      };
    return {
      ...viewDefn,
      selectStmt,
      drop: (options?: { ifExists?: boolean }) => dropView(viewName, options),
    };
  };
}

export function safeViewDefinitionCustom<
  ViewName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  viewName: ViewName,
  props: TPropAxioms,
  selectStmt:
    & ss.Select<Any, Context>
    & Partial<tmpl.SqlTextLintIssuesSupplier<Context>>,
  vdOptions?:
    & ViewDefnOptions<ViewName, ColumnName, Context>
    & Partial<tmpl.EmbeddedSqlSupplier>
    & {
      readonly onPropertyNotAxiomSqlDomain?: (
        name: string,
        axiom: Any,
        domains: d.IdentifiableSqlDomain<Any, Context>[],
      ) => void;
    },
) {
  const { isTemp, isIdempotent = true } = vdOptions ?? {};
  const sd = props ? d.sqlDomains(props, vdOptions) : undefined;
  const viewColumns = sd
    ? sd.domains.map((d) => d.identity as ColumnName)
    : undefined;
  const viewDefn:
    & ViewDefinition<ViewName, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context> = {
      isValid: selectStmt.isValid,
      viewName,
      isTemp,
      isIdempotent,
      populateSqlTextLintIssues: (lintIssues, steOptions) =>
        selectStmt.populateSqlTextLintIssues?.(lintIssues, steOptions),
      SQL: (ctx) => {
        const { sqlTextEmitOptions: steOptions } = ctx;
        const rawSelectStmtSqlText = selectStmt.SQL(ctx);
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
        return vdOptions?.before
          ? ctx.embeddedSQL<Context>()`${[
            vdOptions.before(viewName, vdOptions),
            create,
          ]}`.SQL(ctx)
          : create;
      },
    };
  return {
    ...sd,
    ...viewDefn,
    selectStmt,
    drop: (options?: { ifExists?: boolean }) => dropView(viewName, options),
  };
}

export function safeViewDefinition<
  ViewName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  viewName: ViewName,
  props: TPropAxioms,
  vdOptions?:
    & ViewDefnOptions<ViewName, ColumnName, Context>
    & Partial<tmpl.EmbeddedSqlSupplier>
    & {
      readonly onPropertyNotAxiomSqlDomain?: (
        name: string,
        axiom: Any,
        domains: d.IdentifiableSqlDomain<Any, Context>[],
      ) => void;
    },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    const { embeddedSQL = tmpl.SQL } = vdOptions ?? {};
    const selectStmt = ss.safeSelect<Any, TPropAxioms, Context>(props, {
      embeddedSQL,
    });
    return safeViewDefinitionCustom(
      viewName,
      props,
      selectStmt(literals, ...expressions),
      vdOptions,
    );
  };
}

export function dropView<
  ViewName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  viewName: ViewName,
  dvOptions?: { ifExists?: boolean },
): tmpl.SqlTextSupplier<Context> {
  const { ifExists = true } = dvOptions ?? {};
  return {
    SQL: (ctx) => {
      const ns = ctx.sqlTextEmitOptions.namingStrategy(ctx, {
        quoteIdentifiers: true,
      });
      return `DROP VIEW ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}

import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as ws from "../../../text/whitespace.ts";
import * as tmpl from "../template/mod.ts";
import * as ss from "../dql/select.ts";
import * as d from "../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface ViewDefinition<
  ViewName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly viewName: ViewName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns?: ColumnName[];
  // deno-lint-ignore no-explicit-any
  readonly selectStmt: ss.Select<Context, any, any, EmitOptions>;
}

export function isViewDefinition<
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is ViewDefinition<TableName, ColumnName, EmitOptions, Context> {
  const isViewDefn = safety.typeGuard<
    ViewDefinition<TableName, ColumnName, EmitOptions, Context>
  >(
    "viewName",
    "selectStmt",
    "SQL",
  );
  return isViewDefn(o);
}

export interface ViewDefnOptions<
  ViewName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly viewColumns?: ColumnName[];
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly before?: (
    viewName: ViewName,
    vdOptions: ViewDefnOptions<ViewName, ColumnName, EmitOptions, Context>,
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
}

// export interface ViewDefnFactory<
//   Context,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
//     tmpl.SqlTextEmitOptions<
//       Context
//     >,
// > {
//   sqlViewStrTmplLiteral: <
//     ViewName extends string,
//     ColumnName extends string,
//   >(
//     viewName: ViewName,
//     viewOptions?: ViewDefnOptions<
//       Context,
//       ViewName,
//       ColumnName,
//       EmitOptions
//     >,
//   ) => (
//     literals: TemplateStringsArray,
//     ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
//   ) =>
//     & ViewDefinition<Context, ViewName, ColumnName, EmitOptions>
//     & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>;
//   dropView: <ViewName extends string>(
//     viewName: ViewName,
//     options?: { ifExists?: boolean },
//   ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
// }

// export function typicalSqlViewDefnFactory<
//   Context,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
//     tmpl.SqlTextEmitOptions<
//       Context
//     >,
// >(): ViewDefnFactory<Context, EmitOptions> {
//   return {
//     sqlViewStrTmplLiteral: (viewName, viewOptions) => {
//       return (literals, ...expressions) => {
//         // deno-lint-ignore no-explicit-any
//         const partial = ss.select<Context, any, any, EmitOptions>({
//           literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
//         });
//         const selectStmt = partial(literals, ...expressions);
//         const { isTemp, isIdempotent = true, viewColumns } = viewOptions ?? {};
//         return {
//           isValid: selectStmt.isValid,
//           viewName,
//           columns: viewColumns,
//           isTemp,
//           isIdempotent,
//           selectStmt,
//           populateSqlTextLintIssues: (lintIssues, steOptions) =>
//             selectStmt.populateSqlTextLintIssues(lintIssues, steOptions),
//           SQL: (ctx, steOptions) => {
//             const rawSelectStmtSqlText = selectStmt.SQL(ctx, steOptions);
//             const viewSelectStmtSqlText = steOptions.indentation(
//               "create view select statement",
//               rawSelectStmtSqlText,
//             );
//             const ns = steOptions.namingStrategy(ctx, {
//               quoteIdentifiers: true,
//             });
//             const create = `CREATE ${isTemp ? "TEMP " : ""}VIEW ${
//               isIdempotent ? "IF NOT EXISTS " : ""
//             }${ns.viewName(viewName)}${
//               viewColumns
//                 ? `(${
//                   viewColumns.map((cn) =>
//                     ns.viewColumnName({
//                       viewName,
//                       columnName: cn,
//                     })
//                   ).join(", ")
//                 })`
//                 : ""
//             } AS\n${viewSelectStmtSqlText}`;
//             return viewOptions?.before
//               ? tmpl.SQL<Context, EmitOptions>(ctx)`${[
//                 viewOptions.before(viewName, viewOptions),
//                 create,
//               ]}`
//                 .SQL(ctx, steOptions)
//               : create;
//           },
//         };
//       };
//     },
//     dropView: (viewName, dvOptions) => {
//       const { ifExists = true } = dvOptions ?? {};
//       return {
//         SQL: (ctx, steOptions) => {
//           const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
//           return `DROP VIEW ${ifExists ? "IF EXISTS " : ""}${
//             ns.viewName(viewName)
//           }`;
//         },
//       };
//     },
//   };
// }

export function viewDefinition<
  ViewName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  viewName: ViewName,
  props?: TPropAxioms,
  vdOptions?: ViewDefnOptions<ViewName, ColumnName, EmitOptions, Context> & {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    // deno-lint-ignore no-explicit-any
    const partial = ss.select<Context, any, any, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const selectStmt = partial(literals, ...expressions);
    const sd = props ? d.sqlDomains(props, vdOptions) : undefined;
    const viewColumns = sd
      ? sd.domains.map((d) => d.identity as ColumnName)
      : undefined;
    if (sd && vdOptions?.viewColumns) {
      throw new Error("options?.viewColumns not allowed with TPropAxioms");
    }
    const { isTemp, isIdempotent = true } = vdOptions ?? {};
    const viewDefn:
      & ViewDefinition<ViewName, ColumnName, EmitOptions, Context>
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
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
          return vdOptions?.before
            ? tmpl.SQL<Context, EmitOptions>(ctx)`${[
              vdOptions.before(viewName, vdOptions),
              create,
            ]}`
              .SQL(ctx, steOptions)
            : create;
        },
      };
    return {
      ...sd,
      ...viewDefn,
      drop: (options?: { ifExists?: boolean }) => dropView(viewName, options),
    };
  };
}

export function dropView<
  ViewName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  viewName: ViewName,
  dvOptions?: { ifExists?: boolean },
): tmpl.SqlTextSupplier<Context, EmitOptions> {
  const { ifExists = true } = dvOptions ?? {};
  return {
    SQL: (ctx, steOptions) => {
      const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
      return `DROP VIEW ${ifExists ? "IF EXISTS " : ""}${
        ns.viewName(viewName)
      }`;
    },
  };
}

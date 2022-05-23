import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";
import * as ws from "../../text/whitespace.ts";

export interface UnindentSupplier {
  readonly unindentWhitespace: (text: string) => string;
}

const isUnindentSupplier = safety.typeGuard<UnindentSupplier>(
  "unindentWhitespace",
);

export interface TableColumnsFactory<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly autoIncPrimaryKey: (
    columnName: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableAutoIncPrimaryKeyColumnDefinition<ColumnName>;
  readonly text: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableTextColumnDefinition<ColumnName>;
  readonly integer: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableIntegerColumnDefinition<ColumnName>;
  readonly dateTime: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableDateTimeColumnDefinition<ColumnName>;
  readonly creationTimestamp: (
    columnName: ColumnName,
  ) => TableCreationStampColumnDefinition<ColumnName>;
  readonly JSON: (
    columnName: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableJsonColumnDefinition<ColumnName>;
}

export interface TableDecoratorsFactory<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly unique: (...columnNames: ColumnName[]) => void;
}

export interface SqlDialect<Context extends EngineContext> {
  readonly tableColumnsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: TableDefinition<Context, TableName, ColumnName>,
  ) => TableColumnsFactory<Context, TableName, ColumnName>;
  readonly tableDecoratorsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: TableDefinition<Context, TableName, ColumnName>,
  ) => TableDecoratorsFactory<Context, TableName, ColumnName>;
  readonly tableColumnDefnSqlTextSupplier: <
    TableName extends string,
    ColumnName extends string,
  >(
    ctx: TableColumnDefinitionContext<Context, TableName, ColumnName>,
    options?: SqlTextEmitOptions,
  ) => string;
}

export interface SqlDialectSupplier<Context extends EngineContext> {
  readonly dialect: SqlDialect<Context>;
}

export function isSqlDialectSupplier<Context extends EngineContext>(
  o: unknown,
): o is SqlDialectSupplier<Context> {
  const isSDS = safety.typeGuard<SqlDialectSupplier<Context>>("dialect");
  return isSDS(o);
}

export function typicalTableColumnsFactory<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  tableDefn: TableDefinition<Context, TableName, ColumnName>,
): TableColumnsFactory<
  Context,
  TableName,
  ColumnName
> {
  return {
    autoIncPrimaryKey: (columnName) => {
      const result:
        & TableAutoIncPrimaryKeyColumnDefinition<ColumnName>
        & TableColumnNullabilitySupplier
        & TableColumnPrimaryKeySupplier
        & SqlTextSupplier<
          TableColumnDefinitionContext<Context, TableName, ColumnName>
        > = {
          columnName: columnName,
          sqlDataType: "INTEGER",
          tsDataType: safety.typeGuard<number>(),
          isPrimaryKey: true,
          isNullable: false,
          SQL: (ctx, steOptions) => {
            return `${
              ctx.dialect.tableColumnDefnSqlTextSupplier(ctx, steOptions)
            } AUTOINCREMENT`;
          },
          foreignKeyTableColDefn: (foreignColumnName, options) => {
            const fkeyTableColDefnResult:
              & TableIntegerColumnDefinition<ColumnName>
              // deno-lint-ignore no-explicit-any
              & TableColumnForeignKeySupplier<Context, any, ColumnName> = {
                columnName: foreignColumnName ?? columnName,
                sqlDataType: "INTEGER",
                tsDataType: safety.typeGuard<number>(),
                isNullable: options?.isNullable ?? false,
                foreignKey: {
                  tableDefn,
                  tableColumnDefn: result,
                },
              };
            return fkeyTableColDefnResult;
          },
        };
      return result;
    },
    integer: (columnName, options) => {
      return {
        columnName: columnName,
        sqlDataType: "INTEGER",
        tsDataType: safety.typeGuard<number>(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
      };
    },
    dateTime: (columnName, options) => {
      const result: TableDateTimeColumnDefinition<ColumnName> = {
        columnName: columnName,
        sqlDataType: "DATETIME",
        tsDataType: safety.typeGuard<Date>(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
      };
      return result;
    },
    creationTimestamp: (columnName) => {
      const result:
        & TableCreationStampColumnDefinition<ColumnName>
        & TableColumnDeclareWeightSupplier
        & SqlTextSupplier<
          TableColumnDefinitionContext<Context, TableName, ColumnName>
        > = {
          columnName: columnName,
          sqlDataType: "DATETIME",
          tsDataType: safety.typeGuard<Date>(),
          declarationWeight: 99,
          SQL: (ctx, steOptions) => {
            return `${
              ctx.dialect.tableColumnDefnSqlTextSupplier(ctx, steOptions)
            } DEFAULT CURRENT_TIMESTAMP`;
          },
        };
      return result;
    },
    text: (columnName, options) => {
      return {
        columnName: columnName,
        sqlDataType: "TEXT",
        tsDataType: safety.typeGuard<string>(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
      };
    },
    JSON: (columnName, options) => {
      return {
        columnName: columnName,
        sqlDataType: "JSON",
        tsDataType: safety.typeGuard<Record<string, unknown>>(),
        isNullable: options?.isNullable ?? false,
      };
    },
  };
}

export function typicalTableColumnDefnSqlTextSupplier<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(): (
  ctx: TableColumnDefinitionContext<Context, TableName, ColumnName>,
  options?: SqlTextEmitOptions,
) => string {
  return (ctx, steOptions) => {
    const tCD = ctx.tableColumnDefn;
    const columnName = steOptions?.columnName?.({
      tableName: ctx.tableDefn.tableName,
      columnName: ctx.tableColumnDefn.columnName,
    }) ??
      ctx.tableColumnDefn.columnName;
    const sqlDataType = isTableColumnDataTypeSupplier(tCD)
      ? ` ${tCD.sqlDataType}`
      : "";
    const primaryKey = isTableColumnPrimaryKeySupplier(tCD)
      ? tCD.isPrimaryKey ? " PRIMARY KEY" : ""
      : "";
    const notNull = primaryKey.length == 0
      ? isTableColumnNullabilitySupplier(tCD)
        ? tCD.isNullable ? "" : " NOT NULL"
        : ""
      : "";
    // deno-fmt-ignore
    return `${steOptions?.indentation?.("define table column") ?? ""}${columnName}${sqlDataType}${primaryKey}${notNull}`;
  };
}

export function typicalTableDecoratorsFactory<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  tableDefn: TableDefinition<Context, TableName, ColumnName>,
): TableDecoratorsFactory<Context, TableName, ColumnName> {
  return {
    unique: (...columnNames) => {
      tableDefn.decorators.push({
        SQL: (_ctx, steOptions) =>
          `UNIQUE(${
            columnNames.map((cn) =>
              steOptions?.columnName?.({
                tableName: tableDefn.tableName,
                columnName: cn,
              }) ?? cn
            ).join(", ")
          })`,
      });
    },
  };
}

export function sqliteDialect<Context extends EngineContext>(): SqlDialect<
  Context
> {
  return {
    tableColumnsFactory: (tableDefn) => typicalTableColumnsFactory(tableDefn),
    tableColumnDefnSqlTextSupplier: typicalTableColumnDefnSqlTextSupplier<
      Context,
      // deno-lint-ignore no-explicit-any
      any,
      // deno-lint-ignore no-explicit-any
      any
    >(),
    tableDecoratorsFactory: typicalTableDecoratorsFactory,
  };
}

export interface EngineContext {
  readonly registerTable: <TableName extends string, ColumnName extends string>(
    // deno-lint-ignore no-explicit-any
    table: TableDefinition<any, TableName, ColumnName>,
  ) => void;
  // deno-lint-ignore no-explicit-any
  readonly dialect: SqlDialect<any>;
}

export interface TableDefinitionSupplier<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly tableDefn: TableDefinition<Context, TableName, ColumnName>;
}

export interface SqlLintIssueSupplier {
  readonly lintIssue: string;
}

export interface SqlLintIssuesSupplier {
  readonly lintIssues: SqlLintIssueSupplier[];
}

export const isSqlLintIssuesSupplier = safety.typeGuard<SqlLintIssuesSupplier>(
  "lintIssues",
);

export interface SqlTextEmitOptions {
  readonly tableName?: (tableName: string) => string;
  readonly columnName?: (
    column: { tableName: string; columnName: string },
  ) => string;
  readonly indentation?: (
    nature: "create table" | "define table column",
  ) => string;
}

export interface SqlTextSupplier<Context extends EngineContext> {
  readonly SQL: (ctx: Context, options?: SqlTextEmitOptions) => string;
}

export function isSqlTextSupplier<Context extends EngineContext>(
  o: unknown,
): o is SqlTextSupplier<Context> {
  const isSTS = safety.typeGuard<SqlTextSupplier<Context>>("SQL");
  return isSTS(o);
}

export interface TableColumnNameSupplier<ColumnName extends string> {
  readonly columnName: ColumnName;
}

export const isTableColumnNameSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  TableColumnNameSupplier<any>
>("columnName");

export interface TableColumnPrimaryKeySupplier {
  readonly isPrimaryKey: boolean;
}

export const isTableColumnPrimaryKeySupplier = safety.typeGuard<
  TableColumnPrimaryKeySupplier
>("isPrimaryKey");

export interface ForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
> {
  readonly foreignKeyTableColDefn: (
    columnName?: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableColumnDefinition<ColumnName>;
}

export function isForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
>(
  o: unknown,
): o is ForeignKeyTableColumnDefnFactory<ColumnName> {
  const isTCFKF = safety.typeGuard<
    ForeignKeyTableColumnDefnFactory<ColumnName>
  >("foreignKeyTableColDefn");
  return isTCFKF(o);
}

export interface TableColumnForeignKeySupplier<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly foreignKey:
    & TableDefinitionSupplier<Context, TableName, ColumnName>
    & {
      tableColumnDefn:
        & TableColumnNameSupplier<ColumnName>
        // deno-lint-ignore no-explicit-any
        & TableColumnDataTypeSupplier<any, any>;
    };
}

export function isTableColumnForeignKeySupplier<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  o: unknown,
): o is TableColumnForeignKeySupplier<Context, TableName, ColumnName> {
  const isFKS = safety.typeGuard<
    TableColumnForeignKeySupplier<Context, TableName, ColumnName>
  >("foreignKey");
  return isFKS(o);
}

export interface TableColumnDeclareWeightSupplier {
  readonly declarationWeight: number;
}

export const isTableColumnDeclareWeightSupplier = safety.typeGuard<
  TableColumnDeclareWeightSupplier
>("declarationWeight");

export interface TableColumnNullabilitySupplier {
  readonly isNullable: boolean;
}

export const isTableColumnNullabilitySupplier = safety.typeGuard<
  TableColumnNullabilitySupplier
>("isNullable");

export interface TableColumnDataTypeSupplier<SqlType, TsType> {
  readonly sqlDataType: SqlType;
  readonly tsDataType: safety.TypeGuard<TsType>;
}

export const isTableColumnDataTypeSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  TableColumnDataTypeSupplier<any, any>
>("sqlDataType", "tsDataType");

export interface TableAutoIncPrimaryKeyColumnDefinition<
  ColumnName extends string,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"INTEGER", number>,
  ForeignKeyTableColumnDefnFactory<ColumnName> {
}

export interface TableIntegerColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"INTEGER", number>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableDateTimeColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"DATETIME", Date>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableCreationStampColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"DATETIME", Date> {
}

export interface TableTextColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"TEXT", string>,
    Partial<TableColumnNullabilitySupplier>,
    Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableJsonColumnDefinition<ColumnName extends string>
  extends
    TableColumnNameSupplier<ColumnName>,
    TableColumnDataTypeSupplier<"JSON", Record<string, unknown>>,
    Partial<TableColumnNullabilitySupplier> {
}

export type TableColumnDefinition<ColumnName extends string> =
  TableColumnNameSupplier<ColumnName>;

export function isTableColumnDefinition<ColumnName extends string>(
  o: unknown,
): o is TableColumnDefinition<ColumnName> {
  const isCD = safety.typeGuard<TableColumnDefinition<ColumnName>>(
    "columnName",
  );
  return isCD(o);
}

export interface TableColumnDefinitionSupplier<ColumnName extends string> {
  readonly tableColumnDefn: TableColumnDefinition<ColumnName>;
}

export type TableDefinitionContext<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName>;

export type TableColumnDefinitionContext<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName>
  & TableColumnDefinitionSupplier<ColumnName>;

export interface TableDefinition<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> extends SqlTextSupplier<Context> {
  readonly tableName: TableName;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition<ColumnName>[];
  readonly decorators: SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName>
  >[];
}

export function isTableDefinition<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  o: unknown,
): o is TableDefinition<Context, TableName, ColumnName> {
  const isCTR = safety.typeGuard<
    TableDefinition<Context, TableName, ColumnName>
  >(
    "tableName",
    "isIdempotent",
  );
  return isCTR(o);
}

export interface TableLintIssue<TableName extends string>
  extends SqlLintIssueSupplier {
  readonly tableName: TableName;
}

export interface DefineTableOptions {
  readonly isIdempotent: boolean;
  readonly enforceForeignKeyRefs:
    | false
    | "table-decorator"; /* TODO: | "alter-table" */
}

export interface DefineTableInit<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly tableDefn:
    & TableDefinition<Context, TableName, ColumnName>
    & SqlLintIssuesSupplier
    & {
      readonly finalizeDefn: () => void;
      readonly registerLintIssues: (...slis: SqlLintIssueSupplier[]) => void;
    };
  readonly columnsFactory: TableColumnsFactory<
    Context,
    TableName,
    ColumnName
  >;
  readonly decoratorsFactory: TableDecoratorsFactory<
    Context,
    TableName,
    ColumnName
  >;
  readonly ctx: Context;
}

export function defineTable<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  defineTable?: (init: DefineTableInit<Context, TableName, ColumnName>) => void,
  options?: DefineTableOptions,
): TableDefinition<Context, TableName, ColumnName> {
  const { isIdempotent } = options ?? { isIdempotent: true };
  const columns: TableColumnDefinition<ColumnName>[] = [];
  const decorators: SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName>
  >[] = [];
  const lintIssues: SqlLintIssueSupplier[] = [];
  const tableDefn:
    & TableDefinition<Context, TableName, ColumnName>
    & SqlLintIssuesSupplier
    & {
      finalizeDefn: () => void;
      registerLintIssues: (...slis: SqlLintIssueSupplier[]) => void;
    } = {
      tableName,
      isIdempotent,
      columns,
      lintIssues,
      registerLintIssues: (...slis) => {
        for (const li of slis) {
          const tli: TableLintIssue<TableName> = { tableName, ...li };
          lintIssues.push(tli);
        }
      },
      decorators,
      SQL: (sqlCtx, steOptions) => {
        const columnDefns: string[] = [];
        const tableCtx:
          & Context
          & TableDefinitionSupplier<Context, TableName, ColumnName> = {
            ...sqlCtx,
            tableDefn: tableDefn,
          };
        const ttcdSTS = sqlCtx.dialect.tableColumnDefnSqlTextSupplier;
        for (
          const c of columns.sort((a, b) =>
            isTableColumnDeclareWeightSupplier(a) &&
              isTableColumnDeclareWeightSupplier(b)
              ? a.declarationWeight - b.declarationWeight
              : (isTableColumnDeclareWeightSupplier(a)
                ? a.declarationWeight - 0
                : (isTableColumnDeclareWeightSupplier(b)
                  ? 0 - b.declarationWeight
                  : 0))
          )
        ) {
          const columnDefnSQL = isSqlTextSupplier<Context>(c) ? c.SQL : ttcdSTS;
          columnDefns.push(
            columnDefnSQL({ ...tableCtx, tableColumnDefn: c }, steOptions),
          );
        }
        const indent = steOptions?.indentation?.("define table column");
        const decoratorsSQL = tableCtx.tableDefn.decorators.map((sts) =>
          sts.SQL(tableCtx, steOptions)
        ).join(",\n");

        // deno-fmt-ignore
        const result = `${steOptions?.indentation?.("create table") ?? ''}CREATE TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${steOptions?.tableName?.(tableName) ?? tableName} (\n` +
        columnDefns.join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n);";
        return result;
      },
      finalizeDefn: () => {
        for (const vcn of validColumnNames) {
          if (!columns.find((c) => c.columnName == vcn)) {
            const lintIssue: TableLintIssue<TableName> = {
              tableName,
              lintIssue:
                `column '${vcn}' declared but not defined in createTable(${tableName})`,
            };
            lintIssues.push(lintIssue);
          }
        }
        if (
          options?.enforceForeignKeyRefs &&
          options?.enforceForeignKeyRefs == "table-decorator"
        ) {
          for (const c of tableDefn.columns) {
            if (isTableColumnForeignKeySupplier(c)) {
              tableDefn.decorators.push({
                SQL: (_ctx, steOptions) => {
                  const tn = steOptions?.tableName;
                  const cn = steOptions?.columnName;
                  return `FOREIGN KEY(${
                    cn?.({ tableName, columnName: c.columnName }) ??
                      c.columnName
                  }) REFERENCES ${
                    tn?.(c.foreignKey.tableDefn.tableName) ??
                      c.foreignKey.tableDefn.tableName
                  }(${
                    cn?.({
                      tableName: c.foreignKey.tableDefn.tableName,
                      columnName: c.foreignKey.tableColumnDefn.columnName,
                    }) ?? c.foreignKey.tableColumnDefn.columnName
                  })`;
                },
              });
            }
          }
        }
      },
    };
  defineTable?.({
    tableDefn,
    columnsFactory: ctx.dialect.tableColumnsFactory(tableDefn),
    decoratorsFactory: ctx.dialect.tableDecoratorsFactory(tableDefn),
    ctx,
  });
  return tableDefn;
}

export function typicalTableDefn<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  options: DefineTableOptions = {
    isIdempotent: true,
    enforceForeignKeyRefs: "table-decorator",
  },
) {
  return (
    customDefineTable?: (
      defineColumns: (...column: TableColumnDefinition<ColumnName>[]) => void,
      init: DefineTableInit<Context, TableName, ColumnName>,
    ) => void,
  ) => {
    let primaryKeyColDefn: TableAutoIncPrimaryKeyColumnDefinition<
      `${TableName}_id`
    >;
    const tableDefn = defineTable(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, `created_at`],
      (init) => {
        const { tableDefn, columnsFactory: cf } = init;
        primaryKeyColDefn = cf.autoIncPrimaryKey(
          `${tableName}_id`,
        ) as TableAutoIncPrimaryKeyColumnDefinition<`${TableName}_id`>;
        tableDefn.columns.push(primaryKeyColDefn);
        customDefineTable?.(
          (...columns) => {
            tableDefn.columns.push(...columns);
          },
          // deno-lint-ignore no-explicit-any
          init as any, // TODO: figure out why cast to any is required
        );
        tableDefn.columns.push(cf.creationTimestamp(`created_at`));
        tableDefn.finalizeDefn();
      },
      options,
    );
    // we use ! after primaryKeyColDefn because linter thinks it's not set but we know it is
    return { tableDefn, primaryKeyColDefn: primaryKeyColDefn! };
  };
}

export type SqlTextPartial<Context extends EngineContext> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  // deno-lint-ignore no-explicit-any
  | ((ctx: Context) => TableDefinition<Context, any, any>)
  // deno-lint-ignore no-explicit-any
  | TableDefinition<Context, any, any>
  | string;

export interface SqlTextOptions {
  readonly literalSupplier: ws.TemplateLiteralIndexedTextSupplier;
}

export function sqlText<Context extends EngineContext>(
  options?: SqlTextOptions,
): (
  literals: TemplateStringsArray,
  ...expressions: SqlTextPartial<Context>[]
) => SqlTextSupplier<Context> & Partial<SqlLintIssuesSupplier> {
  const lintIssues: SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const {
      // we want to unindent and remove initial newline by default; if this
      // behavior is not desired, pass in an alternate literal supplier
      // function
      literalSupplier = ws.whitespaceSensitiveTemplateLiteralSupplier(
        literals,
        suppliedExprs,
      ),
    } = options ?? {};
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
          // deno-lint-ignore no-explicit-any
          if (isTableDefinition<Context, any, any>(exprValue)) {
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
          if (isTableDefinition<Context, any, any>(expr)) {
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

        if (isTableDefinition(expr)) {
          interpolated += expr.SQL(ctx, steOptions);
        } else if (typeof expr === "string") {
          interpolated += expr;
        } else {
          interpolated += Deno.inspect(expr);
        }

        if (isSqlLintIssuesSupplier(expr)) {
          lintIssues.push(...expr.lintIssues);
        }
      }
      interpolated += literalSupplier(literals.length - 1);
      return interpolated;
    };
    return {
      SQL: (ctx, steOptions) => {
        const SQL = interpolate(ctx, steOptions);
        return isUnindentSupplier(ctx) ? ctx.unindentWhitespace(SQL) : SQL;
      },
      lintIssues,
    };
  };
}

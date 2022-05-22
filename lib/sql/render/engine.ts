import * as safety from "../../safety/mod.ts";
import * as c from "../../text/contributions.ts";

export interface UnindentSupplier {
  readonly unindentWhitespace: (text: string) => string;
}

const isUnindentSupplier = safety.typeGuard<UnindentSupplier>(
  "unindentWhitespace",
);

export interface SqlDialect {
  readonly tableColumnsConstructionHelpers?: <
    Context extends EngineContext,
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
  ) => ConstructTableColumnsHelpers<Context, TableName, ColumnName> | undefined;
  readonly tableDefnConstructionHelpers?: <
    Context extends EngineContext,
    TableName extends string,
    ColumnName extends string,
  >(
    tableName: TableName,
  ) => ConstructTableDefnHelpers<Context, TableName, ColumnName> | undefined;
}

export interface EngineContext {
  readonly registerTable: <TableName extends string>(
    // deno-lint-ignore no-explicit-any
    table: CreateTableRequest<any, TableName>,
  ) => void;
  readonly reference: <TableName extends string, ColumnName extends string>(
    tableName: TableName,
    columnName?: ColumnName,
  ) =>
    | (
      // deno-lint-ignore no-explicit-any
      & CreateTableRequestSupplier<any, TableName>
      & {
        readonly tableColumnDefn:
          & TableColumnNameSupplier
          // deno-lint-ignore no-explicit-any
          & TableColumnDataTypeSupplier<any, any>;
      }
    )
    | undefined;
  readonly dialect?: SqlDialect;
}

export interface CreateTableRequestSupplier<
  Context extends EngineContext,
  TableName extends string,
> {
  readonly createTableRequest: CreateTableRequest<Context, TableName>;
}

export interface SqlLintIssueSupplier {
  readonly lintIssue: string;
}

export interface SqlLintIssuesSupplier {
  readonly lintIssues: () => SqlLintIssueSupplier[];
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

export interface TableColumnNameSupplier {
  readonly columnName: string;
}

export const isTableColumnNameSupplier = safety.typeGuard<
  TableColumnNameSupplier
>("columnName");

export interface TableColumnPrimaryKeySupplier {
  readonly isPrimaryKey: boolean;
}

export const isTableColumnPrimaryKeySupplier = safety.typeGuard<
  TableColumnPrimaryKeySupplier
>("isPrimaryKey");

export interface TableColumnForeignKeySupplier<
  Context extends EngineContext,
  TableName extends string,
> {
  readonly foreignKey: CreateTableRequestSupplier<Context, TableName> & {
    // deno-lint-ignore no-explicit-any
    tableColumnDefn: TableColumnDataTypeSupplier<any, any>;
  };
}

export function isTableColumnForeignKeySupplier<
  Context extends EngineContext,
  TableName extends string,
>(o: unknown): o is TableColumnForeignKeySupplier<Context, TableName> {
  const isFKS = safety.typeGuard<
    TableColumnForeignKeySupplier<Context, TableName>
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

export interface TableAutoIncPrimaryKeyColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"INTEGER", number>,
    TableColumnNullabilitySupplier,
    TableColumnPrimaryKeySupplier {
}

export interface TableIntegerColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"INTEGER", number>,
    TableColumnNullabilitySupplier,
    TableColumnPrimaryKeySupplier {
}

export interface TableDateTimeColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"DATETIME", Date>,
    TableColumnNullabilitySupplier,
    TableColumnPrimaryKeySupplier {
}

export interface TableCreationStampColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"DATETIME", Date>,
    TableColumnNullabilitySupplier,
    TableColumnDeclareWeightSupplier {
  // defined to differentiate from TableDateTimeColumnDefinition
  readonly isCreationStampColumnDefinition: true;
}

export interface TableTextColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"TEXT", string>,
    TableColumnNullabilitySupplier,
    TableColumnPrimaryKeySupplier {
}

export interface TableJsonColumnDefinition
  extends
    TableColumnNameSupplier,
    TableColumnDataTypeSupplier<"JSON", Record<string, unknown>>,
    TableColumnNullabilitySupplier {
}

export type TableColumnDefinition =
  | TableColumnNameSupplier
  | TableAutoIncPrimaryKeyColumnDefinition
  | TableIntegerColumnDefinition
  | TableDateTimeColumnDefinition
  | TableCreationStampColumnDefinition
  | TableTextColumnDefinition
  | TableJsonColumnDefinition;

export function isTableColumnDefinition(
  o: unknown,
): o is TableColumnDefinition {
  const isCD = safety.typeGuard<TableColumnDefinition>("columnName");
  return isCD(o);
}

export interface TableColumnDefinitionSupplier {
  readonly tableColumnDefn: TableColumnDefinition;
}

export type TableColumnDefinitionContext<
  Context extends EngineContext,
  TableName extends string,
> =
  & Context
  & CreateTableRequestSupplier<Context, TableName>
  & TableColumnDefinitionSupplier;

export type TableStructDefinitionSupplier<
  Context extends EngineContext,
  TableName extends string,
> = (
  ctx: Context & CreateTableRequestSupplier<Context, TableName>,
) =>
  | TableColumnDefinition
  | TableColumnDefinition
    & SqlTextSupplier<TableColumnDefinitionContext<Context, TableName>>
  | c.TextContributionsPlaceholder
  | void;

export interface CreateTableRequest<
  Context extends EngineContext,
  TableName extends string,
> extends SqlTextSupplier<Context> {
  readonly tableName: TableName;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition[];
  readonly define: (
    literals: TemplateStringsArray,
    ...expressions: (TableStructDefinitionSupplier<Context, TableName>)[]
  ) => void;
  readonly tableDefnSql: c.Contributions;
}

export function isCreateTableRequest<
  Context extends EngineContext,
  TableName extends string,
>(
  o: unknown,
): o is CreateTableRequest<Context, TableName> {
  const isCTR = safety.typeGuard<CreateTableRequest<Context, TableName>>(
    "tableName",
    "isIdempotent",
  );
  return isCTR(o);
}

export interface ConstructTableColumnsHelpers<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly autoIncPrimaryKey: (
    columnName: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly text: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly integer: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly dateTime: (
    columnName: ColumnName,
    options?:
      & Partial<TableColumnNullabilitySupplier>
      & Partial<TableColumnPrimaryKeySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly creationTimestamp: (
    columnName: ColumnName,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly JSON: (
    columnName: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
  readonly foreignKey: (
    // deno-lint-ignore no-explicit-any
    reference: CreateTableRequestSupplier<Context, any> & {
      readonly tableColumnDefn:
        & TableColumnNameSupplier
        // deno-lint-ignore no-explicit-any
        & TableColumnDataTypeSupplier<any, any>;
    },
    columnName?: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableStructDefinitionSupplier<Context, TableName>;
}

export function typicalTableColumnDefnSqlTextSupplier<
  Context extends EngineContext,
  TableName extends string,
>(): (
  ctx: TableColumnDefinitionContext<Context, TableName>,
  options?: SqlTextEmitOptions,
) => string {
  return (ctx, steOptions) => {
    const tCD = ctx.tableColumnDefn;
    const columnName = steOptions?.columnName?.({
      tableName: ctx.createTableRequest.tableName,
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

export function typicalTableColumnsConstructionHelpers<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(): ConstructTableColumnsHelpers<
  Context,
  TableName,
  ColumnName
> {
  const ttcdSTS = typicalTableColumnDefnSqlTextSupplier<Context, TableName>();
  return {
    autoIncPrimaryKey: (columnName) => {
      return () => {
        return {
          columnName: columnName as ColumnName,
          sqlDataType: "INTEGER",
          tsDataType: safety.typeGuard<number>(),
          isPrimaryKey: true,
          isNullable: false,
          SQL: (ctx, steOptions) => {
            return `${ttcdSTS(ctx, steOptions)} AUTO INCREMENT`;
          },
        };
      };
    },
    integer: (columnName, options) => {
      return () => {
        return {
          columnName: columnName as ColumnName,
          sqlDataType: "INTEGER",
          tsDataType: safety.typeGuard<number>(),
          isPrimaryKey: options?.isPrimaryKey ?? false,
          isNullable: options?.isNullable ?? false,
        };
      };
    },
    dateTime: (columnName, options) => {
      return () => {
        return {
          columnName: columnName as ColumnName,
          sqlDataType: "DATETIME",
          tsDataType: safety.typeGuard<Date>(),
          isPrimaryKey: options?.isPrimaryKey ?? false,
          isNullable: options?.isNullable ?? false,
        };
      };
    },
    creationTimestamp: (columnName) => {
      return () => {
        return {
          isCreationStampColumnDefinition: true,
          columnName: columnName as ColumnName,
          sqlDataType: "DATETIME",
          tsDataType: safety.typeGuard<Date>(),
          declarationWeight: 99,
          isNullable: false,
          SQL: (ctx, steOptions) => {
            return `${ttcdSTS(ctx, steOptions)} DEFAULT CURRENT_TIMESTAMP`;
          },
        };
      };
    },
    text: (columnName, options) => {
      return () => {
        return {
          columnName: columnName as ColumnName,
          sqlDataType: "TEXT",
          tsDataType: safety.typeGuard<string>(),
          isPrimaryKey: options?.isPrimaryKey ?? false,
          isNullable: options?.isNullable ?? false,
        };
      };
    },
    JSON: (columnName, options) => {
      return () => {
        return {
          columnName: columnName as ColumnName,
          sqlDataType: "JSON",
          tsDataType: safety.typeGuard<Record<string, unknown>>(),
          isNullable: options?.isNullable ?? false,
        };
      };
    },
    foreignKey: (reference, columnName) => {
      return (ctx) => {
        const result:
          & TableColumnNameSupplier
          // deno-lint-ignore no-explicit-any
          & TableColumnDataTypeSupplier<any, any>
          // deno-lint-ignore no-explicit-any
          & TableColumnForeignKeySupplier<Context, any> = {
            columnName: columnName ?? reference.tableColumnDefn.columnName,
            sqlDataType: reference.tableColumnDefn.sqlDataType ??
              `?FK(${reference.createTableRequest.tableName})`,
            tsDataType: reference.tableColumnDefn.tsDataType ??
              `?FK(${reference.createTableRequest.tableName})`,
            foreignKey: {
              ...ctx,
              createTableRequest: reference.createTableRequest,
              tableColumnDefn: reference.tableColumnDefn,
            },
          };
        return result;
      };
    },
  };
}

export interface ConstructTableDefnHelpers<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly unique: (
    ...columnNames: ColumnName[]
  ) => TableStructDefinitionSupplier<Context, TableName>;
}

export function typicalTableDefnConstructionHelpers<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(): ConstructTableDefnHelpers<
  Context,
  TableName,
  ColumnName
> {
  return {
    unique: (...columnNames) => {
      return (ctx) => {
        // deno-fmt-ignore
        ctx.createTableRequest.tableDefnSql.aft`UNIQUE(${columnNames.join(", ")})`;
      };
    },
  };
}

export interface TableLintIssue<TableName extends string>
  extends SqlLintIssueSupplier {
  readonly tableName: TableName;
}

export interface DefineTableOptions {
  readonly isIdempotent: boolean;
}

export function defineTable<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
  DefnHelpers extends ConstructTableDefnHelpers<Context, TableName, ColumnName>,
  ColumnsHelpers extends ConstructTableColumnsHelpers<
    Context,
    TableName,
    ColumnName
  >,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  options?: DefineTableOptions,
):
  & CreateTableRequest<Context, TableName>
  & { defnHelpers: () => DefnHelpers }
  & { columnsHelpers: () => ColumnsHelpers } {
  const { isIdempotent } = options ?? { isIdempotent: true };
  const columns: TableColumnDefinition[] = [];
  const tableDefnSql: c.Contributions = c.contributions("-- custom tableDefns");
  const CTR:
    & CreateTableRequest<Context, TableName>
    & { defnHelpers: () => DefnHelpers }
    & { columnsHelpers: () => ColumnsHelpers }
    & SqlLintIssuesSupplier = {
      tableName,
      isIdempotent,
      columns,
      lintIssues: () => {
        const lintIssues: SqlLintIssueSupplier[] = [];
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
        return lintIssues;
      },
      tableDefnSql,
      SQL: (sqlCtx, steOptions) => {
        const columnDefns: string[] = [];
        const tableCtx:
          & Context
          & CreateTableRequestSupplier<Context, TableName> = {
            ...sqlCtx,
            createTableRequest: CTR,
          };
        const ttcdSTS = typicalTableColumnDefnSqlTextSupplier<
          Context,
          TableName
        >();
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
        const fore = tableCtx.createTableRequest.tableDefnSql.contributions(
          "fore",
        )
          .text("\n");
        const aft = tableCtx.createTableRequest.tableDefnSql.contributions(
          "aft",
        )
          .text("\n");

        // deno-fmt-ignore
        const result = `${steOptions?.indentation?.("create table") ?? ''}CREATE TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${steOptions?.tableName?.(tableName) ?? tableName} (\n` +
          (fore.length > 0 ? `${indent}${fore},\n` : "") +
          columnDefns.join(",\n") +
          (aft.length > 0 ? `,\n${indent}${aft}` : "") +
          "\n);";
        return result;
      },
      columnsHelpers: () => {
        const custom = ctx.dialect?.tableColumnsConstructionHelpers?.(
          tableName,
        );
        const result = custom ??
          typicalTableColumnsConstructionHelpers<
            Context,
            TableName,
            ColumnName
          >();
        return result as ColumnsHelpers;
      },
      defnHelpers: () => {
        const custom = ctx.dialect?.tableDefnConstructionHelpers?.(tableName);
        const result = custom ??
          typicalTableDefnConstructionHelpers<Context, TableName, ColumnName>();
        return result as DefnHelpers;
      },
      define: (_, ...suppliedExprs) => {
        const interpolate: (
          ctx: Context & CreateTableRequestSupplier<Context, TableName>,
        ) => void = (ctx) => {
          // evaluate expressions and look for contribution placeholders;
          const placeholders: number[] = [];
          const expressions: unknown[] = [];
          let exprIndex = 0;
          for (let i = 0; i < suppliedExprs.length; i++) {
            const expr = suppliedExprs[i];
            if (typeof expr === "function") {
              const exprValue = expr(ctx);
              if (isTableColumnDefinition(exprValue)) {
                columns.push(exprValue);
              } else if (c.isTextContributionsPlaceholder(exprValue)) {
                placeholders.push(exprIndex);
                expressions[exprIndex] = expr; // we're going to run the function later
              } else {
                expressions[exprIndex] = exprValue;
              }
            } else {
              expressions[exprIndex] = expr;
            }
            exprIndex++;
          }
          // TODO: if other text is found, add it into proper definition locations
          // if (placeholders.length > 0) {
          //   for (const ph of placeholders) {
          //     const tcph = (expressions[ph] as SqlTextPartial<Context>)(
          //       ctx as Context,
          //     );
          //     expressions[ph] = c.isTextContributionsPlaceholder(tcph)
          //       ? tcph.contributions.map((c) => c.content).join("\n")
          //       : tcph;
          //   }
          // }
        };
        interpolate({ ...ctx, createTableRequest: CTR });
      },
    };
  return CTR;
}

export function typicalTablePreparer<
  Context extends EngineContext,
  TableName extends string,
  ColumnName extends string,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  options?: DefineTableOptions,
) {
  return () => {
    const result = defineTable(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, `created_at`],
      options,
    );
    const [tc] = [result.columnsHelpers()];
    result.define`
      ${tc.autoIncPrimaryKey(`${tableName}_id`)}
      ${tc.creationTimestamp(`created_at`)}
    `;
    return result;
  };
}

type SqlTextPartial<Context extends EngineContext> =
  | ((ctx: Context) => c.TextContributionsPlaceholder)
  | ((ctx: Context) => CreateTableRequest<Context, string>);

export function sqlText<Context extends EngineContext>(): (
  literals: TemplateStringsArray,
  ...expressions: SqlTextPartial<Context>[]
) => SqlTextSupplier<Context> & Partial<SqlLintIssuesSupplier> {
  const lintIssues: SqlLintIssueSupplier[] = [];
  return (literals, ...suppliedExprs) => {
    const interpolate: (
      ctx: Context,
      steOptions?: SqlTextEmitOptions,
    ) => string = (
      ctx,
      steOptions,
    ) => {
      // evaluate expressions and look for contribution placeholders;
      const placeholders: number[] = [];
      const expressions: unknown[] = [];
      let exprIndex = 0;
      for (let i = 0; i < suppliedExprs.length; i++) {
        const expr = suppliedExprs[i];
        if (typeof expr === "function") {
          const exprValue = expr(ctx);
          if (isCreateTableRequest<Context, string>(exprValue)) {
            ctx.registerTable(exprValue);
            expressions[exprIndex] = exprValue;
          } else if (c.isTextContributionsPlaceholder(exprValue)) {
            placeholders.push(exprIndex);
            expressions[exprIndex] = expr; // we're going to run the function later
          } else {
            expressions[exprIndex] = exprValue;
          }
        } else {
          expressions[exprIndex] = expr;
        }
        exprIndex++;
      }
      if (placeholders.length > 0) {
        for (const ph of placeholders) {
          const tcph = (expressions[ph] as SqlTextPartial<Context>)(
            ctx as Context,
          );
          expressions[ph] = c.isTextContributionsPlaceholder(tcph)
            ? tcph.contributions.map((c) => c.content).join("\n")
            : tcph;
        }
      }
      let interpolated = "";
      for (let i = 0; i < expressions.length; i++) {
        interpolated += literals[i];

        const expr = expressions[i];
        interpolated += typeof expr === "string"
          ? expr
          : (isCreateTableRequest(expr)
            ? expr.SQL(ctx, steOptions)
            : Deno.inspect(expr));

        if (isSqlLintIssuesSupplier(expr)) {
          lintIssues.push(...expr.lintIssues());
        }
      }
      interpolated += literals[literals.length - 1];
      return interpolated;
    };
    return {
      SQL: (ctx, steOptions) => {
        const SQL = interpolate(ctx, steOptions);
        return isUnindentSupplier(ctx) ? ctx.unindentWhitespace(SQL) : SQL;
      },
      lintIssues: () => lintIssues,
    };
  };
}

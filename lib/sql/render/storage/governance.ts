import * as safety from "../../../safety/mod.ts";
import * as t from "../text.ts";
import * as l from "../lint.ts";

export interface TableColumnCreateSqlTextSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  t.SqlTextSupplier<
    TableColumnDefinitionContext<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
    EmitOptions
  > {
  readonly isTableColumnCreateSqlTextSupplier: true;
}

export interface TableLintIssue<TableName extends string>
  extends l.SqlLintIssueSupplier {
  readonly tableName: TableName;
}

export interface TableDefinitionSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly tableDefn: TableDefinition<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >;
}

export interface TableColumnNameSupplier<ColumnName extends string> {
  readonly columnName: ColumnName;
}

export interface TableColumnPrimaryKeySupplier {
  readonly isPrimaryKey: boolean;
}

export interface ForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly foreignKeyTableColDefn: (
    columnName?: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableColumnDefinition<ColumnName, EmitOptions>;
}

export interface TableColumnForeignKeySupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly foreignKey:
    & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
    & {
      tableColumnDefn:
        & TableColumnNameSupplier<ColumnName>
        // deno-lint-ignore no-explicit-any
        & TableColumnDataTypeSupplier<any, any>;
    };
}

export interface TableColumnNullabilitySupplier {
  readonly isNullable: boolean;
}

export interface TableColumnDataTypeSupplier<SqlType, TsType> {
  readonly sqlDataType: SqlType;
  readonly tsDataType: safety.TypeGuard<TsType>;
}

export interface TableColumnValueSupplier<
  Context,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly columnDdlDefault: t.SqlTextSupplier<Context, EmitOptions>;
}

export interface TableColumnDeclareWeightSupplier {
  readonly declarationWeight: number;
}

export interface TableColumnDmlContributions {
  readonly isInInsertColumnsList: <Record>(record?: Record) => boolean;
  readonly isInUpdateColumnsList: <Record>(record?: Record) => boolean;
}

export interface TableColumnDmlContributionsSupplier {
  readonly sqlDmlContributions: TableColumnDmlContributions;
}

export interface TableAutoIncPrimaryKeyColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"INTEGER", number>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  ForeignKeyTableColumnDefnFactory<ColumnName, EmitOptions>,
  TableColumnDmlContributionsSupplier {
}

export interface TableIntegerColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"INTEGER", number>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableDateTimeColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"DATETIME", Date>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableCreationStampColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"DATETIME", Date>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  TableColumnDmlContributionsSupplier {
}

export interface TableTextColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"TEXT", string>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableJsonColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<"JSON", Record<string, unknown>>,
  // deno-lint-ignore no-explicit-any
  TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier> {
}

export type TableColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> =
  & TableColumnNameSupplier<ColumnName>
  // deno-lint-ignore no-explicit-any
  & TableColumnCreateSqlTextSupplier<any, any, ColumnName, EmitOptions>;

export interface TableColumnDefinitionSupplier<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly tableColumnDefn: TableColumnDefinition<ColumnName, EmitOptions>;
}

export type TableDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>;

export type TableColumnDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
  & TableColumnDefinitionSupplier<ColumnName, EmitOptions>;

export interface TableDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends t.SqlTextSupplier<Context, EmitOptions> {
  readonly tableName: TableName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition<ColumnName, EmitOptions>[];
  readonly decorators: t.SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName, EmitOptions>,
    EmitOptions
  >[];
}

import * as safety from "../../../safety/mod.ts";
import * as t from "../text.ts";

export interface TableColumnsFactory<
  Context extends StorageContext,
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

export interface TableDefnDecoratorsFactory<
  Context extends StorageContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly unique: (...columnNames: ColumnName[]) => void;
}

export interface StorageFactoriesSupplier<Context extends StorageContext> {
  readonly tableColumnsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: TableDefinition<Context, TableName, ColumnName>,
  ) => TableColumnsFactory<Context, TableName, ColumnName>;
  readonly tableDefnDecoratorsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: TableDefinition<Context, TableName, ColumnName>,
  ) => TableDefnDecoratorsFactory<Context, TableName, ColumnName>;
  readonly tableColumnDefnSqlTextSupplier: <
    TableName extends string,
    ColumnName extends string,
  >(
    ctx: TableColumnDefinitionContext<Context, TableName, ColumnName>,
    options?: t.SqlTextEmitOptions,
  ) => string;
}

export interface StorageContext {
  // deno-lint-ignore no-explicit-any
  readonly storageFactories: StorageFactoriesSupplier<any>;
}

export interface TableDefinitionSupplier<
  Context extends StorageContext,
  TableName extends string,
  ColumnName extends string,
> {
  readonly tableDefn: TableDefinition<Context, TableName, ColumnName>;
}

export interface TableColumnNameSupplier<ColumnName extends string> {
  readonly columnName: ColumnName;
}

export interface TableColumnPrimaryKeySupplier {
  readonly isPrimaryKey: boolean;
}

export interface ForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
> {
  readonly foreignKeyTableColDefn: (
    columnName?: ColumnName,
    options?: Partial<TableColumnNullabilitySupplier>,
  ) => TableColumnDefinition<ColumnName>;
}

export interface TableColumnForeignKeySupplier<
  Context extends StorageContext,
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

export interface TableColumnNullabilitySupplier {
  readonly isNullable: boolean;
}

export interface TableColumnDataTypeSupplier<SqlType, TsType> {
  readonly sqlDataType: SqlType;
  readonly tsDataType: safety.TypeGuard<TsType>;
}

export interface TableColumnDeclareWeightSupplier {
  readonly declarationWeight: number;
}

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

export interface TableColumnDefinitionSupplier<ColumnName extends string> {
  readonly tableColumnDefn: TableColumnDefinition<ColumnName>;
}

export type TableDefinitionContext<
  Context extends StorageContext,
  TableName extends string,
  ColumnName extends string,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName>;

export type TableColumnDefinitionContext<
  Context extends StorageContext,
  TableName extends string,
  ColumnName extends string,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName>
  & TableColumnDefinitionSupplier<ColumnName>;

export interface TableDefinition<
  Context extends StorageContext,
  TableName extends string,
  ColumnName extends string,
> extends t.SqlTextSupplier<Context> {
  readonly tableName: TableName;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition<ColumnName>[];
  readonly decorators: t.SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName>
  >[];
}

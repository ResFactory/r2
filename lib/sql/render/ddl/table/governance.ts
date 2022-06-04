import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as l from "../../lint.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export interface TableColumnCreateSqlTextSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends
  tmpl.SqlTextSupplier<
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly foreignKey:
    & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
    & {
      tableColumnDefn:
        & TableColumnNameSupplier<ColumnName>
        // deno-lint-ignore no-explicit-any
        & TableColumnDataTypeSupplier<any, EmitOptions>;
    };
}

export interface TableColumnNullabilitySupplier {
  readonly isNullable: boolean;
}

export interface TableColumnDataTypeSupplier<
  TsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> {
  readonly sqlDataType: tmpl.SqlTextSupplier<Any, EmitOptions>;
  readonly tsType: {
    readonly tsCodeGenEmit: string;
    readonly tsCodeGenDeclare?: string[];
    readonly typeGuard: safety.TypeGuard<TsType>;
  };
}

export interface TableColumnValueSupplier<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly columnDdlDefault: tmpl.SqlTextSupplier<Context, EmitOptions>;
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<number, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  ForeignKeyTableColumnDefnFactory<ColumnName, EmitOptions>,
  TableColumnDmlContributionsSupplier {
}

export interface TableIntegerColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<number, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableDateTimeColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<Date, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableCreationStampColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<Date, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  TableColumnDmlContributionsSupplier {
}

export interface TableTextColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<string, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier>,
  Partial<TableColumnPrimaryKeySupplier> {
}

export interface TableJsonColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> extends
  TableColumnNameSupplier<ColumnName>,
  TableColumnDataTypeSupplier<Record<string, unknown>, EmitOptions>,
  TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>,
  Partial<TableColumnNullabilitySupplier> {
}

export type TableColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> =
  & TableColumnNameSupplier<ColumnName>
  & TableColumnCreateSqlTextSupplier<Any, Any, ColumnName, EmitOptions>;

export interface TableColumnDefinitionSupplier<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Any>,
> {
  readonly tableColumnDefn: TableColumnDefinition<ColumnName, EmitOptions>;
}

export type TableDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>;

export type TableColumnDefinitionContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> =
  & Context
  & TableDefinitionSupplier<Context, TableName, ColumnName, EmitOptions>
  & TableColumnDefinitionSupplier<ColumnName, EmitOptions>;

export interface TableDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly tableName: TableName;
  readonly isTemp?: boolean;
  readonly isIdempotent?: boolean;
  readonly columns: TableColumnDefinition<ColumnName, EmitOptions>[];
  readonly decorators: tmpl.SqlTextSupplier<
    TableDefinitionContext<Context, TableName, ColumnName, EmitOptions>,
    EmitOptions
  >[];
}

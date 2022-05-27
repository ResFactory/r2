import { events } from "../deps.ts";
import * as safety from "../../../safety/mod.ts";
import * as govn from "./governance.ts";
import * as t from "../text.ts";
import * as tr from "../../../tabular/mod.ts";
import * as v from "../view.ts";

export function isTableColumnCreateSqlTextSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
>(
  o: unknown,
): o is govn.TableColumnCreateSqlTextSupplier<
  Context,
  TableName,
  ColumnName,
  EmitOptions
> {
  const isSTS = safety.typeGuard<
    govn.TableColumnCreateSqlTextSupplier<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >
  >("isTableColumnCreateSqlTextSupplier", "SQL");
  return isSTS(o);
}

export class TableColumnsFactoryEventEmitter<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends events.EventEmitter<{
  construct(column: govn.TableColumnDefinition<ColumnName, EmitOptions>): void;
}> {}

export interface TableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly autoIncPrimaryKey: (
    columnName: ColumnName,
    options?: Partial<govn.TableColumnNullabilitySupplier>,
  ) => govn.TableAutoIncPrimaryKeyColumnDefinition<ColumnName, EmitOptions>;
  readonly text: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableTextColumnDefinition<ColumnName, EmitOptions>;
  readonly integer: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableIntegerColumnDefinition<ColumnName, EmitOptions>;
  readonly dateTime: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableDateTimeColumnDefinition<ColumnName, EmitOptions>;
  readonly creationTimestamp: (
    columnName: ColumnName,
  ) => govn.TableCreationStampColumnDefinition<ColumnName, EmitOptions>;
  readonly JSON: (
    columnName: ColumnName,
    options?: Partial<govn.TableColumnNullabilitySupplier>,
  ) => govn.TableJsonColumnDefinition<ColumnName, EmitOptions>;
}

export interface TableDefnDecoratorsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
> {
  readonly unique: (...columnNames: ColumnName[]) => void;
}

export interface TableDefnFactoriesSupplier<
  Context,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
> {
  readonly tableColumnsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ) => TableColumnsFactory<Context, TableName, ColumnName, EmitOptions>;
  readonly tableDefnDecoratorsFactory: <
    TableName extends string,
    ColumnName extends string,
  >(
    tableDefn: govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ) => TableDefnDecoratorsFactory<Context, TableName, ColumnName>;
}

export function typicalTableColumnDefnSqlTextSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(): (
  ctx: govn.TableColumnDefinitionContext<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >,
  options?: t.SqlTextEmitOptions,
) => string {
  return (ctx, steOptions) => {
    const tCD = ctx.tableColumnDefn;
    const columnName = steOptions?.tableColumnName?.({
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

export function typicalTableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
): TableColumnsFactory<Context, TableName, ColumnName, EmitOptions> {
  const ttcdSTS = typicalTableColumnDefnSqlTextSupplier<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >();
  return {
    autoIncPrimaryKey: (columnName) => {
      const result:
        & govn.TableAutoIncPrimaryKeyColumnDefinition<ColumnName, EmitOptions>
        & govn.TableColumnNullabilitySupplier
        & govn.TableColumnPrimaryKeySupplier = {
          columnName: columnName,
          sqlDataType: "INTEGER",
          tsDataType: safety.typeGuard<number>(),
          isPrimaryKey: true,
          isNullable: false,
          isTableColumnCreateSqlTextSupplier: true,
          SQL: (ctx, steOptions) => {
            return `${ttcdSTS(ctx, steOptions)} AUTOINCREMENT`;
          },
          foreignKeyTableColDefn: (foreignColumnName, options) => {
            const fkeyTableColDefnResult:
              & govn.TableIntegerColumnDefinition<ColumnName, EmitOptions>
              & govn.TableColumnForeignKeySupplier<
                Context,
                // deno-lint-ignore no-explicit-any
                any,
                ColumnName,
                EmitOptions
              > = {
                columnName: foreignColumnName ?? columnName,
                sqlDataType: "INTEGER",
                tsDataType: safety.typeGuard<number>(),
                isNullable: options?.isNullable ?? false,
                foreignKey: {
                  tableDefn,
                  tableColumnDefn: result,
                },
                isTableColumnCreateSqlTextSupplier: true,
                SQL: ttcdSTS,
              };
            return fkeyTableColDefnResult;
          },
          sqlDmlContributions: {
            isInInsertColumnsList: () => false,
            isInUpdateColumnsList: () => false,
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
        isTableColumnCreateSqlTextSupplier: true,
        SQL: ttcdSTS,
      };
    },
    dateTime: (columnName, options) => {
      const result: govn.TableDateTimeColumnDefinition<
        ColumnName,
        EmitOptions
      > = {
        columnName: columnName,
        sqlDataType: "DATETIME",
        tsDataType: safety.typeGuard<Date>(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL: ttcdSTS,
      };
      return result;
    },
    creationTimestamp: (columnName) => {
      const result:
        & govn.TableCreationStampColumnDefinition<ColumnName, EmitOptions>
        & govn.TableColumnDeclareWeightSupplier = {
          columnName: columnName,
          sqlDataType: "DATETIME",
          tsDataType: safety.typeGuard<Date>(),
          declarationWeight: 99,
          isTableColumnCreateSqlTextSupplier: true,
          SQL: (ctx, steOptions) => {
            return `${ttcdSTS(ctx, steOptions)} DEFAULT CURRENT_TIMESTAMP`;
          },
          sqlDmlContributions: {
            isInInsertColumnsList: () => false,
            isInUpdateColumnsList: () => false,
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
        isTableColumnCreateSqlTextSupplier: true,
        SQL: ttcdSTS,
      };
    },
    JSON: (columnName, options) => {
      return {
        columnName: columnName,
        sqlDataType: "JSON",
        tsDataType: safety.typeGuard<Record<string, unknown>>(),
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL: ttcdSTS,
      };
    },
  };
}

export function typicalTableDefnDecoratorsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
): TableDefnDecoratorsFactory<Context, TableName, ColumnName> {
  return {
    unique: (...columnNames) => {
      tableDefn.decorators.push({
        SQL: (_ctx, steOptions) =>
          `UNIQUE(${
            columnNames.map((cn) =>
              steOptions?.tableColumnName?.({
                tableName: tableDefn.tableName,
                columnName: cn,
              }) ?? cn
            ).join(", ")
          })`,
      });
    },
  };
}

export const isTableColumnNameSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  govn.TableColumnNameSupplier<any>
>("columnName");

export const isTableColumnPrimaryKeySupplier = safety.typeGuard<
  govn.TableColumnPrimaryKeySupplier
>("isPrimaryKey");

export function isForeignKeyTableColumnDefnFactory<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  o: unknown,
): o is govn.ForeignKeyTableColumnDefnFactory<ColumnName, EmitOptions> {
  const isTCFKF = safety.typeGuard<
    govn.ForeignKeyTableColumnDefnFactory<ColumnName, EmitOptions>
  >("foreignKeyTableColDefn");
  return isTCFKF(o);
}

export function isTableColumnForeignKeySupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  o: unknown,
): o is govn.TableColumnForeignKeySupplier<
  Context,
  TableName,
  ColumnName,
  EmitOptions
> {
  const isFKS = safety.typeGuard<
    govn.TableColumnForeignKeySupplier<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >
  >("foreignKey");
  return isFKS(o);
}

export const isTableColumnDeclareWeightSupplier = safety.typeGuard<
  govn.TableColumnDeclareWeightSupplier
>("declarationWeight");

export const isTableColumnNullabilitySupplier = safety.typeGuard<
  govn.TableColumnNullabilitySupplier
>("isNullable");

export const isTableColumnDataTypeSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  govn.TableColumnDataTypeSupplier<any, any>
>("sqlDataType", "tsDataType");

export function isTableColumnDefinition<
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  o: unknown,
): o is govn.TableColumnDefinition<ColumnName, EmitOptions> {
  const isCD = safety.typeGuard<
    govn.TableColumnDefinition<ColumnName, EmitOptions>
  >(
    "columnName",
  );
  return isCD(o);
}

export const isTableColumnDmlContributions = safety.typeGuard<
  govn.TableColumnDmlContributions
>("isInInsertColumnsList", "isInUpdateColumnsList");

export const isTableColumnDmlContributionsSupplier = safety.typeGuard<
  govn.TableColumnDmlContributionsSupplier
>("sqlDmlContributions");

export function isTableDefinition<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  o: unknown,
): o is govn.TableDefinition<Context, TableName, ColumnName, EmitOptions> {
  const isCTR = safety.typeGuard<
    govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>
  >(
    "tableName",
    "columns",
  );
  return isCTR(o);
}

export class TableDefnEventEmitter<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends events.EventEmitter<{
  preparedTableColumn(
    column: govn.TableColumnDefinition<ColumnName, EmitOptions>,
    tableDefn: govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ): void;
  registeredTableColumn(
    column: govn.TableColumnDefinition<ColumnName, EmitOptions>,
    tableDefn: govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ): void;
  populatedTableDefn(
    tableDefn: govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
    validColumnNames: ColumnName[],
  ): void;
}> {}

export interface DefineTableOptions<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly isTemp?: boolean;
  readonly isIdempotent: boolean;
  readonly prepareEvents?: (
    tdEE: TableDefnEventEmitter<Context, TableName, ColumnName, EmitOptions>,
  ) => TableDefnEventEmitter<Context, TableName, ColumnName, EmitOptions>;
}

export function typicalDefineTableOptions<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  options?:
    & Partial<DefineTableOptions<Context, TableName, ColumnName, EmitOptions>>
    & { readonly enforceForeignKeys?: boolean },
): DefineTableOptions<Context, TableName, ColumnName, EmitOptions> {
  return {
    isTemp: options?.isTemp,
    isIdempotent: options?.isIdempotent ?? true,
    prepareEvents: (tdEE) => {
      const { enforceForeignKeys = true } = options ?? {};
      if (enforceForeignKeys) {
        tdEE.on("registeredTableColumn", (c, tableDefn) => {
          if (isTableColumnForeignKeySupplier(c)) {
            tableDefn.decorators.push({
              SQL: (_ctx, steOptions) => {
                const tn = steOptions?.tableName;
                const cn = steOptions?.tableColumnName;
                return `FOREIGN KEY(${
                  cn?.({
                    tableName: tableDefn.tableName,
                    columnName: c.columnName,
                  }) ??
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
        });
      }

      options?.prepareEvents?.(tdEE);
      return tdEE;
    },
  };
}

export interface PopulateTableDefnContext<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly tdEE: TableDefnEventEmitter<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >;
  readonly tableDefn: govn.TableDefinition<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >;
  readonly columnsFactory: TableColumnsFactory<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >;
  readonly decoratorsFactory: TableDefnDecoratorsFactory<
    Context,
    TableName,
    ColumnName
  >;
  readonly ctx: Context;
}

export interface TableDefnPopulator<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  (
    defineColumns: (
      ...column: govn.TableColumnDefinition<ColumnName, EmitOptions>[]
    ) => void,
    init: PopulateTableDefnContext<Context, TableName, ColumnName, EmitOptions>,
  ): void;
}

export function staticTableDefn<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
  populateTableDefn?: TableDefnPopulator<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >,
  options?: DefineTableOptions<Context, TableName, ColumnName, EmitOptions>,
): govn.TableDefinition<Context, TableName, ColumnName, EmitOptions> {
  const {
    isTemp,
    isIdempotent,
    prepareEvents = (
      tdEE: TableDefnEventEmitter<Context, TableName, ColumnName, EmitOptions>,
    ) => tdEE,
  } = options ?? { isIdempotent: true };
  const tdEE = prepareEvents(
    new TableDefnEventEmitter<Context, TableName, ColumnName, EmitOptions>(),
  );
  const columns: govn.TableColumnDefinition<ColumnName, EmitOptions>[] = [];
  const decorators: t.SqlTextSupplier<
    govn.TableDefinitionContext<Context, TableName, ColumnName, EmitOptions>,
    EmitOptions
  >[] = [];
  const tableDefn:
    & govn.TableDefinition<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >
    & t.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
      tableName,
      isIdempotent,
      columns,
      decorators,
      populateSqlTextLintIssues: (lintIssues) => {
        for (const vcn of validColumnNames) {
          const columnDefn = columns.find((c) => c.columnName == vcn);
          if (columnDefn) {
            if (
              !isTableColumnCreateSqlTextSupplier<
                Context,
                TableName,
                ColumnName,
                EmitOptions
              >(columnDefn)
            ) {
              const lintIssue: govn.TableLintIssue<TableName> = {
                tableName,
                lintIssue:
                  `column '${vcn}' has a defn but is not a TableColumnCreateSqlTextSupplier`,
              };
              lintIssues.push(lintIssue);
            }
          } else {
            const lintIssue: govn.TableLintIssue<TableName> = {
              tableName,
              lintIssue:
                `column '${vcn}' declared but not defined in createTable(${tableName})`,
            };
            lintIssues.push(lintIssue);
          }
        }
      },
      SQL: (sqlCtx, steOptions) => {
        const columnDefns: string[] = [];
        const tableCtx:
          & Context
          & govn.TableDefinitionSupplier<
            Context,
            TableName,
            ColumnName,
            EmitOptions
          > = {
            ...sqlCtx,
            tableDefn: tableDefn,
          };
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
          if (
            isTableColumnCreateSqlTextSupplier<
              Context,
              TableName,
              ColumnName,
              EmitOptions
            >(c)
          ) {
            columnDefns.push(
              c.SQL({ ...tableCtx, tableColumnDefn: c }, steOptions),
            );
          }
        }
        const indent = steOptions?.indentation?.("define table column");
        const decoratorsSQL = tableCtx.tableDefn.decorators.map((sts) =>
          sts.SQL(tableCtx, steOptions)
        ).join(",\n");

        // deno-fmt-ignore
        const result = `${steOptions?.indentation?.("create table") ?? ''}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${steOptions?.tableName?.(tableName) ?? tableName} (\n` +
        columnDefns.join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n)";
        return result;
      },
    };
  populateTableDefn?.((...columns) => {
    for (const column of columns) {
      tdEE.emitSync("preparedTableColumn", column, tableDefn);
      tableDefn.columns.push(column);
      tdEE.emitSync("registeredTableColumn", column, tableDefn);
    }
  }, {
    tableDefn,
    columnsFactory: tdfs.tableColumnsFactory(tableDefn),
    decoratorsFactory: tdfs.tableDefnDecoratorsFactory(
      tableDefn,
    ),
    ctx,
    tdEE,
  });
  tdEE.emitSync("populatedTableDefn", tableDefn, validColumnNames);
  return tableDefn;
}

export function typicalStaticTableDefn<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
  options: DefineTableOptions<Context, TableName, ColumnName, EmitOptions> =
    typicalDefineTableOptions(),
) {
  return (
    populateTableDefn: TableDefnPopulator<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ) => {
    let primaryKeyColDefn: govn.TableAutoIncPrimaryKeyColumnDefinition<
      `${TableName}_id`,
      EmitOptions
    >;
    const tableDefn = staticTableDefn(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, `created_at`],
      tdfs,
      (defineColumns, init) => {
        const { columnsFactory: cf } = init;
        primaryKeyColDefn = cf.autoIncPrimaryKey(
          `${tableName}_id`,
        ) as govn.TableAutoIncPrimaryKeyColumnDefinition<
          `${TableName}_id`,
          EmitOptions
        >;
        defineColumns(primaryKeyColDefn);
        populateTableDefn(
          defineColumns,
          // deno-lint-ignore no-explicit-any
          init as any, // TODO: figure out why cast to any is required
        );
        defineColumns(cf.creationTimestamp(`created_at`));
      },
      options,
    );
    // we use ! after primaryKeyColDefn because linter thinks it's not set but we know it is
    return { tableDefn, primaryKeyColDefn: primaryKeyColDefn! };
  };
}

export function typicalTableDefnDML<
  InsertableRecord extends tr.UntypedTabularRecordObject,
  Context,
  TableName extends string,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
  ColumnName extends keyof InsertableRecord & string =
    & keyof InsertableRecord
    & string,
  InsertableObject extends tr.TabularRecordToObject<InsertableRecord> =
    tr.TabularRecordToObject<InsertableRecord>,
  UpdatableRecord extends Partial<InsertableRecord> = Partial<InsertableRecord>,
  UpdatableObject extends tr.TabularRecordToObject<UpdatableRecord> =
    tr.TabularRecordToObject<UpdatableRecord>,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
  options: DefineTableOptions<Context, TableName, ColumnName, EmitOptions> =
    typicalDefineTableOptions(),
) {
  return (
    populateTableDefn: TableDefnPopulator<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
  ) => {
    let primaryKeyColDefn: govn.TableAutoIncPrimaryKeyColumnDefinition<
      `${TableName}_id`,
      EmitOptions
    >;
    const createdAtColName = `created_at`;
    const tableDefn = staticTableDefn(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, createdAtColName],
      tdfs,
      (defineColumns, init) => {
        const { columnsFactory: cf } = init;
        primaryKeyColDefn = cf.autoIncPrimaryKey(
          `${tableName}_id`,
        ) as govn.TableAutoIncPrimaryKeyColumnDefinition<
          `${TableName}_id`,
          EmitOptions
        >;
        defineColumns(primaryKeyColDefn);
        populateTableDefn(
          defineColumns,
          // deno-lint-ignore no-explicit-any
          init as any, // TODO: figure out why cast to any is required
        );
        defineColumns(cf.creationTimestamp(createdAtColName));
      },
      options,
    );
    // we use ! after primaryKeyColDefn because linter thinks it's not set but we know it is
    return {
      tableDefn,
      primaryKeyColDefn: primaryKeyColDefn!,
      prepareInsert: (
        o: InsertableObject,
        rowState?: tr.TransformTabularRecordsRowState<InsertableRecord>,
        options?: tr.TransformTabularRecordOptions<InsertableRecord>,
      ) => tr.transformTabularRecord(o, rowState, options),
      prepareUpdate: (
        o: UpdatableObject,
        rowState?: tr.TransformTabularRecordsRowState<UpdatableRecord>,
        options?: tr.TransformTabularRecordOptions<UpdatableRecord>,
      ) => tr.transformTabularRecord(o, rowState, options),
      insertDML: (
        o: InsertableObject,
        insertDmlOptions?: {
          readonly emitColumnNames?: (
            record: InsertableRecord,
            steOptions?: t.SqlTextEmitOptions,
          ) => string[];
          readonly emitColumnValue?: (
            colName: ColumnName,
            record: InsertableRecord,
            steOptions?: t.SqlTextEmitOptions,
          ) => [value: unknown, sqlText: string];
          readonly prepareSqlText?: (
            record: InsertableRecord,
            names: string[],
            values: [value: unknown, sqlText: string][],
          ) => string;
        },
      ): t.SqlTextSupplier<Context, EmitOptions> => {
        return {
          SQL: (_, steOptions) => {
            const {
              emitColumnNames = (
                record: InsertableRecord,
                steOptions?: t.SqlTextEmitOptions,
              ) => {
                const result = Object.keys(record).filter((cn) => {
                  const c = tableDefn.columns.find((c) => c.columnName == cn);
                  return isTableColumnDmlContributionsSupplier(c)
                    ? c.sqlDmlContributions.isInInsertColumnsList(record)
                    : true;
                });
                if (steOptions?.tableColumnName) {
                  return result.map((cn) =>
                    steOptions!.tableColumnName!({ tableName, columnName: cn })
                  );
                }
                return result;
              },
              emitColumnValue = (
                colName: ColumnName,
                record: InsertableRecord,
              ) => {
                const value = record[colName];
                if (typeof value === "undefined") return [value, "NULL"];
                if (typeof value === "string") {
                  return [value, `'${value.replaceAll("'", "''")}'`];
                }
                return [value, String(value)];
              },
              prepareSqlText = (
                _record: InsertableRecord,
                names: string[],
                values: [value: unknown, sqlText: string][],
              ) =>
                `INSERT INTO ${
                  steOptions?.tableName?.(tableName) ?? tableName
                } (${names.join(", ")}) VALUES (${
                  values.map((value) => value[1]).join(", ")
                })`,
            } = insertDmlOptions ?? {};
            const record = tr.transformTabularRecord<
              InsertableRecord,
              InsertableObject
            >(o);
            const names = emitColumnNames(record);
            const values = names.map((colName) =>
              emitColumnValue(colName as ColumnName, record)
            );
            return prepareSqlText(record, names, values);
          },
        };
      },
    };
  };
}

export function tableDefnViewWrapper<
  Context,
  ViewName extends string,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions = t.SqlTextEmitOptions,
>(
  _ctx: Context,
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
  viewName: ViewName,
  factory: v.ViewDefnFactory<Context, EmitOptions>,
  options?: v.ViewDefnOptions<Context, ViewName, ColumnName, EmitOptions>,
) {
  const selectColumnNames = options?.viewColumns
    ? options?.viewColumns
    : tableDefn.columns.map((c) => c.columnName);
  const selectColumnNamesSS: t.SqlTextSupplier<Context, EmitOptions> = {
    SQL: (_, steOptions) =>
      (steOptions?.tableColumnName
        ? selectColumnNames.map((cn) =>
          steOptions!.tableColumnName!({
            tableName: tableDefn.tableName,
            columnName: cn,
          })
        )
        : selectColumnNames).join(", "),
  };
  const tableNameSS: t.SqlTextSupplier<Context, EmitOptions> = {
    SQL: (_, steOptions) =>
      steOptions?.tableName?.(tableDefn.tableName) ?? tableDefn.tableName,
  };
  return factory.sqlViewStrTmplLiteral<ViewName, ColumnName>(
    viewName,
    options,
  )`SELECT ${selectColumnNamesSS}\nFROM ${tableNameSS}`;
}

import { events } from "../../deps.ts";
import * as safety from "../../../../safety/mod.ts";
import * as govn from "./governance.ts";
import * as tmpl from "../../template/mod.ts";
import * as tr from "../../../../tabular/mod.ts";
import * as vw from "../view.ts";
import * as ets from "../../template/emittable-typescript.ts";
import * as d from "../domain.ts";

// TODO:
// * [ ] in foreign key columns allow ON DELETE CASCADE like
//       FOREIGN KEY("userID") REFERENCES "users"("id") ON DELETE CASCADE

export function isTableColumnCreateSqlTextSupplier<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends events.EventEmitter<{
  construct(column: govn.TableColumnDefinition<ColumnName, EmitOptions>): void;
}> {}

export interface TableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(): (
  ctx: govn.TableColumnDefinitionContext<
    Context,
    TableName,
    ColumnName,
    EmitOptions
  >,
  options: tmpl.SqlTextEmitOptions<Context>,
) => string {
  return (ctx, steOptions) => {
    const tCD = ctx.tableColumnDefn;
    const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
    const columnName = ns.tableColumnName({
      tableName: ctx.tableDefn.tableName,
      columnName: ctx.tableColumnDefn.columnName,
    });
    const sqlDataType = isTableColumnDataTypeSupplier(tCD)
      ? ` ${tCD.sqlDataType.SQL(ctx, steOptions)}`
      : "";
    const primaryKey = isTableColumnPrimaryKeySupplier(tCD)
      ? tCD.isPrimaryKey ? " PRIMARY KEY" : ""
      : "";
    const notNull = primaryKey.length == 0
      ? isTableColumnNullabilitySupplier(tCD)
        ? tCD.isNullable ? "" : " NOT NULL"
        : ""
      : "";
    const defaultValue = isTableColumnDefaultValueSupplier(tCD)
      ? ` DEFAULT ${tCD.columnDdlDefault?.SQL(ctx, steOptions)}`
      : "";
    // deno-fmt-ignore
    return `${steOptions.indentation("define table column")}${columnName}${sqlDataType}${primaryKey}${notNull}${defaultValue}`;
  };
}

export function typicalTableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
): TableColumnsFactory<Context, TableName, ColumnName, EmitOptions> {
  const SQL = typicalTableColumnDefnSqlTextSupplier<
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
          ...d.integer(),
          isPrimaryKey: true,
          isNullable: false,
          isTableColumnCreateSqlTextSupplier: true,
          SQL: (ctx, steOptions) => {
            return `${SQL(ctx, steOptions)} AUTOINCREMENT`;
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
                ...d.integer(),
                isNullable: options?.isNullable ?? false,
                foreignKey: {
                  tableDefn,
                  tableColumnDefn: result,
                },
                isTableColumnCreateSqlTextSupplier: true,
                SQL,
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
        ...d.integer(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL,
      };
    },
    dateTime: (columnName, options) => {
      const result: govn.TableDateTimeColumnDefinition<
        ColumnName,
        EmitOptions
      > = {
        columnName: columnName,
        sqlDataType: { SQL: () => `DATETIME` },
        tsType: { tsCodeGenEmit: "Date", typeGuard: safety.typeGuard<Date>() },
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL,
      };
      return result;
    },
    creationTimestamp: (columnName) => {
      const result:
        & govn.TableCreationStampColumnDefinition<ColumnName, EmitOptions>
        & govn.TableColumnDeclareWeightSupplier
        & govn.TableColumnValueSupplier<Context, EmitOptions> = {
          columnName: columnName,
          sqlDataType: { SQL: () => `DATETIME` },
          tsType: {
            tsCodeGenEmit: "Date",
            typeGuard: safety.typeGuard<Date>(),
          },
          declarationWeight: 99,
          isTableColumnCreateSqlTextSupplier: true,
          SQL,
          columnDdlDefault: { SQL: () => `CURRENT_TIMESTAMP` },
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
        ...d.text(),
        isPrimaryKey: options?.isPrimaryKey ?? false,
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL,
      };
    },
    JSON: (columnName, options) => {
      return {
        columnName: columnName,
        sqlDataType: { SQL: () => `JSON` },
        tsType: {
          tsCodeGenEmit: "UnknownJSON",
          tsCodeGenDeclare: [`export type UnknownJSON = string;`],
          typeGuard: safety.typeGuard<Record<string, unknown>>(),
        },
        isNullable: options?.isNullable ?? false,
        isTableColumnCreateSqlTextSupplier: true,
        SQL,
      };
    },
  };
}

export function typicalTableDefnDecoratorsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
): TableDefnDecoratorsFactory<Context, TableName, ColumnName> {
  return {
    unique: (...columnNames) => {
      tableDefn.decorators.push({
        SQL: (ctx, steOptions) =>
          `UNIQUE(${
            columnNames.map((cn) =>
              steOptions.namingStrategy(ctx, { quoteIdentifiers: true })
                .tableColumnName?.({
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
  EmitOptions extends tmpl.SqlTextEmitOptions<govn.Any>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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

export const isTableColumnDefaultValueSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  govn.TableColumnValueSupplier<any, any>
>("columnDdlDefault");

export const isTableColumnDataTypeSupplier = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  govn.TableColumnDataTypeSupplier<any, any>
>("sqlDataType", "tsType");

export function isTableColumnDefinition<
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<govn.Any>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
              SQL: (ctx, steOptions) => {
                const ns = steOptions.namingStrategy(ctx, {
                  quoteIdentifiers: true,
                });
                const tn = ns.tableName;
                const cn = ns.tableColumnName;
                return `FOREIGN KEY(${
                  cn({
                    tableName: tableDefn.tableName,
                    columnName: c.columnName,
                  })
                }) REFERENCES ${tn(c.foreignKey.tableDefn.tableName)}(${
                  cn({
                    tableName: c.foreignKey.tableDefn.tableName,
                    columnName: c.foreignKey.tableColumnDefn.columnName,
                  })
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  const decorators: tmpl.SqlTextSupplier<
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
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
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
        const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
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
        const indent = steOptions.indentation("define table column");
        const decoratorsSQL = tableCtx.tableDefn.decorators.map((sts) =>
          sts.SQL(tableCtx, steOptions)
        ).join(",\n");

        // deno-fmt-ignore
        const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
  InsertableColumnName extends keyof InsertableRecord & string =
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
  validColumnNames: InsertableColumnName[],
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
  options: DefineTableOptions<
    Context,
    TableName,
    InsertableColumnName,
    EmitOptions
  > = typicalDefineTableOptions(),
) {
  return (
    populateTableDefn: TableDefnPopulator<
      Context,
      TableName,
      InsertableColumnName,
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
      prepareInsertable: (
        o: InsertableObject,
        rowState?: tr.TransformTabularRecordsRowState<InsertableRecord>,
        options?: tr.TransformTabularRecordOptions<InsertableRecord>,
      ) => tr.transformTabularRecord(o, rowState, options),
      prepareUpdatable: (
        o: UpdatableObject,
        rowState?: tr.TransformTabularRecordsRowState<UpdatableRecord>,
        options?: tr.TransformTabularRecordOptions<UpdatableRecord>,
      ) => tr.transformTabularRecord(o, rowState, options),
      insertDML: ets.typicalInsertStmtPreparer<
        Context,
        TableName,
        `${TableName}_id`,
        InsertableRecord,
        InsertableRecord,
        EmitOptions
      >(tableName, validColumnNames, [`${tableName}_id`]),
    };
  };
}

export function tableDefnViewWrapper<
  Context,
  ViewName extends string,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(
  _ctx: Context,
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
  viewName: ViewName,
  factory: vw.ViewDefnFactory<Context, EmitOptions>,
  options?: vw.ViewDefnOptions<Context, ViewName, ColumnName, EmitOptions>,
) {
  const selectColumnNames = options?.viewColumns
    ? options?.viewColumns
    : tableDefn.columns.map((c) => c.columnName);
  const selectColumnNamesSS: tmpl.SqlTextSupplier<Context, EmitOptions> = {
    SQL: (ctx, steOptions) =>
      selectColumnNames.map((cn) =>
        steOptions.namingStrategy(ctx, { quoteIdentifiers: true })
          .tableColumnName({
            tableName: tableDefn.tableName,
            columnName: cn,
          })
      ).join(", "),
  };
  const tableNameSS: tmpl.SqlTextSupplier<Context, EmitOptions> = {
    SQL: (ctx, steOptions) =>
      steOptions.namingStrategy(ctx, { quoteIdentifiers: true }).tableName?.(
        tableDefn.tableName,
      ) ??
        tableDefn.tableName,
  };
  return factory.sqlViewStrTmplLiteral<ViewName, ColumnName>(
    viewName,
    options,
  )`SELECT ${selectColumnNamesSS}\nFROM ${tableNameSS}`;
}

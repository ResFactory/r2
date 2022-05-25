import * as safety from "../../../safety/mod.ts";
import * as govn from "./governance.ts";
import * as l from "../lint.ts";
import * as t from "../text.ts";
import * as tr from "../../../tabular/mod.ts";
import * as v from "../view.ts";

export interface TableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
> {
  readonly autoIncPrimaryKey: (
    columnName: ColumnName,
    options?: Partial<govn.TableColumnNullabilitySupplier>,
  ) => govn.TableAutoIncPrimaryKeyColumnDefinition<ColumnName>;
  readonly text: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableTextColumnDefinition<ColumnName>;
  readonly integer: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableIntegerColumnDefinition<ColumnName>;
  readonly dateTime: (
    columnName: ColumnName,
    options?:
      & Partial<govn.TableColumnNullabilitySupplier>
      & Partial<govn.TableColumnPrimaryKeySupplier>,
  ) => govn.TableDateTimeColumnDefinition<ColumnName>;
  readonly creationTimestamp: (
    columnName: ColumnName,
  ) => govn.TableCreationStampColumnDefinition<ColumnName>;
  readonly JSON: (
    columnName: ColumnName,
    options?: Partial<govn.TableColumnNullabilitySupplier>,
  ) => govn.TableJsonColumnDefinition<ColumnName>;
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
  EmitOptions extends t.SqlTextEmitOptions,
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
  ) => TableColumnsFactory<Context, TableName, ColumnName>;
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
  readonly tableColumnDefnSqlTextSupplier: <
    TableName extends string,
    ColumnName extends string,
  >(
    ctx: govn.TableColumnDefinitionContext<
      Context,
      TableName,
      ColumnName,
      EmitOptions
    >,
    options?: t.SqlTextEmitOptions,
  ) => string;
}

export function typicalTableColumnsFactory<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  tableDefn: govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>,
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
): TableColumnsFactory<Context, TableName, ColumnName> {
  return {
    autoIncPrimaryKey: (columnName) => {
      const result:
        & govn.TableAutoIncPrimaryKeyColumnDefinition<ColumnName>
        & govn.TableColumnNullabilitySupplier
        & govn.TableColumnPrimaryKeySupplier
        & t.SqlTextSupplier<
          govn.TableColumnDefinitionContext<
            Context,
            TableName,
            ColumnName,
            EmitOptions
          >,
          EmitOptions
        > = {
          columnName: columnName,
          sqlDataType: "INTEGER",
          tsDataType: safety.typeGuard<number>(),
          isPrimaryKey: true,
          isNullable: false,
          SQL: (ctx, steOptions) => {
            return `${
              tdfs.tableColumnDefnSqlTextSupplier(ctx, steOptions)
            } AUTOINCREMENT`;
          },
          foreignKeyTableColDefn: (foreignColumnName, options) => {
            const fkeyTableColDefnResult:
              & govn.TableIntegerColumnDefinition<ColumnName>
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
      };
    },
    dateTime: (columnName, options) => {
      const result: govn.TableDateTimeColumnDefinition<ColumnName> = {
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
        & govn.TableCreationStampColumnDefinition<ColumnName>
        & govn.TableColumnDeclareWeightSupplier
        & t.SqlTextSupplier<
          govn.TableColumnDefinitionContext<
            Context,
            TableName,
            ColumnName,
            EmitOptions
          >,
          EmitOptions
        > = {
          columnName: columnName,
          sqlDataType: "DATETIME",
          tsDataType: safety.typeGuard<Date>(),
          declarationWeight: 99,
          SQL: (ctx, steOptions) => {
            return `${
              tdfs.tableColumnDefnSqlTextSupplier(ctx, steOptions)
            } DEFAULT CURRENT_TIMESTAMP`;
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
>(
  o: unknown,
): o is govn.ForeignKeyTableColumnDefnFactory<ColumnName> {
  const isTCFKF = safety.typeGuard<
    govn.ForeignKeyTableColumnDefnFactory<ColumnName>
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

export function isTableColumnDefinition<ColumnName extends string>(
  o: unknown,
): o is govn.TableColumnDefinition<ColumnName> {
  const isCD = safety.typeGuard<govn.TableColumnDefinition<ColumnName>>(
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

export interface DefineTableOptions {
  readonly isTemp?: boolean;
  readonly isIdempotent: boolean;
  readonly enforceForeignKeyRefs:
    | false
    | "table-decorator"; /* TODO: | "alter-table" */
}

export interface DefineTableInit<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> {
  readonly tableDefn:
    & govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>
    & l.SqlLintIssuesSupplier
    & {
      readonly finalizeDefn: () => void;
      readonly registerLintIssues: (
        ...slis: l.SqlLintIssueSupplier[]
      ) => void;
    };
  readonly columnsFactory: TableColumnsFactory<
    Context,
    TableName,
    ColumnName
  >;
  readonly decoratorsFactory: TableDefnDecoratorsFactory<
    Context,
    TableName,
    ColumnName
  >;
  readonly ctx: Context;
}

export interface TableLintIssue<TableName extends string>
  extends l.SqlLintIssueSupplier {
  readonly tableName: TableName;
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
  defineTable?: (
    init: DefineTableInit<Context, TableName, ColumnName, EmitOptions>,
  ) => void,
  options?: DefineTableOptions,
): govn.TableDefinition<Context, TableName, ColumnName, EmitOptions> {
  const { isTemp, isIdempotent } = options ?? { isIdempotent: true };
  const columns: govn.TableColumnDefinition<ColumnName>[] = [];
  const decorators: t.SqlTextSupplier<
    govn.TableDefinitionContext<Context, TableName, ColumnName, EmitOptions>,
    EmitOptions
  >[] = [];
  const lintIssues: l.SqlLintIssueSupplier[] = [];
  const tableDefn:
    & govn.TableDefinition<Context, TableName, ColumnName, EmitOptions>
    & l.SqlLintIssuesSupplier
    & {
      finalizeDefn: () => void;
      registerLintIssues: (...slis: l.SqlLintIssueSupplier[]) => void;
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
          & govn.TableDefinitionSupplier<
            Context,
            TableName,
            ColumnName,
            EmitOptions
          > = {
            ...sqlCtx,
            tableDefn: tableDefn,
          };
        const ttcdSTS = tdfs.tableColumnDefnSqlTextSupplier;
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
          const columnDefnSQL = t.isSqlTextSupplier<Context, EmitOptions>(c)
            ? c.SQL
            : ttcdSTS;
          columnDefns.push(
            columnDefnSQL({ ...tableCtx, tableColumnDefn: c }, steOptions),
          );
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
                  const cn = steOptions?.tableColumnName;
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
    columnsFactory: tdfs.tableColumnsFactory(tableDefn),
    decoratorsFactory: tdfs.tableDefnDecoratorsFactory(
      tableDefn,
    ),
    ctx,
  });
  return tableDefn;
}

export function typicalStaticTableDefn<
  Context,
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  ctx: Context,
  tableName: TableName,
  validColumnNames: ColumnName[],
  tdfs: TableDefnFactoriesSupplier<Context, EmitOptions>,
  options: DefineTableOptions = {
    isIdempotent: true,
    enforceForeignKeyRefs: "table-decorator",
  },
) {
  return (
    customDefineTable?: (
      defineColumns: (
        ...column: govn.TableColumnDefinition<ColumnName>[]
      ) => void,
      init: DefineTableInit<Context, TableName, ColumnName, EmitOptions>,
    ) => void,
  ) => {
    let primaryKeyColDefn: govn.TableAutoIncPrimaryKeyColumnDefinition<
      `${TableName}_id`
    >;
    const tableDefn = staticTableDefn(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, `created_at`],
      tdfs,
      (init) => {
        const { tableDefn, columnsFactory: cf } = init;
        primaryKeyColDefn = cf.autoIncPrimaryKey(
          `${tableName}_id`,
        ) as govn.TableAutoIncPrimaryKeyColumnDefinition<`${TableName}_id`>;
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

export function typicalTableDefnDML<
  InsertableRecord extends tr.UntypedTabularRecordObject,
  Context,
  TableName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
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
  options: DefineTableOptions = {
    isIdempotent: true,
    enforceForeignKeyRefs: "table-decorator",
  },
) {
  return (
    customDefineTable?: (
      defineColumns: (
        ...column: govn.TableColumnDefinition<ColumnName>[]
      ) => void,
      init: DefineTableInit<Context, TableName, ColumnName, EmitOptions>,
    ) => void,
  ) => {
    let primaryKeyColDefn: govn.TableAutoIncPrimaryKeyColumnDefinition<
      `${TableName}_id`
    >;
    const createdAtColName = `created_at`;
    const tableDefn = staticTableDefn(
      ctx,
      tableName,
      [`${tableName}_id`, ...validColumnNames, createdAtColName],
      tdfs,
      (init) => {
        const { tableDefn, columnsFactory: cf } = init;
        primaryKeyColDefn = cf.autoIncPrimaryKey(
          `${tableName}_id`,
        ) as govn.TableAutoIncPrimaryKeyColumnDefinition<`${TableName}_id`>;
        tableDefn.columns.push(primaryKeyColDefn);
        customDefineTable?.(
          (...columns) => {
            tableDefn.columns.push(...columns);
          },
          // deno-lint-ignore no-explicit-any
          init as any, // TODO: figure out why cast to any is required
        );
        tableDefn.columns.push(cf.creationTimestamp(createdAtColName));
        tableDefn.finalizeDefn();
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
  EmitOptions extends t.SqlTextEmitOptions,
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

import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as tmpl from "../template/mod.ts";
import * as tr from "../../../tabular/mod.ts";
import * as dml from "../dml/mod.ts";
import * as vw from "./view.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export type TablePrimaryKeyColumnDefn<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
  readonly isPrimaryKey: true;
  readonly isAutoIncrement: boolean;
};

export function isTablePrimaryKeyColumnDefn<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is TablePrimaryKeyColumnDefn<ColumnTsType, EmitOptions, Context> {
  const isTPKCD = safety.typeGuard<
    TablePrimaryKeyColumnDefn<ColumnTsType, EmitOptions, Context>
  >("isPrimaryKey", "isAutoIncrement");
  return isTPKCD(o);
}

export type TableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
  readonly isExcludedFromInsertDML: true;
};

export function isTableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is TableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  EmitOptions,
  Context
> {
  const isIDES = safety.typeGuard<
    TableColumnInsertDmlExclusionSupplier<ColumnTsType, EmitOptions, Context>
  >("isExcludedFromInsertDML");
  return isIDES(o);
}

export function primaryKey<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context>,
): TablePrimaryKeyColumnDefn<ColumnTsType, EmitOptions, Context> {
  return {
    ...axiom,
    isPrimaryKey: true,
    isAutoIncrement: false,
    sqlPartial: (dest) => {
      if (dest === "create table, column defn decorators") {
        const ctcdd = axiom?.sqlPartial?.(
          "create table, column defn decorators",
        );
        const decorators: tmpl.SqlTextSupplier<Context, EmitOptions> = {
          SQL: () => `PRIMARY KEY`,
        };
        return ctcdd ? [decorators, ...ctcdd] : [decorators];
      }
      return axiom.sqlPartial?.(dest);
    },
  };
}

export function autoIncPrimaryKey<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context>,
):
  & TablePrimaryKeyColumnDefn<ColumnTsType, EmitOptions, Context>
  & TableColumnInsertDmlExclusionSupplier<ColumnTsType, EmitOptions, Context> {
  return {
    ...axiom,
    isPrimaryKey: true,
    isExcludedFromInsertDML: true,
    isAutoIncrement: true,
    sqlPartial: (dest) => {
      if (dest === "create table, column defn decorators") {
        const ctcdd = axiom?.sqlPartial?.(
          "create table, column defn decorators",
        );
        const decorators: tmpl.SqlTextSupplier<Context, EmitOptions> = {
          SQL: () => `PRIMARY KEY AUTOINCREMENT`,
        };
        return ctcdd ? [decorators, ...ctcdd] : [decorators];
      }
      return axiom.sqlPartial?.(dest);
    },
  };
}

export type TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
  readonly foreignTableName: ForeignTableName;
  readonly foreignDomain: d.AxiomSqlDomain<
    ColumnTsType,
    EmitOptions,
    Context
  >;
};

export function isTableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName,
  EmitOptions,
  Context
> {
  const isTFKCD = safety.typeGuard<
    TableForeignKeyColumnDefn<
      ColumnTsType,
      ForeignTableName,
      EmitOptions,
      Context
    >
  >("foreignTableName", "foreignDomain");
  return isTFKCD(o);
}

export function foreignKey<
  ColumnTsType,
  ForeignTableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  foreignTableName: ForeignTableName,
  foreignDomain: d.AxiomSqlDomain<
    ColumnTsType,
    EmitOptions,
    Context
  >,
): TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName,
  EmitOptions,
  Context
> {
  const domain = foreignDomain.referenceASD();
  const result: TableForeignKeyColumnDefn<
    ColumnTsType,
    ForeignTableName,
    EmitOptions,
    Context
  > = {
    foreignTableName,
    foreignDomain,
    ...domain,
    sqlPartial: (dest) => {
      if (dest === "create table, after all column definitions") {
        const aacd = domain?.sqlPartial?.(
          "create table, after all column definitions",
        );
        const unique: tmpl.SqlTextSupplier<Context, EmitOptions> = {
          SQL: d.isIdentifiableSqlDomain(result)
            ? ((ctx, steOptions) => {
              const ns = steOptions.namingStrategy(ctx, {
                quoteIdentifiers: true,
              });
              const tn = ns.tableName;
              const cn = ns.tableColumnName;
              return `FOREIGN KEY(${
                cn({
                  tableName: "TODO",
                  columnName: result.identity,
                })
              }) REFERENCES ${tn(foreignTableName)}(${
                cn({
                  tableName: foreignTableName,
                  columnName: d.isIdentifiableSqlDomain(foreignDomain)
                    ? foreignDomain.identity
                    : "/* FOREIGN KEY REFERENCE is not IdentifiableSqlDomain */",
                })
              })`;
            })
            : (() => {
              console.dir(result);
              return `/* FOREIGN KEY sqlPartial in "create table, after all column definitions" is not IdentifiableSqlDomain */`;
            }),
        };
        return aacd ? [...aacd, unique] : [unique];
      }
      return domain.sqlPartial?.(dest);
    },
  };
  return result;
}

export type TableUniqueColumnDefn<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
  readonly isUnique: true;
};

export function unique<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context>,
): TableUniqueColumnDefn<ColumnTsType, EmitOptions, Context> {
  const result: TableUniqueColumnDefn<ColumnTsType, EmitOptions, Context> = {
    ...axiom,
    sqlPartial: (dest) => {
      if (dest === "create table, after all column definitions") {
        const aacd = axiom?.sqlPartial?.(
          "create table, after all column definitions",
        );
        const unique: tmpl.SqlTextSupplier<Context, EmitOptions> = {
          SQL: d.isIdentifiableSqlDomain(result)
            ? ((ctx, steOptions) => {
              const ns = steOptions.namingStrategy(ctx, {
                quoteIdentifiers: true,
              });
              return `UNIQUE(${
                ns.tableColumnName({
                  tableName: "TODO",
                  columnName: result.identity,
                })
              })`;
            })
            : (() => {
              console.dir(result);
              return `/* UNIQUE sqlPartial in "create table, after all column definitions" is not IdentifiableSqlDomain */`;
            }),
        };
        return aacd ? [...aacd, unique] : [unique];
      }
      return axiom.sqlPartial?.(dest);
    },
    isUnique: true,
  };
  return result;
}

export function typicalTableColumnDefnSQL<
  TableName extends string,
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  tableName: TableName,
  isd: d.IdentifiableSqlDomain<Any, EmitOptions, Context, ColumnName>,
): tmpl.RenderedSqlText<Context, EmitOptions> {
  return (ctx, steOptions) => {
    const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
    const columnName = ns.tableColumnName({
      tableName,
      columnName: isd.identity,
    });
    let sqlDataType = isd.sqlDataType("create table column").SQL(
      ctx,
      steOptions,
    );
    if (sqlDataType) sqlDataType = " " + sqlDataType;
    const decorations = isd.sqlPartial?.(
      "create table, column defn decorators",
    );
    const decoratorsSQL = decorations
      ? ` ${decorations.map((d) => d.SQL(ctx, steOptions)).join(" ")}`
      : "";
    const notNull = decoratorsSQL.length == 0
      ? isd.isNullable ? "" : " NOT NULL"
      : "";
    const defaultValue = isd.sqlDefaultValue
      ? ` DEFAULT ${
        isd.sqlDefaultValue("create table column").SQL(ctx, steOptions)
      }`
      : "";
    // deno-fmt-ignore
    return `${steOptions.indentation("define table column")}${columnName}${sqlDataType}${decoratorsSQL}${notNull}${defaultValue}`;
  };
}

export type TableIdentityColumnName<TableName extends string> =
  `${TableName}_id`;

export type TableIdentityColumnsSupplier<
  TableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  TableIdColumnName extends TableIdentityColumnName<TableName> =
    TableIdentityColumnName<TableName>,
> = {
  [K in keyof TableName as TableIdColumnName]: d.AxiomSqlDomain<
    number,
    EmitOptions,
    Context
  >;
};

export type HousekeepingColumnsDefns<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = {
  readonly created_at: d.AxiomSqlDomain<Date | undefined, EmitOptions, Context>;
};

export function housekeeping<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): HousekeepingColumnsDefns<EmitOptions, Context> {
  return {
    created_at: d.dateTimeNullable(undefined, {
      sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
    }),
  };
}

export type TableDefinition<
  TableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = tmpl.SqlTextSupplier<Context, EmitOptions> & {
  readonly tableName: TableName;
};

export function isTableDefinition<
  TableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is TableDefinition<TableName, EmitOptions, Context> {
  const isTD = safety.typeGuard<
    TableDefinition<TableName, EmitOptions, Context>
  >("tableName", "SQL");
  return isTD(o);
}

export interface TableDefnOptions<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> {
  readonly isIdempotent?: boolean;
  readonly isTemp?: boolean;
  readonly sqlPartial?: (
    destination: "after all column definitions",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>[] | undefined;
  readonly onPropertyNotAxiomSqlDomain?: (
    name: string,
    axiom: ax.Axiom<Any>,
    domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
  ) => void;
}

export function tableDefinition<
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  tableName: TableName,
  props: TPropAxioms,
  tdOptions?: TableDefnOptions<EmitOptions, Context>,
) {
  const columnDefnsSS: tmpl.SqlTextSupplier<Context, EmitOptions>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context, EmitOptions>[] = [];
  const sd = d.sqlDomains(props, tdOptions);
  for (const columnDefn of sd.domains) {
    const typicalSQL = typicalTableColumnDefnSQL(tableName, columnDefn);
    if (columnDefn.sqlPartial) {
      const acdPartial = columnDefn.sqlPartial(
        "create table, after all column definitions",
      );
      if (acdPartial) afterColumnDefnsSS.push(...acdPartial);

      const ctcPartial = columnDefn.sqlPartial(
        "create table, full column defn",
      );
      if (ctcPartial) {
        columnDefnsSS.push(...ctcPartial);
      } else {
        columnDefnsSS.push({ SQL: typicalSQL });
      }
    } else {
      columnDefnsSS.push({ SQL: typicalSQL });
    }
  }

  type PrimaryKeys = {
    [
      Property in keyof TPropAxioms as Extract<
        Property,
        TPropAxioms[Property] extends { isPrimaryKey: true } ? Property
          : never
      >
    ]: TablePrimaryKeyColumnDefn<
      ax.AxiomMappedPrimitive<TPropAxioms, Property>,
      EmitOptions,
      Context
    >;
  };
  const primaryKey: PrimaryKeys = {} as Any;
  for (const column of sd.domains) {
    if (isTablePrimaryKeyColumnDefn(column)) {
      primaryKey[column.identity as (keyof PrimaryKeys)] = column as Any;
    }
  }

  // ESSENTIAL TODO: see d.AxiomPrimitive; do we need to "manually" compute the
  // TsType through conditional types or can we infer it from ax.Axiom<?>
  type ForeignKeyRefs = {
    [Property in keyof TPropAxioms]: () => TableForeignKeyColumnDefn<
      ax.AxiomMappedPrimitive<TPropAxioms, Property>,
      TableName,
      EmitOptions,
      Context
    >;
  };
  const fkRef: ForeignKeyRefs = {} as Any;
  for (const column of sd.domains) {
    fkRef[column.identity as (keyof TPropAxioms)] = () => {
      return foreignKey(tableName, column);
    };
  }

  const result: TableDefinition<TableName, EmitOptions, Context> & {
    primaryKey: PrimaryKeys;
    foreignKeyRef: ForeignKeyRefs;
  } = {
    tableName,
    SQL: (ctx, steOptions) => {
      const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
      const indent = steOptions.indentation("define table column");
      const afterCDs =
        tdOptions?.sqlPartial?.("after all column definitions") ?? [];
      const decoratorsSQL = [...afterColumnDefnsSS, ...afterCDs].map((sts) =>
        sts.SQL(ctx, steOptions)
      ).join(`,\n${indent}`);

      const { isTemp, isIdempotent } = tdOptions ?? {};
      // deno-fmt-ignore
      const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx, steOptions)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n)";
      return result;
    },
    primaryKey,
    foreignKeyRef: fkRef,
  };

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    ...sd,
    ...result,
  };
}

export function tableDefnRowFactory<
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  tableName: TableName,
  props: TPropAxioms,
  tdrfOptions?: TableDefnOptions<EmitOptions, Context>,
) {
  const tableDefn = tableDefinition(tableName, props, tdrfOptions);

  type EntireRecord =
    & tr.UntypedTabularRecordObject
    & ax.AxiomType<typeof tableDefn>;
  type ExcludeFromInsert = {
    [
      Property in keyof TPropAxioms as Extract<
        Property,
        TPropAxioms[Property] extends { isExcludedFromInsertDML: true }
          ? Property
          : never
      >
    ]: true;
  };
  type ExcludePropertyName = Extract<
    keyof EntireRecord,
    keyof ExcludeFromInsert
  >;
  type InsertableRecord = Omit<EntireRecord, ExcludePropertyName>;
  type InsertableColumnName = keyof InsertableRecord & string;
  type InsertableObject = tr.TabularRecordToObject<InsertableRecord>;

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    ...tableDefn,
    prepareInsertable: (
      o: InsertableObject,
      rowState?: tr.TransformTabularRecordsRowState<InsertableRecord>,
      options?: tr.TransformTabularRecordOptions<InsertableRecord>,
    ) => tr.transformTabularRecord(o, rowState, options),
    insertDML: dml.typicalInsertStmtPreparer<
      Context,
      TableName,
      InsertableRecord,
      EntireRecord,
      EmitOptions
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return tableDefn.domains.filter((d) =>
            isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as InsertableColumnName[];
        }
        return tableDefn.domains.filter((d) =>
          isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        ).map((d) => d.identity) as InsertableColumnName[];
      },
    ),
  };
}

export function tableDefnViewWrapper<
  ViewName extends string,
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  viewName: ViewName,
  tableName: TableName,
  props: TPropAxioms,
  options?: vw.ViewDefnOptions<
    ViewName,
    keyof TPropAxioms & string,
    EmitOptions,
    Context
  >,
) {
  const tableDefn = tableDefinition(tableName, props);
  const selectColumnNames = tableDefn.domains.map((d) => d.identity);
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
  return vw.viewDefinition(viewName, props, options)`
    SELECT ${selectColumnNamesSS}
      FROM ${tableNameSS}`;
}

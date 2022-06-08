import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as tmpl from "../template/mod.ts";
import * as tr from "../../../tabular/mod.ts";
import * as ets from "../template/emittable-typescript.ts";

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

export function primaryKey<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context>,
  pkOptions?: {
    readonly isAutoIncrement?: boolean;
  },
): TablePrimaryKeyColumnDefn<ColumnTsType, EmitOptions, Context> {
  const { isAutoIncrement = true } = pkOptions ?? {};
  return {
    ...axiom,
    isPrimaryKey: true,
    isAutoIncrement,
    sqlPartial: (dest) => {
      if (dest === "create table, column defn decorators") {
        const ctcdd = axiom?.sqlPartial?.(
          "create table, column defn decorators",
        );
        const decorators: tmpl.SqlTextSupplier<Context, EmitOptions> = {
          SQL: () => `PRIMARY KEY${isAutoIncrement ? " AUTOINCREMENT" : ""}`,
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

// export function tableIdentity<
//   TableName extends string,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   TableIdColumnName extends TableIdentityColumnName<TableName> =
//   TableIdentityColumnName<TableName>,
//   >(tableName: TableName): TableIdentityColumnsSupplier<TableName, EmitOptions, Context> {
//   return {
//     [`${tableName}_id` as string as TableIdColumnName]: primaryKey<number, EmitOptions, Context>(d.integer()),
//   };
// }

export type HousekeepingColumnsDefns<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = {
  readonly created_at: d.AxiomSqlDomain<Date, EmitOptions, Context>;
};

export function housekeeping<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): HousekeepingColumnsDefns<EmitOptions, Context> {
  return {
    created_at: d.dateTime(undefined, {
      sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
    }),
  };
}

export type TableDefnition<
  TableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = tmpl.SqlTextSupplier<Context, EmitOptions> & {
  readonly tableName: TableName;
};

export function isTableDefnition<
  TableName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is TableDefnition<TableName, EmitOptions, Context> {
  const isTD = safety.typeGuard<
    TableDefnition<TableName, EmitOptions, Context>
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

  const result: TableDefnition<TableName, EmitOptions, Context> = {
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

  type InsertableRecord =
    & tr.UntypedTabularRecordObject
    & ax.AxiomType<typeof tableDefn>;
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
    insertDML: ets.typicalInsertStmtPreparer<
      Context,
      TableName,
      string,
      InsertableRecord,
      InsertableRecord,
      EmitOptions
    >(
      tableName,
      tableDefn.domains.map((d) => d.identity) as InsertableColumnName[],
      tableDefn.domains.filter((d) =>
        isTablePrimaryKeyColumnDefn(d) ? true : false
      ).map((d) => d.identity),
    ),
  };
}

import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as tmpl from "../template/mod.ts";
import * as tr from "../../../tabular/mod.ts";
import * as dml from "../dml/mod.ts";
import * as vw from "./view.ts";
import * as ss from "../dql/select.ts";
import * as ns from "../namespace.ts";
import * as js from "../js.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easier on Deno linting

export type TablePrimaryKeyColumnDefn<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
> = d.AxiomSqlDomain<ColumnTsType, Context> & {
  readonly isPrimaryKey: true;
  readonly isAutoIncrement: boolean;
};

export function isTablePrimaryKeyColumnDefn<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TablePrimaryKeyColumnDefn<ColumnTsType, Context> {
  const isTPKCD = safety.typeGuard<
    TablePrimaryKeyColumnDefn<ColumnTsType, Context>
  >("isPrimaryKey", "isAutoIncrement");
  return isTPKCD(o);
}

export type TableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
> = d.AxiomSqlDomain<ColumnTsType, Context> & {
  readonly isExcludedFromInsertDML: true;
};

export function isTableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableColumnInsertDmlExclusionSupplier<
  ColumnTsType,
  Context
> {
  const isIDES = safety.typeGuard<
    TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context>
  >("isExcludedFromInsertDML");
  return isIDES(o);
}

export function primaryKey<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, Context>,
): TablePrimaryKeyColumnDefn<ColumnTsType, Context> {
  return {
    ...axiom,
    isPrimaryKey: true,
    isAutoIncrement: false,
    sqlPartial: (dest) => {
      if (dest === "create table, column defn decorators") {
        const ctcdd = axiom?.sqlPartial?.(
          "create table, column defn decorators",
        );
        const decorators: tmpl.SqlTextSupplier<Context> = {
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
  Context extends tmpl.SqlEmitContext,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, Context>,
):
  & TablePrimaryKeyColumnDefn<ColumnTsType, Context>
  & TableColumnInsertDmlExclusionSupplier<ColumnTsType, Context> {
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
        const decorators: tmpl.SqlTextSupplier<Context> = {
          SQL: () => `PRIMARY KEY AUTOINCREMENT`,
        };
        return ctcdd ? [decorators, ...ctcdd] : [decorators];
      }
      return axiom.sqlPartial?.(dest);
    },
  };
}

export type TableBelongsToForeignKeyRelNature<
  Context extends tmpl.SqlEmitContext,
> = {
  readonly isBelongsToRel: true;
  readonly collectionName?: js.JsTokenSupplier<Context>;
};

export type TableForeignKeyRelNature<Context extends tmpl.SqlEmitContext> =
  | TableBelongsToForeignKeyRelNature<Context>
  | { readonly isExtendsRel: true }
  | { readonly isSelfRef: true }
  | { readonly isInheritsRel: true };

export function belongsTo<
  Context extends tmpl.SqlEmitContext,
>(
  singularSnakeCaseCollName?: string,
  pluralSnakeCaseCollName = singularSnakeCaseCollName
    ? `${singularSnakeCaseCollName}s`
    : undefined,
): TableBelongsToForeignKeyRelNature<Context> {
  return {
    isBelongsToRel: true,
    collectionName: singularSnakeCaseCollName
      ? js.jsSnakeCaseToken(
        singularSnakeCaseCollName,
        pluralSnakeCaseCollName,
      )
      : undefined,
  };
}

export function isTableBelongsToForeignKeyRelNature<
  Context extends tmpl.SqlEmitContext,
>(o: unknown): o is TableBelongsToForeignKeyRelNature<Context> {
  const isTBFKRN = safety.typeGuard<TableBelongsToForeignKeyRelNature<Context>>(
    "isBelongsToRel",
    "collectionName",
  );
  return isTBFKRN(o);
}

export type TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName extends string,
  Context extends tmpl.SqlEmitContext,
> = d.AxiomSqlDomain<ColumnTsType, Context> & {
  readonly foreignTableName: ForeignTableName;
  readonly foreignDomain: d.AxiomSqlDomain<
    ColumnTsType,
    Context
  >;
  readonly foreignRelNature?: TableForeignKeyRelNature<Context>;
};

export function isTableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName,
  Context
> {
  const isTFKCD = safety.typeGuard<
    TableForeignKeyColumnDefn<
      ColumnTsType,
      ForeignTableName,
      Context
    >
  >("foreignTableName", "foreignDomain");
  return isTFKCD(o);
}

export function foreignKey<
  ColumnTsType,
  ForeignTableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  foreignTableName: ForeignTableName,
  foreignDomain: d.AxiomSqlDomain<
    ColumnTsType,
    Context
  >,
  foreignRelNature?: TableForeignKeyRelNature<Context>,
): TableForeignKeyColumnDefn<
  ColumnTsType,
  ForeignTableName,
  Context
> {
  const domain = foreignDomain.referenceASD();
  const result: TableForeignKeyColumnDefn<
    ColumnTsType,
    ForeignTableName,
    Context
  > = {
    foreignTableName,
    foreignDomain,
    foreignRelNature,
    ...domain,
    sqlPartial: (dest) => {
      if (dest === "create table, after all column definitions") {
        const aacd = domain?.sqlPartial?.(
          "create table, after all column definitions",
        );
        const unique: tmpl.SqlTextSupplier<Context> = {
          SQL: d.isIdentifiableSqlDomain(result)
            ? ((ctx) => {
              const ns = ctx.sqlNamingStrategy(ctx, {
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
  Context extends tmpl.SqlEmitContext,
> = d.AxiomSqlDomain<ColumnTsType, Context> & {
  readonly isUnique: true;
};

export function unique<
  ColumnTsType,
  Context extends tmpl.SqlEmitContext,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, Context>,
): TableUniqueColumnDefn<ColumnTsType, Context> {
  const result: TableUniqueColumnDefn<ColumnTsType, Context> = {
    ...axiom,
    sqlPartial: (dest) => {
      if (dest === "create table, after all column definitions") {
        const aacd = axiom?.sqlPartial?.(
          "create table, after all column definitions",
        );
        const unique: tmpl.SqlTextSupplier<Context> = {
          SQL: d.isIdentifiableSqlDomain(result)
            ? ((ctx) => {
              const ns = ctx.sqlNamingStrategy(ctx, {
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
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  isd: d.IdentifiableSqlDomain<Any, Context, ColumnName>,
): tmpl.RenderedSqlText<Context> {
  return (ctx) => {
    const { sqlTextEmitOptions: steOptions } = ctx;
    const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
    const columnName = ns.tableColumnName({
      tableName,
      columnName: isd.identity,
    });
    let sqlDataType = isd.sqlDataType("create table column").SQL(ctx);
    if (sqlDataType) sqlDataType = " " + sqlDataType;
    const decorations = isd.sqlPartial?.(
      "create table, column defn decorators",
    );
    const decoratorsSQL = decorations
      ? ` ${decorations.map((d) => d.SQL(ctx)).join(" ")}`
      : "";
    const notNull = decoratorsSQL.length == 0
      ? isd.isNullable ? "" : " NOT NULL"
      : "";
    const defaultValue = isd.sqlDefaultValue
      ? ` DEFAULT ${isd.sqlDefaultValue("create table column").SQL(ctx)}`
      : "";
    // deno-fmt-ignore
    return `${steOptions.indentation("define table column")}${columnName}${sqlDataType}${decoratorsSQL}${notNull}${defaultValue}`;
  };
}

export type TableIdentityColumnName<TableName extends string> =
  `${TableName}_id`;

export type TableIdentityColumnsSupplier<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
  TableIdColumnName extends TableIdentityColumnName<TableName> =
    TableIdentityColumnName<TableName>,
> = {
  [K in keyof TableName as TableIdColumnName]: d.AxiomSqlDomain<
    number,
    Context
  >;
};

export type TableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplier<Context> & {
  readonly tableName: TableName;
};

export function isTableDefinition<
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is TableDefinition<TableName, Context> {
  const isTD = safety.typeGuard<
    TableDefinition<TableName, Context>
  >("tableName", "SQL");
  return isTD(o);
}

export interface TableDefnOptions<
  Context extends tmpl.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
  readonly isTemp?: boolean;
  readonly sqlPartial?: (
    destination: "after all column definitions",
  ) => tmpl.SqlTextSupplier<Context>[] | undefined;
  readonly onPropertyNotAxiomSqlDomain?: (
    name: string,
    axiom: ax.Axiom<Any>,
    domains: d.IdentifiableSqlDomain<Any, Context>[],
  ) => void;
  readonly sqlNS?: ns.SqlNamespaceSupplier;
}

export function tableDefinition<
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: TPropAxioms,
  tdOptions?: TableDefnOptions<Context>,
) {
  const columnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
  const afterColumnDefnsSS: tmpl.SqlTextSupplier<Context>[] = [];
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
      TPropAxioms[Property] extends ax.Axiom<infer T> ? T : never,
      Context
    >;
  };
  const primaryKey: PrimaryKeys = {} as Any;
  for (const column of sd.domains) {
    if (isTablePrimaryKeyColumnDefn(column)) {
      primaryKey[column.identity as (keyof PrimaryKeys)] = column as Any;
    }
  }

  type ForeignKeyRefs = {
    [Property in keyof TPropAxioms]: (
      foreignRelNature?: TableForeignKeyRelNature<Context>,
    ) => TableForeignKeyColumnDefn<
      TPropAxioms[Property] extends ax.Axiom<infer T> ? T : never,
      TableName,
      Context
    >;
  };
  const fkRef: ForeignKeyRefs = {} as Any;
  for (const column of sd.domains) {
    fkRef[column.identity as (keyof TPropAxioms)] = (foreignRelNature) => {
      return foreignKey(tableName, column, foreignRelNature);
    };
  }

  const result: TableDefinition<TableName, Context> & {
    readonly primaryKey: PrimaryKeys;
    readonly foreignKeyRef: ForeignKeyRefs;
    readonly sqlNS?: ns.SqlNamespaceSupplier;
  } = {
    tableName,
    SQL: (ctx) => {
      const { sqlTextEmitOptions: steOptions } = ctx;
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
        qnss: tdOptions?.sqlNS,
      });
      const indent = steOptions.indentation("define table column");
      const afterCDs =
        tdOptions?.sqlPartial?.("after all column definitions") ?? [];
      const decoratorsSQL = [...afterColumnDefnsSS, ...afterCDs].map((sts) =>
        sts.SQL(ctx)
      ).join(`,\n${indent}`);

      const { isTemp, isIdempotent } = tdOptions ?? {};
      // deno-fmt-ignore
      const result = `${steOptions.indentation("create table")}CREATE ${isTemp ? 'TEMP ' : ''}TABLE ${isIdempotent ? "IF NOT EXISTS " : ""}${ns.tableName(tableName)} (\n` +
        columnDefnsSS.map(cdss => cdss.SQL(ctx)).join(",\n") +
        (decoratorsSQL.length > 0 ? `,\n${indent}${decoratorsSQL}` : "") +
        "\n)";
      return result;
    },
    primaryKey,
    foreignKeyRef: fkRef,
    sqlNS: tdOptions?.sqlNS,
  };

  // we let Typescript infer function return to allow generics in sqlDomains to
  // be more effective but we want other parts of the `result` to be as strongly
  // typed as possible
  return {
    ...sd,
    ...result,
  };
}

export function typicalKeysTableDefinition<
  TableName extends string,
  TPropAxioms extends
    & Record<string, ax.Axiom<Any>>
    & Record<`${TableName}_id`, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: TPropAxioms,
  tdOptions?: TableDefnOptions<Context>,
) {
  return tableDefinition(tableName, props, tdOptions);
}

export function tableDomainsRowFactory<
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  props: TPropAxioms,
  tdrfOptions?: TableDefnOptions<Context> & {
    defaultIspOptions?: dml.InsertStmtPreparerOptions<
      TableName,
      Any,
      Any,
      Context
    >;
  },
) {
  const sd = d.sqlDomains(props, tdrfOptions);

  type EntireRecord =
    & tr.UntypedTabularRecordObject
    & ax.AxiomType<typeof sd>;
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
    prepareInsertable: (
      o: InsertableObject,
      rowState?: tr.TransformTabularRecordsRowState<InsertableRecord>,
      options?: tr.TransformTabularRecordOptions<InsertableRecord>,
    ) => tr.transformTabularRecord(o, rowState, options),
    insertDML: dml.typicalInsertStmtPreparer<
      TableName,
      InsertableRecord,
      EntireRecord,
      Context
    >(
      tableName,
      (group) => {
        if (group === "primary-keys") {
          return sd.domains.filter((d) =>
            isTablePrimaryKeyColumnDefn(d) ? true : false
          ).map((d) => d.identity) as InsertableColumnName[];
        }
        return sd.domains.filter((d) =>
          isTableColumnInsertDmlExclusionSupplier(d) &&
            d.isExcludedFromInsertDML
            ? false
            : true
        ).map((d) => d.identity) as InsertableColumnName[];
      },
      tdrfOptions?.defaultIspOptions,
    ),
  };
}

export function tableDomainsViewWrapper<
  ViewName extends string,
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  viewName: ViewName,
  tableName: TableName,
  props: TPropAxioms,
  tdvwOptions?:
    & vw.ViewDefnOptions<
      ViewName,
      keyof TPropAxioms & string,
      Context
    >
    & {
      readonly onPropertyNotAxiomSqlDomain?: (
        name: string,
        axiom: ax.Axiom<Any>,
        domains: d.IdentifiableSqlDomain<Any, Context>[],
      ) => void;
    },
) {
  const sd = d.sqlDomains(props, tdvwOptions);
  const selectColumnNames = sd.domains.map((d) => d.identity);
  const select: tmpl.SqlTextSupplier<Context> = {
    SQL: (ctx) => {
      const ns = ctx.sqlNamingStrategy(ctx, {
        quoteIdentifiers: true,
      });
      return `SELECT ${
        selectColumnNames.map((cn) =>
          ns.tableColumnName({
            tableName,
            columnName: cn,
          })
        ).join(", ")
      }\n  FROM ${ns.tableName(tableName)}`;
    },
  };
  const selectStmt: ss.Select<ViewName, Context> = {
    isValid: true,
    selectStmt: select,
    ...select,
    ...sd,
  };
  // views use render/dql/select.ts Select statements and they must
  // start with the literal word SELECT; TODO: fix this?
  return vw.safeViewDefinitionCustom(viewName, props, selectStmt, tdvwOptions);
}

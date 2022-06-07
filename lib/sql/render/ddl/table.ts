import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as tmpl from "../template/mod.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

// export type TableColumnDefn<
//   TPropAxioms extends Record<string, ax.Axiom<Any>>,
//   ColumnTsType,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
// > = d.IdentifiableSqlDomain<ColumnTsType, EmitOptions, Context, ColumnName> & {
//   readonly columnName: ColumnName;
// };

// export type TablePrimaryKeyColumnDefn<
//   ColumnTsType,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   > = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
//     readonly isPrimaryKey: true;
//   };

export function primaryKey<
  ColumnTsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  axiom: d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context>,
) {
  return {
    ...axiom,
    isPrimaryKey: true,
  };
}

// export type TableForeignKeyColumnDefn<
//   ColumnTsType,
//   ForeignTableName extends string,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   > = d.AxiomSqlDomain<ColumnTsType, EmitOptions, Context> & {
//     readonly foreignTableName: ForeignTableName;
//     readonly foreignDomain: d.AxiomSqlDomain<
//       ColumnTsType,
//       EmitOptions,
//       Context
//     >;
//   };

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
) {
  return {
    foreignTableName,
    foreignDomain,
    ...foreignDomain.referenceASD(),
  };
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
  return {
    ...axiom,
    isUnique: true,
  };
}

export type TableNameSupplier<TableName extends string> = {
  readonly tableName: TableName;
};

// export type TableDefinition<
//   TableName extends string,
//   TPropAxioms extends Record<string, ax.Axiom<Any>>,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
// > = d.IdentifiableSqlDomains<TPropAxioms, EmitOptions, Context> & {
//   readonly tableName: TableName;
//   // readonly columns: Record<
//   //   ColumnName,
//   //   TableColumnDefn<TPropAxioms, Any, EmitOptions, Context>
//   // >;
// };

// export function isTableDefinition<
//   TableName extends string,
//   TPropAxioms extends Record<string, ax.Axiom<Any>>,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
//   >(o: unknown): o is TableDefinition<TableName, TPropAxioms, EmitOptions, Context> {
//   const isTD = safety.typeGuard<
//     TableDefinition<TableName, TPropAxioms, EmitOptions, Context>
//   >("tableName", "domains");
//   return isTD(o);
// }

export function table<
  TableName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  tableName: TableName,
  props: TPropAxioms,
  sdOptions?: {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: ax.Axiom<Any>,
      domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) {
  const sd = d.sqlDomains(props, sdOptions);
  const columnDefns = sd.domains.map((d) => ({ ...d, columnName: d.identity }));
  const columns: Record<string, unknown> = {};
  for (const cd of columnDefns) {
    columns[cd.columnName] = cd;
  }
  return {
    tableName,
    ...sd,
    // columns: columns as unknown as Record<
    //   keyof TPropAxioms & string,
    //   TableColumnDefn<TPropAxioms, Any, EmitOptions, Context>
    // >,
  };
}

// export type TypicalTablePrimaryKeyColName<TableName extends string> =
//   `${TableName}_id`;
// export type TypicalTablePrimaryKeySupplier<
//   TableName extends string,
//   Object,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
// > = {
//   readonly [columnName in `${TableName}_id`]: TableColumnDefn<
//     Object,
//     number,
//     EmitOptions,
//     Context
//   >;
// };
// export type TypicalTableHousekeepingSupplier<
//   TableName extends string,
//   Object,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
// > = {
//   readonly created_at: TableColumnDefn<Object, Date, EmitOptions, Context>;
// };
// export type TypicalTableObject<
//   TableName extends string,
//   Object,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
// > =
//   & Object
//   & TypicalTablePrimaryKeySupplier<TableName, Object, EmitOptions, Context>
//   & TypicalTableHousekeepingSupplier<TableName, Object, EmitOptions, Context>;

// export type TypicalTableDefinition<
//   TableName extends string,
//   Object,
//   EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
//   Context = Any,
// > = TableDefinition<
//   TableName,
//   TypicalTableObject<TableName, Object, EmitOptions, Context>,
//   EmitOptions,
//   Context
// >;

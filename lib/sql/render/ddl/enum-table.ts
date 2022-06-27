import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as d from "../domain.ts";
import * as tmpl from "../template/mod.ts";
import * as tbl from "./table.ts";

// deno-lint-ignore no-explicit-any
type Any = any; // make it easier on Deno linting

export interface EnumTableDefn {
  readonly enumTableNature: "text" | "numeric";
}

export const isEnumTableDefn = safety.typeGuard<EnumTableDefn>(
  "enumTableNature",
);

/**
 * Some of our tables will just have fixed ("seeded") values and act as
 * enumerations (lookup) with foreign key relationships.
 * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
 * and use type-safe enums
 * @param tableName the name of the enumeration table
 * @param seedEnum is enum whose list of values become the seed values of the lookup table
 * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
 */
export function enumTable<
  TEnumCode extends string,
  TEnumValue extends number,
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  seedEnum: { [key in TEnumCode]: TEnumValue },
  tdOptions?: tbl.TableDefnOptions<Context>,
) {
  const seedRows: {
    readonly code: number;
    readonly value: string;
  }[] = [];
  for (const e of Object.entries(seedEnum)) {
    const [key, value] = e;
    if (typeof value === "number") {
      // enums have numeric ids and reverse-mapped values as their keys
      // and we care only about the text keys ids, they point to codes
      const value = e[1] as TEnumValue;
      seedRows.push({ code: value, value: key });
    }
  }

  const props = {
    code: tbl.primaryKey(d.integer()),
    value: d.text(),
    created_at: d.createdAt(),
  };
  const tdrf = tbl.tableDomainsRowFactory(tableName, props, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "numeric" };
  return {
    ...etn,
    ...tbl.tableDefinition(tableName, props, tdOptions),
    ...tdrf,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
  };
}

/**
 * Some of our tables will just have fixed ("seeded") values and act as
 * enumerations (lookup) with foreign key relationships.
 * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
 * and use type-safe enums
 * @param tableName the name of the enumeration table
 * @param seedEnum is enum whose list of values become the seed values of the lookup table
 * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
 */
export function enumTextTable<
  TEnumCode extends string,
  TEnumValue extends string,
  TableName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  tableName: TableName,
  seedEnum: { [key in TEnumCode]: TEnumValue },
  tdOptions?: tbl.TableDefnOptions<Context>,
) {
  const seedRows: {
    readonly code: string;
    readonly value: string;
  }[] = [];
  for (const e of Object.entries(seedEnum)) {
    const code = e[0] as TEnumCode;
    const value = e[1] as TEnumValue;
    seedRows.push({ code, value });
  }
  const codeEnum = <
    TType extends readonly [TEnumCode, ...(readonly TEnumCode[])],
  >(
    ...values: TType
  ) =>
    ax.create((value): value is TType[number] =>
      values.includes(value as never)
    );
  const valueEnum = <
    TType extends readonly [TEnumValue, ...(readonly TEnumValue[])],
  >(
    ...values: TType
  ) =>
    ax.create((value): value is TType[number] =>
      values.includes(value as never)
    );

  const enumCodes = Object.keys(seedEnum) as unknown as TEnumCode[];
  const enumValues = Object.values(seedEnum) as unknown as TEnumValue[];

  const codeDomain = {
    ...codeEnum(enumCodes[0], ...enumCodes),
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: () => codeDomain,
  };

  const valueDomain = {
    ...valueEnum(enumValues[0], ...enumValues),
    sqlDataType: () => ({ SQL: () => `TEXT` }),
    isNullable: false,
    referenceASD: () => valueDomain,
  };

  const props = {
    code: tbl.primaryKey(codeDomain),
    value: valueDomain,
    created_at: d.createdAt(),
  };
  const tdrf = tbl.tableDomainsRowFactory(tableName, props, {
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    defaultIspOptions: {
      isColumnEmittable: (name) => name == "created_at" ? false : true,
    },
  });
  const etn: EnumTableDefn = { enumTableNature: "text" };
  return {
    ...etn,
    ...tbl.tableDefinition(tableName, props, tdOptions),
    ...tdrf,
    // seed will be used in SQL interpolation template literal, which accepts
    // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
    // case, if seed data is provided we'll prepare the insert DMLs as an
    // array of SqlTextSuppliers
    seedDML: seedRows && seedRows.length > 0
      ? seedRows.map((s) => tdrf.insertDML(s as Any))
      : `-- no ${tableName} seed rows`,
    seedEnum,
  };
}

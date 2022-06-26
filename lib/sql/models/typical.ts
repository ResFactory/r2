import * as safety from "../../safety/mod.ts";
import * as ax from "../../safety/axiom.ts";
import * as SQLa from "../render/mod.ts";
import * as erd from "../diagram/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type HousekeepingColumnsDefns<Context extends SQLa.SqlEmitContext> = {
  readonly created_at: SQLa.AxiomSqlDomain<Date | undefined, Context>;
};

export interface EnumTableDefn {
  readonly enumTableNature: "text" | "numeric";
}

export const isEnumTableDefn = safety.typeGuard<EnumTableDefn>(
  "enumTableNature",
);

/**
 * typicalModelsGovn is a "models governer" helpers object that supplies functions
 * for "typical" RDBMS schemas that prepare tables in a "governed" fashion with a
 * primary key named `<tableName>_id` and with standard "housekeeping" columns such
 * as `created_at`. This function can be used as-is if the models governance rules
 * are useful as-is or can be an exemplar in case the governance rules should be
 * different.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function typicalModelsGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions?: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  // TODO: convert this to a UUID to allow database row merging/syncing
  const primaryKey = () =>
    SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());

  function housekeeping<
    Context extends SQLa.SqlEmitContext,
  >(): HousekeepingColumnsDefns<Context> {
    return {
      created_at: SQLa.dateTimeNullable(undefined, {
        sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
      }),
    };
  }

  // "created_at" is considered "housekeeping" with a default so don't
  // emit it as part of the insert DML statement
  const defaultIspOptions: SQLa.InsertStmtPreparerOptions<
    Any,
    Any,
    Any,
    Context
  > = { isColumnEmittable: (name) => name == "created_at" ? false : true };

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "houskeeping" columns like created_at.
   * TODO: figure out how to automatically add ...housekeeping() to the end of
   * each table (it's easy to add at the start of each table, but we want them
   * at the end after all the "content" columns).
   * @param tableName
   * @param props
   * @returns
   */
  const table = <
    TableName extends string,
    TPropAxioms extends
      & Record<string, ax.Axiom<Any>>
      & Record<`${TableName}_id`, ax.Axiom<Any>>
      & HousekeepingColumnsDefns<Context>,
  >(
    tableName: TableName,
    props: TPropAxioms,
  ) => {
    return {
      ...SQLa.tableDefinition(tableName, props, {
        isIdempotent: true,
        sqlNS: ddlOptions?.sqlNS,
      }),
      ...SQLa.tableDomainsRowFactory(tableName, props, { defaultIspOptions }),
      view: SQLa.tableDomainsViewWrapper(
        `${tableName}_vw`,
        tableName,
        props,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };
  };

  const erdConfig: Partial<erd.PlantUmlIeOptions<Context>> = {
    elaborateEntityAttr: (d, td, entity, ns) => {
      let result = "";
      if (SQLa.isTableForeignKeyColumnDefn(d)) {
        const ftd = entity(d.foreignTableName);
        if (ftd) {
          result = isEnumTableDefn(ftd)
            ? ` <<ENUM(${ns.tableName(ftd.tableName)})>>`
            : ` <<FK(${ns.tableName(ftd.tableName)})>>`;
        } else {
          result = ` <<FK(${ns.tableName(d.foreignTableName)})>>`;
        }
        if (d.foreignTableName == td.tableName) result = " <<SELF>>";
      }
      return result;
    },
    relationshipIndicator: (edge) => {
      const refIsEnum = isEnumTableDefn(edge.ref.entity);
      // Relationship types see: https://plantuml.com/es/ie-diagram
      // Zero or One	|o--
      // Exactly One	||--
      // Zero or Many	}o--
      // One or Many	}|--
      return refIsEnum ? "|o..o|" : "|o..o{";
    },
  };

  return {
    primaryKey,
    housekeeping,
    table,
    defaultIspOptions,
    erdConfig,
  };
}

/**
 * typicalLookupsGovn is a "models governer" helpers object that provides the
 * same helper functions as typicalModelsGovn and adds functions for "typical"
 * lookup tables such as text or numeric emurations (code/value pairs).
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building enums)
 */
export function typicalLookupsGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions?: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const mg = typicalModelsGovn(ddlOptions);

  type TextLookupRecord = {
    readonly code: string;
    readonly value: string;
  };

  /**
   * Some of our tables will just have fixed ("seeded") values and act as
   * enumerations (lookup) with foreign key relationships.
   * @param tableName the name of the enumeration table
   * @param seed is the fixed rows that should be initialized at startup
   * @param props optional, for type-safety only, should not be used
   * @returns
   */
  const textLookupTable = <
    TableName extends string,
    TPropAxioms extends
      & Record<`${TableName}_id`, ax.Axiom<Any>>
      & {
        readonly code: SQLa.AxiomSqlDomain<string, Context>;
        readonly value: SQLa.AxiomSqlDomain<string, Context>;
      }
      & HousekeepingColumnsDefns<Context>,
  >(
    tableName: TableName,
    seed?: TextLookupRecord[],
    props: TPropAxioms = {
      [`${tableName}_id`]: mg.primaryKey(),
      code: SQLa.text(),
      value: SQLa.text(),
      ...mg.housekeeping(),
    } as TPropAxioms,
  ) => {
    const entity = mg.table(tableName, props);
    return {
      isTextLookupTable: true,
      ...entity,
      // seed will be used in SQL interpolation template literal, which accepts
      // either a string, SqlTextSupplier, or array of SqlTextSuppliers; in our
      // case, if seed data is provided we'll prepare the insert DMLs as an
      // array of SqlTextSuppliers
      seed: seed
        ? seed.map((s) => entity.insertDML(s as Any))
        : `-- no ${tableName} seed rows`,
    };
  };

  /**
   * Some of our tables will just have fixed ("seeded") values and act as
   * enumerations (lookup) with foreign key relationships.
   * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
   * and use type-safe enums
   * @param tableName the name of the enumeration table
   * @param seedEnum is enum whose list of values become the seed values of the lookup table
   * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
   */
  const enumTable = <
    TEnumCode extends string,
    TEnumValue extends number,
    TableName extends string,
  >(
    tableName: TableName,
    seedEnum: { [key in TEnumCode]: TEnumValue },
  ) => {
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
      code: SQLa.primaryKey(SQLa.integer()),
      value: SQLa.text(),
      ...mg.housekeeping(),
    };
    const tdrf = SQLa.tableDomainsRowFactory(tableName, props, {
      defaultIspOptions: mg.defaultIspOptions,
    });
    const etn: EnumTableDefn = { enumTableNature: "numeric" };
    return {
      ...etn,
      ...SQLa.tableDefinition(tableName, props, {
        isIdempotent: true,
        sqlNS: ddlOptions?.sqlNS,
      }),
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
  };

  /**
   * Some of our tables will just have fixed ("seeded") values and act as
   * enumerations (lookup) with foreign key relationships.
   * See https://github.com/microsoft/TypeScript/issues/30611 for how to create
   * and use type-safe enums
   * @param tableName the name of the enumeration table
   * @param seedEnum is enum whose list of values become the seed values of the lookup table
   * @returns a SQLa table with seed rows as insertDML and original typed enum for reference
   */
  const enumTextTable = <
    TEnumCode extends string,
    TEnumValue extends string,
    TableName extends string,
  >(
    tableName: TableName,
    seedEnum: { [key in TEnumCode]: TEnumValue },
  ) => {
    const seedRows: TextLookupRecord[] = [];
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
      code: SQLa.primaryKey(codeDomain),
      value: valueDomain,
      ...mg.housekeeping(),
    };
    const tdrf = SQLa.tableDomainsRowFactory(tableName, props, {
      defaultIspOptions: mg.defaultIspOptions,
    });
    const etn: EnumTableDefn = { enumTableNature: "text" };
    return {
      ...etn,
      ...SQLa.tableDefinition(tableName, props, {
        isIdempotent: true,
        sqlNS: ddlOptions?.sqlNS,
      }),
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
  };

  return {
    ...mg,
    textLookupTable,
    enumTable,
    enumTextTable,
  };
}

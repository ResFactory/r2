import * as ax from "../../safety/axiom.ts";
import * as SQLa from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type HousekeepingColumnsDefns<Context extends SQLa.SqlEmitContext> = {
  readonly created_at: SQLa.AxiomSqlDomain<Date | undefined, Context>;
};

export type TextLookupRecord = {
  readonly code: string;
  readonly value: string;
};

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
    // "created_at" is considered "housekeeping" with a default so don't
    // emit it as part of the insert DML statement
    const defaultIspOptions: SQLa.InsertStmtPreparerOptions<
      TableName,
      Any,
      Any,
      Context
    > = { isColumnEmittable: (name) => name == "created_at" ? false : true };
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

  return {
    primaryKey,
    housekeeping,
    table,
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
    TEnumValue extends number | string,
    TableName extends string,
  >(
    tableName: TableName,
    seedEnum: { [key in TEnumCode]: TEnumValue },
  ) => {
    const seedRows: TextLookupRecord[] = [];
    for (const e of Object.entries(seedEnum)) {
      const code = e[0] as TEnumCode;
      const value = e[1];
      seedRows.push({
        code,
        value: typeof value === "string" ? value : String(value),
      });
    }
    const entity = textLookupTable(tableName, seedRows);
    return {
      ...entity,
      seedEnum,
    };
  };

  return {
    ...mg,
    textLookupTable,
    enumTable,
  };
}

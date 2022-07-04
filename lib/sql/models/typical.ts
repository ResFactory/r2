import * as ax from "../../safety/axiom.ts";
import * as SQLa from "../render/mod.ts";
import * as erd from "../diagram/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type HousekeepingColumnsDefns<Context extends SQLa.SqlEmitContext> = {
  readonly created_at: SQLa.AxiomSqlDomain<Date | undefined, Context>;
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
      created_at: SQLa.createdAt(),
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
      ...SQLa.tableSelectFactory(tableName, props),
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
          result = SQLa.isEnumTableDefn(ftd)
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
      const refIsEnum = SQLa.isEnumTableDefn(edge.ref.entity);
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

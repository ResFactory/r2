import * as ax from "../../axiom/mod.ts";
import * as SQLa from "../render/mod.ts";
import * as erd from "../diagram/mod.ts";
import * as axsdUlid from "../../axiom/axiom-serde-ulid.ts";

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
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  // TODO: convert this to a UUID to allow database row merging/syncing
  const primaryKey = () =>
    SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());
  const ulidPrimaryKey = () =>
    SQLa.uaDefaultablePrimaryKey(SQLa.ulid<Context>());

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
    options?: {
      readonly lint?:
        & SQLa.TableNameConsistencyLintOptions
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) => {
    const result = {
      ...ax.axiomSerDeObject(props),
      ...SQLa.tableDefinition<TableName, TPropAxioms, Context>(
        tableName,
        props,
        {
          isIdempotent: true,
          sqlNS: ddlOptions?.sqlNS,
        },
      ),
      ...SQLa.tableDomainsRowFactory<TableName, TPropAxioms, Context>(
        tableName,
        props,
        { defaultIspOptions },
      ),
      ...SQLa.tableSelectFactory<TableName, TPropAxioms, Context>(
        tableName,
        props,
      ),
      view: SQLa.tableDomainsViewWrapper<
        `${TableName}_vw`,
        TableName,
        TPropAxioms,
        Context
      >(
        `${tableName}_vw`,
        tableName,
        props,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };

    const rules = tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  };

  const erdConfig = erd.typicalPlantUmlIeOptions();
  const lintState = SQLa.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
  const tableLintRules = SQLa.tableLintRules<Context>();

  return {
    primaryKey,
    ulidPrimaryKey,
    housekeeping,
    table,
    tableLintRules,
    defaultIspOptions,
    erdConfig,
    enumTable: SQLa.enumTable,
    enumTextTable: SQLa.enumTextTable,
    sqlTextLintSummary: lintState.sqlTextLintSummary,
    sqlTmplEngineLintSummary: lintState.sqlTmplEngineLintSummary,
  };
}

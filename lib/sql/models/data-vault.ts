import * as ax from "../../axiom/mod.ts";
import * as axsdc from "../../axiom/axiom-serde-crypto.ts";
import * as SQLa from "../render/mod.ts";
import * as erd from "../diagram/mod.ts";

// for convenience so that deno-lint is not required for use of `any`
// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * dataVaultDomains is a convenience object which defines aliases of all the
 * domains that we'll be using. We create "aliases" for easier maintenance and
 * extensibility (so if SQLa base domains change, we can diverge easily).
 * @returns the typical domains used by Data Vault models
 */
export function dataVaultDomains() {
  return {
    text: SQLa.text,
    textNullable: SQLa.textNullable,
    integer: SQLa.integer,
    date: SQLa.date,
    dateTime: SQLa.dateTime,
    createdAt: SQLa.createdAt,
    shah1Digest: SQLa.sha1Digest,
  };
}

/**
 * dataVaultKeys is a "data vault keys governer" builder object.
 * @returns a builder object with helper functions as properties which can be used to build DV keys
 */
export function dataVaultKeys<Context extends SQLa.SqlEmitContext>() {
  // we create our aliases in a function and use the function instead of passing
  // in dvDomains as an argument because deep-generics type-safe objects will be
  // available.
  const { shah1Digest } = dataVaultDomains();

  const digestPrimaryKey = () =>
    SQLa.uaDefaultablePrimaryKey<string, Context>(
      shah1Digest<Context>(() => axsdc.sha1DigestUndefined),
    );

  const autoIncPrimaryKey = () =>
    SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());

  const surrogateKey = <TsValueType>(
    domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  ) => {
    return SQLa.label(domain, "surrogate-key");
  };

  return {
    digestPrimaryKey,
    digestPkLintRule: <TableName, ColumnName>(
      tableName: TableName,
      pkColumn?: SQLa.IdentifiableSqlDomain<Any, Context>,
      options?: { readonly pkDigestColumns?: ColumnName[] },
    ) => {
      const rule: SQLa.SqlLintRule = {
        lint: (lis) => {
          if (
            pkColumn && axsdc.isDigestAxiomSD(pkColumn) &&
            !options?.pkDigestColumns
          ) {
            lis.registerLintIssue({
              lintIssue:
                `table name '${tableName}' requires pkDigestColumns for primary key column ${pkColumn.identity}`,
              consequence: SQLa.SqlLintIssueConsequence.FATAL_DDL,
            });
          }
        },
      };
      return rule;
    },
    autoIncPrimaryKey,
    surrogateKey,
  };
}

export type DataVaultTypicalHousekeepingColumns<
  Context extends SQLa.SqlEmitContext,
> = {
  readonly created_at: SQLa.AxiomSqlDomain<Date | undefined, Context>;
};

/**
 * dataVaultHousekeeping is a "data vault housekeeping columns governer" builder
 * object.
 * @returns a builder object with helper functions as properties which can be used to build DV housekeeping columns
 */
export function dataVaultHousekeeping<Context extends SQLa.SqlEmitContext>() {
  const { createdAt } = dataVaultDomains();

  // TODO: add loadedAt, loadedBy, provenance (lineage), etc. columns from PgDCP DV

  return {
    typical: {
      columns: {
        created_at: createdAt(),
      },
      insertStmtPrepOptions: <TableName extends string>() => {
        const result: SQLa.InsertStmtPreparerOptions<
          TableName,
          { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
          { created_at?: Date }, // this must match typical.columns so that isColumnEmittable is type-safe
          Context
        > = {
          // created_at should be filled in by the database so we don't want
          // to emit it as part of the an insert DML SQL statement
          isColumnEmittable: (name) => name == "created_at" ? false : true,
        };
        return result as SQLa.InsertStmtPreparerOptions<Any, Any, Any, Context>;
      },
    },
  };
}

export type DataVaultHubTableDefn<
  HubName extends string,
  HubTableName extends string,
  Context extends SQLa.SqlEmitContext,
> = SQLa.TableDefinition<HubTableName, Context> & {
  readonly pkColumnDefn: SQLa.TablePrimaryKeyColumnDefn<Any, Context>;
  readonly hubName: HubName;
};

/**
 * dataVaultGovn is a "data vault governer" builders object for data vault models.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function dataVaultGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const domains = dataVaultDomains();
  const keys = dataVaultKeys<Context>();
  const housekeeping = dataVaultHousekeeping<Context>();
  const tableLintRules = SQLa.tableLintRules<Context>();

  const denormalized = <TsValueType>(
    domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  ) => {
    return SQLa.label(domain, "denormalized");
  };

  /**
   * All our table names should be strongly typed and consistent. Generics are
   * used so that they are passed into Axiom, SQLa domain, etc. properly typed.
   * @param name the name of the table
   * @returns the transformed table name (e.g. in case prefixes should be added)
   */
  const tableName = <Name extends string, Qualified extends string = Name>(
    name: Name,
  ): Qualified => {
    // for now we're not doing anything special but that could change in future
    return name as unknown as Qualified;
  };

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
      & DataVaultTypicalHousekeepingColumns<Context>,
    ColumnName extends keyof TPropAxioms = keyof TPropAxioms,
  >(
    tableName: TableName,
    props: TPropAxioms,
    options?: {
      readonly pkDigestColumns?: ColumnName[];
      readonly constraints?: SQLa.TableColumnsConstraint<
        TPropAxioms,
        Context
      >[];
      readonly lint?:
        & SQLa.TableNameConsistencyLintOptions
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) => {
    const asdo = ax.axiomSerDeObject(props);
    const pkColumnDefn = asdo.axiomProps.find((ap) =>
      SQLa.isTablePrimaryKeyColumnDefn<Any, Context>(ap)
    ) as unknown as (
      | (
        & SQLa.IdentifiableSqlDomain<string, Context>
        & ax.DefaultableAxiomSerDe<string>
        & SQLa.TablePrimaryKeyColumnDefn<Any, Context>
      )
      | undefined
    );
    const defaultIspOptions = housekeeping.typical.insertStmtPrepOptions<
      TableName
    >();
    const tdrf = SQLa.tableDomainsRowFactory<TableName, TPropAxioms, Context>(
      tableName,
      props,
      { defaultIspOptions },
    );
    const result = {
      ...asdo,
      pkColumnDefn,
      ...SQLa.tableDefinition<TableName, TPropAxioms, Context>(
        tableName,
        props,
        {
          isIdempotent: true,
          sqlNS: ddlOptions?.sqlNS,
          constraints: options?.constraints,
        },
      ),
      // we want a custom, async, insertDML since some of our primary keys are
      //  "digest" type and we need to generate the digest from content in the
      // record
      insertDML: tdrf.insertCustomDML(async (ir) => {
        const pkDigestCols = options?.pkDigestColumns;
        if (pkDigestCols && pkColumnDefn) {
          // TODO: figure out how to type this properly, don't leave it untyped
          // suggestion: create a writeable: (ir: InsertableRecord) => safety.Writeable<InsertableRecord>?
          const untypedIR = ir as Any;
          const dc = pkDigestCols.map((dc) => untypedIR[dc]).join("::");
          // pkColumn.defaultValue(dc) will be the SHA-1 or other digest function
          untypedIR[pkColumnDefn.identity] = await pkColumnDefn.defaultValue(
            dc,
          );
        }
      }),
      ...SQLa.tableSelectFactory<TableName, TPropAxioms, Context>(
        tableName,
        props,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };

    const rules = tableLintRules.typical(
      result,
      keys.digestPkLintRule(tableName, pkColumnDefn, options),
    );
    rules.lint(result, options?.lint);

    return result;
  };

  const hubTableName = <
    HubName extends string,
    TableName extends `hub_${HubName}` = `hub_${HubName}`,
    Qualified extends string = TableName,
  >(name: HubName) =>
    tableName<TableName, Qualified>(`hub_${name}` as TableName);

  const hubTable = <
    HubName extends string,
    TPropAxioms extends
      & Record<string, ax.Axiom<Any>>
      & Record<
        `hub_${HubName}_id`,
        SQLa.TablePrimaryKeyColumnDefn<Any, Context>
      >
      & Record<`key`, ax.Axiom<Any>>,
  >(hubName: HubName, props: TPropAxioms) => {
    const tableName = hubTableName(hubName);
    const tableDefn = table(tableName, {
      ...props,
      ...housekeeping.typical.columns,
    });
    if (!tableDefn.pkColumnDefn) {
      throw Error(`no primary key column defined for hubTable ${hubName}`);
    }
    const signature: Pick<
      DataVaultHubTableDefn<HubName, typeof tableName, Context>,
      "hubName" | "pkColumnDefn"
    > = { hubName, pkColumnDefn: tableDefn.pkColumnDefn };
    // TODO: add lint rule for checking if hub business key or group of keys is unique
    const result = {
      ...tableDefn,
      ...signature,
      satTable: <
        SatelliteName extends string,
        TPropSatAxioms extends
          & Record<string, ax.Axiom<Any>>
          & Record<
            `sat_${HubName}_${SatelliteName}_id`,
            SQLa.TablePrimaryKeyColumnDefn<Any, Context>
          >
          & Record<
            `hub_${HubName}_id`,
            SQLa.TableForeignKeyColumnDefn<Any, typeof tableName, Context>
          >,
      >(satelliteName: SatelliteName, satProps: TPropSatAxioms) =>
        satelliteTable(result, satelliteName, satProps),
    };
    return result;
  };

  const satelliteTableName = <
    HubName extends string,
    SatelliteName extends string,
    TableName extends `sat_${HubName}_${SatelliteName}` =
      `sat_${HubName}_${SatelliteName}`,
    Qualified extends string = TableName,
  >(hubName: HubName, satelliteName: SatelliteName) =>
    tableName<TableName, Qualified>(
      `sat_${hubName}_${satelliteName}` as TableName,
    );

  const satelliteTable = <
    HubName extends string,
    HubTableName extends string,
    SatelliteName extends string,
    SatPropAxioms extends
      & Record<string, ax.Axiom<Any>>
      & Record<
        `sat_${HubName}_${SatelliteName}_id`,
        SQLa.TablePrimaryKeyColumnDefn<Any, Context>
      >
      & Record<
        `hub_${HubName}_id`,
        SQLa.TableForeignKeyColumnDefn<Any, HubTableName, Context>
      >,
  >(
    hubTableDefn: DataVaultHubTableDefn<HubName, HubTableName, Context>,
    satelliteName: SatelliteName,
    props: SatPropAxioms,
  ) => {
    const satTableName = satelliteTableName<HubName, SatelliteName>(
      hubTableDefn.hubName,
      satelliteName,
    );
    // TODO: add lint rule for checking if key or group of keys is unique
    return {
      ...table(
        satTableName,
        {
          ...props,
          ...housekeeping.typical.columns,
        },
      ),
      hubTableDefn,
      satelliteName,
    };
  };

  const linkTableName = <
    LinkName extends string,
    TableName extends `link_${LinkName}` = `link_${LinkName}`,
  >(linkName: LinkName) =>
    tableName<TableName>(`link_${linkName}` as TableName);

  const linkTable = <
    LinkName extends string,
    HubNames extends string,
    HubTableDefns extends Record<
      HubNames,
      DataVaultHubTableDefn<
        HubNames,
        Any,
        Context
      >
    >,
  >(
    linkName: LinkName,
    hubTableDefns: HubTableDefns,
  ) => {
    const lTableName = linkTableName<LinkName>(linkName);
    const props:
      & Record<
        `link_${LinkName}_id`,
        SQLa.TablePrimaryKeyColumnDefn<Any, Context>
      >
      & Record<
        `hub_${HubNames}_id`,
        SQLa.TableForeignKeyColumnDefn<Any, Any, Context>
      > = {} as Any;
    (props[`link_${linkName}_id`] as Any) = keys.digestPrimaryKey();
    for (const htdEntry of Object.entries(hubTableDefns)) {
      const hubName = htdEntry[0] as HubNames;
      const hubTableDefn = htdEntry[1] as DataVaultHubTableDefn<
        typeof hubName,
        Any,
        Context
      >;
      (props as Any)[`hub_${hubName}_id`] = SQLa.foreignKey(
        hubTableDefn.tableName,
        hubTableDefn.pkColumnDefn,
      );
    }
    // TODO: add lint rule for checking if key or group of keys is unique
    return {
      ...table(
        lTableName,
        {
          ...props,
          ...housekeeping.typical.columns,
        },
      ),
      linkName,
      hubTableDefns,
    };
  };

  const erdConfig = erd.typicalPlantUmlIeOptions();
  const lintState = SQLa.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);

  return {
    domains,
    ...keys,
    denormalized,
    housekeeping,
    tableName,
    table,
    hubTableName,
    hubTable,
    satelliteTableName,
    satelliteTable,
    linkTableName,
    linkTable,
    tableLintRules,
    erdConfig,
    enumTable: SQLa.enumTable,
    enumTextTable: SQLa.enumTextTable,
    sqlTextLintSummary: lintState.sqlTextLintSummary,
    sqlTmplEngineLintSummary: lintState.sqlTmplEngineLintSummary,
  };
}

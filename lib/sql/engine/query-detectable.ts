import * as SQLa from "../render/mod.ts";
import * as eng from "./engine.ts";

type Any = any;

export interface DetectedEngineInstanceInSqlText<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
> {
  readonly engineInstanceID: Identity;
  readonly STS:
    | SQLa.SqlTextSupplier<Context>
    | SQLa.MutatedSqlTextSupplier<Context>;
}

export interface QueryEngineInspector<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
> {
  readonly detectedEngine: (
    ctx: Context,
    sts: SQLa.SqlTextSupplier<Context>,
  ) => DetectedEngineInstanceInSqlText<Identity, Context> | undefined;
}

/**
 * typicalUseDatabaseIdDetector creates a detector which looks for this pattern:
 *
 *     USE DATABASE something;\n
 *
 * If the first line of the SQL starts with any whitespace and then USE DATABASE
 * (case insensitive) then "something" would be extracted as the databaseID.
 *
 * @returns
 */
export function useDatabaseIdInFirstLineOfSqlDetector<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
>(
  { removeUseDbIdStmt }: { removeUseDbIdStmt: boolean } = {
    removeUseDbIdStmt: true,
  },
) {
  const detectedUseDbIdInSQL = (
    ctx: Context,
    sts: SQLa.SqlTextSupplier<Context>,
  ) => {
    const useDatabaseRegEx = /^\s*USE\s*DATABASE\s*(\w+).*$/gmi;
    const useDatabaseMatch = useDatabaseRegEx.exec(sts.SQL(ctx));
    return useDatabaseMatch ? useDatabaseMatch[1] as Identity : undefined;
  };
  const rewriteSqlRemoveUseDbId = (
    ctx: Context,
    sts: SQLa.SqlTextSupplier<Context>,
  ) => {
    const SQL = sts.SQL(ctx).replace(/^\s*USE\s*DATABASE.*$/mi, "").trim();
    return removeUseDbIdStmt
      ? { SQL: () => SQL, isMutatedSqlTextSupplier: true, originalSTS: sts }
      : sts;
  };

  const result: QueryEngineInspector<Identity, Context> = {
    detectedEngine: (ctx, sts) => {
      const engineInstanceID = detectedUseDbIdInSQL(ctx, sts);
      if (engineInstanceID) {
        return {
          engineInstanceID,
          STS: rewriteSqlRemoveUseDbId(ctx, sts),
        };
      }
      return undefined;
    },
  };
  return result;
}

/**
 * A custom SQL engine factory which "detects" the instance in a SQL query by
 * searching for `USE DATABASE instance_id;\n` in the SQL text.
 * @param instancePreparer the function which prepares an instance based on an ID
 * @param options provides inspector and default instance options
 * @returns a factory which can create SQL engine instances (connections) from query inspection
 */
export function sqlTextSuppliedEngineCustom<
  InstanceID extends string,
  Context extends SQLa.SqlEmitContext,
>(
  instancePreparer: (
    detected: DetectedEngineInstanceInSqlText<InstanceID, Context>,
  ) => {
    engineInstance?: eng.SqlEngineInstance<Any>;
    detected: DetectedEngineInstanceInSqlText<InstanceID, Context>;
  } | undefined,
  options?: {
    readonly qed?: QueryEngineInspector<InstanceID, Context>;
    readonly defaultInstance?: <
      Engine extends eng.SqlEngine,
      Instance extends eng.SqlEngineInstance<Engine>,
    >(detected: DetectedEngineInstanceInSqlText<InstanceID, Context>) => {
      engineInstance: Instance;
      detected: DetectedEngineInstanceInSqlText<InstanceID, Context>;
    } | undefined;
  },
) {
  const {
    qed = useDatabaseIdInFirstLineOfSqlDetector<InstanceID, Context>(),
    defaultInstance,
  } = options ?? {};
  return {
    instance: (ctx: Context, sts: SQLa.SqlTextSupplier<Context>) => {
      const detected = qed.detectedEngine(ctx, sts);
      if (detected) {
        const instance = instancePreparer(detected);
        if (instance) return instance;
        return defaultInstance?.(detected);
      }
    },
  };
}

export function sqlTextSuppliedEngine<
  Instances extends Record<
    string,
    (
      detected: DetectedEngineInstanceInSqlText<InstanceID, Context>,
    ) => {
      engineInstance: eng.SqlEngineInstance<Any>;
      detected: DetectedEngineInstanceInSqlText<InstanceID, Context>;
    } | undefined
  >,
  Context extends SQLa.SqlEmitContext,
  InstanceID extends keyof Instances & string,
>(
  instances: Instances,
  options?: {
    readonly qed?: QueryEngineInspector<InstanceID, Context>;
    readonly defaultInstance?: <
      Engine extends eng.SqlEngine,
      Instance extends eng.SqlEngineInstance<Engine>,
    >(detected: DetectedEngineInstanceInSqlText<InstanceID, Context>) => {
      engineInstance: Instance;
      detected: DetectedEngineInstanceInSqlText<InstanceID, Context>;
    } | undefined;
  },
) {
  const stsEngine = sqlTextSuppliedEngineCustom((detected) => {
    if (detected.engineInstanceID in instances) {
      return instances[detected.engineInstanceID](detected);
    }
    return undefined;
  }, options);
  return {
    instance: (ctx: Context, sts: SQLa.SqlTextSupplier<Context>) => {
      return stsEngine.instance(ctx, sts);
    },
  };
}

import * as SQLa from "../render/mod.ts";
import * as eng from "./engine.ts";

export interface RewrittenSqlTextSupplier<
  Context extends SQLa.SqlEmitContext,
> extends SQLa.SqlTextSupplier<Context> {
  readonly isRewrittenSQL: boolean;
  readonly originalSQL: SQLa.SqlTextSupplier<Context>;
}

export interface DetectedEngineInstanceInSQL<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
> {
  readonly engineInstanceID: Identity;
  readonly query:
    | SQLa.SqlTextSupplier<Context>
    | RewrittenSqlTextSupplier<Context>;
}

export interface QueryEngineDetector<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
> {
  readonly detectedEngine: (
    ctx: Context,
    sts: SQLa.SqlTextSupplier<Context>,
  ) => DetectedEngineInstanceInSQL<Identity, Context> | undefined;
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
      ? { SQL: () => SQL, isRewrittenSQL: true, originalSQL: sts }
      : sts;
  };

  const result: QueryEngineDetector<Identity, Context> = {
    detectedEngine: (ctx, sts) => {
      const engineInstanceID = detectedUseDbIdInSQL(ctx, sts);
      if (engineInstanceID) {
        return {
          engineInstanceID,
          query: rewriteSqlRemoveUseDbId(ctx, sts),
        };
      }
      return undefined;
    },
  };
  return result;
}

export function queryBasedEngine<
  Identity extends string,
  Context extends SQLa.SqlEmitContext,
>(
  instancePreparer: <
    Engine extends eng.SqlEngine,
    Instance extends eng.SqlEngineInstance<Engine>,
  >(detected: DetectedEngineInstanceInSQL<Identity, Context>) => {
    engineInstance?: Instance;
    detected: DetectedEngineInstanceInSQL<Identity, Context>;
  } | undefined,
  options?: {
    readonly qed?: QueryEngineDetector<Identity, Context>;
    readonly defaultInstance: <
      Engine extends eng.SqlEngine,
      Instance extends eng.SqlEngineInstance<Engine>,
    >(detected: DetectedEngineInstanceInSQL<Identity, Context>) => {
      engineInstance: Instance;
      detected: DetectedEngineInstanceInSQL<Identity, Context>;
    } | undefined;
  },
) {
  const {
    qed = useDatabaseIdInFirstLineOfSqlDetector<Identity, Context>(),
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

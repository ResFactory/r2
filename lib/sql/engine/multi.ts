import * as SQLa from "../render/mod.ts";
import * as eng from "./engine.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

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
    detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>,
  ) => {
    engineInstance?: eng.SqlEngineInstance<Any>;
    detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>;
  } | undefined,
  options?: {
    readonly inspector?: SQLa.SqlDirectivesInspector<
      SQLa.SqlEngineInstanceDirective<InstanceID, Context>,
      Context
    >;
    readonly defaultInstance?: <
      Engine extends eng.SqlEngine,
      Instance extends eng.SqlEngineInstance<Engine>,
    >(detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>) => {
      engineInstance: Instance;
      detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>;
    } | undefined;
  },
) {
  const {
    inspector = SQLa.sqlEngineDirectiveInspector<InstanceID, Context>(),
    defaultInstance,
  } = options ?? {};
  return {
    instance: (ctx: Context, sts: SQLa.SqlTextSupplier<Context>) => {
      const detected = inspector(ctx, sts);
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
      detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>,
    ) => {
      engineInstance: eng.SqlEngineInstance<Any>;
      detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>;
    } | undefined
  >,
  Context extends SQLa.SqlEmitContext,
  InstanceID extends keyof Instances & string,
>(
  instances: Instances,
  options?: {
    readonly inspector?: SQLa.SqlDirectivesInspector<
      SQLa.SqlEngineInstanceDirective<InstanceID, Context>,
      Context
    >;
    readonly defaultInstance?: <
      Engine extends eng.SqlEngine,
      Instance extends eng.SqlEngineInstance<Engine>,
    >(detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>) => {
      engineInstance: Instance;
      detected: SQLa.SqlEngineInstanceDirective<InstanceID, Context>;
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

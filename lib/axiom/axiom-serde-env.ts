import * as safety from "../safety/mod.ts";
import * as ax from "./axiom.ts";
import * as axsd from "./axiom-serde.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export const freeTextToEnvVarName = (text: string) =>
  // change whitespace/dashes/dots to underscores, remove anything not alphanumeric or underscore
  text.replace(/[-\.\s]+/g, "_").replace(/[^\w]+/g, "").toLocaleUpperCase();

export const camelCaseToEnvVarName = (text: string) =>
  // find one or more uppercase characters and separate with _
  text.replace(/[A-Z]+/g, (match: string) => `_${match}`)
    .toLocaleUpperCase();

export type EnvVarNamingStrategy = (given: string) => string;

export type EnvVarNamesSupplier<Name extends string> = {
  readonly envVarNames: Name[];
};

export function isEnvVarNamesSupplier<Name extends string>(
  o: unknown,
): o is EnvVarNamesSupplier<Name> {
  const isLSD = safety.typeGuard<EnvVarNamesSupplier<Name>>("envVarNames");
  return isLSD(o);
}

export type AliasedAxiomSerDe<TsValueType, Alias extends string> =
  & axsd.AxiomSerDe<TsValueType>
  & EnvVarNamesSupplier<Alias>;

export function isAliasedAxiomSerDe<TsValueType, Name extends string>(
  o: unknown,
): o is AliasedAxiomSerDe<TsValueType, Name> {
  const isLT = safety.typeGuard<AliasedAxiomSerDe<TsValueType, Name>>(
    "envVarNames",
  );
  return axsd.isAxiomSerDe(o) && isLT(o);
}

export function alias<TsValueType, Name extends string>(
  toggle: axsd.AxiomSerDe<TsValueType>,
  ...envVarNames: Name[]
): AliasedAxiomSerDe<TsValueType, Name> {
  return {
    ...toggle,
    envVarNames,
  };
}

export interface DeserializeIndividualEnvOptions<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
> {
  readonly ctx?: Context;
  readonly initValues?: axsd.SerDeAxiomRecord<TPropAxioms>;
  readonly evNS?: EnvVarNamingStrategy;
  readonly onPropertyNotSerDeAxiom?: (
    name: string,
    axiom: ax.Axiom<Any>,
    toggles: axsd.IdentifiableAxiomSerDe<Any>[],
  ) => void;
}

export function deserializeIndividualEnv<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  dieOptions?: DeserializeIndividualEnvOptions<TPropAxioms, Context>,
) {
  const { evNS = camelCaseToEnvVarName } = dieOptions ?? {};
  const tt = axsd.serDeAxioms(props, dieOptions);

  type EnvVarValues = {
    [Property in keyof TPropAxioms]: {
      readonly envVarName: string;
      readonly envVarValue: string;
    };
  };
  const envVarDefns: axsd.SerDeAxiomDefns<TPropAxioms> = {} as Any;
  const envVarValues: EnvVarValues = {} as Any;
  const serDeAxiomRecord: axsd.SerDeAxiomRecord<TPropAxioms> =
    dieOptions?.initValues ?? {} as Any;
  const envVarsSearched: {
    propName: keyof axsd.SerDeAxiomDefns<TPropAxioms>;
    envVarName: string;
    found: boolean;
    defaulted: boolean;
    defaultValue?: unknown;
    evDefn: axsd.IdentifiableAxiomSerDe<Any, string>;
  }[] = [];

  const attempt = (
    envVarName: string,
    evDefn: axsd.IdentifiableAxiomSerDe<Any, string>,
  ) => {
    const envVarValue = Deno.env.get(envVarName);
    const searched = {
      propName: evDefn.identity,
      envVarName,
      found: envVarValue != undefined ? true : false,
      defaulted: false,
      defaultValue: undefined,
      evDefn,
    };
    envVarsSearched.push(searched);
    if (envVarValue) {
      envVarValues[evDefn.identity as (keyof EnvVarValues)] = {
        envVarName,
        envVarValue,
      };
      serDeAxiomRecord[
        evDefn.identity as (keyof axsd.SerDeAxiomRecord<TPropAxioms>)
      ] = evDefn.fromText(
        envVarValue,
        "env",
      );
    }
    return searched;
  };

  for (const evDefn of tt.serDeAxioms) {
    const searched = attempt(evNS(evDefn.identity), evDefn);
    if (!searched.found) {
      let aliasFound = false;
      if (isAliasedAxiomSerDe(evDefn)) {
        for (const alias of evDefn.envVarNames) {
          const searchedAlias = attempt(alias, evDefn);
          if (searchedAlias.found) {
            aliasFound = true;
            break;
          }
        }
      }

      if (!aliasFound) {
        if (evDefn.defaultValue) {
          const dv = evDefn.defaultValue<Context>(dieOptions?.ctx);
          serDeAxiomRecord[
            evDefn.identity as (keyof axsd.SerDeAxiomRecord<TPropAxioms>)
          ] = dv;
          searched.defaulted = true;
          searched.defaultValue = dv;
        }
      }
    }
    envVarDefns[evDefn.identity as (keyof TPropAxioms)] = evDefn;
  }

  return {
    ...tt,
    envVarDefns,
    envVarValues,
    envVarsSearched,
    serDeAxiomRecord,
  };
}

export function deserializeOmnibusEnv<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  omnibusEnvVarName: string,
  sdaOptions?: {
    readonly ctx?: Context;
    readonly initValues?: (ctx?: Context) => axsd.SerDeAxiomRecord<TPropAxioms>;
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      iasd: axsd.IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) {
  const omnibusEnvVarValue = Deno.env.get(omnibusEnvVarName);
  const djt = axsd.deserializeJsonText<TPropAxioms, Context>(
    props,
    () => omnibusEnvVarValue ?? "{}",
    sdaOptions?.initValues ?? (() => ({} as Any)),
    sdaOptions,
  );

  return {
    ...djt,
    omnibusEnvVarName,
    omnibusEnvVarValue,
  };
}

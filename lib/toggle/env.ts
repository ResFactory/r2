import * as safety from "../safety/mod.ts";
import * as ax from "../safety/axiom.ts";
import * as t from "./toggle.ts";

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

export type AliasedToggle<TsValueType, Alias extends string> =
  & t.AxiomToggle<TsValueType>
  & EnvVarNamesSupplier<Alias>;

export function isAliasedToggle<TsValueType, Name extends string>(
  o: unknown,
): o is AliasedToggle<TsValueType, Name> {
  const isLT = safety.typeGuard<AliasedToggle<TsValueType, Name>>(
    "envVarNames",
  );
  return t.isAxiomToggle(o) && isLT(o);
}

export function alias<TsValueType, Name extends string>(
  toggle: t.AxiomToggle<TsValueType>,
  ...envVarNames: Name[]
): AliasedToggle<TsValueType, Name> {
  return {
    ...toggle,
    envVarNames,
  };
}

export interface EnvTogglesOptions<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
> {
  readonly ctx?: Context;
  readonly initValues?: {
    [Property in keyof TPropAxioms]: TPropAxioms[Property] extends
      ax.Axiom<infer T> ? T : never;
  };
  readonly evNS?: EnvVarNamingStrategy;
  readonly onPropertyNotAxiomToggle?: (
    name: string,
    axiom: ax.Axiom<Any>,
    toggles: t.IdentifiableToggle<Any>[],
  ) => void;
}

export function individualEnvToggles<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  etOptions?: EnvTogglesOptions<TPropAxioms, Context>,
) {
  const { evNS = camelCaseToEnvVarName } = etOptions ?? {};
  const tt = t.typedToggles(props, etOptions);

  type EnvVarDefns = {
    [Property in keyof TPropAxioms]: t.IdentifiableToggle<
      TPropAxioms[Property] extends ax.Axiom<infer T> ? T : never
    >;
  };
  type EnvVarValues = {
    [Property in keyof TPropAxioms]: {
      readonly envVarName: string;
      readonly envVarValue: string;
    };
  };
  type ToggleValues = {
    [Property in keyof TPropAxioms]: TPropAxioms[Property] extends
      ax.Axiom<infer T> ? T : never;
  };
  const envVarDefns: EnvVarDefns = {} as Any;
  const envVarValues: EnvVarValues = {} as Any;
  const toggleValues: ToggleValues = etOptions?.initValues ?? {} as Any;
  const envVarsSearched: {
    propName: keyof EnvVarDefns;
    envVarName: string;
    found: boolean;
    defaulted: boolean;
    defaultValue?: unknown;
    evDefn: t.IdentifiableToggle<Any, string>;
  }[] = [];

  const attempt = (
    envVarName: string,
    evDefn: t.IdentifiableToggle<Any, string>,
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
      toggleValues[evDefn.identity as (keyof ToggleValues)] = evDefn.fromText(
        envVarValue,
        "env",
      );
    }
    return searched;
  };

  for (const evDefn of tt.toggles) {
    const searched = attempt(evNS(evDefn.identity), evDefn);
    if (!searched.found) {
      let aliasFound = false;
      if (isAliasedToggle(evDefn)) {
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
          const dv = evDefn.defaultValue<Context>(etOptions?.ctx);
          toggleValues[evDefn.identity as (keyof ToggleValues)] = dv;
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
    toggleValues,
  };
}

export function omnibusEnvToggles<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  omnibusEnvVarName: string,
  etOptions?: EnvTogglesOptions<TPropAxioms, Context>,
) {
  const tt = t.typedToggles(props, etOptions);
  type ToggleValues = {
    [Property in keyof TPropAxioms]: TPropAxioms[Property] extends
      ax.Axiom<infer T> ? T : never;
  };
  let toggleValues: ToggleValues = etOptions?.initValues ?? {} as Any;

  const omnibusEnvVarValue = Deno.env.get(omnibusEnvVarName);
  if (omnibusEnvVarValue) {
    toggleValues = JSON.parse(omnibusEnvVarValue);
  }

  return {
    ...tt,
    omnibusEnvVarName,
    omnibusEnvVarValue,
    toggleValues,
  };
}

import * as safety from "../safety/mod.ts";
import * as m from "../safety/merge.ts";
import * as ax from "./axiom.ts";

/**
 * An `AxiomSerDe` is an Axiom-typed "data definition" for defining type-safe
 * "serializable deserializable" (SerDe) atomic data components that can be
 * stored in the environment, a database, etc.
 *
 * A `serDeAxioms` object groups multiple Axiom-typed `AxiomSerDe` instances and
 * treats them as a collection so that they can be treated as a single unit.
 * `serDeAxioms` objects are special in that each AxiomSerDe can be independently
 * identifiable by using simple TypeScript object declarations.
 */

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export interface AixomSerDeLintIssueSupplier {
  readonly lintIssue: string;
  readonly location?: (options?: { maxLength?: number }) => string;
}

export const isAixomSerDeLintIssueSupplier = safety.typeGuard<
  AixomSerDeLintIssueSupplier
>("lintIssue");

export interface AxiomSerDeLintIssuesSupplier {
  readonly lintIssues: AixomSerDeLintIssueSupplier[];
}

export const isAxiomSerDeLintIssuesSupplier = safety.typeGuard<
  AxiomSerDeLintIssuesSupplier
>("lintIssues");

export type AxiomSerDeLabelsSupplier<Label extends string> = {
  readonly labels: Label[];
};

export function axiomSerDeLintIssue<TsValueType>(
  axiomSD: AxiomSerDe<TsValueType>,
  issue: string,
  location?: (options?: { maxLength?: number }) => string,
): AxiomSerDeLintIssuesSupplier & AxiomSerDe<TsValueType> {
  const lintIssue = { lintIssue: issue, location };
  if (isAxiomSerDeLintIssuesSupplier(axiomSD)) {
    axiomSD.lintIssues.push(lintIssue);
    return axiomSD;
  } else {
    const lintable = axiomSD as
      & safety.Writeable<AxiomSerDeLintIssuesSupplier>
      & AxiomSerDe<TsValueType>;
    lintable.lintIssues = [lintIssue];
    return lintable;
  }
}

export function isAxiomSerDeLabelsSupplier<Label extends string>(
  o: unknown,
): o is AxiomSerDeLabelsSupplier<Label> {
  const isLSD = safety.typeGuard<AxiomSerDeLabelsSupplier<Label>>("labels");
  return isLSD(o);
}

export type AxiomSerDeValueSupplier<TsValueType> = <Context>(
  ctx?: Context,
) => TsValueType;

export type AxiomSerDe<TsValueType> = ax.Axiom<TsValueType> & {
  readonly fromText: (text: string, srcHint: "env") => TsValueType;
  readonly isDefaultable?: <Context>(
    value?: TsValueType,
    ctx?: Context,
  ) => boolean;
  readonly defaultValue?: AxiomSerDeValueSupplier<TsValueType>;
  readonly isOptional: boolean;
};

export function isAxiomSerDe<TsValueType>(
  o: unknown,
): o is AxiomSerDe<TsValueType> {
  const isAT = safety.typeGuard<
    AxiomSerDe<TsValueType>
  >("isOptional");
  return isAT(o);
}

export type IdentifiableAxiomSerDe<
  TsValueType,
  SerDeIdentity extends string = string,
> =
  & AxiomSerDe<TsValueType>
  & { readonly identity: SerDeIdentity };

export function isIdentifiableAxiomSerDe<
  TsValueType,
  ToggleIdentity extends string = string,
>(o: unknown): o is IdentifiableAxiomSerDe<TsValueType, ToggleIdentity> {
  const isIASD = safety.typeGuard<
    IdentifiableAxiomSerDe<TsValueType, ToggleIdentity>
  >("identity");
  return isAxiomSerDe(o) && isIASD(o);
}

export type LabeledAxiomSerDe<TsValueType, Label extends string> =
  & AxiomSerDe<TsValueType>
  & AxiomSerDeLabelsSupplier<Label>;

export function isLabeledAxiomSerDe<TsValueType, Label extends string>(
  o: unknown,
): o is LabeledAxiomSerDe<TsValueType, Label> {
  const isLASD = safety.typeGuard<LabeledAxiomSerDe<TsValueType, Label>>(
    "labels",
  );
  return isAxiomSerDe(o) && isLASD(o);
}

export function label<TsValueType, Label extends string>(
  toggle: AxiomSerDe<TsValueType>,
  ...labels: Label[]
): LabeledAxiomSerDe<TsValueType, Label> {
  return {
    ...toggle,
    labels,
  };
}

export function defaultable<TsValueType>(
  toggle: AxiomSerDe<TsValueType>,
  defaultValue: AxiomSerDeValueSupplier<TsValueType>,
  isDefaultable?: <Context>(value?: TsValueType, ctx?: Context) => boolean,
): AxiomSerDe<TsValueType> {
  return { ...toggle, defaultValue, isDefaultable };
}

export function text(
  axiom: ax.Axiom<string> = ax.$.string,
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string> {
  return {
    ...axiom,
    fromText: (text) => text,
    isOptional: false,
    ...atOptions,
  };
}

export function textOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string | undefined> {
  return { ...axiom, fromText: (text) => text, isOptional: true, ...atOptions };
}

export function date(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomSerDe<Date>>,
): AxiomSerDe<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomSerDe<Date | undefined>>,
): AxiomSerDe<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function dateTime(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomSerDe<Date>>,
): AxiomSerDe<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateTimeOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomSerDe<Date | undefined>>,
): AxiomSerDe<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function boolean(
  axiom: ax.Axiom<boolean> = ax.$.boolean,
  atOptions?: Partial<AxiomSerDe<boolean>>,
): AxiomSerDe<boolean> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function booleanOptional(
  axiom: ax.Axiom<boolean | undefined> = ax.$.boolean.optional(),
  atOptions?: Partial<AxiomSerDe<boolean>>,
): AxiomSerDe<boolean | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export function integer(
  axiom: ax.Axiom<number> = ax.$.number,
  atOptions?: Partial<AxiomSerDe<number>>,
): AxiomSerDe<number> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: false,
    ...atOptions,
  };
}

export function integerOptional(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  atOptions?: Partial<AxiomSerDe<number>>,
): AxiomSerDe<number | undefined> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: true,
    ...atOptions,
  };
}

export function bigint(
  axiom: ax.Axiom<bigint> = ax.$.bigint,
  atOptions?: Partial<AxiomSerDe<bigint>>,
): AxiomSerDe<bigint> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: false,
    ...atOptions,
  };
}

export function bigintOptional(
  axiom: ax.Axiom<bigint | undefined> = ax.$.bigint.optional(),
  atOptions?: Partial<AxiomSerDe<bigint>>,
): AxiomSerDe<bigint | undefined> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: true,
    ...atOptions,
  };
}

export function object<TPropAxioms extends Record<string, ax.Axiom<Any>>>(
  axiom: TPropAxioms,
  atOptions?: Partial<AxiomSerDe<string>>,
) {
  return {
    ...ax.$.object(axiom),
    fromText: (text: string) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function objectOptional<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
>(axiom: TPropAxioms) {
  return {
    ...ax.$.object(axiom).optional(),
    fromText: (text: string) => JSON.parse(text),
    isOptional: true,
  };
}

export function jsonText(
  axiom: ax.Axiom<string> = ax.$.string,
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function jsonTextOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomSerDe<string>>,
): AxiomSerDe<string | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export interface AxiomsSerDeSupplier<TsValueType = Any> {
  readonly serDeAxioms: IdentifiableAxiomSerDe<TsValueType>[];
}

export type SerDeAxiomDefns<TPropAxioms extends Record<string, ax.Axiom<Any>>> =
  {
    [Property in keyof TPropAxioms]: IdentifiableAxiomSerDe<
      TPropAxioms[Property] extends ax.Axiom<infer T> ? T : never
    >;
  };

export type SerDeAxiomRecord<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
> = {
  [Property in keyof TPropAxioms]: TPropAxioms[Property] extends
    ax.Axiom<infer T> ? T : never;
};

export function isAxiomsSerDeSupplier<TsValueType>(
  o: unknown,
): o is AxiomsSerDeSupplier<TsValueType> {
  const isSDS = safety.typeGuard<AxiomsSerDeSupplier<TsValueType>>(
    "serDeAxioms",
  );
  return isSDS(o);
}

export function serDeAxioms<TPropAxioms extends Record<string, ax.Axiom<Any>>>(
  props: TPropAxioms,
  sdaOptions?: {
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      toggles: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotSerDeAxiom } = sdaOptions ?? {};
  const serDeAxioms: IdentifiableAxiomSerDe<Any>[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomSerDe<Any>(axiom)) {
      const mutatableIT = axiom as safety.Writeable<
        IdentifiableAxiomSerDe<Any>
      >;
      mutatableIT.identity = name as Any;
      serDeAxioms.push(mutatableIT);
    } else {
      onPropertyNotSerDeAxiom?.(name, axiom, serDeAxioms);
    }
  });

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to AxiomsSerDeSupplier contract
  return {
    ...axiom,
    serDeAxioms,
  };
}

export function axiomSerDeDefaults<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  initValues:
    | SerDeAxiomRecord<TPropAxioms>
    | ((ctx?: Context) => SerDeAxiomRecord<TPropAxioms>) = {} as Any,
  sdaOptions?: {
    readonly ctx?: Context;
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      iasd: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) {
  const { ctx } = sdaOptions ?? {};

  const sda = serDeAxioms(props, sdaOptions);
  const defaults = typeof initValues === "function"
    ? initValues(ctx)
    : initValues;

  for (const a of sda.serDeAxioms) {
    if (a.defaultValue) {
      if (a.isDefaultable) {
        if (!a.isDefaultable<Context>(defaults[a.identity] as Any, ctx)) {
          continue;
        }
      }
      (defaults[a.identity] as Any) = a.defaultValue(ctx);
    }
  }

  return defaults;
}

export function* axiomsSerDeLintIssues<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  sdaOptions?: {
    readonly ctx?: Context;
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      iasd: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) {
  const sda = serDeAxioms(props, sdaOptions);
  for (const axiomSD of sda.serDeAxioms) {
    if (isAxiomSerDeLintIssuesSupplier(axiomSD)) {
      for (const li of axiomSD.lintIssues) {
        yield { axiomSD, ...li };
      }
    }
  }
}

export function deserializeJsonText<
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context,
>(
  props: TPropAxioms,
  jsonTextSupplier: (ctx?: Context) => string,
  initValues:
    | SerDeAxiomRecord<TPropAxioms>
    | ((ctx?: Context) => SerDeAxiomRecord<TPropAxioms>) = axiomSerDeDefaults(
      props,
    ),
  sdaOptions?: {
    readonly ctx?: Context;
    readonly onPropertyNotSerDeAxiom?: (
      name: string,
      axiom: Any,
      iasd: IdentifiableAxiomSerDe<Any>[],
    ) => void;
  },
) {
  const { ctx } = sdaOptions ?? {};

  const sda = serDeAxioms(props, sdaOptions);
  const jsonText = jsonTextSupplier(ctx);
  const jsonValue = JSON.parse(jsonText) as SerDeAxiomRecord<TPropAxioms>;

  const init = typeof initValues === "function" ? initValues(ctx) : initValues;
  const serDeAxiomRecord = m.safeMerge(init, jsonValue) as SerDeAxiomRecord<
    TPropAxioms
  >;

  return {
    ...sda,
    jsonText,
    jsonValue,
    serDeAxiomRecord,
  };
}

export function* labeledSerDeAxioms<Label extends string, TsValueType = Any>(
  asds: AxiomsSerDeSupplier<TsValueType>,
  include: (
    d:
      & IdentifiableAxiomSerDe<TsValueType, string>
      & LabeledAxiomSerDe<TsValueType, Label>,
  ) => boolean,
): Generator<
  & IdentifiableAxiomSerDe<TsValueType, string>
  & LabeledAxiomSerDe<TsValueType, Label>,
  void
> {
  for (const d of asds.serDeAxioms) {
    if (isLabeledAxiomSerDe<TsValueType, Label>(d) && include(d)) {
      yield d;
    }
  }
}

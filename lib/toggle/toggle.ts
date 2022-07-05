import * as safety from "../safety/mod.ts";
import * as ax from "../safety/axiom.ts";

/**
 * A `toggle` is an Axiom-typed "data definition" for defining "feature flags"
 * or [feature toggles](https://martinfowler.com/articles/feature-toggles.html)
 * that can be stored in the environment, a database, etc.
 *
 * A `toggles` object groups multiple Axiom-typed `toggle` instances and treats
 * them as a collection.
 */

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export type LabelsSupplier<Label extends string> = { readonly labels: Label[] };

export function isLabelsSupplier<Label extends string>(
  o: unknown,
): o is LabelsSupplier<Label> {
  const isLSD = safety.typeGuard<LabelsSupplier<Label>>("labels");
  return isLSD(o);
}

export type AxiomToggle<TsValueType> = ax.Axiom<TsValueType> & {
  readonly fromText: (text: string, srcHint: "env") => TsValueType;
  readonly defaultValue?: <Context>(ctx?: Context) => TsValueType;
  readonly isOptional: boolean;
};

export function isAxiomToggle<TsValueType>(
  o: unknown,
): o is AxiomToggle<TsValueType> {
  const isAT = safety.typeGuard<
    AxiomToggle<TsValueType>
  >("isOptional");
  return isAT(o);
}

export type IdentifiableToggle<
  TsValueType,
  ToggleIdentity extends string = string,
> =
  & AxiomToggle<TsValueType>
  & { readonly identity: ToggleIdentity };

export function isIdentifiableToggle<
  TsValueType,
  ToggleIdentity extends string = string,
>(o: unknown): o is IdentifiableToggle<TsValueType, ToggleIdentity> {
  const isISD = safety.typeGuard<
    IdentifiableToggle<TsValueType, ToggleIdentity>
  >("identity");
  return isAxiomToggle(o) && isISD(o);
}

export type LabeledToggle<TsValueType, Label extends string> =
  & AxiomToggle<TsValueType>
  & LabelsSupplier<Label>;

export function isLabeledToggle<TsValueType, Label extends string>(
  o: unknown,
): o is LabeledToggle<TsValueType, Label> {
  const isLT = safety.typeGuard<LabeledToggle<TsValueType, Label>>("labels");
  return isAxiomToggle(o) && isLT(o);
}

export function label<TsValueType, Label extends string>(
  toggle: AxiomToggle<TsValueType>,
  ...labels: Label[]
): LabeledToggle<TsValueType, Label> {
  return {
    ...toggle,
    labels,
  };
}

export function defaultable<TsValueType>(
  toggle: AxiomToggle<TsValueType>,
  defaultValue: <Context>(ctx?: Context) => TsValueType,
): AxiomToggle<TsValueType> {
  return { ...toggle, defaultValue };
}

export function text(
  axiom: ax.Axiom<string> = ax.$.string,
  atOptions?: Partial<AxiomToggle<string>>,
): AxiomToggle<string> {
  return {
    ...axiom,
    fromText: (text) => text,
    isOptional: false,
    ...atOptions,
  };
}

export function textOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomToggle<string>>,
): AxiomToggle<string | undefined> {
  return { ...axiom, fromText: (text) => text, isOptional: true, ...atOptions };
}

export function date(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomToggle<Date>>,
): AxiomToggle<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomToggle<Date | undefined>>,
): AxiomToggle<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function dateTime(
  axiom: ax.Axiom<Date> = ax.$.date,
  atOptions?: Partial<AxiomToggle<Date>>,
): AxiomToggle<Date> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: false,
    ...atOptions,
  };
}

export function dateTimeOptional(
  axiom: ax.Axiom<Date | undefined> = ax.$.date.optional(),
  atOptions?: Partial<AxiomToggle<Date | undefined>>,
): AxiomToggle<Date | undefined> {
  return {
    ...axiom,
    fromText: (text) => new Date(text),
    isOptional: true,
    ...atOptions,
  };
}

export function boolean(
  axiom: ax.Axiom<boolean> = ax.$.boolean,
  atOptions?: Partial<AxiomToggle<boolean>>,
): AxiomToggle<boolean> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function booleanOptional(
  axiom: ax.Axiom<boolean | undefined> = ax.$.boolean.optional(),
  atOptions?: Partial<AxiomToggle<boolean>>,
): AxiomToggle<boolean | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export function integer(
  axiom: ax.Axiom<number> = ax.$.number,
  atOptions?: Partial<AxiomToggle<number>>,
): AxiomToggle<number> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: false,
    ...atOptions,
  };
}

export function integerOptional(
  axiom: ax.Axiom<number | undefined> = ax.$.number.optional(),
  atOptions?: Partial<AxiomToggle<number>>,
): AxiomToggle<number | undefined> {
  return {
    ...axiom,
    fromText: (text) => parseInt(text),
    isOptional: true,
    ...atOptions,
  };
}

export function bigint(
  axiom: ax.Axiom<bigint> = ax.$.bigint,
  atOptions?: Partial<AxiomToggle<bigint>>,
): AxiomToggle<bigint> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: false,
    ...atOptions,
  };
}

export function bigintOptional(
  axiom: ax.Axiom<bigint | undefined> = ax.$.bigint.optional(),
  atOptions?: Partial<AxiomToggle<bigint>>,
): AxiomToggle<bigint | undefined> {
  return {
    ...axiom,
    fromText: (text) => BigInt(JSON.parse(text)),
    isOptional: true,
    ...atOptions,
  };
}

export function object<TPropAxioms extends Record<string, ax.Axiom<Any>>>(
  axiom: TPropAxioms,
  atOptions?: Partial<AxiomToggle<string>>,
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
  atOptions?: Partial<AxiomToggle<string>>,
): AxiomToggle<string> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: false,
    ...atOptions,
  };
}

export function jsonTextOptional(
  axiom: ax.Axiom<string | undefined> = ax.$.string.optional(),
  atOptions?: Partial<AxiomToggle<string>>,
): AxiomToggle<string | undefined> {
  return {
    ...axiom,
    fromText: (text) => JSON.parse(text),
    isOptional: true,
    ...atOptions,
  };
}

export interface TogglesSupplier<TsValueType = Any> {
  readonly toggles: IdentifiableToggle<TsValueType>[];
}

export function isTogglesSupplier<TsValueType>(
  o: unknown,
): o is TogglesSupplier<TsValueType> {
  const isSDS = safety.typeGuard<TogglesSupplier<TsValueType>>("toggles");
  return isSDS(o);
}

export function typedToggles<TPropAxioms extends Record<string, ax.Axiom<Any>>>(
  props: TPropAxioms,
  tt?: {
    readonly onPropertyNotAxiomToggle?: (
      name: string,
      axiom: Any,
      toggles: IdentifiableToggle<Any>[],
    ) => void;
  },
) { // we let Typescript infer function return to allow generics to be more effective
  const { onPropertyNotAxiomToggle } = tt ?? {};
  const toggles: IdentifiableToggle<Any>[] = [];
  const axiom = ax.$.object(props);
  Object.entries(axiom.axiomObjectDecl).forEach((entry) => {
    const [name, axiom] = entry;
    if (isAxiomToggle<Any>(axiom)) {
      const mutatableIT = axiom as safety.Writeable<IdentifiableToggle<Any>>;
      mutatableIT.identity = name as Any;
      toggles.push(mutatableIT);
    } else {
      onPropertyNotAxiomToggle?.(name, axiom, toggles);
    }
  });

  // we let Typescript infer function return to allow generics to be more
  // easily passed to consumers (if we typed it to an interface we'd limit
  // the type-safety)
  // ESSENTIAL: be sure it adheres to TogglesSupplier contract
  return {
    ...axiom,
    toggles,
  };
}

export function* labeledToggles<Label extends string, TsValueType = Any>(
  ts: TogglesSupplier<TsValueType>,
  include: (
    d:
      & IdentifiableToggle<TsValueType, string>
      & LabeledToggle<TsValueType, Label>,
  ) => boolean,
): Generator<
  & IdentifiableToggle<TsValueType, string>
  & LabeledToggle<TsValueType, Label>,
  void
> {
  for (const d of ts.toggles) {
    if (isLabeledToggle<TsValueType, Label>(d) && include(d)) {
      yield d;
    }
  }
}

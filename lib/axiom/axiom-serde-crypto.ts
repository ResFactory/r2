import * as axsd from "./axiom-serde.ts";
import * as hex from "https://deno.land/std@0.147.0/encoding/hex.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

/**
 * An AxiomSerDe supplier which sets the default value of the Axiom to a UUIDv4
 * value.
 * @param axiomSD the AxiomSerDe base
 * @param isDefaultable a function which determines whether the default value should be used
 * @returns an AxiomSerDe definition can be assigned to an axioms record collection
 */
export function uuidAxiomSD(
  axiomSD = axsd.text(),
  isDefaultable: <Context>(value?: string, ctx?: Context) => boolean = (
    value,
  ) => value == undefined ? true : false,
) {
  return axsd.defaultable(axiomSD, () => crypto.randomUUID(), isDefaultable);
}

export async function sha1Digest(
  textSupplier: string | (() => string | Promise<string>),
) {
  const text = typeof textSupplier === "function"
    ? await textSupplier()
    : textSupplier;
  const digest = await crypto.subtle.digest(
    "sha-1",
    new TextEncoder().encode(text),
  );
  return new TextDecoder().decode(hex.encode(new Uint8Array(digest)));
}

export const sha1DigestUndefined = `sha1DigestPlacholder` as const;

/**
 * TODO: An AxiomSerDe supplier which sets the default value of the Axiom to a SHA-1
 * digest of a given value. THIS DOES NOT WORK RIGHT NOW BUT NEEDS TO BE IMPLEMENTED.
 * @param axiomSD the AxiomSerDe base
 * @param isDefaultable a function which determines whether the default value should be used
 * @returns an AxiomSerDe definition can be assigned to an axioms record collection
 */
export function sha1DigestAxiomSD(
  digestValue: () => string | Promise<string>,
  axiomSD = axsd.text(),
  isDefaultable?: <Context>(value?: string, ctx?: Context) => boolean,
) {
  return axsd.defaultable(
    axiomSD,
    async () => await sha1Digest(digestValue),
    isDefaultable ??
      ((value) =>
        value == undefined || value == sha1DigestUndefined ? true : false),
  );
}

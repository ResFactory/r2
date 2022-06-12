import * as safety from "../../safety/mod.ts";

export type SqlNamespace = string;

export interface SqlNamespaceSupplier {
  readonly sqlNamespace: SqlNamespace;
}

export interface TemplateStringSqlSpace extends SqlNamespaceSupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export function templateStringSqlSpace(
  sqlNamespace: string,
  templateLiterals: TemplateStringsArray,
  templateExprs: unknown[],
): TemplateStringSqlSpace {
  return {
    sqlNamespace,
    templateLiterals,
    templateExprs,
  };
}

export const isSqlSpaceSupplier = safety.typeGuard<SqlNamespaceSupplier>(
  "sqlNamespace",
);

export const isTemplateStringSqlSpace = safety.typeGuard<
  TemplateStringSqlSpace
>("sqlNamespace", "templateLiterals", "templateExprs");

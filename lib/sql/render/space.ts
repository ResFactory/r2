import * as safety from "../../safety/mod.ts";

export type SqlSpace = string;

export interface SqlSpaceSupplier {
  readonly sqlSpace: SqlSpace;
}

export interface TemplateStringSqlSpace extends SqlSpaceSupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export function templateStringSqlSpace(
  sqlSpace: string,
  templateLiterals: TemplateStringsArray,
  templateExprs: unknown[],
): TemplateStringSqlSpace {
  return {
    sqlSpace,
    templateLiterals,
    templateExprs,
  };
}

export const isSqlSpaceSupplier = safety.typeGuard<SqlSpaceSupplier>(
  "sqlSpace",
);

export const isTemplateStringSqlSpace = safety.typeGuard<
  TemplateStringSqlSpace
>("sqlSpace", "templateLiterals", "templateExprs");

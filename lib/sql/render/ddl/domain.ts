import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";

// deno-lint-ignore no-explicit-any
export type Any = any; // make it easier on Deno linting

export interface DataDomainSupplier<
  TsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> {
  readonly sqlDataType: tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly tsType: {
    readonly tsCodeGenEmit: string;
    readonly tsCodeGenDeclare?: string[];
    readonly typeGuard: safety.TypeGuard<TsType>;
  };
}

export function text<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): DataDomainSupplier<string, EmitOptions, Context> {
  return {
    sqlDataType: { SQL: () => `TEXT` },
    tsType: {
      tsCodeGenEmit: "string",
      typeGuard: safety.typeGuard<string>(),
    },
  };
}

export function integer<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): DataDomainSupplier<number, EmitOptions, Context> {
  return {
    sqlDataType: { SQL: () => `INTEGER` },
    tsType: {
      tsCodeGenEmit: "number",
      typeGuard: safety.typeGuard<number>(),
    },
  };
}

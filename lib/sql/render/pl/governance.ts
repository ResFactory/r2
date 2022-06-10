import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as ax from "../../../safety/axiom.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
export type ANONYMOUS = "ANONYMOUS";

export interface RoutineBody<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly identity?: BodyIdentity;
  readonly isValid: boolean;
  readonly content: tmpl.SqlTextSupplier<Context, EmitOptions>;
}

export interface RoutineDefinition<
  RoutineName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly body: RoutineBody<RoutineName, EmitOptions, Context>;
}

export interface AnonymousRoutineDefn<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends RoutineDefinition<ANONYMOUS, EmitOptions, Context> {
  readonly isAnonymousRoutine: boolean;
  readonly isValid: boolean;
  readonly body: RoutineBody<ANONYMOUS, EmitOptions, Context>;
}

export interface NamedRoutineDefn<
  RoutineName extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends RoutineDefinition<RoutineName, EmitOptions, Context> {
  readonly routineName: RoutineName;
  readonly isValid: boolean;
  readonly body: RoutineBody<RoutineName, EmitOptions, Context>;
  readonly argsDefn: ArgAxioms;
  readonly isIdempotent: boolean;
}

export function isAnonymousRoutineDefn<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is AnonymousRoutineDefn<EmitOptions, Context> {
  const isViewDefn = safety.typeGuard<
    AnonymousRoutineDefn<EmitOptions, Context>
  >(
    "isAnonymousRoutine",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}

export function isRoutineDefinition<
  RoutineName extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is NamedRoutineDefn<RoutineName, ArgAxioms, EmitOptions, Context> {
  const isViewDefn = safety.typeGuard<
    NamedRoutineDefn<RoutineName, ArgAxioms, EmitOptions, Context>
  >(
    "routineName",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}

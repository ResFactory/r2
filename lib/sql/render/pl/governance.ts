import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../ddl/domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
export type ANONYMOUS = "ANONYMOUS";

export interface RoutineBody<
  Context,
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly identity?: BodyIdentity;
  readonly isValid: boolean;
  readonly content: tmpl.SqlTextSupplier<Context, EmitOptions>;
}

export interface RoutineDefinition<
  Context,
  RoutineName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly body: RoutineBody<Context, RoutineName, EmitOptions>;
  readonly isIdempotent: boolean;
}

export interface AnonymousRoutineDefn<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends RoutineDefinition<Context, ANONYMOUS, EmitOptions> {
  readonly isAnonymousRoutine: boolean;
  readonly isValid: boolean;
  readonly body: RoutineBody<Context, ANONYMOUS, EmitOptions>;
}

export interface RoutineArgSupplier<
  Context,
  ArgumentName extends string,
  TsType,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends d.DataDomainSupplier<TsType, EmitOptions, Context> {
  readonly argName: ArgumentName;
}

export interface NamedRoutineDefn<
  Context,
  RoutineName extends string,
  ArgumentName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends RoutineDefinition<Context, RoutineName, EmitOptions> {
  readonly routineName: RoutineName;
  readonly isValid: boolean;
  readonly body: RoutineBody<Context, RoutineName, EmitOptions>;
  readonly args?: RoutineArgSupplier<Context, ArgumentName, Any, EmitOptions>[];
}

export function isAnonymousRoutineDefn<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is AnonymousRoutineDefn<Context, EmitOptions> {
  const isViewDefn = safety.typeGuard<
    AnonymousRoutineDefn<Context, EmitOptions>
  >(
    "isAnonymousRoutine",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}

export function isRoutineDefinition<
  Context,
  RoutineName extends string,
  ArgumentName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is NamedRoutineDefn<Context, RoutineName, ArgumentName, EmitOptions> {
  const isViewDefn = safety.typeGuard<
    NamedRoutineDefn<Context, RoutineName, ArgumentName, EmitOptions>
  >(
    "routineName",
    "body",
    "SQL",
  );
  return isViewDefn(o);
}

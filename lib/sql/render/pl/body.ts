import * as safety from "../../../safety/mod.ts";
import * as ws from "../../../text/whitespace.ts";
import * as tmpl from "../template/mod.ts";
import * as govn from "./governance.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export function isBody<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  o: unknown,
): o is govn.RoutineBody<BodyIdentity, EmitOptions, Context> {
  const isB = safety.typeGuard<
    govn.RoutineBody<BodyIdentity, EmitOptions, Context>
  >("content", "SQL");
  return isB(o);
}

export type BodyDefnOptions<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = tmpl.SqlTextSupplierOptions<Context, EmitOptions> & {
  readonly identity?: BodyIdentity;
  readonly surround?: string | {
    readonly pre: string;
    readonly post: string;
  } | ((SQL: string) => string);
};

export function body<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  bOptions?: BodyDefnOptions<BodyIdentity, EmitOptions, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ):
    & govn.RoutineBody<BodyIdentity, EmitOptions, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> => {
    const partial = tmpl.SQL<Context, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const content = partial(literals, ...expressions);
    const { identity, surround } = bOptions ?? {};
    return {
      isValid: true,
      identity,
      content,
      SQL: surround
        ? ((ctx, steOptions) => {
          switch (typeof surround) {
            case "string":
              return `${surround}${content.SQL(ctx, steOptions)}${surround}`;
            case "function":
              return surround(content.SQL(ctx, steOptions));
            default:
              return `${surround.pre}${
                content.SQL(ctx, steOptions)
              }${surround.post}`;
          }
        })
        : content.SQL,
      populateSqlTextLintIssues: () => {},
    };
  };
}

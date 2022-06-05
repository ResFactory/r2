import * as safety from "../../../safety/mod.ts";
import * as ws from "../../../text/whitespace.ts";
import * as tmpl from "../template/mod.ts";
import * as govn from "./governance.ts";

export function isBody<
  Context,
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is govn.RoutineBody<Context, BodyIdentity, EmitOptions> {
  const isB = safety.typeGuard<
    govn.RoutineBody<Context, BodyIdentity, EmitOptions>
  >("content", "SQL");
  return isB(o);
}

export function body<
  Context,
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  bOptions?: tmpl.SqlTextSupplierOptions<Context, EmitOptions> & {
    readonly identity?: BodyIdentity;
    readonly surround?: string | {
      readonly pre: string;
      readonly post: string;
    } | ((SQL: string) => string);
  },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ):
    & govn.RoutineBody<Context, BodyIdentity, EmitOptions>
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

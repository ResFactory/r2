import * as tmpl from "../../template/mod.ts";
import * as r from "../../pl/mod.ts";
import * as ws from "../../../../text/whitespace.ts";

export interface AnonymousRoutineDefnOptions<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly isIdempotent?: boolean;
}

export function anonymousRoutine<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(rdOptions?: AnonymousRoutineDefnOptions<Context, EmitOptions>): (
  literals: TemplateStringsArray,
  ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
) =>
  & r.AnonymousRoutineDefn<Context, EmitOptions>
  & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> {
  return (literals, ...expressions) => {
    const partial = r.body<Context, r.ANONYMOUS, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const body = partial(literals, ...expressions);
    const { isIdempotent = true } = rdOptions ?? {};
    return {
      isValid: body.isValid,
      isAnonymousRoutine: true,
      isIdempotent,
      body,
      populateSqlTextLintIssues: (lintIssues, steOptions) =>
        body.populateSqlTextLintIssues(lintIssues, steOptions),
      SQL: (ctx, steOptions) => {
        const rawBodySqlText = body.SQL(ctx, steOptions);
        const bodySqlText = steOptions.indentation(
          "create routine body",
          rawBodySqlText,
        );
        return steOptions.indentation(
          "create routine",
          `DO $$\n${bodySqlText}\n$$`,
        );
      },
    };
  };
}

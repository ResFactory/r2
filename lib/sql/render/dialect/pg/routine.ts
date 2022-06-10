import * as tmpl from "../../template/mod.ts";
import * as r from "../../pl/mod.ts";
import * as ws from "../../../../text/whitespace.ts";
import * as ax from "../../../../safety/axiom.ts";
import * as d from "../../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PgProceduralLang<
  Language extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> {
  readonly identity: Language;
  readonly sqlPartial: (
    destination:
      | "after procedure args declaration, before body"
      | "after function args declaration, before body"
      | "after body definition",
  ) => tmpl.SqlTextSupplier<Context, EmitOptions>;
}

export const plPgSqlIdentity = "PL/pgSQL" as const;
export function plPgSqlLanguage<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): PgProceduralLang<typeof plPgSqlIdentity, EmitOptions, Context> {
  return {
    identity: plPgSqlIdentity,
    sqlPartial: () => ({
      SQL: () => `LANGUAGE PLPGSQL`,
    }),
  };
}

export interface PgProceduralLangBody<
  BodyIdentity extends string,
  Language extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends r.RoutineBody<BodyIdentity, EmitOptions, Context> {
  readonly pgPL: PgProceduralLang<Language, EmitOptions, Context>;
}

export function pgPlSqlBody<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(identity: BodyIdentity, bOptions?: { readonly autoBeginEnd: boolean }) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const contentPartial = tmpl.SQL<Context, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const content = contentPartial(literals, ...expressions);
    const { autoBeginEnd = true } = bOptions ?? {};
    const result:
      & PgProceduralLangBody<
        BodyIdentity,
        typeof plPgSqlIdentity,
        EmitOptions,
        Context
      >
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
        isValid: true,
        identity,
        content,
        SQL: (ctx, steOptions) => {
          const contentSQL = steOptions.indentation(
            "create routine body",
            content.SQL(ctx, steOptions),
          );
          return autoBeginEnd ? `BEGIN\n${contentSQL}\nEND;` : contentSQL;
        },
        populateSqlTextLintIssues: () => {},
        pgPL: plPgSqlLanguage(),
      };
    return result;
  };
}

export function safePgPlSqlBody<
  BodyIdentity extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  identity: BodyIdentity,
  _argDefns: ArgAxioms,
  bOptions?: { readonly autoBeginEnd: boolean },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const contentPartial = tmpl.SQL<Context, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const content = contentPartial(literals, ...expressions);
    const { autoBeginEnd = true } = bOptions ?? {};
    const result:
      & PgProceduralLangBody<
        BodyIdentity,
        typeof plPgSqlIdentity,
        EmitOptions,
        Context
      >
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
        isValid: true,
        identity,
        content,
        SQL: (ctx, steOptions) => {
          const contentSQL = steOptions.indentation(
            "create routine body",
            content.SQL(ctx, steOptions),
          );
          return autoBeginEnd ? `BEGIN\n${contentSQL}\nEND;` : contentSQL;
        },
        populateSqlTextLintIssues: () => {},
        pgPL: plPgSqlLanguage(),
      };
    return result;
  };
}

export interface AnonymousRoutineDefnOptions<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly autoBeginEnd: boolean;
}

export function anonymousPlPgSqlRoutine<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(rdOptions?: AnonymousRoutineDefnOptions<EmitOptions, Context>): (
  literals: TemplateStringsArray,
  ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
) =>
  & r.AnonymousRoutineDefn<EmitOptions, Context>
  & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> {
  return (literals, ...expressions) => {
    const partial = pgPlSqlBody<r.ANONYMOUS, EmitOptions, Context>(
      "ANONYMOUS",
      rdOptions,
    );
    const body = partial(literals, ...expressions);
    return {
      isValid: body.isValid,
      isAnonymousRoutine: true,
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

export interface StoredRoutineDefnOptions<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends tmpl.SqlTextSupplierOptions<Context, EmitOptions> {
  readonly autoBeginEnd: boolean;
  readonly isIdempotent?: boolean;
  readonly headerBodySeparator?: string;
}

// deno-lint-ignore no-empty-interface
export interface StoredProcedureDefnOptions<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends StoredRoutineDefnOptions<EmitOptions, Context> {
}

export function pgPlSqlStoredProcedure<
  RoutineName extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  routineName: RoutineName,
  argsDefn: ArgAxioms,
  spOptions?: StoredProcedureDefnOptions<EmitOptions, Context> & {
    readonly onPropertyNotAxiomSqlDomain?: (
      name: string,
      axiom: Any,
      domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
    ) => void;
  },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const bodyPartial = safePgPlSqlBody<
      RoutineName,
      ArgAxioms,
      EmitOptions,
      Context
    >(routineName, argsDefn, spOptions);
    const body = bodyPartial(literals, ...expressions);
    const { isIdempotent = true, headerBodySeparator: hbSep = "$$" } =
      spOptions ?? {};
    const sd = d.sqlDomains(argsDefn, spOptions);
    const argsSS = sd.domains.map((arg) => ({
      name: arg.identity,
      type: arg.sqlDataType("stored routine arg"),
    }));
    const result:
      & r.NamedRoutineDefn<RoutineName, ArgAxioms, EmitOptions, Context>
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
        routineName,
        argsDefn,
        isValid: body.isValid,
        isIdempotent,
        body,
        populateSqlTextLintIssues: (lintIssues, steOptions) =>
          body.populateSqlTextLintIssues(lintIssues, steOptions),
        SQL: (ctx, steOptions) => {
          const ns = steOptions.namingStrategy(ctx, { quoteIdentifiers: true });
          const bodySqlText = body.SQL(ctx, steOptions);
          const argsSQL = argsSS.map((arg) =>
            `${ns.storedRoutineArg(arg.name)} ${arg.type.SQL(ctx, steOptions)}`
          ).join(", ");
          const langSQL = body.pgPL.sqlPartial("after body definition").SQL(
            ctx,
            steOptions,
          );
          return steOptions.indentation(
            "create routine",
            // deno-fmt-ignore
            `CREATE${isIdempotent ? ` OR REPLACE` : ""} PROCEDURE ${ns.storedRoutineName(routineName)}(${argsSQL}) AS ${hbSep}\n${bodySqlText}\n${hbSep}${langSQL};`,
          );
        },
      };
    return result;
  };
}

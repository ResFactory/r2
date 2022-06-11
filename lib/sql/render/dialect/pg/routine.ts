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

export interface PgProceduralLangSupplier<
  Language extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> {
  readonly pgPL: PgProceduralLang<Language, EmitOptions, Context>;
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

export const plSqlIdentity = "PL/SQL" as const;
export function plSqlLanguage<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): PgProceduralLang<typeof plSqlIdentity, EmitOptions, Context> {
  return {
    identity: plSqlIdentity,
    sqlPartial: () => ({
      SQL: () => `LANGUAGE SQL`,
    }),
  };
}

export interface PgProceduralLangBody<
  BodyIdentity extends string,
  Language extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends
  r.RoutineBody<BodyIdentity, EmitOptions, Context>,
  PgProceduralLangSupplier<Language, EmitOptions, Context> {
}

export function untypedPlSqlBody<
  BodyIdentity extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(identity: BodyIdentity) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const contentPartial = tmpl.SQL<Context, EmitOptions>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const content = contentPartial(literals, ...expressions);
    const result:
      & PgProceduralLangBody<
        BodyIdentity,
        typeof plSqlIdentity,
        EmitOptions,
        Context
      >
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
        isValid: true,
        identity,
        content,
        SQL: (ctx, steOptions) => {
          return steOptions.indentation(
            "create routine body",
            content.SQL(ctx, steOptions),
          );
        },
        populateSqlTextLintIssues: () => {},
        pgPL: plSqlLanguage(),
      };
    return result;
  };
}

export function untypedPlPgSqlBody<
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
          return autoBeginEnd
            ? `BEGIN\n${
              steOptions.indentation(
                "create routine body",
                content.SQL(ctx, steOptions),
              )
            }\nEND;`
            : content.SQL(ctx, steOptions);
        },
        populateSqlTextLintIssues: () => {},
        pgPL: plPgSqlLanguage(),
      };
    return result;
  };
}

export function typedPlSqlBody<
  BodyIdentity extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  identity: BodyIdentity,
  argDefns: ArgAxioms,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const untypedBody = untypedPlSqlBody<BodyIdentity, EmitOptions, Context>(
      identity,
    );
    return {
      ...argDefns,
      ...untypedBody(literals, ...expressions),
    };
  };
}

export function typedPlPgSqlBody<
  BodyIdentity extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  identity: BodyIdentity,
  argDefns: ArgAxioms,
  bOptions?: { readonly autoBeginEnd: boolean },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    const untypedBody = untypedPlPgSqlBody<BodyIdentity, EmitOptions, Context>(
      identity,
      bOptions,
    );
    return {
      ...argDefns,
      ...untypedBody(literals, ...expressions),
    };
  };
}

export function typicalPgProcLangBodySqlTextSupplier<
  BodyIdentity extends string,
  Language extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  body:
    & PgProceduralLangBody<BodyIdentity, Language, EmitOptions, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>,
) {
  const result:
    & tmpl.SqlTextSupplier<Context, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
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
  return result;
}

export function anonymousPlSqlRoutine<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(): (
  literals: TemplateStringsArray,
  ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
) =>
  & r.AnonymousRoutineDefn<EmitOptions, Context>
  & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> {
  return (literals, ...expressions) => {
    const body = untypedPlSqlBody<r.ANONYMOUS, EmitOptions, Context>(
      "ANONYMOUS",
    )(literals, ...expressions);
    return {
      isValid: body.isValid,
      isAnonymousRoutine: true,
      body,
      ...typicalPgProcLangBodySqlTextSupplier(body),
    };
  };
}

export function anonymousPlPgSqlRoutine<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(rdOptions?: { readonly autoBeginEnd: boolean }): (
  literals: TemplateStringsArray,
  ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
) =>
  & r.AnonymousRoutineDefn<EmitOptions, Context>
  & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> {
  return (literals, ...expressions) => {
    const body = untypedPlPgSqlBody<r.ANONYMOUS, EmitOptions, Context>(
      "ANONYMOUS",
      rdOptions,
    )(literals, ...expressions);
    return {
      isValid: body.isValid,
      isAnonymousRoutine: true,
      body,
      ...typicalPgProcLangBodySqlTextSupplier(body),
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

export function storedProcedure<
  RoutineName extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  BodyTemplateSupplier extends (
    routineName: RoutineName,
    argsDefn: ArgAxioms,
    spOptions?: StoredProcedureDefnOptions<EmitOptions, Context>,
  ) => tmpl.SafeTemplateString<
    tmpl.SqlPartialExpression<Context, EmitOptions>,
    Any
  >,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  BodyTemplateReturnType extends tmpl.SafeTemplateStringReturnType<
    BodyTemplateSupplier
  > = tmpl.SafeTemplateStringReturnType<BodyTemplateSupplier>,
>(
  routineName: RoutineName,
  argsDefn: ArgAxioms,
  bodyTemplate: BodyTemplateSupplier,
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
    const body = bodyTemplate(routineName, argsDefn)(
      literals,
      ...expressions,
    );
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
            `CREATE${isIdempotent ? ` OR REPLACE` : ""} PROCEDURE ${ns.storedRoutineName(routineName)}(${argsSQL}) AS ${hbSep}\n${bodySqlText}\n${hbSep} ${langSQL};`,
          );
        },
      };
    return result;
  };
}

// deno-lint-ignore no-empty-interface
export interface StoredFunctionDefnOptions<
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends StoredRoutineDefnOptions<EmitOptions, Context> {
}

export function storedFunction<
  RoutineName extends string,
  ArgAxioms extends Record<string, ax.Axiom<Any>>,
  Returns extends
    | d.AxiomSqlDomain<Any, EmitOptions, Context> // arbitrary domain
    | Record<string, ax.Axiom<Any>> // TABLE
    | "RECORD"
    | string, // arbitrary SQL
  BodyTemplateSupplier extends (
    routineName: RoutineName,
    argsDefn: ArgAxioms,
    returns: Returns,
    spOptions?: StoredFunctionDefnOptions<EmitOptions, Context>,
  ) => tmpl.SafeTemplateString<
    tmpl.SqlPartialExpression<Context, EmitOptions>,
    Any
  >,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  BodyTemplateReturnType extends tmpl.SafeTemplateStringReturnType<
    BodyTemplateSupplier
  > = tmpl.SafeTemplateStringReturnType<BodyTemplateSupplier>,
>(
  routineName: RoutineName,
  argsDefn: ArgAxioms,
  returns: Returns,
  bodyTemplate: BodyTemplateSupplier,
  sfOptions?: StoredFunctionDefnOptions<EmitOptions, Context> & {
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
    const body = bodyTemplate(routineName, argsDefn, returns, sfOptions)(
      literals,
      ...expressions,
    );
    const { isIdempotent = true, headerBodySeparator: hbSep = "$$" } =
      sfOptions ?? {};
    const argsSD = d.sqlDomains(argsDefn, sfOptions);
    const argsSS = argsSD.domains.map((arg) => ({
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
          let returnsSQL: string;
          if (typeof returns === "string") {
            returnsSQL = returns;
          } else {
            if (ax.isAxiom(returns)) {
              returnsSQL = returns.sqlDataType("stored function returns scalar")
                .SQL(ctx, steOptions);
            } else {
              const returnsSD = d.sqlDomains(returns, sfOptions);
              returnsSQL = `TABLE(${
                returnsSD.domains.map((
                  r,
                ) => (`${ns.storedRoutineReturns(r.identity)} ${
                  r.sqlDataType("stored function returns table column").SQL(
                    ctx,
                    steOptions,
                  )
                }`)).join(", ")
              })`;
            }
          }
          const langSQL = body.pgPL.sqlPartial("after body definition").SQL(
            ctx,
            steOptions,
          );
          return steOptions.indentation(
            "create routine",
            // deno-fmt-ignore
            `CREATE${isIdempotent ? ` OR REPLACE` : ""} FUNCTION ${ns.storedRoutineName(routineName)}(${argsSQL}) RETURNS ${returnsSQL} AS ${hbSep}\n${bodySqlText}\n${hbSep} ${langSQL};`,
          );
        },
      };
    return result;
  };
}

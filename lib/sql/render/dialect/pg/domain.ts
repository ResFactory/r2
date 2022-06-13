import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as d from "../../domain.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
export type DomainName = string;

export interface DomainDefinition<
  TsType,
  DN extends DomainName,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context>, d.AxiomSqlDomain<TsType, Context> {
  readonly domainName: DN;
  readonly isIdempotent: boolean;
}

export function isDomainDefinition<
  TsType,
  DN extends DomainName,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is DomainDefinition<TsType, DN, Context> {
  const isSD = safety.typeGuard<
    DomainDefinition<TsType, DN, Context>
  >(
    "domainName",
    "SQL",
  );
  return d.isAxiomSqlDomain(o) && isSD(o);
}

export interface SchemaDefnOptions<
  DN extends DomainName,
  Context extends tmpl.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
  readonly warnOnDuplicate?: (
    identifier: string,
    ctx: Context,
  ) => string;
  readonly humanFriendlyFmtIndent?: string;
}

export function pgDomainDefn<
  TsType,
  DN extends DomainName,
  Context extends tmpl.SqlEmitContext,
>(
  dd: d.AxiomSqlDomain<TsType, Context>,
  domainName: DN,
  ddOptions?: SchemaDefnOptions<DN, Context>,
) {
  const { isIdempotent = false, humanFriendlyFmtIndent: hffi } = ddOptions ??
    {};
  const result:
    & tmpl.SqlTextLintIssuesSupplier<Context>
    & tmpl.SqlTextSupplier<Context> = {
      populateSqlTextLintIssues: () => {},
      SQL: (ctx) => {
        const identifier = domainName;
        const asType = dd.sqlDataType("PostgreSQL domain").SQL(ctx);
        if (isIdempotent) {
          if (ddOptions?.warnOnDuplicate) {
            const [_, quotedWarning] = ctx.sqlTextEmitOptions.quotedLiteral(
              ddOptions.warnOnDuplicate(identifier, ctx),
            );
            return hffi
              ? uws(`
                  BEGIN
                  ${hffi}CREATE DOMAIN ${identifier} AS ${asType};
                  EXCEPTION
                  ${hffi}WHEN DUPLICATE_OBJECT THEN
                  ${hffi}${hffi}RAISE NOTICE ${quotedWarning};
                  END`)
              : `BEGIN CREATE DOMAIN ${identifier} AS ${asType}; EXCEPTION WHEN DUPLICATE_OBJECT THEN RAISE NOTICE ${quotedWarning}; END`;
          } else {
            return hffi
              ? uws(`
                  BEGIN
                  ${hffi}CREATE DOMAIN ${identifier} AS ${asType};
                  EXCEPTION
                  ${hffi}WHEN DUPLICATE_OBJECT THEN -- ignore error without warning
                  END`)
              : `BEGIN CREATE DOMAIN ${identifier} AS ${asType}; EXCEPTION WHEN DUPLICATE_OBJECT THEN /* ignore error without warning */ END`;
          }
        } else {
          return `CREATE DOMAIN ${identifier} AS ${asType}`;
        }
      },
    };
  return {
    ...dd,
    isValid: true,
    domainName: domainName,
    isIdempotent,
    ...result,
  };
}

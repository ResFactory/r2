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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> extends
  tmpl.SqlTextSupplier<Context, EmitOptions>,
  d.AxiomSqlDomain<TsType, EmitOptions, Context> {
  readonly domainName: DN;
  readonly isIdempotent: boolean;
}

export function isDomainDefinition<
  TsType,
  Context,
  DN extends DomainName,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is DomainDefinition<TsType, DN, EmitOptions, Context> {
  const isSD = safety.typeGuard<
    DomainDefinition<TsType, DN, EmitOptions, Context>
  >(
    "domainName",
    "SQL",
  );
  return d.isAxiomSqlDomain(o) && isSD(o);
}

export interface SchemaDefnOptions<
  Context,
  DN extends DomainName,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly isIdempotent?: boolean;
  readonly warnOnDuplicate?: (
    identifier: string,
    ctx: Context,
    options: EmitOptions,
  ) => string;
  readonly humanFriendlyFmtIndent?: string;
}

export function pgDomainDefn<
  TsType,
  DN extends DomainName,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  dd: d.AxiomSqlDomain<TsType, EmitOptions, Context>,
  domainName: DN,
  ddOptions?: SchemaDefnOptions<Context, DN, EmitOptions>,
) {
  const { isIdempotent = false, humanFriendlyFmtIndent: hffi } = ddOptions ??
    {};
  const result:
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>
    & tmpl.SqlTextSupplier<Context, EmitOptions> = {
      populateSqlTextLintIssues: () => {},
      SQL: (ctx, steOptions) => {
        const identifier = domainName;
        const asType = dd.sqlDataType("PostgreSQL domain").SQL(ctx, steOptions);
        if (isIdempotent) {
          if (ddOptions?.warnOnDuplicate) {
            const [_, quotedWarning] = steOptions.quotedLiteral(
              ddOptions.warnOnDuplicate(identifier, ctx, steOptions),
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

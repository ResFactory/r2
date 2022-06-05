import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as d from "../../ddl/domain.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";

export type DomainName = string;

export interface DomainDefinition<
  TsType,
  Context,
  DN extends DomainName,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends
  tmpl.SqlTextSupplier<Context, EmitOptions>,
  d.DataDomainSupplier<TsType, EmitOptions, Context> {
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
): o is DomainDefinition<TsType, Context, DN, EmitOptions> {
  const isSD = safety.typeGuard<
    DomainDefinition<TsType, Context, DN, EmitOptions>
  >(
    "tsType",
    "sqlDataType",
    "domainName",
    "SQL",
  );
  return isSD(o);
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

export interface SchemaDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
> {
  pgDomainDefn: <TsType, DN extends DomainName>(
    dd: d.DataDomainSupplier<TsType, EmitOptions, Context>,
    domainName: DN,
    domainDefnOptions?: SchemaDefnOptions<Context, DN, EmitOptions>,
  ) =>
    & DomainDefinition<TsType, Context, DN, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>;
}

export function typicalDomainDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(): SchemaDefnFactory<Context, EmitOptions> {
  return {
    pgDomainDefn: (dd, domainName, ddOptions) => {
      const { isIdempotent = true, humanFriendlyFmtIndent: hffi } = ddOptions ??
        {};
      return {
        ...dd,
        isValid: true,
        domainName: domainName,
        isIdempotent,
        populateSqlTextLintIssues: () => {},
        SQL: (ctx, steOptions) => {
          const identifier = domainName;
          const asType = dd.sqlDataType.SQL(ctx, steOptions);
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
    },
  };
}

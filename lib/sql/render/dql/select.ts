import * as safety from "../../../safety/mod.ts";
import * as ax from "../../../safety/axiom.ts";
import * as tmpl from "../template/mod.ts";
import * as l from "../lint.ts";
import * as d from "../domain.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

// TODO:
// [ ] use https://github.com/oguimbal/pgsql-ast-parser or similar to parse SQL
//     statements and auto-discover columns, tables, etc. instead of requiring
//     developers to provide definition
// [ ] generate dialect-specific EXPLAIN PLAN statements

export type SelectNotFirstWordLintIssue = l.TemplateStringSqlLintIssue;

export interface Select<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly selectStmt: tmpl.SqlTextSupplier<Context>;
  readonly selectStmtName?: SelectStmtName;
}

const firstWordRegEx = /^\s*([a-zA-Z0-9]+)/;

const firstWord = (text: string) => {
  const firstWordMatch = text.match(firstWordRegEx);
  if (firstWordMatch && firstWordMatch.length > 1) {
    return firstWordMatch[1].toUpperCase();
  }
  return false;
};

export function isSelect<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is Select<SelectStmtName, Context> {
  const isSS = safety.typeGuard<
    Select<SelectStmtName, Context>
  >("selectStmt", "SQL");
  return isSS(o);
}

export type SelectTemplateOptions<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
> = tmpl.SqlTextSupplierOptions<Context> & {
  readonly symbolsFirst?: boolean;
  readonly onSelectNotFirstWord?: (issue: SelectNotFirstWordLintIssue) =>
    & Select<SelectStmtName, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context>;
  readonly selectStmtName?: SelectStmtName;
  readonly onPropertyNotAxiomSqlDomain?: (
    name: string,
    axiom: Any,
    domains: d.IdentifiableSqlDomain<Any, Context>[],
  ) => void;
};

export function selectTemplateResult<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  literals: TemplateStringsArray,
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
  ...expressions: tmpl.SqlPartialExpression<Context>[]
) {
  let invalid: SelectNotFirstWordLintIssue | undefined;
  const candidateSQL = literals[0];
  const command = firstWord(candidateSQL);
  if (!(command && command == "SELECT")) {
    invalid = l.templateStringLintIssue(
      "SQL statement does not start with SELECT",
      literals,
      expressions,
    );
    if (ssOptions?.onSelectNotFirstWord) {
      return ssOptions?.onSelectNotFirstWord(invalid);
    }
  }

  // symbolsFirst = true means that any embedded expressions should check for
  // tmpl.SqlSymbolSupplier (e.g. domain, tables, views, etc.) to generate
  // proper names from Typescript tokens
  const selectStmt = ess.embeddedSQL<Context>(
    tmpl.typicalSqlTextSupplierOptions({
      symbolsFirst: ssOptions?.symbolsFirst,
    }),
  )(
    literals,
    ...expressions,
  );
  const { selectStmtName } = ssOptions ?? {};

  const result:
    & Select<SelectStmtName, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context> = {
      isValid: invalid === undefined,
      selectStmtName: selectStmtName,
      selectStmt,
      SQL: invalid
        ? ((ctx) => ctx.sqlTextEmitOptions.comments(invalid!.lintIssue))
        : selectStmt.SQL,
      populateSqlTextLintIssues: (lintIssues) => {
        if (invalid) lintIssues.push(invalid);
        if (selectStmt.lintIssues) lintIssues.push(...selectStmt.lintIssues);
      },
    };
  return result;
}

export function untypedSelect<
  SelectStmtName extends string,
  Context extends tmpl.SqlEmitContext,
>(
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    return selectTemplateResult(literals, ess, ssOptions, ...expressions);
  };
}

export function typedSelect<
  SelectStmtName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  Context extends tmpl.SqlEmitContext,
>(
  props: TPropAxioms,
  ess: tmpl.EmbeddedSqlSupplier,
  ssOptions?: SelectTemplateOptions<SelectStmtName, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context>[]
  ) => {
    return {
      ...d.sqlDomains(props, ssOptions),
      ...selectTemplateResult(literals, ess, ssOptions, ...expressions),
    };
  };
}

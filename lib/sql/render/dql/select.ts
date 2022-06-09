import * as safety from "../../../safety/mod.ts";
import * as ws from "../../../text/whitespace.ts";
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly selectStmt: tmpl.SqlTextSupplier<Context, EmitOptions>;
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
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context,
>(
  o: unknown,
): o is Select<SelectStmtName, EmitOptions, Context> {
  const isSS = safety.typeGuard<
    Select<SelectStmtName, EmitOptions, Context>
  >("selectStmt", "SQL");
  return isSS(o);
}

export type SelectTemplateOptions<
  SelectStmtName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
> = tmpl.SqlTextSupplierOptions<Context, EmitOptions> & {
  readonly onSelectNotFirstWord?: (issue: SelectNotFirstWordLintIssue) => (
    & Select<SelectStmtName, EmitOptions, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>
  );
  readonly selectStmtName?: SelectStmtName;
  readonly onPropertyNotAxiomSqlDomain?: (
    name: string,
    axiom: Any,
    domains: d.IdentifiableSqlDomain<Any, EmitOptions, Context>[],
  ) => void;
};

export function selectTemplateResult<
  SelectStmtName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  literals: TemplateStringsArray,
  ssOptions?: SelectTemplateOptions<SelectStmtName, EmitOptions, Context>,
  ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
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

  const partial = tmpl.SQL<Context, EmitOptions>({
    literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
  });
  const selectStmt = partial(literals, ...expressions);
  const { selectStmtName } = ssOptions ?? {};

  const result:
    & Select<SelectStmtName, EmitOptions, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
      isValid: invalid === undefined,
      selectStmtName: selectStmtName,
      selectStmt,
      SQL: invalid
        ? ((_, steOptions) => steOptions.comments(invalid!.lintIssue))
        : selectStmt.SQL,
      populateSqlTextLintIssues: (lintIssues) => {
        if (invalid) lintIssues.push(invalid);
        if (selectStmt.lintIssues) lintIssues.push(...selectStmt.lintIssues);
      },
    };
  return result;
}

export function select<
  SelectStmtName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(ssOptions?: SelectTemplateOptions<SelectStmtName, EmitOptions, Context>) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    return selectTemplateResult(literals, ssOptions, ...expressions);
  };
}

export function safeSelect<
  SelectStmtName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  props: TPropAxioms,
  ssOptions?: SelectTemplateOptions<SelectStmtName, EmitOptions, Context>,
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: tmpl.SqlPartialExpression<Context, EmitOptions>[]
  ) => {
    return {
      ...d.sqlDomains(props, ssOptions),
      ...selectTemplateResult(literals, ssOptions, ...expressions),
    };
  };
}

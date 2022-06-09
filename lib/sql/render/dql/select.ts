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
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly selectStmt: tmpl.SqlTextSupplier<Context, EmitOptions>;
  readonly selectStmtName?: SelectStmtName;
  readonly columns?: ColumnName[];
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
  ColumnName extends string,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context,
>(
  o: unknown,
): o is Select<SelectStmtName, ColumnName, EmitOptions, Context> {
  const isSS = safety.typeGuard<
    Select<SelectStmtName, ColumnName, EmitOptions, Context>
  >("selectStmt", "SQL");
  return isSS(o);
}

export function select<
  SelectStmtName extends string,
  TPropAxioms extends Record<string, ax.Axiom<Any>>,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
  ColumnName extends keyof TPropAxioms & string = keyof TPropAxioms & string,
>(
  props?: TPropAxioms,
  ssOptions?: tmpl.SqlTextSupplierOptions<Context, EmitOptions> & {
    readonly onSelectNotFirstWord?: (issue: SelectNotFirstWordLintIssue) => (
      & Select<SelectStmtName, ColumnName, EmitOptions, Context>
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>
    );
    readonly selectStmtName?: SelectStmtName;
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
    const sd = props ? d.sqlDomains(props, ssOptions) : undefined;
    const selectColumns = sd
      ? sd.domains.map((d) => d.identity as ColumnName)
      : undefined;

    const result:
      & Select<SelectStmtName, ColumnName, EmitOptions, Context>
      & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
        isValid: invalid === undefined,
        columns: selectColumns,
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
    return {
      ...sd,
      ...result,
    };
  };
}

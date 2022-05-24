import * as safety from "../../safety/mod.ts";
import * as ws from "../../text/whitespace.ts";
import * as t from "./text.ts";
import * as l from "./lint.ts";

export interface SelectNotFirstWordLintIssue extends l.SqlLintIssueSupplier {
  readonly templateLiterals: TemplateStringsArray;
  readonly templateExprs: unknown[];
}

export interface SelectStatement<
  Context,
  SelectStmtName extends string,
  ColumnName extends string,
> extends t.SqlTextSupplier<Context> {
  readonly isValid: boolean;
  readonly selectStmt: t.SqlTextSupplier<Context>;
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

export function isSelectStatement<
  Context,
  SelectStmtName extends string,
  ColumnName extends string,
>(
  o: unknown,
): o is SelectStatement<Context, SelectStmtName, ColumnName> {
  const isSS = safety.typeGuard<
    SelectStatement<Context, SelectStmtName, ColumnName>
  >("selectStmt");
  return isSS(o);
}

export function selectStmt<
  Context,
  SelectStmtName extends string,
  ColumnName extends string,
>(
  ssOptions?: t.SqlPartialOptions<Context> & {
    readonly onSelectNotFirstWord?: (issue: SelectNotFirstWordLintIssue) => (
      & SelectStatement<Context, SelectStmtName, ColumnName>
      & Partial<l.SqlLintIssuesSupplier>
    );
    readonly selectStmtName?: SelectStmtName;
    readonly selectColumns?: ColumnName[];
  },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: t.SqlPartialExpression<Context>[]
  ):
    & SelectStatement<Context, SelectStmtName, ColumnName>
    & Partial<l.SqlLintIssuesSupplier> => {
    let invalid: SelectNotFirstWordLintIssue | undefined;
    const candidateSQL = literals[0];
    const command = firstWord(candidateSQL);
    if (!(command && command == "SELECT")) {
      invalid = {
        lintIssue: "SQL statement does not start with SELECT",
        templateExprs: expressions,
        templateLiterals: literals,
      };
      if (ssOptions?.onSelectNotFirstWord) {
        return ssOptions?.onSelectNotFirstWord(invalid);
      }
    }

    const partial = t.sqlPartial<Context>({
      literalSupplier: ws.whitespaceSensitiveTemplateLiteralSupplier,
    });
    const selectStmt = partial(literals, ...expressions);
    const { selectColumns } = ssOptions ?? {};
    return {
      isValid: invalid === undefined,
      columns: selectColumns,
      selectStmt,
      SQL: invalid
        ? ((_, steOptions) =>
          steOptions?.comments?.(invalid!.lintIssue) ??
            `-- ${invalid!.lintIssue}`)
        : selectStmt.SQL,
      lintIssues: invalid
        ? (selectStmt.lintIssues
          ? [...selectStmt.lintIssues, invalid]
          : [invalid])
        : selectStmt.lintIssues,
    };
  };
}

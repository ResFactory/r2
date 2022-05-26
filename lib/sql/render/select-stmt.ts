import * as safety from "../../safety/mod.ts";
import * as ws from "../../text/whitespace.ts";
import * as t from "./text.ts";
import * as l from "./lint.ts";

export type SelectNotFirstWordLintIssue = l.TemplateStringLintIssue;

export interface SelectStatement<
  Context,
  SelectStmtName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
> extends t.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly selectStmt: t.SqlTextSupplier<Context, EmitOptions>;
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
  EmitOptions extends t.SqlTextEmitOptions,
>(
  o: unknown,
): o is SelectStatement<Context, SelectStmtName, ColumnName, EmitOptions> {
  const isSS = safety.typeGuard<
    SelectStatement<Context, SelectStmtName, ColumnName, EmitOptions>
  >("selectStmt");
  return isSS(o);
}

export function selectStmt<
  Context,
  SelectStmtName extends string,
  ColumnName extends string,
  EmitOptions extends t.SqlTextEmitOptions,
>(
  ssOptions?: t.SqlPartialOptions<Context, EmitOptions> & {
    readonly onSelectNotFirstWord?: (issue: SelectNotFirstWordLintIssue) => (
      & SelectStatement<Context, SelectStmtName, ColumnName, EmitOptions>
      & t.SqlTextLintIssuesSupplier<Context, EmitOptions>
    );
    readonly selectStmtName?: SelectStmtName;
    readonly selectColumns?: ColumnName[];
  },
) {
  return (
    literals: TemplateStringsArray,
    ...expressions: t.SqlPartialExpression<Context, EmitOptions>[]
  ):
    & SelectStatement<Context, SelectStmtName, ColumnName, EmitOptions>
    & t.SqlTextLintIssuesSupplier<Context, EmitOptions> => {
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

    const partial = t.sqlPartial<Context, EmitOptions>({
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
      populateSqlTextLintIssues: (lintIssues) => {
        if (invalid) lintIssues.push(invalid);
        if (selectStmt.lintIssues) lintIssues.push(...selectStmt.lintIssues);
      },
    };
  };
}

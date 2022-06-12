import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type InsertStmtReturning<
  ReturnableRecord,
  ReturnableColumnName extends keyof ReturnableRecord = keyof ReturnableRecord,
  ReturnableColumnExpr extends string = string,
> =
  | "*"
  | "primary-keys"
  | safety.RequireOnlyOne<{
    readonly columns?: ReturnableColumnName[];
    readonly exprs?: ReturnableColumnExpr[];
  }>;

export interface InsertStmtPreparerOptions<
  Context,
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
> {
  readonly isColumnEmittable?: (
    columnName: keyof InsertableRecord,
    record: InsertableRecord,
    tableName: TableName,
  ) => boolean;
  readonly emitColumn?: (
    columnName: keyof InsertableRecord,
    record: InsertableRecord,
    tableName: TableName,
    ns: tmpl.SqlObjectNamingStrategy,
    eo?: EmitOptions,
    ctx?: Context,
  ) =>
    | [columNameSqlText: string, value: unknown, valueSqlText: string]
    | undefined;
  readonly where?:
    | tmpl.SqlTextSupplier<Context, EmitOptions>
    | ((
      ctx?: Context,
      eo?: EmitOptions,
    ) => tmpl.SqlTextSupplier<Context, EmitOptions>);
  readonly onConflict?:
    | tmpl.SqlTextSupplier<Context, EmitOptions>
    | ((
      ctx?: Context,
      eo?: EmitOptions,
    ) => tmpl.SqlTextSupplier<Context, EmitOptions>);
  readonly returning?:
    | InsertStmtReturning<ReturnableRecord>
    | ((
      ctx?: Context,
      eo?: EmitOptions,
    ) => InsertStmtReturning<ReturnableRecord>);
  readonly transformSQL?: (
    suggested: string,
    tableName: TableName,
    record: InsertableRecord,
    names: InsertableColumnName[],
    values: [value: unknown, sqlText: string][],
    ns: tmpl.SqlObjectNamingStrategy,
    eo?: EmitOptions,
    ctx?: Context,
  ) => string;
}

export interface InsertStmtPreparer<
  Context,
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  (
    ir: InsertableRecord,
    options?: InsertStmtPreparerOptions<
      Context,
      TableName,
      InsertableRecord,
      ReturnableRecord,
      EmitOptions
    >,
  ): tmpl.SqlTextSupplier<Context, EmitOptions>;
}

export function typicalInsertStmtPreparer<
  Context,
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
>(
  tableName: TableName,
  candidateColumns: (group?: "all" | "primary-keys") => InsertableColumnName[],
  defaultIspOptions?: InsertStmtPreparerOptions<
    Context,
    TableName,
    InsertableRecord,
    ReturnableRecord,
    EmitOptions
  >,
): InsertStmtPreparer<
  Context,
  TableName,
  InsertableRecord,
  ReturnableRecord,
  EmitOptions
> {
  return (ir, ispOptions = defaultIspOptions) => {
    return {
      SQL: (ctx, eo) => {
        const {
          isColumnEmittable,
          emitColumn,
          returning: returningArg,
          where,
          onConflict,
        } = ispOptions ?? {};
        const ns = eo.namingStrategy(ctx ?? ({} as Context), {
          quoteIdentifiers: true,
        });
        const names: InsertableColumnName[] = [];
        const values: [value: unknown, valueSqlText: string][] = [];
        candidateColumns().forEach((c) => {
          if (isColumnEmittable && !isColumnEmittable(c, ir, tableName)) return;

          let ec: [
            columNameSqlText: string,
            value: unknown,
            valueSqlText: string,
          ] | undefined;
          if (emitColumn) {
            ec = emitColumn(c, ir, tableName, ns, eo, ctx);
          } else {
            const { quotedLiteral } = eo;
            const qValue = quotedLiteral((ir as Any)[c]);
            ec = [c as string, ...qValue];
          }
          if (ec) {
            const [columNameSqlText, value, valueSqlText] = ec;
            names.push(columNameSqlText as InsertableColumnName);
            values.push([value, valueSqlText]);
          }
        });
        const sqlText = (
          ss?:
            | tmpl.SqlTextSupplier<Context, EmitOptions>
            | ((
              ctx?: Context,
              eo?: EmitOptions,
            ) => tmpl.SqlTextSupplier<Context, EmitOptions>),
        ) => {
          if (!ss) return "";
          const SQL = typeof ss == "function"
            ? ss(ctx, eo).SQL(ctx, eo)
            : ss.SQL(ctx, eo);
          return ` ${SQL}`;
        };
        const returning = returningArg
          ? (typeof returningArg === "function"
            ? returningArg(ctx, eo)
            : returningArg)
          : undefined;
        let returningSQL = "";
        if (typeof returning === "string") {
          switch (returning) {
            case "*":
              returningSQL = ` RETURNING *`;
              break;
            case "primary-keys":
              returningSQL = ` RETURNING ${
                candidateColumns("primary-keys").map((n) =>
                  ns.tableColumnName({ tableName, columnName: String(n) })
                ).join(", ")
              }`;
              break;
          }
        } else if (typeof returning === "object") {
          if (returning.columns) {
            returningSQL = ` RETURNING ${
              returning!.columns!.map((n) =>
                ns.tableColumnName({ tableName, columnName: String(n) })
              ).join(", ")
            }`;
          } else {
            returningSQL = ` RETURNING ${
              returning!.exprs!.map((n) =>
                ns.tableColumnName({ tableName, columnName: String(n) })
              ).join(", ")
            }`;
          }
        }
        // deno-fmt-ignore
        const SQL = `INSERT INTO ${ns.tableName(tableName)} (${names.map(n => ns.tableColumnName({ tableName, columnName: String(n) })).join(", ")}) VALUES (${values.map((value) => value[1]).join(", ")
          })${sqlText(where)}${sqlText(onConflict)}${returningSQL}`;
        return ispOptions?.transformSQL
          ? ispOptions?.transformSQL(
            SQL,
            tableName,
            ir,
            names,
            values,
            ns,
            eo,
            ctx,
          )
          : SQL;
      },
    };
  };
}

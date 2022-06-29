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
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
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
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) =>
    | [columNameSqlText: string, value: unknown, valueSqlText: string]
    | undefined;
  readonly where?:
    | tmpl.SqlTextSupplier<Context>
    | ((
      ctx: Context,
    ) => tmpl.SqlTextSupplier<Context>);
  readonly onConflict?:
    | tmpl.SqlTextSupplier<Context>
    | ((
      ctx: Context,
    ) => tmpl.SqlTextSupplier<Context>);
  readonly returning?:
    | InsertStmtReturning<ReturnableRecord>
    | ((
      ctx: Context,
    ) => InsertStmtReturning<ReturnableRecord>);
  readonly transformSQL?: (
    suggested: string,
    tableName: TableName,
    record: InsertableRecord,
    names: InsertableColumnName[],
    values: [value: unknown, sqlText: string][],
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) => string;
}

export interface InsertStmtPreparer<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
> {
  (
    ir: InsertableRecord,
    options?: InsertStmtPreparerOptions<
      TableName,
      InsertableRecord,
      ReturnableRecord,
      Context
    >,
  ): tmpl.SqlTextSupplier<Context>;
}

export function typicalInsertStmtPreparer<
  TableName extends string,
  InsertableRecord,
  ReturnableRecord,
  Context extends tmpl.SqlEmitContext,
  InsertableColumnName extends keyof InsertableRecord = keyof InsertableRecord,
>(
  tableName: TableName,
  candidateColumns: (group?: "all" | "primary-keys") => InsertableColumnName[],
  defaultIspOptions?: InsertStmtPreparerOptions<
    TableName,
    InsertableRecord,
    ReturnableRecord,
    Context
  >,
): InsertStmtPreparer<
  TableName,
  InsertableRecord,
  ReturnableRecord,
  Context
> {
  return (ir, ispOptions = defaultIspOptions) => {
    return {
      SQL: (ctx) => {
        const {
          isColumnEmittable,
          emitColumn,
          returning: returningArg,
          where,
          onConflict,
        } = ispOptions ?? {};
        const { sqlTextEmitOptions: eo } = ctx;
        const ns = ctx.sqlNamingStrategy(ctx, {
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
            ec = emitColumn(c, ir, tableName, ns, ctx);
          } else {
            const { quotedLiteral } = eo;
            const recordValueRaw = (ir as Any)[c];
            if (tmpl.isSqlTextSupplier(recordValueRaw)) {
              ec = [
                c as string,
                recordValueRaw,
                `(${recordValueRaw.SQL(ctx)})`, // e.g. `(SELECT x from y) as SQL expr`
              ];
            } else {
              const qValue = quotedLiteral(recordValueRaw);
              ec = [c as string, ...qValue];
            }
          }
          if (ec) {
            const [columNameSqlText, value, valueSqlText] = ec;
            names.push(columNameSqlText as InsertableColumnName);
            values.push([value, valueSqlText]);
          }
        });
        const sqlText = (
          ss?:
            | tmpl.SqlTextSupplier<Context>
            | ((ctx: Context) => tmpl.SqlTextSupplier<Context>),
        ) => {
          if (!ss) return "";
          const SQL = typeof ss == "function" ? ss(ctx).SQL(ctx) : ss.SQL(ctx);
          return ` ${SQL}`;
        };
        const returning = returningArg
          ? (typeof returningArg === "function"
            ? returningArg(ctx)
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
            ctx,
          )
          : SQL;
      },
    };
  };
}

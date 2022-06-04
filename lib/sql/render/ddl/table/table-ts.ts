import { path } from "../../deps.ts";
import { unindentWhitespace as uws } from "../../../../text/whitespace.ts";
import * as govn from "./governance.ts";
import * as tmpl from "../../template/mod.ts";
import * as s from "./table.ts";

// TODO:
// * [ ] see if generating https://github.com/koskimas/kysely modules makes sense
// * [ ] consider parsing SQL statements for type-safe results using
//       https://tokern.io/blog/open-source-sql-parsers/ - perhaps any SQL statement
//       SQL supplier can be type-safe?
// * [ ] in interface decls:
//   * [ ] PK like `publ_host_id: number;` should be `publ_host_id: PublHostIdentity;`
//   * [ ] FK references to PK's should use PublHostIdentity
// * [ ] add `updatable` method (like `insertable`) to transform${tableTsToken} objects
// * [ ] add `upsert` method which wraps insert with onConflict automation
// * [ ] add data validators to transform${tableTsToken} objects
//       use https://github.com/tinysource/tinysource/tree/main/schema for validators?
// * [ ] add foreign key accessors to parent tables
//         readonly tableChildren: (whereCond: SqlTextSupplier) => Children[]
//         readonly xyz_id: scalar should also have xyz: () => record accessor
// * [ ] add typed column definitions like
//   * [ ] const publHostColumn1Defn = { ... defn }
//   * [ ] const publHostColumns = [publHostColumn1Defn, publHostColumn2Defn, etc]

export interface TypescriptCodeSupplier<Context> {
  readonly typescriptCode: (ctx: Context) => string;
}

// deno-lint-ignore no-empty-interface
export interface TableTypeScriptDeps<Context>
  extends TypescriptCodeSupplier<Context> {
}

export interface TableTypescriptDepsOptions<Context> {
  readonly tsSharedDeclarations?: Set<string>;
}

export function tableTypescriptDeps<Context>(
  tto?: TableTypescriptDepsOptions<Context>,
): TableTypeScriptDeps<Context> {
  const deps: string[] = [];
  if (tto?.tsSharedDeclarations) {
    deps.push("", ...tto?.tsSharedDeclarations.values());
  }
  return {
    typescriptCode: () => {
      return deps.join("\n");
    },
  };
}

// deno-lint-ignore no-empty-interface
export interface TableTypescriptOptions<Context> {
}

export interface TableTypescriptCodeSupplier<Context>
  extends TypescriptCodeSupplier<Context> {
  readonly tsSharedDeclarations?: string[];
}

export function tableGovnTypescript<Context>(
  tableDefn: govn.TableDefinition<Context, govn.Any, govn.Any, govn.Any>,
  steOptions: tmpl.SqlTextEmitOptions<Context>,
  _tsOptions?: TableTypescriptOptions<Context>,
): TableTypescriptCodeSupplier<Context> {
  const snakeToCamelCase = (str: string) =>
    str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());

  const snakeToPascalCase = (str: string) => {
    const camelCase = snakeToCamelCase(str);
    return camelCase[0].toUpperCase() + camelCase.substring(1);
  };

  let tsColumnDeclarations: string[] | undefined = undefined;
  for (const tCD of tableDefn.columns) {
    if (s.isTableColumnDataTypeSupplier(tCD) && tCD.tsType.tsCodeGenDeclare) {
      tsColumnDeclarations = tsColumnDeclarations
        ? [...tsColumnDeclarations, ...tCD.tsType.tsCodeGenDeclare]
        : tCD.tsType.tsCodeGenDeclare;
    }
  }

  return {
    tsSharedDeclarations: tsColumnDeclarations,
    typescriptCode: (ctx) => {
      const ns = steOptions.namingStrategy(ctx);
      const { columns } = tableDefn;
      const pkColumns = [];
      const defaultedColumns = [];
      const tsBody: string[] = [];
      const tableSqlName = ns.tableName(tableDefn.tableName);
      const tableTsToken = snakeToPascalCase(tableDefn.tableName);
      const columnTsToken = (cd: govn.TableColumnNameSupplier<govn.Any>) =>
        snakeToCamelCase(cd.columnName);
      tsBody.push(`export interface mutable_${tableSqlName} {`);
      for (const tCD of tableDefn.columns) {
        if (s.isTableColumnDataTypeSupplier(tCD)) {
          const columnName = ns.tableColumnName({
            tableName: tableDefn.tableName,
            columnName: tCD.columnName,
          });
          const sqlDataType = tCD.sqlDataType.SQL(ctx, steOptions);
          const isPrimaryKey = s.isTableColumnPrimaryKeySupplier(tCD)
            ? tCD.isPrimaryKey
            : false;
          const isColValueRequired = s.isTableColumnNullabilitySupplier(tCD)
            ? tCD.isNullable ? false : true
            : false;
          const defaultSqlValue = s.isTableColumnDefaultValueSupplier(tCD)
            ? tCD.columnDdlDefault?.SQL(ctx, steOptions)
            : undefined;

          const remarks = [sqlDataType];
          if (isColValueRequired) remarks.push("NOT NULL");
          if (s.isTableColumnForeignKeySupplier(tCD)) {
            remarks.push(
              `FK: ${tCD.foreignKey.tableDefn.tableName}.${tCD.foreignKey.tableColumnDefn.columnName}`,
            );
          }
          if (isPrimaryKey) {
            remarks.push("primary key");
            pkColumns.push(tCD);
          }
          if (defaultSqlValue) {
            remarks.push(`default: ${defaultSqlValue}`);
            defaultedColumns.push(tCD);
          }
          const propRequired = isColValueRequired && !defaultSqlValue;
          tsBody.push(
            // deno-fmt-ignore
            `  ${columnName}${propRequired ? "" : "?"}: ${tCD.tsType.tsCodeGenEmit};${remarks.length > 0 ? ` // ${remarks.join(", ")}` : ''}`,
          );
        }
      }
      const pkColumnNames = pkColumns.map((c) =>
        ns.tableColumnName({
          tableName: tableDefn.tableName,
          columnName: c.columnName,
        })
      );
      const omitInsertables = [...pkColumns, ...defaultedColumns];
      const omitUpdatables = omitInsertables;
      const tableTsTokenCC = tableTsToken.charAt(0).toLowerCase() +
        tableTsToken.slice(1);
      tsBody.push(`}\n`);
      // deno-fmt-ignore
      tsBody.push(
        `export const ${tableTsTokenCC}TableName = "${tableSqlName}" as const;`,
        `export const ${tableTsTokenCC}PrimaryKeyColNames = [${pkColumnNames.map((cn) => `"${cn}"`).join(", ")}];`,
        `export type ${tableTsToken}PrimaryKeyColName = ${pkColumnNames.map((cn) => `"${cn}"`).join(" | ")};`,
        `export type ${tableSqlName} = Readonly<mutable_${tableSqlName}>;`,
        `export type Mutable${tableTsToken} = TableToObject<mutable_${tableSqlName}>;`,
        `export type ${tableTsToken} = Readonly<Mutable${tableTsToken}>;`,
        `export type ${tableSqlName}_insertable = Omit<${tableSqlName}, ${omitInsertables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        `export type mutable_${tableSqlName}_insertable = Omit<mutable_${tableSqlName}, ${omitInsertables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<mutable_${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        `export type ${tableTsToken}Insertable = Omit<${tableTsToken}, ${omitInsertables.map(c => `"${columnTsToken(c)}"`).join(" | ")}> & Partial<Pick<${tableTsToken}, ${defaultedColumns.map(c => `"${columnTsToken(c)}"`).join(" | ")}>>;`,
        `export type ${tableSqlName}_updateable = Omit<${tableSqlName}, ${omitUpdatables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        `export type ${tableTsToken}Updatable = Omit<${tableTsToken}, ${omitUpdatables.map(c => `"${columnTsToken(c)}"`).join(" | ")}> & Partial<Pick<${tableTsToken}, ${defaultedColumns.map(c => `"${columnTsToken(c)}"`).join(" | ")}>>;\n`,
      );
      // deno-fmt-ignore
      tsBody.push(uws(`
        export const ${tableTsTokenCC}DT: TableDataTransferSuppliers<typeof ${tableTsTokenCC}TableName, ${tableSqlName}, ${tableTsToken}, ${tableSqlName}_insertable, ${tableTsToken}Insertable> = {
          tableName: ${tableTsTokenCC}TableName,
          fromTable: (record) => ({
            ${columns.map(c => `${columnTsToken(c)}: record.${c.columnName}`).join(",\n            ")}
          }),
          toTable: (o) => ({
            ${columns.map(c => `${c.columnName}: o.${columnTsToken(c)}`).join(",\n            ")}
          }),
          insertable: (o) => {
            const insertable: mutable_${tableSqlName}_insertable = {
              ${columns.filter(c => omitInsertables.find(o => o.columnName == c.columnName && !s.isTableColumnDefaultValueSupplier(c)) ? false : true).map(c => `${c.columnName}: o.${columnTsToken(c)}`).join(",\n              ")}
            };
            ${defaultedColumns.map(dc => `if(typeof insertable.${dc.columnName} === "undefined") delete insertable.${dc.columnName}; // allow RDBMS to supply the defaultValue ${s.isTableColumnDefaultValueSupplier(dc) ? dc.columnDdlDefault.SQL(ctx, steOptions) : ''}`).join("\n              ")}
            return insertable;
          },
        };

        export function ${tableTsTokenCC}DML<Context = unknown, EmitOptions extends SqlTextEmitOptions<Context> = SqlTextEmitOptions<Context>>(): TableDmlSuppliers<Context, typeof ${tableTsTokenCC}TableName, ${pkColumnNames.length > 0 ? `${tableTsToken}PrimaryKeyColName` : "unknown"}, ${tableSqlName}_insertable, ${tableSqlName}, EmitOptions> {
          return {
            tableName: ${tableTsTokenCC}TableName,
            prepareInsertStmt: typicalInsertStmtPreparer(${tableTsTokenCC}TableName, [${columns.filter(c => omitInsertables.find(o => o.columnName == c.columnName && !s.isTableColumnDefaultValueSupplier(c)) ? false : true).map(c => `"${c.columnName}"`).join(",")}]${pkColumnNames.length > 0 ? `, ${tableTsTokenCC}PrimaryKeyColNames` : ''})
          }
        };`));
      return tsBody.join("\n");
    },
  };
}

export interface TablesTypescriptOptions<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly tableTsOptions?: (
    tableDefn: govn.TableDefinition<Context, govn.Any, govn.Any, EmitOptions>,
  ) => TableTypescriptOptions<Context>;
  readonly templateSrcPath?: (suggested: string) => string;
  readonly origin?: string;
}

export function tablesGovnTypescript<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  tableDefns: Iterable<
    govn.TableDefinition<Context, govn.Any, govn.Any, govn.Any>
  >,
  ctx: Context,
  steOptions: EmitOptions,
  tsOptions?: TablesTypescriptOptions<Context, EmitOptions>,
): string {
  const suggested = path.join(
    path.dirname(path.fromFileUrl(import.meta.url)),
    "..",
    "template",
    "emittable-typescript.ts",
  );
  let templateText = Deno.readTextFileSync(
    tsOptions?.templateSrcPath?.(suggested) ?? suggested,
  ).replaceAll(/^\/\/!.*$/gm, "");

  if (tsOptions?.origin) {
    templateText = templateText.replaceAll(
      "${SQL_RENDER_EMIT_TS_ORIGIN}",
      tsOptions?.origin,
    );
  }

  const tsSharedDeclarations: string[] = [];
  const tsCode: TypescriptCodeSupplier<Context>[] = [];

  for (const tableDefn of tableDefns) {
    const ts = tableGovnTypescript(
      tableDefn,
      steOptions,
      tsOptions?.tableTsOptions?.(tableDefn),
    );
    if (ts.tsSharedDeclarations) {
      tsSharedDeclarations.push(...ts.tsSharedDeclarations);
    }
    tsCode.push(ts);
  }
  tsCode.unshift(tableTypescriptDeps({
    tsSharedDeclarations: tsSharedDeclarations
      ? new Set<string>(tsSharedDeclarations.values())
      : undefined,
  }));

  /*
   * Template should have this line in the text, which will get replaced with body:
   *    // ${SQL_RENDER_EMIT_TS_BODY}
   */
  const body = tsCode.map((tsc) => tsc.typescriptCode(ctx)).join("\n\n");
  if (tsOptions?.origin) {
    templateText = templateText.replace(
      /\/\/ \${SQL_RENDER_EMIT_TS_BODY}.*$/m,
      body,
    );
  }

  return templateText;
}

import { unindentWhitespace as uws } from "../../../text/whitespace.ts";
import * as govn from "./governance.ts";
import * as t from "../template/mod.ts";
import * as s from "./storage.ts";

// TODO:
// * [ ] in interface decls:
//   * [ ] PK like `publ_host_id: number;` should be `publ_host_id: PublHostIdentity;`
//   * [ ] FK references to PK's should use PublHostIdentity
// * [ ] add `updatable` method (like `insertable`) to transform${tableTsToken} objects
// * [ ] add data validators to transform${tableTsToken} objects

export interface TypescriptCodeSupplier<Context> {
  readonly typescriptCode: (ctx: Context) => string;
}

// deno-lint-ignore no-empty-interface
export interface TableTypeScriptDeps<Context>
  extends TypescriptCodeSupplier<Context> {
}

export interface TableTypescriptDepsOptions<Context> {
  readonly header?: string[];
  readonly tsSharedDeclarations?: Set<string>;
}

export function tableTypescriptDeps<Context>(
  tto?: TableTypescriptDepsOptions<Context>,
): TableTypeScriptDeps<Context> {
  const typicalTypescriptHeader: string[] = [
    "export type CamelCase<S extends string> = S extends",
    "  `${infer P1}_${infer P2}${infer P3}`",
    "  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`",
    "  : Lowercase<S>;",
    "export type TableToObject<T> = {",
    "  [K in keyof T as CamelCase<string & K>]: T[K] extends Date ? T[K]",
    "    : // deno-lint-ignore ban-types",
    "    (T[K] extends object ? TableToObject<T[K]> : T[K]);",
    "};",
  ];
  if (tto?.header) typicalTypescriptHeader.unshift(...tto?.header.values());
  if (tto?.tsSharedDeclarations) {
    typicalTypescriptHeader.push(...tto?.tsSharedDeclarations.values());
  }
  return {
    typescriptCode: () => {
      return typicalTypescriptHeader.join("\n");
    },
  };
}

// deno-lint-ignore no-empty-interface
export interface TableTypescriptOptions<Context>
  extends TypescriptCodeSupplier<Context> {
}

export interface TableTypescriptCodeSupplier<Context>
  extends TypescriptCodeSupplier<Context> {
  readonly tsSharedDeclarations?: string[];
}

export function tableTypescript<Context>(
  tableDefn: govn.TableDefinition<Context, govn.Any, govn.Any, govn.Any>,
  steOptions: t.SqlTextEmitOptions<Context>,
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
      const omitInsertables = [...pkColumns, ...defaultedColumns];
      const omitUpdatables = omitInsertables;
      tsBody.push(`}\n`);
      tsBody.push(
        `export const ${tableTsToken}TableName = "${tableSqlName}" as const;`,
        `export type ${tableSqlName} = Readonly<mutable_${tableSqlName}>;`,
        `export type Mutable${tableTsToken} = TableToObject<mutable_${tableSqlName}>;`,
        `export type ${tableTsToken} = Readonly<Mutable${tableTsToken}>;`,
        // deno-fmt-ignore
        `export type ${tableSqlName}_insertable = Omit<${tableSqlName}, ${omitInsertables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        // deno-fmt-ignore
        `export type mutable_${tableSqlName}_insertable = Omit<mutable_${tableSqlName}, ${omitInsertables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<mutable_${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        // deno-fmt-ignore
        `export type ${tableTsToken}Insertable = Omit<${tableTsToken}, ${omitInsertables.map(c => `"${columnTsToken(c)}"`).join(" | ")}> & Partial<Pick<${tableTsToken}, ${defaultedColumns.map(c => `"${columnTsToken(c)}"`).join(" | ")}>>;`,
        // deno-fmt-ignore
        `export type ${tableSqlName}_updateable = Omit<${tableSqlName}, ${omitUpdatables.map(c => `"${c.columnName}"`).join(" | ")}> & Partial<Pick<${tableSqlName}, ${defaultedColumns.map(c => `"${c.columnName}"`).join(" | ")}>>;`,
        // deno-fmt-ignore
        `export type ${tableTsToken}Updatable = Omit<${tableTsToken}, ${omitUpdatables.map(c => `"${columnTsToken(c)}"`).join(" | ")}> & Partial<Pick<${tableTsToken}, ${defaultedColumns.map(c => `"${columnTsToken(c)}"`).join(" | ")}>>;\n`,
      );
      // deno-fmt-ignore
      tsBody.push(uws(`
        export const transform${tableTsToken} = {
          tableName: ${tableTsToken}TableName,
          fromTable: (t: ${tableSqlName}): ${tableTsToken} => ({
            ${columns.map(c => `${columnTsToken(c)}: t.${c.columnName}`).join(",\n            ")}
          }),
          toTable: (o: ${tableTsToken}): ${tableSqlName} => ({
            ${columns.map(c => `${c.columnName}: o.${columnTsToken(c)}`).join(",\n            ")}
          }),
          insertable: (o: ${tableTsToken}Insertable): ${tableSqlName}_insertable => {
            const insertable: mutable_${tableSqlName}_insertable = {
              ${columns.filter(c => omitInsertables.find(o => o.columnName == c.columnName && !s.isTableColumnDefaultValueSupplier(c)) ? false : true).map(c => `${c.columnName}: o.${columnTsToken(c)}`).join(",\n              ")}
            };
            ${defaultedColumns.map(dc => `if(typeof insertable.${dc.columnName} === "undefined") delete insertable.${dc.columnName}; // allow RDBMS to supply the defaultValue ${s.isTableColumnDefaultValueSupplier(dc) ? dc.columnDdlDefault.SQL(ctx, steOptions) : ''}`).join("\n              ")}
            return insertable;
          },
        };`));
      return tsBody.join("\n");
    },
  };
}

export function tablesTypescript<Context>(
  tableDefns: Iterable<
    govn.TableDefinition<Context, govn.Any, govn.Any, govn.Any>
  >,
  steOptions: t.SqlTextEmitOptions<Context>,
  _tsOptions?: TableTypescriptOptions<Context>,
): TypescriptCodeSupplier<Context> {
  const tsSharedDeclarations: string[] = [];
  const tsCode: TypescriptCodeSupplier<Context>[] = [];

  for (const tableDefn of tableDefns) {
    const ts = tableTypescript(tableDefn, steOptions, _tsOptions);
    if (ts.tsSharedDeclarations) {
      tsSharedDeclarations.push(...ts.tsSharedDeclarations);
    }
    tsCode.push(ts);
  }
  tsCode.unshift(tableTypescriptDeps({
    header: [`// generated by storage-ts.ts. DO NOT EDIT.`, ""],
    tsSharedDeclarations: tsSharedDeclarations
      ? new Set<string>(tsSharedDeclarations.values())
      : undefined,
  }));

  return {
    typescriptCode: (ctx) => {
      return tsCode.map((tsc) => tsc.typescriptCode(ctx)).join("\n\n");
    },
  };
}

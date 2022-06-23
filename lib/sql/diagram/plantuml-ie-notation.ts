import * as SQLa from "../render/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface PlantUmlIeOptions<Context extends SQLa.SqlEmitContext> {
  readonly diagramName: string;
  readonly includeColumn: (
    d: SQLa.IdentifiableSqlDomain<Any, Context>,
    td: SQLa.TableDefinition<Any, Context>,
  ) => boolean;
  readonly includeEntity: (
    td:
      & SQLa.TableDefinition<Any, Context>
      & SQLa.SqlDomainsSupplier<Any, Context>,
  ) => boolean;
}

export function plantUmlIE<
  Context extends SQLa.SqlEmitContext & {
    readonly plantUmlIeOptions: PlantUmlIeOptions<Context>;
  },
>(
  ctx: Context,
  tables: (
    ctx: Context,
  ) => Generator<
    SQLa.TableDefinition<Any, Context> & SQLa.SqlDomainsSupplier<Any, Context>
  >,
) {
  const ns = ctx.sqlNamingStrategy(ctx);
  const puieOptions = ctx.plantUmlIeOptions;
  const columnPuml = (d: SQLa.IdentifiableSqlDomain<Any, Context>) => {
    const tcName = ns.tableColumnName({
      tableName: "",
      columnName: d.identity,
    });
    const required = d.isNullable ? "" : "*";
    const name = SQLa.isTablePrimaryKeyColumnDefn(d) ? `**${tcName}**` : tcName;
    const descr = "";
    // let descr = tc.column.references
    //   ? (gim.isEnumeration(tc.column.references.table.entity)
    //     ? ` <<ENUM(${tc.column.references.table.name(this.reCtx)})>> `
    //     : ` <<FK(${tc.column.references.table.name(this.reCtx)})>>`)
    //   : "";
    // if ("isSelfReference" in tc.column.forAttr) descr = " <<SELF>>";
    const sqlType = d.sqlDataType("diagram").SQL(ctx);
    return `    ${required} ${name}: ${sqlType}${descr}`;
  };

  // const backRef = (
  //   table: gimRDS.Table,
  //   backRef: gim.InboundRelationshipBackRef<gim.Entity>,
  // ) => {
  //   const name = infl.toCamelCase(backRef.name.plural);
  //   const type = backRef.rel.fromAttr.parent
  //     ? infl.toPascalCase(backRef.rel.fromAttr.parent.name)
  //     : "SHOULD_NEVER_HAPPEN!";
  //   return `    ${name}: ${type}[]`;
  // }

  const tablePuml = (
    td:
      & SQLa.TableDefinition<Any, Context>
      & SQLa.SqlDomainsSupplier<Any, Context>,
  ) => {
    const columns: string[] = [];
    for (const column of td.domains) {
      if (SQLa.isTablePrimaryKeyColumnDefn(column)) {
        columns.push(columnPuml(column));
        columns.push("    --");
      }
    }

    for (const column of td.domains) {
      if (!SQLa.isTablePrimaryKeyColumnDefn(column)) {
        if (!puieOptions.includeColumn(column, td)) continue;
        columns.push(columnPuml(column));
      }
    }

    // const backRefs: string[] = [];
    // if (td.entity.backRefs) {
    //   for (const backRef of td.entity.backRefs) {
    //     backRefs.push(this.backRef(td, backRef));
    //   }
    // }
    // if (backRefs.length > 0) {
    //   backRefs.unshift("    --");
    // }

    return [
      `  entity "${ns.tableName(td.tableName)}" as ${
        ns.tableName(td.tableName)
      } {`,
      ...columns,
      //...backRefs,
      `  }`,
    ];
  };

  const tablesPuml = () => {
    let result: string[] = [];
    for (const table of tables(ctx)) {
      if (!puieOptions.includeEntity(table)) {
        continue;
      }

      result = result.concat(tablePuml(table));
    }
    return result;
  };

  const relationshipsPuml = () => {
    const result: string[] = [];
    // for (const rel of this.options.rdbmsModel.relationships) {
    //   if (
    //     !this.includeRelationship(
    //       this.reCtx,
    //       this.includeColumn,
    //       this.includeEntity,
    //       rel,
    //     )
    //   ) {
    //     continue;
    //   }
    //   const refIsEnum = !gim.isEnumeration(rel.references.table.entity);

    // const src = rel.source;
    // const ref = rel.references;
    // // Relationship types see: https://plantuml.com/es/ie-diagram
    // // Zero or One	|o--
    // // Exactly One	||--
    // // Zero or Many	}o--
    // // One or Many	}|--
    // const relIndicator = refIsEnum ? "|o..o|" : "|o..o{";
    // result.push(
    //   `  ${ref.table.name(this.reCtx)} ${relIndicator} ${src.table.name(this.reCtx)
    //   }`,
    // );
    //}
    if (result.length > 0) result.unshift("");
    return result;
  };

  const content = [
    `@startuml ${puieOptions.diagramName}`,
    "  hide circle",
    "  skinparam linetype ortho",
    "  skinparam roundcorner 20",
    "  skinparam class {",
    "    BackgroundColor White",
    "    ArrowColor Silver",
    "    BorderColor Silver",
    "    FontColor Black",
    "    FontSize 12",
    "  }\n",
    ...tablesPuml(),
    ...relationshipsPuml(),
    "@enduml",
  ].join("\n");

  return content;
}

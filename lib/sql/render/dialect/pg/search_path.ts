import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as sch from "../../ddl/schema.ts";
import * as nsp from "../../namespace.ts";

export interface PostgresSchemaSearchPathDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context> {
  readonly searchPath: SchemaName[];
}

export function isPostgresSchemaSearchPathDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is PostgresSchemaSearchPathDefinition<Context, SchemaName, EmitOptions> {
  const isSD = safety.typeGuard<
    PostgresSchemaSearchPathDefinition<Context, SchemaName, EmitOptions>
  >(
    "searchPath",
    "SQL",
  );
  return isSD(o);
}

// deno-lint-ignore no-empty-interface
export interface PostgresSchemaSearchPathDefnOptions<
  Context,
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
> {
}

export interface PostgresSchemaSearchPathDefnFactory<
  Context,
  Context extends tmpl.SqlEmitContext = tmpl.SqlTextEmitOptions<
    Context
  >,
> extends sch.SchemaDefnFactory<Context> {
  pgSearchPath: <SchemaName extends nsp.SqlNamespace>(
    searchPath: sch.SchemaDefinition<Context, SchemaName, EmitOptions>[],
    spDefnOptions?: PostgresSchemaSearchPathDefnOptions<
      Context,
      SchemaName,
      EmitOptions
    >,
  ) =>
    & PostgresSchemaSearchPathDefinition<Context, SchemaName, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context>;
}

export function typicalPostgresSchemaSearchPathDefnFactory<
  Context,
  Context extends tmpl.SqlEmitContext = tmpl.SqlTextEmitOptions<
    Context
  >,
>(): PostgresSchemaSearchPathDefnFactory<Context> {
  return {
    ...sch.typicalSqlSchemaDefnFactory(),
    pgSearchPath: (searchPath) => {
      return {
        searchPath: searchPath.map((s) => s.sqlNamespace),
        populateSqlTextLintIssues: () => {},
        SQL: (ctx) => {
          return `SET search_path TO ${
            searchPath.map((schema) =>
              steOptions.namingStrategy(ctx, { quoteIdentifiers: true })
                .schemaName(schema.sqlNamespace)
            ).join(", ")
          }`;
        },
      };
    },
  };
}

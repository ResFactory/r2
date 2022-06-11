import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as sch from "../../ddl/schema.ts";
import * as sp from "../../space.ts";

export interface PostgresSchemaSearchPathDefinition<
  Context,
  SchemaName extends sp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly searchPath: SchemaName[];
}

export function isPostgresSchemaSearchPathDefinition<
  Context,
  SchemaName extends sp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
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
  SchemaName extends sp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
}

export interface PostgresSchemaSearchPathDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
> extends sch.SchemaDefnFactory<Context, EmitOptions> {
  pgSearchPath: <SchemaName extends sp.SqlNamespace>(
    searchPath: sch.SchemaDefinition<Context, SchemaName, EmitOptions>[],
    spDefnOptions?: PostgresSchemaSearchPathDefnOptions<
      Context,
      SchemaName,
      EmitOptions
    >,
  ) =>
    & PostgresSchemaSearchPathDefinition<Context, SchemaName, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>;
}

export function typicalPostgresSchemaSearchPathDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(): PostgresSchemaSearchPathDefnFactory<Context, EmitOptions> {
  return {
    ...sch.typicalSqlSchemaDefnFactory(),
    pgSearchPath: (searchPath) => {
      return {
        searchPath: searchPath.map((s) => s.sqlNamespace),
        populateSqlTextLintIssues: () => {},
        SQL: (ctx, steOptions) => {
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

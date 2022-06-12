import * as safety from "../../../../safety/mod.ts";
import * as tmpl from "../../template/mod.ts";
import * as sch from "../../ddl/schema.ts";
import * as nsp from "../../namespace.ts";

export type PostgresExtension = string;

export interface ExtensionDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  ExtensionName extends PostgresExtension,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly extension: ExtensionName;
  readonly isIdempotent: boolean;
  readonly schema: sch.SchemaDefinition<Context, SchemaName, EmitOptions>;
}

export function isExtensionDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  ExtensionName extends PostgresExtension,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is ExtensionDefinition<Context, SchemaName, ExtensionName, EmitOptions> {
  const isSD = safety.typeGuard<
    ExtensionDefinition<Context, SchemaName, ExtensionName, EmitOptions>
  >(
    "extension",
    "SQL",
  );
  return isSD(o);
}

export interface ExtensionDefnOptions<
  Context,
  SchemaName extends nsp.SqlNamespace,
  ExtensionName extends PostgresExtension,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly isIdempotent?: boolean;
}

export interface ExtensionDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
> {
  pgExtensionDefn: <
    SchemaName extends nsp.SqlNamespace,
    ExtensionName extends PostgresExtension,
  >(
    schema: sch.SchemaDefinition<Context, SchemaName, EmitOptions>,
    extension: ExtensionName,
    edOptions?: ExtensionDefnOptions<
      Context,
      SchemaName,
      ExtensionName,
      EmitOptions
    >,
  ) =>
    & ExtensionDefinition<Context, SchemaName, ExtensionName, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>;
}

export function typicalPgExtensionDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(): ExtensionDefnFactory<Context, EmitOptions> {
  return {
    pgExtensionDefn: (schema, extension, edOptions) => {
      const { isIdempotent = true } = edOptions ?? {};
      return {
        isValid: true,
        schema,
        extension,
        isIdempotent,
        populateSqlTextLintIssues: () => {},
        SQL: (ctx, steOptions) => {
          return `CREATE EXTENSION ${
            isIdempotent ? "IF NOT EXISTS " : ""
          }${extension} SCHEMA ${
            steOptions.namingStrategy(ctx, { quoteIdentifiers: true })
              .schemaName(schema.sqlNamespace)
          }`;
        },
      };
    },
  };
}

import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as nsp from "../namespace.ts";

export interface SchemaDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions>, nsp.SqlNamespaceSupplier {
  readonly isValid: boolean;
  readonly sqlNamespace: SchemaName;
  readonly isIdempotent: boolean;
}

export function isSchemaDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is SchemaDefinition<Context, SchemaName, EmitOptions> {
  const isSD = safety.typeGuard<
    SchemaDefinition<Context, SchemaName, EmitOptions>
  >(
    "sqlNamespace",
    "SQL",
  );
  return isSD(o);
}

export interface SchemaDefnOptions<
  Context,
  SchemaName extends nsp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> {
  readonly isIdempotent?: boolean;
}

export interface SchemaDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
> {
  sqlSchemaDefn: <SchemaName extends nsp.SqlNamespace>(
    schemaName: SchemaName,
    schemaDefnOptions?: SchemaDefnOptions<Context, SchemaName, EmitOptions>,
  ) =>
    & SchemaDefinition<Context, SchemaName, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions>;
}

export function typicalSqlSchemaDefnFactory<
  Context,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context> =
    tmpl.SqlTextEmitOptions<
      Context
    >,
>(): SchemaDefnFactory<Context, EmitOptions> {
  return {
    sqlSchemaDefn: (schemaName, sdOptions) => {
      const { isIdempotent = false } = sdOptions ?? {};
      return {
        isValid: true,
        sqlNamespace: schemaName,
        isIdempotent,
        populateSqlTextLintIssues: () => {},
        SQL: (ctx, steOptions) => {
          return `CREATE SCHEMA ${
            isIdempotent ? "IF NOT EXISTS " : ""
          }${steOptions.namingStrategy(ctx, { quoteIdentifiers: true })
            .schemaName?.(schemaName)}`;
        },
      };
    },
  };
}

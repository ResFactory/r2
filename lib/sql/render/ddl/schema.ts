import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as nsp from "../namespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SchemaDefinition<
  Context,
  SchemaName extends nsp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions>, nsp.SqlNamespaceSupplier {
  readonly isValid: boolean;
  readonly sqlNamespace: SchemaName;
  readonly isIdempotent: boolean;
  readonly schemaQualifier: tmpl.NameQualifier;
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

export function sqlSchemaDefn<
  SchemaName extends nsp.SqlNamespace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
  Context = Any,
>(
  schemaName: SchemaName,
  schemaDefnOptions?: SchemaDefnOptions<Context, SchemaName, EmitOptions>,
) {
  const { isIdempotent = false } = schemaDefnOptions ?? {};
  const result:
    & SchemaDefinition<Context, SchemaName, EmitOptions>
    & tmpl.SqlTextLintIssuesSupplier<Context, EmitOptions> = {
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
      schemaQualifier: tmpl.qualifyName(schemaName),
    };
  return result;
}

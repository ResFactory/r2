import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as nsp from "../namespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface SchemaDefinition<
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
> extends tmpl.SqlTextSupplier<Context>, nsp.SqlNamespaceSupplier {
  readonly isValid: boolean;
  readonly sqlNamespace: SchemaName;
  readonly isIdempotent: boolean;
  readonly schemaQualifier: tmpl.NameQualifier;
  readonly qualifiedNames: (baseNS: tmpl.SqlObjectNames) => tmpl.SqlObjectNames;
}

export function isSchemaDefinition<
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
>(
  o: unknown,
): o is SchemaDefinition<SchemaName, Context> {
  const isSD = safety.typeGuard<
    SchemaDefinition<SchemaName, Context>
  >("sqlNamespace", "SQL");
  return isSD(o);
}

export interface SchemaDefnOptions<
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
> {
  readonly isIdempotent?: boolean;
}

export function sqlSchemaDefn<
  SchemaName extends nsp.SqlNamespace,
  Context extends tmpl.SqlEmitContext,
>(
  schemaName: SchemaName,
  schemaDefnOptions?: SchemaDefnOptions<SchemaName, Context>,
) {
  const { isIdempotent = false } = schemaDefnOptions ?? {};
  const schemaQualifier = tmpl.qualifyName(schemaName);
  const result:
    & SchemaDefinition<SchemaName, Context>
    & tmpl.SqlTextLintIssuesSupplier<Context> = {
      isValid: true,
      sqlNamespace: schemaName,
      isIdempotent,
      populateSqlTextLintIssues: () => {},
      SQL: (ctx) => {
        return `CREATE SCHEMA ${isIdempotent ? "IF NOT EXISTS " : ""}${
          ctx
            .sqlNamingStrategy(ctx, { quoteIdentifiers: true })
            .schemaName(schemaName)
        }`;
      },
      schemaQualifier,
      qualifiedNames: (ns) => tmpl.qualifiedNamingStrategy(ns, schemaQualifier),
    };
  return result;
}

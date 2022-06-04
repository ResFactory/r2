import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";
import * as sp from "../space.ts";

export interface SchemaDefinition<
  Context,
  SchemaName extends sp.SqlSpace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
> extends tmpl.SqlTextSupplier<Context, EmitOptions>, sp.SqlSpaceSupplier {
  readonly isValid: boolean;
  readonly sqlSpace: SchemaName;
  readonly isIdempotent: boolean;
}

export function isSchemaDefinition<
  Context,
  SchemaName extends sp.SqlSpace,
  EmitOptions extends tmpl.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is SchemaDefinition<Context, SchemaName, EmitOptions> {
  const isSD = safety.typeGuard<
    SchemaDefinition<Context, SchemaName, EmitOptions>
  >(
    "sqlSpace",
    "SQL",
  );
  return isSD(o);
}

export interface SchemaDefnOptions<
  Context,
  SchemaName extends sp.SqlSpace,
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
  sqlSchemaDefn: <SchemaName extends sp.SqlSpace>(
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
      const { isIdempotent = true } = sdOptions ?? {};
      return {
        isValid: true,
        sqlSpace: schemaName,
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

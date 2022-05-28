import * as safety from "../../safety/mod.ts";
import * as t from "./text.ts";

export interface SchemaDefinition<
  Context,
  SchemaName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
> extends t.SqlTextSupplier<Context, EmitOptions> {
  readonly isValid: boolean;
  readonly schemaName: SchemaName;
  readonly isIdempotent: boolean;
}

export function isSchemaDefinition<
  Context,
  SchemaName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
>(
  o: unknown,
): o is SchemaDefinition<Context, SchemaName, EmitOptions> {
  const isSD = safety.typeGuard<
    SchemaDefinition<Context, SchemaName, EmitOptions>
  >(
    "schemaName",
    "SQL",
  );
  return isSD(o);
}

export interface SchemaDefnOptions<
  Context,
  SchemaName extends string,
  EmitOptions extends t.SqlTextEmitOptions<Context>,
> {
  readonly isIdempotent?: boolean;
}

export interface SchemaDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions<Context> = t.SqlTextEmitOptions<
    Context
  >,
> {
  sqlSchemaDefn: <SchemaName extends string>(
    schemaName: SchemaName,
    schemaDefnOptions?: SchemaDefnOptions<Context, SchemaName, EmitOptions>,
  ) =>
    & SchemaDefinition<Context, SchemaName, EmitOptions>
    & t.SqlTextLintIssuesSupplier<Context, EmitOptions>;
}

export function typicalSqlSchemaDefnFactory<
  Context,
  EmitOptions extends t.SqlTextEmitOptions<Context> = t.SqlTextEmitOptions<
    Context
  >,
>(): SchemaDefnFactory<Context, EmitOptions> {
  return {
    sqlSchemaDefn: (schemaName, sdOptions) => {
      const { isIdempotent = true } = sdOptions ?? {};
      return {
        isValid: true,
        schemaName,
        isIdempotent,
        populateSqlTextLintIssues: () => {},
        SQL: (ctx, steOptions) => {
          return `CREATE SCHEMA ${
            isIdempotent ? "IF NOT EXISTS " : ""
          }${steOptions.namingStrategy(ctx).schemaName?.(schemaName)}`;
        },
      };
    },
  };
}

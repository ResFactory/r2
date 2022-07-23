import { fs, path } from "../render/deps.ts";
import * as ax from "../../axiom/mod.ts";
import * as axsdc from "../../axiom/axiom-serde-crypto.ts";
import * as SQLa from "../render/mod.ts";
import * as erd from "../diagram/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * fsModelsGovn is a "models governer" helpers object that supplies functions
 * for this module's RDBMS schemas that prepare tables in a "governed" fashion
 * with a primary key named `<tableName>_id` and with standard "housekeeping"
 * columns such as `created_at`.
 * @param ddlOptions optional DDL string template literal options
 * @returns a single object with helper functions as properties (for building models)
 */
export function fsModelsGovn<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  },
) {
  const primaryKey = () =>
    SQLa.uaDefaultablePrimaryKey(
      SQLa.sha1Digest(() => axsdc.sha1DigestUndefined),
    );
  const autoIncPrimaryKey = () =>
    SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());

  type HousekeepingColumnsDefns<Context extends SQLa.SqlEmitContext> = {
    readonly created_at: SQLa.AxiomSqlDomain<Date | undefined, Context>;
  };

  function housekeeping<
    Context extends SQLa.SqlEmitContext,
  >(): HousekeepingColumnsDefns<Context> {
    return {
      created_at: SQLa.createdAt(),
    };
  }

  // "created_at" is considered "housekeeping" with a default so don't
  // emit it as part of the insert DML statement
  const defaultIspOptions: SQLa.InsertStmtPreparerOptions<
    Any,
    Any,
    Any,
    Context
  > = { isColumnEmittable: (name) => name == "created_at" ? false : true };

  /**
   * All of our "content" or "transaction" tables will follow a specific format,
   * namely that they will have a single primary key with the same name as the
   * table with _id appended and common "houskeeping" columns like created_at.
   * TODO: figure out how to automatically add ...housekeeping() to the end of
   * each table (it's easy to add at the start of each table, but we want them
   * at the end after all the "content" columns).
   * @param tableName
   * @param props
   * @returns
   */
  const table = <
    TableName extends string,
    TPropAxioms extends
      & Record<string, ax.Axiom<Any>>
      & Record<`${TableName}_id`, ax.Axiom<Any>>
      & HousekeepingColumnsDefns<Context>,
    ColumnName extends keyof TPropAxioms = keyof TPropAxioms,
  >(
    tableName: TableName,
    props: TPropAxioms,
    options?: {
      readonly pkDigestColumns?: ColumnName[];
      readonly constraints?: SQLa.TableColumnsConstraint<
        TPropAxioms,
        Context
      >[];
      readonly lint?:
        & SQLa.TableNameConsistencyLintOptions
        & SQLa.FKeyColNameConsistencyLintOptions<Context>;
    },
  ) => {
    const asdo = ax.axiomSerDeObject(props);
    const pkColumn = asdo.axiomProps.find((ap) =>
      SQLa.isTablePrimaryKeyColumnDefn<Any, Context>(ap)
    ) as unknown as (
      | (
        & SQLa.IdentifiableSqlDomain<string, Context>
        & ax.DefaultableAxiomSerDe<string>
      )
      | undefined
    );
    const tdrf = SQLa.tableDomainsRowFactory<TableName, TPropAxioms, Context>(
      tableName,
      props,
      { defaultIspOptions },
    );
    const result = {
      ...asdo,
      ...SQLa.tableDefinition<TableName, TPropAxioms, Context>(
        tableName,
        props,
        {
          isIdempotent: true,
          sqlNS: ddlOptions?.sqlNS,
          constraints: options?.constraints,
        },
      ),
      // we want a custom, async, insertDML since some of our primary keys are
      //  "digest" type and we need to generate the digest from content in the
      // record
      insertDML: tdrf.insertCustomDML(async (ir) => {
        if (options?.pkDigestColumns && pkColumn) {
          const untypedIR = ir as Any;
          const dc = options?.pkDigestColumns.map((dc) => untypedIR[dc] as Any)
            .join("::");
          untypedIR[pkColumn.identity] = await pkColumn.defaultValue(dc);
        }
      }),
      ...SQLa.tableSelectFactory<TableName, TPropAxioms, Context>(
        tableName,
        props,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };

    const rules = tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  };

  const erdConfig = erd.typicalPlantUmlIeOptions();
  const lintState = SQLa.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
  const tableLintRules = SQLa.tableLintRules<Context>();

  return {
    primaryKey,
    autoIncPrimaryKey,
    housekeeping,
    table,
    tableLintRules,
    defaultIspOptions,
    erdConfig,
    enumTable: SQLa.enumTable,
    enumTextTable: SQLa.enumTextTable,
    sqlTextLintSummary: lintState.sqlTextLintSummary,
    sqlTmplEngineLintSummary: lintState.sqlTmplEngineLintSummary,
  };
}

export interface WalkGlob {
  readonly originRootPath: string;
  readonly glob: string;
  readonly include: (we: fs.WalkEntry) => boolean;
  readonly options?: (path: string) => fs.ExpandGlobOptions;
}

export enum FileSystemEntryNature {
  PATH,
  FILE,
  // TODO: SYMLINK
}

export function fileSystemModels<Context extends SQLa.SqlEmitContext>(
  ddlOptions: SQLa.SqlTextSupplierOptions<Context> & {
    readonly sqlNS?: SQLa.SqlNamespaceSupplier;
  } = SQLa.typicalSqlTextSupplierOptions(),
) {
  const mg = fsModelsGovn(ddlOptions);

  const fseNature = mg.enumTable(
    "fs_entry_nature",
    FileSystemEntryNature,
  );

  const fsOrigin = mg.table("fs_origin", {
    fs_origin_id: mg.primaryKey(),
    host: SQLa.unique(SQLa.text()), // add label "surrogate key"
    host_meta: SQLa.jsonTextNullable(),
    ...mg.housekeeping(),
  }, { pkDigestColumns: ["host"] });

  const fsEntryPK = mg.autoIncPrimaryKey();
  const fsEntry = mg.table("fs_entry", {
    fs_entry_id: fsEntryPK,
    fse_nature_id: fseNature.foreignKeyRef.code(),
    fs_origin_id: fsOrigin.foreignKeyRef.fs_origin_id(),
    parent_id: SQLa.selfRefForeignKeyNullable(fsEntryPK),
    label: SQLa.text(), // how the entry is known, abs_path for a directory, file_abs_path_and_file_name_extn for file
    ...mg.housekeeping(),
  }, { constraints: [SQLa.uniqueTableCols("fs_origin_id", "label")] });

  const fsePathPK = mg.autoIncPrimaryKey();
  const fsePath = mg.table("fs_entry_path", {
    fs_entry_path_id: fsePathPK,
    fs_origin_id: fsOrigin.foreignKeyRef.fs_origin_id(SQLa.belongsTo()), // TODO: add label "denormalized"
    fs_entry_id: fsEntry.foreignKeyRef.fs_entry_id(SQLa.belongsTo()), // TODO: belongsTo should be isA(), requires 1:1
    parent_id: SQLa.selfRefForeignKeyNullable(fsePathPK),
    abs_path: SQLa.text(),
    parent_abs_path: SQLa.textNullable(), // TODO: add governance details such as "denormalized"
    ...mg.housekeeping(),
  }, { constraints: [SQLa.uniqueTableCols("fs_origin_id", "abs_path")] });

  const fseFileExtn = mg.table("fs_entry_file_extn", {
    fs_entry_file_extn_id: mg.autoIncPrimaryKey(),
    fs_origin_id: fsOrigin.foreignKeyRef.fs_origin_id(),
    file_extn: SQLa.text(),
    file_extn_modifiers: SQLa.textNullable(),
    ...mg.housekeeping(),
  }, {
    constraints: [
      SQLa.uniqueTableCols("fs_origin_id", "file_extn", "file_extn_modifiers"),
    ],
  });

  const fseFile = mg.table("fs_entry_file", {
    fs_entry_file_id: mg.primaryKey(),
    fs_entry_id: fsEntry.foreignKeyRef.fs_entry_id(SQLa.belongsTo()), // TODO: belongsTo should be isA(), requires 1:1
    fse_path_id: fsePath.foreignKeyRef.fs_entry_path_id(SQLa.belongsTo()),
    file_abs_path_and_file_name_extn: SQLa.text(),
    file_parent_path: SQLa.text(), // TODO: add "denormalized" label
    file_root: SQLa.textNullable(),
    file_abs_path_only: SQLa.text(),
    file_name_without_extn: SQLa.text(),
    file_name_with_extn: SQLa.text(),
    file_extn: SQLa.textNullable(),
    file_extn_modifiers: SQLa.textNullable(),
    ...mg.housekeeping(),
  }, { pkDigestColumns: ["file_abs_path_and_file_name_extn"] });

  const fsWalk = mg.table("fs_walk", {
    fs_walk_id: mg.autoIncPrimaryKey(),
    fs_origin_id: fsOrigin.foreignKeyRef.fs_origin_id(),
    fs_path_id: fsePath.foreignKeyRef.fs_entry_path_id(),
    glob: SQLa.text(),
    ...mg.housekeeping(),
  });

  const fsWalkEntry = mg.table("fs_walk_entry", {
    fs_walk_entry_id: mg.autoIncPrimaryKey(),
    fs_walk_id: fsWalk.foreignKeyRef.fs_walk_id(SQLa.belongsTo()),
    fs_entry_id: fsEntry.foreignKeyRef.fs_entry_id(SQLa.belongsTo()),
    label: SQLa.text(), // how the entry is known, abs_path for a directory, file_abs_path_and_file_name_extn for file
    ...mg.housekeeping(),
  });

  // deno-fmt-ignore
  const seedDDL = SQLa.SQL<Context>(ddlOptions)`
      -- Generated by ${path.basename(import.meta.url)}. DO NOT EDIT.

      ${mg.sqlTextLintSummary}

      ${fseNature}

      ${fseNature.seedDML}

      ${fsOrigin}

      ${fsEntry}

      ${fsePath}

      ${fseFileExtn}

      ${fseFile}

      ${fsWalk}

      ${fsWalkEntry}

      ${mg.sqlTmplEngineLintSummary}`;

  return {
    modelsGovn: mg,
    fseNature,
    fsOrigin,
    fsEntry,
    fsePath,
    fseFileExtn,
    fseFile,
    fsWalk,
    fsWalkEntry,
    seedDDL,
    walkedDML: async (ctx: Context, ...globs: WalkGlob[]) => {
      const result = new Set<string>();
      const storeSQL = <STS extends SQLa.SqlTextSupplier<Context>>(
        sts: STS,
      ) => {
        result.add(sts.SQL(ctx));
        return sts;
      };

      const activeHost = storeSQL(
        await fsOrigin.insertDML({ host: Deno.hostname() }),
      );
      const { fs_origin_id } = activeHost.returnable(activeHost.insertable);

      const storePathSQL = async (absPath: string) => {
        const entryDML = storeSQL(
          await fsEntry.insertDML({
            fse_nature_id: FileSystemEntryNature.PATH,
            label: absPath,
            fs_origin_id,
          }),
        );
        return [
          entryDML,
          storeSQL(
            await fsePath.insertDML({
              fs_entry_id: fsEntry.select(entryDML.insertable),
              fs_origin_id,
              abs_path: absPath,
            }),
          ),
        ];
      };

      for (const srcGlob of globs) {
        const [_, walkRootPathDML] = await storePathSQL(srcGlob.originRootPath);
        const walkDML = storeSQL(
          await fsWalk.insertDML({
            fs_path_id: fsePath.select(walkRootPathDML.insertable),
            fs_origin_id,
            glob: srcGlob.glob,
          }),
        );
        for await (
          const we of fs.expandGlob(
            srcGlob.glob,
            srcGlob.options?.(srcGlob.originRootPath),
          )
        ) {
          if (srcGlob.include(we) && we.isFile) {
            const parentPath = path.dirname(we.path);
            const [pathEntryDML, pathDML] = await storePathSQL(parentPath);
            // const fileEntryDML = storeSQL(
            //   await fsEntry.insertDML({
            //     fse_nature_id: FileSystemEntryNature.FILE,
            //     label: we.path,
            //     fs_origin_id,
            //   }),
            // );
            // const fileDML = storeSQL(fseFile.insertDML({

            // }))
          }
        }
      }
      return result;
    },
  };
}

if (import.meta.main) {
  // - if we're being called as a CLI, just emit the DDL SQL:
  //   $ deno run -A --unstable lib/sql/models/fs.ts | sqlite3 ":memory:" > synthetic.sql
  //   $ deno run -A --unstable lib/sql/models/fs.ts | sqlite3 ":memory:" | sqlite3 test.db
  // - sending into SQLite memory first and then dumping afterwards is much faster
  //   because we're using static SQL with lookups for foreign keys.
  // - A good way to "test" is to use this CLI from $RF_HOME:
  //   $ rm -f lib/sql/models/fs.db && deno run -A --unstable lib/sql/models/fs.ts | sqlite3 ":memory:" | sqlite3 lib/sql/models/fs.db
  //   then, open `fs.sql` with VS Code SQL notebook for exploring the content
  const emitForSqlite3IMDB = true;
  const dbDefn = fileSystemModels();
  const ctx = SQLa.typicalSqlEmitContext();
  console.log(dbDefn.seedDDL.SQL(ctx));
  (await dbDefn.walkedDML(ctx, {
    originRootPath: path.resolve(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "..",
      "..",
    ),
    glob: "**/*",
    include: (we) => we.isFile,
    options: (path) => ({
      root: path,
      includeDirs: false,
      globstar: true,
    }),
  })).forEach((sql) => console.log(sql, ";"));

  // this is so that sqlite3 ":memory:" is dumped to STDOUT for subsequent sqlite3 lib/sql/models/fs.db
  if (emitForSqlite3IMDB) console.log(`.dump`);
}

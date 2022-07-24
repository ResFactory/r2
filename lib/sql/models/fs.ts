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
  const digestPrimaryKey = () =>
    SQLa.uaDefaultablePrimaryKey(
      SQLa.sha1Digest(() => axsdc.sha1DigestUndefined),
    );
  const autoIncPrimaryKey = () =>
    SQLa.autoIncPrimaryKey<number, Context>(SQLa.integer());

  const denormalized = <TsValueType>(
    domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  ) => {
    return SQLa.label(domain, "denormalized");
  };

  const surrogateKey = <TsValueType>(
    domain: SQLa.AxiomSqlDomain<TsValueType, Context>,
  ) => {
    return SQLa.label(domain, "surrogate-key");
  };

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
        & SQLa.TablePrimaryKeyColumnDefn<Any, Context>
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
      pkColumn,
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
        const pkDigestCols = options?.pkDigestColumns;
        if (pkDigestCols && pkColumn) {
          // TODO: figure out how to type this properly, don't leave it untyped
          // suggestion: create a writeable: (ir: InsertableRecord) => safety.Writeable<InsertableRecord>?
          const untypedIR = ir as Any;
          const dc = pkDigestCols.map((dc) => untypedIR[dc]).join("::");
          // pkColumn.defaultValue(dc) will be the SHA-1 or other digest function
          untypedIR[pkColumn.identity] = await pkColumn.defaultValue(dc);
        }
      }),
      ...SQLa.tableSelectFactory<TableName, TPropAxioms, Context>(
        tableName,
        props,
      ),
      defaultIspOptions, // in case others need to wrap the call
    };

    if (
      pkColumn && axsdc.isDigestAxiomSD(pkColumn) && !options?.pkDigestColumns
    ) {
      result.registerLintIssue({
        lintIssue:
          `table name '${tableName}' requires pkDigestColumns for primary key column ${pkColumn.identity}`,
        consequence: SQLa.SqlLintIssueConsequence.FATAL_DDL,
      });
    }

    const rules = tableLintRules.typical(result);
    rules.lint(result, options?.lint);

    return result;
  };

  const erdConfig = erd.typicalPlantUmlIeOptions();
  const lintState = SQLa.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
  const tableLintRules = SQLa.tableLintRules<Context>();

  return {
    digestPrimaryKey,
    autoIncPrimaryKey,
    denormalized,
    surrogateKey,
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
  readonly rootPath: string;
  readonly label: string;
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
    fs_origin_id: mg.digestPrimaryKey(),
    host: mg.surrogateKey(SQLa.unique(SQLa.text())),
    host_ipv4_address: SQLa.unique(SQLa.text()),
    host_meta: SQLa.jsonTextNullable(),
    ...mg.housekeeping(),
  }, {
    pkDigestColumns: ["host", "host_ipv4_address"], // TODO: should `host_meta` be part of the digest?
    constraints: [SQLa.uniqueTableCols("host", "host_ipv4_address")],
  });

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
    fs_origin_id: mg.denormalized(
      fsOrigin.foreignKeyRef.fs_origin_id(SQLa.belongsTo()),
    ),
    fs_entry_id: fsEntry.foreignKeyRef.fs_entry_id(SQLa.belongsTo()), // TODO: belongsTo should be isA(), requires 1:1
    parent_id: SQLa.selfRefForeignKeyNullable(fsePathPK),
    abs_path: SQLa.text(),
    parent_abs_path: mg.denormalized(SQLa.textNullable()),
    ...mg.housekeeping(),
  }, { constraints: [SQLa.uniqueTableCols("fs_origin_id", "abs_path")] });

  const fseFileExtn = mg.table("fs_entry_file_extn", {
    fs_entry_file_extn_id: mg.autoIncPrimaryKey(),
    fs_origin_id: fsOrigin.foreignKeyRef.fs_origin_id(), // TODO: should this be tied to origin or fs_walk?
    file_extn_tail: SQLa.text(),
    modifier: SQLa.textNullable(),
    modifier_index: SQLa.integerNullable(),
    modifiers_count: SQLa.integerNullable(),
    file_extn_full: SQLa.text(),
    ...mg.housekeeping(),
  }, {
    constraints: [
      SQLa.uniqueTableCols(
        "fs_origin_id",
        "fs_entry_file_extn_id",
        "file_extn_tail",
        "modifier",
        "modifier_index",
        "modifiers_count",
        "file_extn_full",
      ),
    ],
  });

  const fseFile = mg.table("fs_entry_file", {
    fs_entry_file_id: mg.autoIncPrimaryKey(),
    fs_origin_id: mg.denormalized(
      fsOrigin.foreignKeyRef.fs_origin_id(SQLa.belongsTo()),
    ),
    fs_entry_id: fsEntry.foreignKeyRef.fs_entry_id(SQLa.belongsTo()), // TODO: belongsTo should be isA(), requires 1:1
    fse_path_id: fsePath.foreignKeyRef.fs_entry_path_id(SQLa.belongsTo()),
    file_abs_path_and_file_name_extn: SQLa.text(),
    file_grandparent_path: mg.denormalized(SQLa.text()),
    file_root: SQLa.textNullable(), // TODO: add example/doc/remark that e.g. `C:\` on Windows, `/` on Linux/MacOS
    file_abs_path_only: SQLa.text(),
    file_name_without_extn: SQLa.text(),
    file_name_with_extn: SQLa.text(),
    file_extn_tail: SQLa.textNullable(),
    file_extn_modifiers: SQLa.textNullable(),
    file_extn_full: SQLa.textNullable(),
    ...mg.housekeeping(),
  }, {
    constraints: [
      SQLa.uniqueTableCols("fs_origin_id", "file_abs_path_and_file_name_extn"),
    ],
  });

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
    fs_path_id: fsePath.foreignKeyRef.fs_entry_path_id(),
    fs_file_id: fseFile.foreignKeyRef.fs_entry_file_id(),
    label_abs: SQLa.text(), // how the entry is known, abs_path for a directory, file_abs_path_and_file_name_extn for file
    label_rel_to_walk_glob: SQLa.text(),
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

      ${mg.sqlTmplEngineLintSummary}
      ${mg.sqlTextLintSummary}`;

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
    isValid: () => {
      const stls = seedDDL.stsOptions.sqlTextLintState;
      if (stls?.lintedSqlText.lintIssues.find((li) => stls.isFatalIssue(li))) {
        return 100;
      }
      if (
        stls?.lintedSqlTmplEngine.lintIssues.find((li) => stls.isFatalIssue(li))
      ) {
        return 101;
      }
      return true;
    },
  };
}

export function fileSystemContent<Context extends SQLa.SqlEmitContext>() {
  const fsModels = fileSystemModels<Context>();
  const {
    fsOrigin,
    fsEntry,
    fsePath,
    fseFileExtn,
    fseFile,
    fsWalk,
    fsWalkEntry,
  } = fsModels;

  return {
    fsModels,
    walkFilesGlob: (
      rootPath: string,
      inherit?: Partial<Omit<WalkGlob, "rootPath">>,
    ): WalkGlob => {
      return {
        rootPath,
        label: inherit?.label ?? rootPath,
        glob: inherit?.glob ?? "**/*",
        include: inherit?.include ?? ((we) => we.isFile),
        options: inherit?.options ?? ((path) => ({
          root: path,
          includeDirs: false,
          globstar: true,
          extended: true,
          exclude: [".git"],
        })),
      };
    },
    entriesDML: async (ctx: Context, ...globs: WalkGlob[]) => {
      const uniqueDML = new Set<string>();
      const memoizeSQL = <STS extends SQLa.SqlTextSupplier<Context>>(
        sts: STS,
      ) => {
        uniqueDML.add(sts.SQL(ctx));
        return sts;
      };

      const activeHost = memoizeSQL(
        await fsOrigin.insertDML({
          host: Deno.hostname(),
          host_ipv4_address: Deno.hostname(), // TODO: add IPv4 address
        }),
      );
      const { fs_origin_id } = activeHost.returnable(activeHost.insertable);

      const memoizePathSQL = async (absPath: string) => {
        const entryDML = memoizeSQL(
          await fsEntry.insertDML({
            fse_nature_id: FileSystemEntryNature.PATH,
            label: absPath,
            fs_origin_id,
          }),
        );
        return [
          entryDML,
          memoizeSQL(
            await fsePath.insertDML({
              fs_entry_id: fsEntry.select(entryDML.insertable),
              fs_origin_id,
              abs_path: absPath,
            }),
          ),
        ];
      };

      for (const srcGlob of globs) {
        const [_, walkRootPathDML] = await memoizePathSQL(srcGlob.rootPath);
        const walkDML = memoizeSQL(
          await fsWalk.insertDML({
            fs_path_id: fsePath.select(walkRootPathDML.insertable),
            fs_origin_id,
            glob: srcGlob.glob,
          }),
        );
        for await (
          const we of fs.expandGlob(
            srcGlob.glob,
            srcGlob.options?.(srcGlob.rootPath),
          )
        ) {
          if (srcGlob.include(we) && we.isFile) {
            const parentPath = path.dirname(we.path);
            const [_, pathDML] = await memoizePathSQL(parentPath);
            const fileEntryDML = memoizeSQL(
              await fsEntry.insertDML({
                fse_nature_id: FileSystemEntryNature.FILE,
                label: we.path,
                fs_origin_id,
              }),
            );
            const pp: path.ParsedPath & { modifiers: string[] } = {
              modifiers: [],
              ...path.parse(we.path),
            };
            if (pp.name.indexOf(".") > 0) {
              let ppn = pp.name;
              let modifier = path.extname(ppn);
              while (modifier && modifier.length > 0) {
                pp.modifiers.push(modifier);
                ppn = ppn.substring(0, ppn.length - modifier.length);
                modifier = path.extname(ppn);
              }
              pp.name = ppn;
            }
            const onlyModifiers = pp.modifiers.join(""); // modifiers already have "." in their text
            if (pp.ext) {
              for (let mi = 0; mi < pp.modifiers.length; mi++) {
                memoizeSQL(
                  await fseFileExtn.insertDML({
                    fs_origin_id,
                    file_extn_tail: pp.ext,
                    modifier: pp.modifiers.slice(mi).join(""),
                    modifier_index: mi + 1,
                    modifiers_count: pp.modifiers.length,
                    file_extn_full: onlyModifiers + pp.ext,
                  }),
                );
              }
              memoizeSQL(
                await fseFileExtn.insertDML({
                  fs_origin_id,
                  file_extn_tail: pp.ext,
                  file_extn_full: onlyModifiers + pp.ext,
                  modifiers_count: pp.modifiers.length,
                }),
              );
            }

            memoizeSQL(
              await fseFile.insertDML({
                fs_origin_id,
                file_abs_path_and_file_name_extn: we.path,
                file_abs_path_only: pp.dir,
                file_name_with_extn: pp.base,
                file_name_without_extn: pp.name,
                file_grandparent_path: path.dirname(pp.dir),
                fs_entry_id: fsEntry.select(fileEntryDML.insertable),
                fse_path_id: fsePath.select(pathDML.insertable),
                file_root: pp.root, // e.g. C:\ on Windows, / on Linux/MacOS
                file_extn_tail: pp.ext.length > 0 ? pp.ext : undefined,
                file_extn_modifiers: pp.modifiers.length > 0
                  ? onlyModifiers
                  : undefined,
                file_extn_full: pp.ext.length > 0
                  ? onlyModifiers + pp.ext
                  : undefined,
              }),
            );

            memoizeSQL(
              await fsWalkEntry.insertDML({
                fs_walk_id: fsWalk.select(walkDML.insertable),
                fs_entry_id: fsEntry.select(fileEntryDML.insertable),
                fs_file_id: fseFile.select({
                  fs_origin_id,
                  file_abs_path_and_file_name_extn: we.path,
                }),
                fs_path_id: fsePath.select(walkRootPathDML.insertable),
                label_abs: we.path,
                label_rel_to_walk_glob: path.relative(
                  srcGlob.rootPath,
                  we.path,
                ),
              }),
            );
          }
        }
      }
      return uniqueDML;
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
  //   $ sudo apt-get -y -qq install sqlite3
  //   $ rm -f lib/sql/models/fs.db && deno run -A --unstable lib/sql/models/fs.ts | sqlite3 ":memory:" | sqlite3 lib/sql/models/fs.db
  //   then, open `fs.sql` with VS Code SQL notebook for exploring the content
  const emitForSqlite3IMDB = true;
  const ctx = SQLa.typicalSqlEmitContext();
  const fsc = fileSystemContent();
  console.log(fsc.fsModels.seedDDL.SQL(ctx));
  const isValid = fsc.fsModels.isValid();
  if (typeof isValid === "number") {
    console.error("FATAL errors in SQL (see lint messages in emitted SQL)");
    Deno.exit(isValid);
  }

  (await fsc.entriesDML(
    ctx,
    fsc.walkFilesGlob(path.resolve(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "..",
      "..",
      "..",
    )),
  )).forEach((sql) => console.log(sql, ";"));

  // this is so that sqlite3 ":memory:" is dumped to STDOUT for subsequent sqlite3 lib/sql/models/fs.db
  if (emitForSqlite3IMDB) console.log(`.dump`);
}

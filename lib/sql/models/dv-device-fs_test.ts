import { testingAsserts as ta } from "./deps-test.ts";
import { path } from "../render/deps.ts";
import * as SQLa from "../render/mod.ts";
import * as sqlE from "../engine/sqlite.ts";
import * as mod from "./dv-device-fs.ts";

Deno.test("walk FS and build SQLite data vault", async () => {
  const ctx = SQLa.typicalSqlEmitContext();
  type Context = typeof ctx;

  const fsc = mod.deviceFileSysContent<Context>();
  const SQL = [fsc.models.seedDDL.SQL(ctx)];
  const validity = fsc.models.isValid();

  ta.assert(SQL);
  ta.assert(
    typeof validity === "boolean" && validity,
    "FATAL errors in SQL (see lint messages in emitted SQL)",
  );

  // walk all the files in resFactory/factory
  (await fsc.entriesDML(
    ctx,
    mod.walkGlobbedFilesExcludeGit(path.resolve(
      path.dirname(path.fromFileUrl(import.meta.url)),
      "..",
      "..",
      "..",
    )),
  )).forEach((sql) => SQL.push(sql + ";"));

  const sqliteEngine = sqlE.sqliteEngine();
  const instance = sqliteEngine.instance({
    storageFileName: () => ":memory:",
    autoCloseOnUnload: true,
  });
  instance.dbStore.execute(SQL.join("\n"));
  const qer = await instance.rowsDQL(ctx, {
    SQL: () => `SELECT count(*) FROM hub_file`,
  });
  ta.assertEquals(qer.rows.length, 1);
  ta.assert(typeof qer.rows[0][0] === "number");
  ta.assert(qer.rows[0][0] > 0);
  instance.close();
});

import { path, testingAsserts as ta } from "./deps-test.ts";
import * as whs from "../../text/whitespace.ts";
import * as f from "./factory.ts";
import * as SQLa from "../render/mod.ts";

Deno.test("fselect SQL shell command", async (tc) => {
  const thisTestFilePath = path.dirname(path.fromFileUrl(import.meta.url));
  const scEngine = f.sqlShellCmdsEngine();
  const fselect = scEngine.fselect();
  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step(`*.ts files in ${thisTestFilePath}`, async () => {
    const sysInfoQuery = {
      SQL: () =>
        whs.unindentWhitespace(`
          SELECT size, path
            FROM ${thisTestFilePath}
           WHERE name = '*.ts'
           LIMIT 50`),
    };
    const fsQER = await fselect.recordsDQL(ctx, sysInfoQuery);
    ta.assert(fsQER);
    // there are twelve files in the current path
    ta.assertEquals(13, fsQER.records.length);
  });
});

Deno.test("mergestat Git SQL shell command", async (tc) => {
  const thisTestFilePath = path.dirname(path.fromFileUrl(import.meta.url));
  const gitProjectHome = path.resolve(thisTestFilePath, "../../..");
  const scEngine = f.sqlShellCmdsEngine();
  const mergestat = scEngine.mergestat();
  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step(
    `total commits counts grouped by author in ${gitProjectHome}`,
    async () => {
      const sysInfoQuery = {
        SQL: () =>
          whs.unindentWhitespace(`
          SELECT count(*), author_email, author_name
            FROM commits('${gitProjectHome}')
           WHERE parents < 2 -- ignore merge commits
           GROUP BY author_name, author_email ORDER BY count(*) DESC`),
      };
      const fsQER = await mergestat.recordsDQL(ctx, sysInfoQuery);
      ta.assert(fsQER);
      ta.assert(fsQER.records.length);
    },
  );

  await tc.step(
    `total commits counts grouped by email domain of author in ${gitProjectHome}`,
    async () => {
      const sysInfoQuery = {
        SQL: () =>
          whs.unindentWhitespace(`
            SELECT count(*), substr(author_email, instr(author_email, '@')+1) AS email_domain -- https://sqlite.org/lang_corefunc.html
              FROM commits('${gitProjectHome}')
             WHERE parents < 2 -- ignore merge commits
             GROUP BY email_domain
             ORDER BY count(*) DESC`),
      };
      const gitQER = await mergestat.recordsDQL(ctx, sysInfoQuery);
      ta.assert(gitQER);
      ta.assert(gitQER.records.length);
    },
  );
});

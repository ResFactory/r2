import { path, testingAsserts as ta } from "./deps-test.ts";
import * as ax from "../../axiom/mod.ts";
import * as whs from "../../text/whitespace.ts";
import * as mod from "./shell.ts";
import * as SQLa from "../render/mod.ts";

const isCICD = Deno.env.get("CI") ? true : false;

Deno.test("osQuery SQL shell command", async (tc) => {
  // GitHub actions won't have osQuery
  if (isCICD) return;

  const scEngine = mod.sqlShellCmdsEngine();
  const osq = scEngine.osqueryi();
  const ctx = SQLa.typicalSqlEmitContext();

  await tc.step("untyped system_info query", async () => {
    const sysInfoQuery = {
      SQL: () =>
        whs.unindentWhitespace(`
          SELECT computer_name,
                 hostname,
                 cpu_brand,
                 cpu_physical_cores,
                 cpu_logical_cores,
                 printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
    };
    const osQER = await osq.recordsDQL(ctx, sysInfoQuery);
    ta.assert(osQER);
    ta.assert(osQER.records);
  });

  await tc.step("typed system_info query", async () => {
    const sysInfoSerDe = ax.axiomSerDeObject({
      computer_name: SQLa.text(),
      hostname: SQLa.text(),
      cpu_brand: SQLa.text(),
      cpu_physical_cores: SQLa.integer(),
      cpu_logical_cores: SQLa.integer(),
      memory_gb: SQLa.integer(), // TODO: convert to float?
    });

    const sysInfoQuery = {
      SQL: () =>
        whs.unindentWhitespace(`
          SELECT computer_name,
                 hostname,
                 cpu_brand,
                 cpu_physical_cores,
                 cpu_logical_cores,
                 printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
    };
    const osQER = await osq.firstRecordDQL(ctx, sysInfoQuery);
    ta.assert(osQER);
    ta.assert(osQER.record);
    const typedRecord = sysInfoSerDe.fromTextRecord(osQER.record);
    ta.assert(typedRecord.computer_name);
    ta.assertEquals("number", typeof typedRecord.cpu_physical_cores);
  });
});

Deno.test("fselect SQL shell command", async (tc) => {
  const thisTestFilePath = path.dirname(path.fromFileUrl(import.meta.url));
  const scEngine = mod.sqlShellCmdsEngine();
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
    // there are nine files in the current path
    ta.assertEquals(9, fsQER.records.length);
  });
});

Deno.test("mergestat Git SQL shell command", async (tc) => {
  const thisTestFilePath = path.dirname(path.fromFileUrl(import.meta.url));
  const gitProjectHome = path.resolve(thisTestFilePath, "../../..");
  const scEngine = mod.sqlShellCmdsEngine();
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

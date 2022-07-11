import { testingAsserts as ta } from "./deps-test.ts";
import * as ax from "../../axiom/mod.ts";
import * as pge from "../engine/postgres.ts";
import * as ex from "../execute/mod.ts";
import * as mod from "./gitlab.ts";

const isCICD = Deno.env.get("CI") ? true : false;

Deno.test("PostgreSQL valid connection from GLTEST_* env with FS proxy", async () => {
  // if we're running in GitHub Actions or other Continuous Integration (CI)
  // or Continuous Delivery (CD) environment then PostgreSQL won't be available
  // so don't fail the test case, just don't run it
  if (isCICD) return;

  const pgdbcc = pge.pgDbConnEnvConfig({
    ens: (given) => `GLTEST_${given}`,
  });

  // set any "required" env value to textEnvPlaceholder
  const config = pgdbcc.configure({
    configured: true,
    identity: `resFactory/factory/lib/sql/models/gitlab_test.ts`,
    database: "gitlabhq_production",
    hostname: "192.168.2.24",
    port: 5033,
    user: pgdbcc.envBuilder.textEnvPlaceholder, // must come from env
    password: pgdbcc.envBuilder.textEnvPlaceholder, // must come from env
    dbConnPoolCount: 1,
  });
  const pgco = pgdbcc.pgClientOptions(config);
  if (!pgco.user || !pgco.password) {
    console.error(
      `Unable to test valid PostgreSQL connection, GLTEST_PKC_PGUSER or GLTEST_PKC_PGPASSWORD env vars missing\n
      > export GLTEST_PGUSER=gitlab_username GLTEST_PGPASSWORD=gitlab_password`,
    );
    return;
  }
  ta.assertEquals(pgdbcc.missingValues(config).length, 0);

  const pgEngine = pge.postgreSqlEngine();
  const pgDBi = pgEngine.instance({
    clientOptions: () => pgdbcc.pgClientOptions(config),
    autoCloseOnUnload: true,
    poolCount: config.dbConnPoolCount,
  });
  const glCtx = mod.gitLabSqlEmitContext();
  const glq = mod.gitLabSqlStmts();

  ta.assert(await pgDBi.isConnectable());
  await pgDBi.init();

  const groups = await pgDBi.recordsDQL(glCtx, glq.groups(glCtx));
  ta.assert(groups.records.length > 0);

  const group = await pgDBi.firstRecordDQL<mod.GitLabNamespace>(
    glCtx,
    glq.group(glCtx, "Precision Knowledge Content"),
  );
  ta.assert(group?.record);

  const glNSCtx = mod.gitLabNamespaceContext(group.record);

  const issuesStmt = glq.issues(glNSCtx);
  const issues = await pgDBi.recordsDQL<ax.AxiomType<typeof issuesStmt>>(
    glCtx,
    issuesStmt,
    { enrich: ex.mutateRecordsBigInts },
  );
  ta.assert(issues.records.length > 0);

  const uaStmt = glq.userAnalytics(glNSCtx);
  const userAnalytics = await pgDBi.recordsDQL<ax.AxiomType<typeof uaStmt>>(
    glCtx,
    issuesStmt,
    { enrich: ex.mutateRecordsBigInts },
  );
  ta.assert(userAnalytics.records.length > 0);

  await pgDBi.close();
});

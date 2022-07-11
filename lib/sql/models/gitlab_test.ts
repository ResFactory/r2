import { testingAsserts as ta } from "./deps-test.ts";
import * as pge from "../engine/postgres.ts";
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
  const { textEnvPlaceholder, intEnvPlaceholder } = pgdbcc.envBuilder;
  const config = pgdbcc.configure({
    configured: true,
    // the identity names a reusable connection pool; the PG engine uses the ID
    // to reuse a pool when a cached config identity is found.
    identity: `resFactory/factory/lib/sql/models/gitlab_test.ts`,
    database: "gitlabhq_production",
    hostname: textEnvPlaceholder, // optionally from env
    port: intEnvPlaceholder, // optionally from env
    user: textEnvPlaceholder, // must come from env
    password: textEnvPlaceholder, // must come from env
    dbConnPoolCount: 1,
  });
  const pgco = pgdbcc.pgClientOptions(config);
  if (!pgco.hostname) pgco.hostname = "192.168.2.24";
  if (!pgco.port) pgco.port = 5033;
  if (!pgco.user || !pgco.password) {
    console.error(
      `Unable to test valid PostgreSQL connection, GLTEST_PKC_PGUSER or GLTEST_PKC_PGPASSWORD env vars missing\n
      > export GLTEST_PGUSER=gitlab_username GLTEST_PGPASSWORD=gitlab_password if PGHOSTADDR=${pgco.hostname} and PGPORT=${pgco.port} are OK, or
      > export GLTEST_PGUSER=gitlab_username GLTEST_PGPASSWORD=gitlab_password GLTEST_PGHOSTADDR=x.y.z.n and GLTEST_PGPORT=nnnn`,
    );
    return;
  }
  ta.assertEquals(pgdbcc.missingValues(config).length, 0);

  const pgEngine = pge.postgreSqlEngine<mod.GitLabSqlEmitContext>();
  const pgDBi = pgEngine.instance({
    clientOptions: () => pgco,
    autoCloseOnUnload: true,
    poolCount: config.dbConnPoolCount,
  });
  ta.assert(
    await pgDBi.isConnectable(),
    `Unable to connect using ${JSON.stringify(pgco)}`,
  );
  await pgDBi.init();

  const glPC = mod.gitLabProxyableContent(() => pgDBi);

  const groups = await glPC.groups();
  ta.assert(groups.records.length > 0);

  const groupName = "Precision Knowledge Content";
  const group = await glPC.group(groupName);
  ta.assert(group?.record);

  const issues = await glPC.issues(groupName);
  ta.assertEquals(issues.groupName, groupName);
  ta.assertEquals(issues.group?.record.name, groupName);
  ta.assert(issues.content?.records);

  const ua = await glPC.userAnalytics(groupName);
  ta.assertEquals(ua.groupName, groupName);
  ta.assertEquals(ua.group?.record.name, groupName);
  ta.assert(ua.content?.records);

  await pgDBi.close();
});

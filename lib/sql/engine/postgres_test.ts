import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./postgres.ts";
import * as SQLa from "../render/mod.ts";

const isCICD = Deno.env.get("CI") ? true : false;

Deno.test("PostgreSQL engine connection configuration", async (tc) => {
  const pgdbcc = mod.pgDatabaseConnConfig();

  await tc.step("from code", () => {
    const config = pgdbcc.configure({
      identity: "appName",
      database: "database",
      hostname: "hostname",
      port: 5433,
      user: "user",
      password: "password",
      dbConnPoolCount: 9,
    });
    ta.assertEquals(config.identity, "appName");
    ta.assertEquals(config.database, "database");
    ta.assertEquals(config.hostname, "hostname");
    ta.assertEquals(config.port, 5433);
    ta.assertEquals(config.user, "user");
    ta.assertEquals(config.password, "password");
    ta.assertEquals(config.dbConnPoolCount, 9);
    ta.assertEquals(pgdbcc.missingValues(config).length, 0);
  });

  await tc.step("from environment", () => {
    const syntheticEnv = {
      PGAPPNAME: "appName",
      PGDATABASE: "database",
      PGHOST: "hostname",
      PGPORT: 5433,
      PGUSER: "user",
      PGPASSWORD: "password",
      PGCONNPOOL_COUNT: 9,
    };
    Object.entries(syntheticEnv).forEach((se) => {
      const [envVarName, envVarValue] = se;
      Deno.env.set(envVarName, String(envVarValue));
    });

    const config = pgdbcc.configure();
    ta.assertEquals(config.identity, "appName");
    ta.assertEquals(config.database, "database");
    ta.assertEquals(config.hostname, "hostname");
    ta.assertEquals(config.port, 5433);
    ta.assertEquals(config.user, "user");
    ta.assertEquals(config.password, "password");
    ta.assertEquals(config.dbConnPoolCount, 9);
    ta.assertEquals(pgdbcc.missingValues(config).length, 0);

    Object.keys(syntheticEnv).forEach((envVarName) => {
      Deno.env.delete(envVarName);
    });
  });

  await tc.step("mixed code, env, and env alias", () => {
    const syntheticEnv = {
      PGUSER: "user-from-env", // primary env var name
      PGPASSWORD: "password-from-env", // aliased env var name, primary is SYNTHETIC_PASSWORD
    };
    Object.entries(syntheticEnv).forEach((se) => {
      const [envVarName, envVarValue] = se;
      Deno.env.set(envVarName, String(envVarValue));
    });

    const config = pgdbcc.configure({
      identity: pgdbcc.envBuilder.textUndefined,
      database: "database-in-code",
      hostname: "hostname-in-code",
      port: 5433,
      user: pgdbcc.envBuilder.textUndefined,
      password: pgdbcc.envBuilder.textUndefined,
      dbConnPoolCount: 9,
    });
    // SYNTHETIC_IDENTITY and PGAPPNAME missing in env, and no value supplied
    ta.assertEquals(config.identity, pgdbcc.envBuilder.textUndefined);

    ta.assertEquals(config.database, "database-in-code");
    ta.assertEquals(config.hostname, "hostname-in-code");
    ta.assertEquals(config.port, 5433); // from code
    ta.assertEquals(config.user, "user-from-env");
    ta.assertEquals(config.password, "password-from-env");
    ta.assertEquals(config.dbConnPoolCount, 9); // from code

    ta.assertEquals(pgdbcc.missingValues(config).length, 0);
    ta.assertEquals(
      ["identity"],
      pgdbcc.missingValues(
        config,
        "identity",
        "database",
        "hostname",
        "port",
        "user",
        "password",
      ).map((asd) => asd.identity),
    );

    const pgco = pgdbcc.pgClientOptions(config);
    ta.assertEquals(pgco.applicationName, undefined);
    ta.assertEquals(pgco.database, config.database);
    ta.assertEquals(pgco.hostname, config.hostname);
    ta.assertEquals(pgco.port, config.port);
    ta.assertEquals(pgco.user, config.user);
    ta.assertEquals(pgco.password, config.password);

    Object.keys(syntheticEnv).forEach((envVarName) => {
      Deno.env.delete(envVarName);
    });
  });
});

Deno.test("PostgreSQL connection", async (tc) => {
  await tc.step("invalid", async () => {
    const pgdbcc = mod.pgDatabaseConnConfig();
    const config = pgdbcc.configure({
      identity: `resFactory/factory/lib/sql/engine/postgres_test.ts`,
      database: "database",
      hostname: "hostname",
      port: 5433,
      user: "user",
      password: "user",
      dbConnPoolCount: 1,
    });
    ta.assertEquals(pgdbcc.missingValues(config).length, 0);

    const pgEngine = mod.postgreSqlEngine();
    const pgDBi = pgEngine.instance({
      clientOptions: () => pgdbcc.pgClientOptions(config),
      autoCloseOnUnload: true,
      poolCount: config.dbConnPoolCount,
    });
    ta.assert(!(await pgDBi.isConnectable()));
    pgDBi.close();
  });

  await tc.step("valid", async () => {
    if (isCICD) return;

    const pgdbcc = mod.pgDatabaseConnConfig({
      ens: (given) => `TESTVALID_PKC_${given}`,
    });
    const config = pgdbcc.configure({
      configured: true,
      identity: `resFactory/factory/lib/sql/engine/postgres_test.ts`,
      database: "gitlabhq_production",
      hostname: "192.168.2.24",
      port: 5033,
      user: pgdbcc.envBuilder.textUndefined, // must come from env
      password: pgdbcc.envBuilder.textUndefined, // must come from env
      dbConnPoolCount: 1,
    });
    const pgco = pgdbcc.pgClientOptions(config);
    if (!pgco.user || !pgco.password) {
      console.error(
        `Unable to test valid PostgreSQL connection, TESTVALID_PKC_PGUSER or TESTVALID_PKC_PGPASSWORD env vars missing`,
      );
      return;
    }
    ta.assertEquals(pgdbcc.missingValues(config).length, 0);

    const events = new Map<string, { count: number }>();
    const event = (id: string) => {
      let result = events.get(id);
      if (!result) {
        result = { count: 0 };
        events.set(id, result);
      }
      return result;
    };

    const pgEngine = mod.postgreSqlEngine();
    const pgDBi = pgEngine.instance({
      clientOptions: () => pgdbcc.pgClientOptions(config),
      autoCloseOnUnload: true,
      poolCount: config.dbConnPoolCount,
      prepareEE: (ee) => {
        // deno-lint-ignore require-await
        ee.on("openingDatabase", async () => event("openingDatabase").count++);
        // deno-lint-ignore require-await
        ee.on("openedDatabase", async () => event("openedDatabase").count++);
        ee.on(
          "testingConnection",
          // deno-lint-ignore require-await
          async () => event("testingConnection").count++,
        );
        // deno-lint-ignore require-await
        ee.on("testedConnValid", async () => event("testedConnValid").count++);
        ee.on(
          "testedConnInvalid",
          // deno-lint-ignore require-await
          async () => event("testedConnInvalid").count++,
        );
        // deno-lint-ignore require-await
        ee.on("connected", async () => event("connected").count++);
        // deno-lint-ignore require-await
        ee.on("releasing", async () => event("releasing").count++);
        // deno-lint-ignore require-await
        ee.on("closingDatabase", async () => event("closingDatabase").count++);
        // deno-lint-ignore require-await
        ee.on("closedDatabase", async () => event("closedDatabase").count++);
        return ee;
      },
    });
    ta.assert(await pgDBi.isConnectable());
    pgDBi.init();
    const records = await pgDBi.recordsDQL(SQLa.typicalSqlEmitContext(), {
      SQL: () => `SELECT datname FROM pg_database WHERE datistemplate = false;`,
    });
    ta.assert(records);
    pgDBi.close();
    //console.dir(events);
  });
});

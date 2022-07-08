import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./postgres.ts";

Deno.test("PostgreSQL engine connection defn", async (tc) => {
  const pgdbcc = mod.pgDatabaseConnConfig({
    ens: (given) => `SYNTHETIC_${given}`,
  });

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
    ta.assertEquals(pgdbcc.missingProperties(config).length, 0);
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
    ta.assertEquals(pgdbcc.missingProperties(config).length, 0);

    Object.keys(syntheticEnv).forEach((envVarName) => {
      Deno.env.delete(envVarName);
    });
  });

  await tc.step("mixed code, env, and env alias", () => {
    const syntheticEnv = {
      SYNTHETIC_USER: "user-from-env", // primary env var name
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

    ta.assertEquals(pgdbcc.missingProperties(config).length, 0);
    ta.assertEquals(
      ["identity"],
      pgdbcc.missingProperties(
        config,
        "identity",
        "database",
        "hostname",
        "port",
        "user",
        "password",
      ).map((asd) => asd.identity),
    );

    Object.keys(syntheticEnv).forEach((envVarName) => {
      Deno.env.delete(envVarName);
    });
  });
});

import { testingAsserts as ta } from "./deps-test.ts";
import * as t from "./toggle.ts";
import * as mod from "./env.ts";

const syntheticNS = (name: string) =>
  `CFGTEST_${mod.camelCaseToEnvVarName(name)}`;

Deno.test(`envToggles`, async (tc) => {
  await tc.step("invalid config, missing required properties", () => {
    const syntheticToggles = {
      text: t.text(),
      number: t.integer(),
      maxAgeInMS: t.bigint(),
      bool: t.boolean(),
      complexType: t.object({
        innerText: t.text(),
        innerNumber: t.integer(),
      }),
    };

    const testTextPropValue = "test";
    Deno.env.set("CFGTEST_TEXT", testTextPropValue);

    const et = mod.envToggles(syntheticToggles, { evNS: syntheticNS });
    const { toggleValues: config } = et;
    ta.assertEquals(false, et.test(et.toggleValues));
    ta.assertEquals(5, et.envVarsSearched.length);
    ta.assertEquals(1, et.envVarsSearched.filter((s) => s.found).length);
    ta.assertEquals(4, et.envVarsSearched.filter((s) => !s.found).length);
    ta.assertEquals(0, et.envVarsSearched.filter((s) => s.defaulted).length);

    Deno.env.delete("CFGTEST_TEXT");
    ta.assertEquals(config.text, testTextPropValue);
  });

  await tc.step("valid config, all required properties defined", () => {
    const syntheticToggles = {
      text: t.text(),
      number: t.integer(),
      maxAgeInMS: t.bigint(),
      bool: t.boolean(),
      complexType: t.object({
        innerText: t.text(),
        innerNumber: t.integer(),
      }),
    };

    Deno.env.set("CFGTEST_TEXT", "test");
    Deno.env.set("CFGTEST_NUMBER", String(100));
    Deno.env.set("CFGTEST_MAX_AGE_IN_MS", String(2500));
    Deno.env.set("CFGTEST_BOOL", String(true));
    Deno.env.set(
      "CFGTEST_COMPLEX_TYPE",
      JSON.stringify({ innerText: "testInner", innerNumber: 25 }),
    );

    const et = mod.envToggles(syntheticToggles, { evNS: syntheticNS });
    const { toggleValues: config } = et;
    ta.assert(et.test(et.toggleValues));
    ta.assertEquals(5, et.envVarsSearched.length);
    ta.assertEquals(5, et.envVarsSearched.filter((s) => s.found).length);
    ta.assertEquals(0, et.envVarsSearched.filter((s) => !s.found).length);
    ta.assertEquals(0, et.envVarsSearched.filter((s) => s.defaulted).length);

    Deno.env.delete("CFGTEST_TEXT");
    Deno.env.delete("CFGTEST_NUMBER");
    Deno.env.delete("CFGTEST_MAX_AGE_IN_MS");
    Deno.env.delete("CFGTEST_BOOL");
    Deno.env.delete("CFGTEST_COMPLEX_TYPE");

    ta.assertEquals(config.text, "test");
    ta.assertEquals(config.number, 100);
    ta.assertEquals(config.maxAgeInMS, 2500n);
    ta.assertEquals(config.bool, true);
    ta.assertEquals(config.complexType, {
      innerText: "testInner",
      innerNumber: 25,
    });
  });

  await tc.step(
    "valid config with single required property, an alias, others optional with defaults",
    () => {
      const syntheticToggles = {
        text: t.text(),
        number: t.defaultable(t.integerOptional(), () => 47),
        maxAgeInMS: mod.alias(t.bigintOptional(), "CFGTEST_MAXAGEINMS_ALIAS"),
        bool: t.defaultable(t.boolean(), () => true),
        complexType: t.objectOptional({
          innerText: t.text(),
          innerNumber: t.integer(),
        }),
      };

      Deno.env.set("CFGTEST_TEXT", "test");
      Deno.env.set("CFGTEST_MAXAGEINMS_ALIAS", String(2456));

      const et = mod.envToggles(syntheticToggles, { evNS: syntheticNS });
      const { toggleValues: config } = et;
      ta.assert(et.test(et.toggleValues, {
        onInvalid: (reason) => {
          console.log(reason);
        },
      }));
      ta.assertEquals(6, et.envVarsSearched.length); // 5 regular searches, 1 alias
      ta.assertEquals(2, et.envVarsSearched.filter((s) => s.found).length);
      ta.assertEquals(4, et.envVarsSearched.filter((s) => !s.found).length); // alias was found but 4 others weren't
      ta.assertEquals(2, et.envVarsSearched.filter((s) => s.defaulted).length);

      Deno.env.delete("CFGTEST_TEXT");
      ta.assertEquals(config.text, "test");
      ta.assertEquals(config.number, 47);
      ta.assertEquals(config.maxAgeInMS, 2456n);
      ta.assertEquals(config.bool, true);
    },
  );
});

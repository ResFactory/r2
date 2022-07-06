import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./axiom-serde.ts";
import * as ax from "./axiom.ts";
import { $ } from "./axiom.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("serializable/deserializable axioms", async (tc) => {
  // use these for type-testing in IDE
  const syntheticDecl = {
    text: mod.text(),
    textOptional: mod.textOptional(),
    textCustom: mod.text($.string),
    textLabeledOptional: mod.label(mod.textOptional(), "synthetic_label1"),
    int: mod.integer(),
    intOptional: mod.integerOptional(),
    intCustom: mod.integer($.number),
    bigint: mod.bigint(),
    bigintOptional: mod.bigintOptional(),
    bigintCustom: mod.bigint($.bigint),
    json: mod.jsonText(),
    jsonCustom: mod.jsonText($.string),
    jsonOptional: mod.jsonTextOptional(),
    date: mod.date(),
    dateCustom: mod.date($.date),
    dateNullable: mod.dateOptional(),
    dateTime: mod.dateTime(),
    dateTimeCustom: mod.dateTime($.date),
    dateTimeNullable: mod.dateTimeOptional(),

    // passing in Axiom without SerDe wrapper will be a "lint" error for
    // mod.serDeAxioms but OK for Axiom
    notSerDe: $.string.optional(),
  };

  const syntheticDefn = $.object(syntheticDecl);

  // deno-lint-ignore require-await
  await tc.step("axiom IDE experiments", async () => {
    // hover over 'names' to see quasi-typed names
    const _names = syntheticDefn.axiomObjectDeclPropNames;
    // uncomment the following to see the IDE picking up type mismatch error for `p`
    //const _badNameFound = syntheticDefn.properties.map((p) => p.axiomPropertyName).find(p => p === "bad");

    // hover over 'Synthetic' to see fully typed object
    type Synthetic = ax.AxiomType<typeof syntheticDefn>;
    // try typing in bad properties or invalid types
    const _synthetic: Synthetic = {
      text: "synthetic",
      textCustom: "synthetic_custom",
      int: 0,
      intCustom: 1,
      bigint: 0n,
      bigintCustom: 1n,
      json: `{"synthetic": "yes"}`,
      jsonCustom: `{ "synthetic": "yes", "custom": true }`,
      date: new Date(),
      dateCustom: new Date(),
      dateTime: new Date(),
      dateTimeCustom: new Date(),
      // bad: "hello"
    };
  });

  await tc.step("SerDe-wrapped axiom", async (tc) => {
    let lintIssuesCount = 0;
    const syntheticDomains = mod.serDeAxioms(syntheticDecl, {
      onPropertyNotSerDeAxiom: (name) => {
        lintIssuesCount++;
        ta.assertEquals("notSerDe", name);
      },
    });

    await tc.step("lint issues count", () => {
      ta.assertEquals(1, lintIssuesCount);
    });

    await tc.step("IDE experiments", () => {
      // hover over 'names' to see quasi-typed names
      const _sdNames = syntheticDomains.serDeAxioms.map((sda) => sda.identity);
      const _sdDefault = syntheticDomains.serDeAxioms.map((sda) =>
        sda.defaultValue
      );
    });

    await tc.step("labeled", () => {
      const syntheticDomains = mod.serDeAxioms(syntheticDecl);
      const labeled = Array.from(
        mod.labeledSerDeAxioms(syntheticDomains, (test) => {
          return test.labels.includes("synthetic_label1") ? true : false;
        }),
      );
      ta.assertEquals(1, labeled.length);
      ta.assertEquals("textLabeledOptional", labeled[0].identity);
    });

    // hover over 'SyntheticDomains' to see fully typed object
    type SyntheticDomains = ax.AxiomType<typeof syntheticDomains>;
    // try typing in bad properties or invalid types
    const synthetic: SyntheticDomains = {
      text: "synthetic",
      textCustom: "synthetic_custom",
      int: 0,
      intCustom: 1,
      bigint: 0n,
      bigintCustom: 1n,
      json: `{"synthetic": "yes"}`,
      jsonCustom: `{ "synthetic": "yes", "custom": true }`,
      date: new Date(),
      dateCustom: new Date(),
      dateTime: new Date(),
      dateTimeCustom: new Date(),
      // bad: "hello"
    };

    const expectType = <T>(_value: T) => {
      // Do nothing, the TypeScript compiler handles this for us
    };

    // should see compile errors if any of these fail
    expectType<string>(synthetic.text);
    expectType<string>(synthetic.textCustom);
    expectType<string | undefined>(synthetic.textLabeledOptional);
    expectType<number>(synthetic.int);
    expectType<number>(synthetic.intCustom);
    expectType<bigint>(synthetic.bigint);
    expectType<bigint>(synthetic.bigintCustom);
    expectType<string>(synthetic.json);
    expectType<string>(synthetic.jsonCustom);
    expectType<Date>(synthetic.date);
    expectType<Date>(synthetic.dateCustom);
    expectType<Date>(synthetic.dateTime);
    expectType<Date>(synthetic.dateTimeCustom);
  });
});

Deno.test(`deserialize JSON text`, async (tc) => {
  await tc.step("invalid config, missing required properties", () => {
    const syntheticSerDe = {
      text: mod.text(),
      number: mod.integer(),
      maxAgeInMS: mod.bigint(),
      bool: mod.boolean(),
      complexType: mod.object({
        innerText: mod.text(),
        innerNumber: mod.integer(),
      }),
    };

    const syntheticJsonText = JSON.stringify(
      { text: "test" },
      (_, value) => typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
    );

    const djt = mod.deserializeJsonText(
      syntheticSerDe,
      () => syntheticJsonText,
    );
    const { serDeAxiomRecord: sdaRec } = djt;
    ta.assertEquals(false, djt.test(sdaRec));
    ta.assertEquals(sdaRec.text, "test");
  });

  await tc.step("valid config, all required properties defined", () => {
    const syntheticSerDe = {
      text: mod.text(),
      number: mod.integer(),
      // maxAgeInMS: mod.bigint(), TODO: bigint in omnibus doesn't work yet
      bool: mod.boolean(),
      complexType: mod.object({
        innerText: mod.text(),
        innerNumber: mod.integer(),
      }),
    };

    const syntheticJsonText = JSON.stringify({
      text: "test",
      number: 100,
      bool: true,
      complexType: { innerText: "testInner", innerNumber: 25 },
    }, (_, value) => typeof value === "bigint" ? value.toString() : value // return everything else unchanged
    );

    const djt = mod.deserializeJsonText(
      syntheticSerDe,
      () => syntheticJsonText,
    );
    const { serDeAxiomRecord: config } = djt;
    ta.assert(djt.test(config, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));

    ta.assertEquals(config.text, "test");
    ta.assertEquals(config.number, 100);
    ta.assertEquals(config.bool, true);
    ta.assertEquals(config.complexType, {
      innerText: "testInner",
      innerNumber: 25,
    });
  });
});

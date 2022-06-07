import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./domain.ts";
import * as ax from "../../safety/axiom.ts";
import { $ } from "../../safety/axiom.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("type-safe data domains", async (tc) => {
  // use these for type-testing in IDE
  const syntheticDecl = {
    text: mod.text(),
    text_nullable: mod.textNullable(),
    text_custom: mod.text($.string),
    int: mod.integer(),
    int_nullable: mod.integerNullable(),
    int_custom: mod.integer($.number),
    json: mod.jsonText(),
    json_custom: mod.jsonText($.string),
    json_nullable: mod.jsonTextNullable(),

    // passing in Axiom without domain wrapper will be a "lint" error for
    // mod.sqlDomains but OK for Axiom
    non_domain: $.string.optional(),
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
      text_custom: "synthetic_custom",
      int: 0,
      int_custom: 1,
      json: `{"synthetic": "yes"}`,
      json_custom: `{ "synthetic": "yes", "custom": true }`,
      // bad: "hello"
    };
  });

  await tc.step("domain-wrapped axiom", async (tc) => {
    let lintIssuesCount = 0;
    const syntheticDomains = mod.sqlDomains(syntheticDecl, {
      onPropertyNotAxiomSqlDomain: (name) => {
        lintIssuesCount++;
        ta.assertEquals("non_domain", name);
      },
    });

    await tc.step("lint issues count", () => {
      ta.assertEquals(1, lintIssuesCount);
    });

    await tc.step("IDE experiments", () => {
      // hover over 'names' to see quasi-typed names
      const _sdNames = syntheticDomains.domains.map((d) => d.identity);
      const _sdSqlTypes = syntheticDomains.domains.map((d) => d.sqlDataType);
    });

    await tc.step("references (for foreign keys, etc.)", () => {
      const intDomain = syntheticDomains.domains.find((d) =>
        d.identity == "int"
      );
      ta.assert(intDomain);
      ta.assertEquals("int", intDomain.identity);
      const intRefASD = intDomain.referenceASD();
      ta.assert(intRefASD);
      const intRef = intDomain.reference();
      ta.assertEquals("int", intRef.identity);
      const intRefOther = intDomain.reference({ foreignIdentity: "intRef" });
      ta.assertEquals("intRef", intRefOther.identity);
    });

    // hover over 'SyntheticDomains' to see fully typed object
    type SyntheticDomains = ax.AxiomType<typeof syntheticDomains>;
    // try typing in bad properties or invalid types
    const _synthetic: SyntheticDomains = {
      text: "synthetic",
      text_custom: "synthetic_custom",
      int: 0,
      int_custom: 1,
      json: `{"synthetic": "yes"}`,
      json_custom: `{ "synthetic": "yes", "custom": true }`,
      // bad: "hello"
    };
  });
});

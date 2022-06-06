import { testingAsserts as ta } from "./deps-test.ts";
import * as mod from "./domain.ts";
import * as ax from "../../safety/axiom.ts";
import { $ } from "../../safety/axiom.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("type-safe data domain IDE experiments", () => {
  // use these for type-testing in IDE
  const syntheticDefn = $.object({
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
  });
  // hover over 'names' to see quasi-typed names
  const _names = syntheticDefn.properties.map((p) => p.axiomPropertyName);
  // _goodNameFound and _badNameFound show type-safety by name
  const _goodNameFound = syntheticDefn.properties.map((p) =>
    p.axiomPropertyName
  ).find((p) => p === "text");
  // uncomment the following to see the IDE picking up type mismatch error for `p`
  //const _badNameFound = syntheticDefn.properties.map((p) => p.axiomPropertyName).find(p => p === "bad");

  let lintIssuesCount = 0;
  const syntheticDomains = mod.sqlDomains(syntheticDefn, {
    onPropertyNotAxiomSqlDomain: (prop) => {
      lintIssuesCount++;
      ta.assertEquals("non_domain", prop.axiomPropertyName);
    },
  });
  ta.assertEquals(1, lintIssuesCount);
  const _sdNames = syntheticDomains.domains.map((d) => d.identity);
  const _sdSqlTypes = syntheticDomains.domains.map((d) => d.sqlDataType);

  // hover over 'PublHost' to see fully typed object
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

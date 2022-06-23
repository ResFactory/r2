import { testingAsserts as ta } from "../render/deps-test.ts";
import * as SQLa from "../render/mod.ts";
import * as mod from "./plantuml-ie-notation.ts";
import * as tf from "../render/mod_test-fixtures.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test("PlantUML IE Diagram", () => {
  const puml = mod.plantUmlIE({
    ...SQLa.typicalSqlEmitContext(),
    plantUmlIeOptions: {
      diagramName: "ERD",
      includeEntity: () => true,
      includeColumn: () => true,
    },
  }, function* () {
    const defns = tf.syntheticDatabaseDefn();
    for (const defn of Object.values(defns)) {
      if (SQLa.isTableDefinition(defn)) {
        yield defn;
      }
    }
  });
  //console.log(puml);
});

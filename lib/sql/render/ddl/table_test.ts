import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./table.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";
import * as ax from "../../../safety/axiom.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";

Deno.test("SQL assembler (SQLa) custom table", async (tc) => {
  const syntheticTable1Defn = mod.table("synthetic_table1", {
    column_pk: mod.primaryKey(d.integer()),
    column_one_text: d.text(),
    column_two_text_nullable: d.textNullable(),
    column_unique: mod.unique(d.text()),
  });

  const syntheticTable2Defn = mod.table(
    "synthetic_table2",
    {
      column_pk: mod.primaryKey(d.integer()),
      column_fk_pk: mod.foreignKey(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.column_pk,
      ),
      column_fk_text: mod.foreignKey(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.column_one_text,
      ),
    },
  );

  const ctx = undefined;
  const emitOptions = tmpl.typicalSqlTextEmitOptions();

  await tc.step("table 1 definition", () => {
    ta.assert(syntheticTable1Defn);
    ta.assertEquals("synthetic_table1", syntheticTable1Defn.tableName);
    ta.assert(syntheticTable1Defn.domains.length == 4);
    ta.assertEquals(
      [
        "column_pk",
        "column_one_text",
        "column_two_text_nullable",
        "column_unique",
      ],
      syntheticTable1Defn.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table 1 SQL", () => {
    ta.assertEquals(
      syntheticTable1Defn.SQL(ctx, emitOptions),
      uws(`
        CREATE TABLE "synthetic_table1" (
            "column_pk" INTEGER PRIMARY KEY,
            "column_one_text" TEXT NOT NULL,
            "column_two_text_nullable" TEXT,
            "column_unique" TEXT NOT NULL,
            UNIQUE("column_unique")
        )`),
    );
  });

  await tc.step("table 2 definition", () => {
    ta.assert(syntheticTable2Defn);
    ta.assertEquals("synthetic_table2", syntheticTable2Defn.tableName);
    ta.assert(syntheticTable2Defn.domains.length == 3);
    ta.assertEquals(
      [
        "column_pk",
        "column_fk_pk",
        "column_fk_text",
      ],
      syntheticTable2Defn.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table 2 SQL", () => {
    ta.assertEquals(
      syntheticTable2Defn.SQL(ctx, emitOptions),
      uws(`
        CREATE TABLE "synthetic_table2" (
            "column_pk" INTEGER PRIMARY KEY,
            "column_fk_pk" INTEGER NOT NULL,
            "column_fk_text" TEXT NOT NULL,
            FOREIGN KEY("column_fk_pk") REFERENCES "synthetic_table1"("column_pk"),
            FOREIGN KEY("column_fk_text") REFERENCES "synthetic_table1"("column_one_text")
        )`),
    );
  });

  await tc.step("typed table 1 row values", () => {
    type Synthetic1 = ax.AxiomType<typeof syntheticTable1Defn>;
    const synthetic1: Synthetic1 = {
      column_pk: 1,
      column_one_text: "text",
      // TODO: figure out why removing this nullable text fails the test
      column_two_text_nullable: "TODO: should be nullable but test fails",
      column_unique: "unique",
    };
    ta.assert(syntheticTable1Defn.test(synthetic1, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));
  });

  await tc.step("typed table 2 row values", () => {
    type Synthetic2 = ax.AxiomType<typeof syntheticTable2Defn>;
    const synthetic2: Synthetic2 = {
      column_pk: 1,
      column_fk_pk: 1,
      column_fk_text: "text",
    };
    ta.assert(syntheticTable2Defn.test(synthetic2, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));
  });
});

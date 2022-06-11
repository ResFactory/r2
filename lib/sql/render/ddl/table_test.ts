import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./table.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";
import * as ax from "../../../safety/axiom.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";

Deno.test("SQL assembler (SQLa) custom table", async (tc) => {
  const syntheticTable1Defn = mod.tableDefnRowFactory("synthetic_table1", {
    synthetic_table1_id: mod.autoIncPrimaryKey(d.integer()),
    column_one_text: d.text(),
    column_two_text_nullable: d.textNullable(),
    column_unique: mod.unique(d.text()),
    ...mod.housekeeping(),
  });

  const syntheticTable2Defn = mod.typicalKeysTableDefinition(
    "synthetic_table2",
    {
      synthetic_table2_id: mod.autoIncPrimaryKey(d.integer()),
      column_fk_pk: mod.foreignKey(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.synthetic_table1_id,
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
    ta.assert(mod.isTableDefinition(syntheticTable1Defn));
    ta.assert(syntheticTable1Defn);
    ta.assertEquals("synthetic_table1", syntheticTable1Defn.tableName);
    ta.assert(syntheticTable1Defn.domains.length == 5);
    ta.assertEquals(
      [
        "synthetic_table1_id",
        "column_one_text",
        "column_two_text_nullable",
        "column_unique",
        "created_at",
      ],
      syntheticTable1Defn.domains.map((cd) => cd.identity),
    );
  });

  await tc.step("table 1 creation SQL", () => {
    ta.assertEquals(
      syntheticTable1Defn.SQL(ctx, emitOptions),
      uws(`
        CREATE TABLE "synthetic_table1" (
            "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "column_one_text" TEXT NOT NULL,
            "column_two_text_nullable" TEXT,
            "column_unique" TEXT NOT NULL,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("column_unique")
        )`),
    );
  });

  await tc.step("table 2 definition", () => {
    ta.assert(mod.isTableDefinition(syntheticTable2Defn));
    ta.assert(syntheticTable2Defn);
    ta.assertEquals("synthetic_table2", syntheticTable2Defn.tableName);
    ta.assert(syntheticTable2Defn.domains.length == 3);
    ta.assertEquals(
      [
        "synthetic_table2_id",
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
            "synthetic_table2_id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "column_fk_pk" INTEGER NOT NULL,
            "column_fk_text" TEXT NOT NULL,
            FOREIGN KEY("column_fk_pk") REFERENCES "synthetic_table1"("synthetic_table1_id"),
            FOREIGN KEY("column_fk_text") REFERENCES "synthetic_table1"("column_one_text")
        )`),
    );
  });

  await tc.step("typed table 1 Typescript objects", () => {
    type Synthetic1 = ax.AxiomType<typeof syntheticTable1Defn>;
    const synthetic1: Synthetic1 = {
      synthetic_table1_id: 1,
      column_one_text: "text",
      // TODO: figure out why removing this nullable text fails the test
      column_two_text_nullable: "TODO: should be nullable but test fails",
      column_unique: "unique",
      created_at: new Date(),
    };
    ta.assert(syntheticTable1Defn.test(synthetic1, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));
  });

  await tc.step("typed table 1 DML row values", () => {
    const insertable = syntheticTable1Defn.prepareInsertable({
      columnOneText: "text",
      columnUnique: "value",
      createdAt: new Date(),
    });
    ta.assert(insertable);
    ta.assertEquals(
      syntheticTable1Defn.insertDML(insertable).SQL(ctx, emitOptions),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }')`,
    );
    ta.assertEquals(
      syntheticTable1Defn.insertDML(insertable, { returning: "*" }).SQL(
        ctx,
        emitOptions,
      ),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }') RETURNING *`,
    );
    ta.assertEquals(
      syntheticTable1Defn.insertDML(insertable, { returning: "primary-keys" })
        .SQL(
          ctx,
          emitOptions,
        ),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }') RETURNING "synthetic_table1_id"`,
    );
    ta.assertEquals(
      syntheticTable1Defn.insertDML(insertable, {
        returning: { columns: ["synthetic_table1_id"] },
        onConflict: { SQL: () => `ON CONFLICT ("synthetic_table1_id") IGNORE` },
      }).SQL(
        ctx,
        emitOptions,
      ),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }') ON CONFLICT ("synthetic_table1_id") IGNORE RETURNING "synthetic_table1_id"`,
    );
  });

  await tc.step("typed table 2 row values", () => {
    type Synthetic2 = ax.AxiomType<typeof syntheticTable2Defn>;
    const synthetic2: Synthetic2 = {
      synthetic_table2_id: 1,
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

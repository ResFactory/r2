import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./table.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";
import * as ax from "../../../safety/axiom.ts";
import * as sch from "./schema.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";

type HousekeepingColumnsDefns<Context extends tmpl.SqlEmitContext> = {
  readonly created_at: d.AxiomSqlDomain<Date | undefined, Context>;
};

function housekeeping<
  Context extends tmpl.SqlEmitContext,
>(): HousekeepingColumnsDefns<Context> {
  return {
    created_at: d.dateTimeNullable(undefined, {
      sqlDefaultValue: () => ({ SQL: () => `CURRENT_TIMESTAMP` }),
    }),
  };
}

Deno.test("SQL Aide (SQLa) custom table", async (tc) => {
  const syntheticTable1Defn = mod.typicalKeysTableDefinition(
    "synthetic_table1",
    {
      synthetic_table1_id: mod.autoIncPrimaryKey(d.integer()),
      column_one_text: d.text(),
      column_two_text_nullable: d.textNullable(),
      column_unique: mod.unique(d.text()),
      ...housekeeping(),
    },
  );
  const syntheticTable1DefnRF = mod.tableDomainsRowFactory(
    syntheticTable1Defn.tableName,
    syntheticTable1Defn.axiomObjectDecl,
  );
  const syntheticTable1DefnVW = mod.tableDomainsViewWrapper(
    `${syntheticTable1Defn.tableName}_vw`,
    syntheticTable1Defn.tableName,
    syntheticTable1Defn.axiomObjectDecl,
  );

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
    { sqlNS: sch.sqlSchemaDefn("synthetic_schema") },
  );

  const ctx = tmpl.typicalSqlEmitContext();

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
      syntheticTable1Defn.SQL(ctx),
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

  await tc.step("table 1 DML type-safety", () => {
    const expectType = <T>(_value: T) => {
      // Do nothing, the TypeScript compiler handles this for us
    };
    const row = syntheticTable1DefnRF.prepareInsertable({
      columnOneText: "text",
      columnUnique: "unique",
    });
    expectType<string>(row.column_one_text); // should see compile error if this doesn't work
  });

  await tc.step("table 1 wrapper view", () => {
    ta.assertEquals(
      syntheticTable1DefnVW.SQL(ctx),
      uws(`
        CREATE VIEW IF NOT EXISTS "synthetic_table1_vw"("synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "created_at") AS
            SELECT "synthetic_table1_id", "column_one_text", "column_two_text_nullable", "column_unique", "created_at"
              FROM "synthetic_table1"`),
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
      syntheticTable2Defn.SQL(ctx),
      uws(`
        CREATE TABLE "synthetic_schema"."synthetic_table2" (
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
    const insertable = syntheticTable1DefnRF.prepareInsertable({
      columnOneText: "text",
      columnUnique: "value",
      createdAt: new Date(),
    });
    ta.assert(insertable);
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }')`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, { returning: "*" }).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }') RETURNING *`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, { returning: "primary-keys" })
        .SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable", "column_unique", "created_at") VALUES ('text', NULL, 'value', '${
        String(insertable.created_at)
      }') RETURNING "synthetic_table1_id"`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, {
        returning: { columns: ["synthetic_table1_id"] },
        onConflict: { SQL: () => `ON CONFLICT ("synthetic_table1_id") IGNORE` },
      }).SQL(ctx),
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

import { testingAsserts as ta } from "../deps-test.ts";
import * as mod from "./table.ts";
import * as tmpl from "../template/mod.ts";
import * as d from "../domain.ts";
import * as l from "../lint.ts";
import * as ax from "../../../axiom/mod.ts";
import * as axsdc from "../../../axiom/axiom-serde-crypto.ts";
import * as sch from "./schema.ts";
import * as dql from "../dql/mod.ts";
import { unindentWhitespace as uws } from "../../../text/whitespace.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

type HousekeepingColumnsDefns<Context extends tmpl.SqlEmitContext> = {
  readonly created_at: d.AxiomSqlDomain<Date | undefined, Context>;
};

function housekeeping<
  Context extends tmpl.SqlEmitContext,
>(): HousekeepingColumnsDefns<Context> {
  return {
    created_at: d.createdAt(),
  };
}

Deno.test("SQL Aide (SQLa) custom table", async (tc) => {
  const syntheticTable1Defn = mod.typicalKeysTableDefinition(
    "synthetic_table1",
    {
      synthetic_table1_id: mod.autoIncPrimaryKey(d.integer()),
      column_one_text: d.text(),
      column_two_text_nullable_defaultable: ax.defaultableOptional<
        string | undefined
      >(
        d.textNullable(),
        () => `synthetic-defaulted`,
      ),
      column_three_text_digest: d.sha1Digest(),
      column_unique: mod.unique(d.text()),
      column_linted: d.lintedSqlDomain(
        d.text(),
        d.domainLintIssue("synthetic lint issue #1", {
          consequence: l.SqlLintIssueConsequence.INFORMATIONAL_DDL,
        }),
      ),
      ...housekeeping(),
    },
    {
      // test "manual" creation of constraints
      sqlPartial: (destination) => {
        if (destination == "after all column definitions") {
          return [
            {
              SQL: () => `UNIQUE(column_one_text, column_three_text_digest)`,
            },
          ];
        }
      },
      // test "automatic" creation of unique constraints
      constraints: [mod.uniqueTableCols("column_unique", "created_at")],
    },
  );
  const syntheticTable1DefnDefaultable = ax.axiomSerDeObjectDefaultables<
    typeof syntheticTable1Defn.axiomObjectDecl
  >(...syntheticTable1Defn.domains);
  const syntheticTable1DefnRF = mod.tableDomainsRowFactory(
    syntheticTable1Defn.tableName,
    syntheticTable1Defn.axiomObjectDecl,
  );
  const syntheticTable1DefnVW = mod.tableDomainsViewWrapper(
    `${syntheticTable1Defn.tableName}_vw`,
    syntheticTable1Defn.tableName,
    syntheticTable1Defn.axiomObjectDecl,
  );

  const st2PK = mod.autoIncPrimaryKey(d.integer());
  const syntheticTable2Defn = mod.typicalKeysTableDefinition(
    "synthetic_table2",
    {
      synthetic_table2_id: st2PK,
      column_fk_pk: mod.foreignKey(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.synthetic_table1_id,
      ),
      column_fk_text: mod.foreignKey(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.column_one_text,
      ),
      column_fk_text_nullable: mod.foreignKeyNullable(
        syntheticTable1Defn.tableName,
        syntheticTable1Defn.axiomObjectDecl.column_one_text,
      ),
      column_fk_self_ref: mod.selfRefForeignKey(st2PK),
      column_fk_self_ref_nullable: mod.selfRefForeignKeyNullable(st2PK),
    },
    { sqlNS: sch.sqlSchemaDefn("synthetic_schema") },
  );

  const ctx = tmpl.typicalSqlEmitContext();

  await tc.step("table 1 definition", async () => {
    ta.assert(mod.isTableDefinition(syntheticTable1Defn));
    ta.assert(syntheticTable1Defn);
    ta.assertEquals("synthetic_table1", syntheticTable1Defn.tableName);
    ta.assert(syntheticTable1Defn.domains.length == 7);
    ta.assertEquals(
      [
        "synthetic_table1_id",
        "column_one_text",
        "column_two_text_nullable_defaultable",
        "column_three_text_digest",
        "column_unique",
        "column_linted",
        "created_at",
      ],
      syntheticTable1Defn.domains.map((cd) => cd.identity),
    );
    ta.assertEquals(
      `synthetic-defaulted`,
      syntheticTable1DefnDefaultable.column_two_text_nullable_defaultable(),
    );
    ta.assertEquals(
      await axsdc.sha1Digest(`synthetic-digest-source`),
      await syntheticTable1DefnDefaultable.column_three_text_digest(
        `synthetic-digest-source`,
      ),
    );
  });

  await tc.step("table 1 creation SQL", () => {
    const ddlOptions = tmpl.typicalSqlTextSupplierOptions();
    const lintState = tmpl.typicalSqlLintSummaries(ddlOptions.sqlTextLintState);
    ta.assertEquals(
      tmpl.SQL(ddlOptions)`
        ${lintState.sqlTextLintSummary}

        ${syntheticTable1Defn}`.SQL(ctx),
      uws(`
        -- [Informational (DDL)] synthetic lint issue #1

        CREATE TABLE "synthetic_table1" (
            "synthetic_table1_id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "column_one_text" TEXT NOT NULL,
            "column_two_text_nullable_defaultable" TEXT,
            "column_three_text_digest" TEXT NOT NULL,
            "column_unique" TEXT NOT NULL,
            "column_linted" TEXT NOT NULL,
            "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("column_unique"),
            UNIQUE("column_unique", "created_at"),
            UNIQUE(column_one_text, column_three_text_digest)
        );`),
    );
  });

  await tc.step("table 1 DML type-safety", () => {
    const expectType = <T>(_value: T) => {
      // Do nothing, the TypeScript compiler handles this for us
    };
    const row = syntheticTable1DefnRF.prepareInsertable({
      columnOneText: "text",
      columnUnique: "unique",
      columnLinted: "linted",
      columnThreeTextDigest: axsdc.sha1DigestUndefined,
    });
    expectType<string | tmpl.SqlTextSupplier<tmpl.SqlEmitContext>>(
      row.column_one_text,
    ); // should see compile error if this doesn't work
  });

  await tc.step("table 1 wrapper view", () => {
    ta.assertEquals(
      syntheticTable1DefnVW.SQL(ctx),
      uws(`
        CREATE VIEW IF NOT EXISTS "synthetic_table1_vw"("synthetic_table1_id", "column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") AS
            SELECT "synthetic_table1_id", "column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at"
              FROM "synthetic_table1"`),
    );
  });

  await tc.step("table 1 lint issues", () => {
    const lintedSqlText: l.SqlLintIssuesSupplier = {
      lintIssues: [],
      registerLintIssue: (...slis: l.SqlLintIssueSupplier[]) => {
        lintedSqlText.lintIssues.push(...slis);
      },
    };
    syntheticTable1Defn.populateSqlTextLintIssues(lintedSqlText, ctx);
    ta.assertEquals(1, lintedSqlText.lintIssues.length);
    ta.assertEquals(
      lintedSqlText.lintIssues[0].lintIssue,
      "synthetic lint issue #1",
    );
    ta.assert(!lintedSqlText.lintIssues[0].location);
  });

  await tc.step("table 2 definition", () => {
    ta.assert(mod.isTableDefinition(syntheticTable2Defn));
    ta.assert(syntheticTable2Defn);
    ta.assertEquals("synthetic_table2", syntheticTable2Defn.tableName);
    ta.assert(syntheticTable2Defn.domains.length == 6);
    ta.assertEquals(
      [
        "synthetic_table2_id",
        "column_fk_pk",
        "column_fk_text",
        "column_fk_text_nullable",
        "column_fk_self_ref",
        "column_fk_self_ref_nullable",
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
            "column_fk_text_nullable" TEXT,
            "column_fk_self_ref" INTEGER NOT NULL,
            "column_fk_self_ref_nullable" INTEGER,
            FOREIGN KEY("column_fk_pk") REFERENCES "synthetic_table1"("synthetic_table1_id"),
            FOREIGN KEY("column_fk_text") REFERENCES "synthetic_table1"("column_one_text"),
            FOREIGN KEY("column_fk_text_nullable") REFERENCES "synthetic_table1"("column_one_text"),
            FOREIGN KEY("column_fk_self_ref") REFERENCES "synthetic_table2"("synthetic_table2_id"),
            FOREIGN KEY("column_fk_self_ref_nullable") REFERENCES "synthetic_table2"("synthetic_table2_id")
        )`),
    );
  });

  await tc.step("typed table 1 Typescript objects", () => {
    type Synthetic1 = ax.AxiomType<typeof syntheticTable1Defn>;
    const synthetic1: Synthetic1 = {
      synthetic_table1_id: 1,
      column_one_text: "text",
      column_unique: "unique",
      column_linted: "linted",
      column_three_text_digest: axsdc.sha1DigestUndefined,
      created_at: new Date(),
    };
    ta.assert(syntheticTable1Defn.test(synthetic1, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));
  });

  await tc.step("typed table 1 DML row values", async () => {
    const insertable = syntheticTable1DefnRF.prepareInsertable({
      columnOneText: "text",
      columnUnique: "value",
      columnLinted: "linted",
      columnThreeTextDigest: await syntheticTable1DefnDefaultable
        .column_three_text_digest(`synthetic-digest-source`),
      createdAt: new Date(),
    });
    ta.assert(insertable);
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") VALUES ('text', 'synthetic-defaulted', 'b7f479332024c700953eb2e7431e791b1ae35b75', 'value', 'linted', '${
        String(insertable.created_at)
      }')`,
    );
    const sdc = syntheticTable1Defn.columns;
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML({
        // { symbolsFirst: true } means that ${XYZ} in dql.select()`${XYZ}`
        // will try to find name of object first
        column_one_text: dql.untypedSelect(ctx, {
          symbolsFirst: true,
        })`select ${sdc.column_one_text} from ${syntheticTable1Defn}`, // the value will be a SQL expression
        column_unique: "value",
        column_linted: "linted",
        column_three_text_digest: await syntheticTable1DefnDefaultable
          .column_three_text_digest(`synthetic-digest-source`),
      }).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") VALUES ((select "column_one_text" from "synthetic_table1"), 'synthetic-defaulted', 'b7f479332024c700953eb2e7431e791b1ae35b75', 'value', 'linted', NULL)`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, { returning: "*" }).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") VALUES ('text', 'synthetic-defaulted', 'b7f479332024c700953eb2e7431e791b1ae35b75', 'value', 'linted', '${
        String(insertable.created_at)
      }') RETURNING *`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, { returning: "primary-keys" })
        .SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") VALUES ('text', 'synthetic-defaulted', 'b7f479332024c700953eb2e7431e791b1ae35b75', 'value', 'linted', '${
        String(insertable.created_at)
      }') RETURNING "synthetic_table1_id"`,
    );
    ta.assertEquals(
      syntheticTable1DefnRF.insertDML(insertable, {
        returning: { columns: ["synthetic_table1_id"] },
        onConflict: { SQL: () => `ON CONFLICT ("synthetic_table1_id") IGNORE` },
      }).SQL(ctx),
      `INSERT INTO "synthetic_table1" ("column_one_text", "column_two_text_nullable_defaultable", "column_three_text_digest", "column_unique", "column_linted", "created_at") VALUES ('text', 'synthetic-defaulted', 'b7f479332024c700953eb2e7431e791b1ae35b75', 'value', 'linted', '${
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
      column_fk_self_ref: 0,
    };
    ta.assert(syntheticTable2Defn.test(synthetic2, {
      onInvalid: (reason) => {
        console.log(reason);
      },
    }));
  });
});

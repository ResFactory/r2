import { testingAsserts as ta } from "../../deps-test.ts";
import * as govn from "../../../governance/mod.ts";
import * as std from "../../../core/std/mod.ts";
import * as mod from "./mod.ts";

export type Resource = govn.TextSyncSupplier;

Deno.test(`CerberusEmailDesignSystem`, async () => {
  const ceDS = new mod.CerberusEmailDesignSystem(`/universal-cc`);
  const input: govn.TextSyncSupplier = {
    textSync: `Test of content transformation to email layout`,
  };
  const assets = ceDS.assets();
  const result = await ceDS.emailRenderer({ assets })(input);
  ta.assert(std.isHtmlSupplier(result));
  //std.persistResourceFile(result, result.html, "test.html");
});

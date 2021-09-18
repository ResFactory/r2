import { testingAsserts as ta } from "../../../deps-test.ts";
import * as govn from "../../../governance/mod.ts";
import * as content from "../../../core/std/content.ts";
import * as modGovn from "./governance.ts";
import * as rt from "../../../core/std/route.ts";
import * as rtree from "../../../core/std/route-tree.ts";
import * as mod from "./lightning.ts";

export type Resource = govn.TextSyncSupplier;

Deno.test(`htmlLayoutTransformers with lds prime`, async () => {
  const lds = new mod.LightingDesignSystem();
  const lss = lds.layoutStrategies.defaultLayoutStrategySupplier;
  const ls = lss.layoutStrategy;
  const resource: govn.TextSyncSupplier = {
    textSync: "Test of content transformation to HTML layout",
  };
  // ***** TODO ****
  // ***** REPLACE surface in context ****
  const rf = new rt.TypicalRouteFactory();
  const routeTree = new rtree.TypicalRouteTree(rf);
  const layoutText = new mod.LightingDesignSystemText();
  const navigation = new mod.LightingDesignSystemNavigation(true, routeTree);
  const assets = lds.assets();
  const branding: modGovn.LightningBranding = {
    contextBarSubject: "test",
    contextBarSubjectImageSrc: "test",
  };
  const dsArgs: modGovn.LightingDesignSystemArguments = {
    layoutText,
    navigation,
    assets,
    branding,
  };
  const syncResult = ls.renderedSync(
    lds.layout(resource, lss, dsArgs),
  );
  ta.assert(content.isHtmlSupplier(syncResult));
  // console.dir(syncResult);
  // TODO:
  // ta.assertEquals(
  //   content.flexibleTextSync(syncResult, "error"),
  //   "Test of content transformation to HTML layout",
  // );
  // ***** TODO ****
  // ***** REPLACE surface in context ****
  const asyncResult = await ls.rendered(
    lds.layout(resource, lss, dsArgs),
  );
  ta.assert(content.isHtmlSupplier(asyncResult));
  // console.dir(asyncResult);
  // TODO:
  // ta.assertEquals(
  //   await content.flexibleText(asyncResult, "error"),
  //   "__transform__ test with frontmatter",
  // );
  // ta.assertEquals(asyncResult.frontmatter, { first: "value", second: 40 });
});

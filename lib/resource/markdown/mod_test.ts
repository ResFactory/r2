import { testingAsserts as ta } from "./deps-test.ts";
import * as c from "../content/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as mod from "./mod.ts";

const routeFactory = new r.TypicalRouteFactory(
  r.defaultRouteLocationResolver(),
  r.defaultRouteWorkspaceEditorResolver(() => undefined),
);
const mds = new mod.MarkdownRenderStrategy(new mod.MarkdownLayouts());
const renderer =
  mds.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;

Deno.test(`markdownHTML without frontmatter and integrated styles through data URI`, async () => {
  const testText = "__transform__ test";
  const nature = mod.markdownContentNature;
  const asset: Omit<
    mod.MarkdownResource,
    "consumeParsedFrontmatter" | "frontmatter"
  > = {
    nature,
    route: routeFactory.route({ unit: "test", label: "test" }),
    model: {
      isContentModel: true,
      isMarkdownModel: true,
      isContentAvailable: true,
    },
    text: testText,
    textSync: testText,
  };

  const syncResult = renderer.renderedSync(asset);
  ta.assertStringIncludes(
    syncResult.html.toString(),
    "<p><strong>transform</strong> test</p>",
  );

  const asyncResult = await renderer.rendered(asset);
  ta.assertStringIncludes(
    asyncResult.html.toString(),
    "<p><strong>transform</strong> test</p>",
  );
});

const testTextWithFrontmatter = `
---
folksonomy: [a, b, c]
custom: value
layout: slds/prime
route:
  unit: home
  label: Home
  isRootUnit: true
---
Welcome to R2 Markdown *with Frontmatter* Home.`;

Deno.test(`markdownHTML with typed frontmatter`, async () => {
  const nature = mod.markdownContentNature;
  const asset:
    & mod.MarkdownResource
    & fm.FrontmatterConsumer<fm.UntypedFrontmatter>
    & Partial<r.RouteSupplier>
    & r.ParsedRouteConsumer = {
      nature,
      route: routeFactory.route({ unit: "test", label: "test" }),
      frontmatter: { preParse: "value" },
      model: {
        isContentModel: true,
        isMarkdownModel: true,
        isContentAvailable: true,
      },
      consumeParsedFrontmatter: (parsed) => {
        if (parsed.frontmatter) {
          c.mutateFlexibleContent(asset, parsed.content);
          // deno-lint-ignore no-explicit-any
          (asset as any).frontmatter = parsed.frontmatter;
          asset.consumeParsedRoute(parsed.frontmatter);
          return parsed.frontmatter;
        }
      },
      consumeParsedRoute: (rs) => {
        if (r.isParsedRouteSupplier(rs)) {
          // we're going to mutate this object directly
          // deno-lint-ignore no-explicit-any
          (asset as any).route = routeFactory.route(rs.route);
        }
        return rs;
      },
      text: testTextWithFrontmatter,
      textSync: testTextWithFrontmatter,
    };

  ta.assertEquals(asset.frontmatter?.preParse, "value");

  // should mutate the above with new frontmatter and content
  const fmr = fm.prepareFrontmatterSync(fm.yamlTomlMarkdownFrontmatterRE)(
    asset,
  );
  ta.assert(fmr);
  ta.assert(fmr.frontmatter);
  ta.assert(r.isRouteSupplier(fmr));
  ta.assert(r.isRoute(fmr.route));

  const syncResult = renderer.renderedSync(asset);
  ta.assertStringIncludes(
    syncResult.html.toString(),
    "<p>Welcome to R2 Markdown <em>with Frontmatter</em> Home.</p>\n",
  );

  const asyncResult = await renderer.rendered(asset);
  ta.assertStringIncludes(
    asyncResult.html.toString(),
    "<p>Welcome to R2 Markdown <em>with Frontmatter</em> Home.</p>\n",
  );
});

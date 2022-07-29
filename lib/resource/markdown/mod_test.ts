import { testingAsserts as ta } from "./deps-test.ts";
import { path } from "../deps.ts";
import { CachedExtensions } from "../../../lib/module/mod.ts";
import * as fsr from "../../../lib/fs/fs-route.ts";
import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as direc from "./directive/mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test(`markdownHTML without frontmatter and integrated styles through data URI`, async () => {
  const routeFactory = new r.TypicalRouteFactory(
    r.defaultRouteLocationResolver(),
    r.defaultRouteWorkspaceEditorResolver(() => undefined),
  );
  const mds = new mod.MarkdownRenderStrategy(new mod.MarkdownLayouts());
  const renderer =
    mds.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;

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
  const routeFactory = new r.TypicalRouteFactory(
    r.defaultRouteLocationResolver(),
    r.defaultRouteWorkspaceEditorResolver(() => undefined),
  );
  const mds = new mod.MarkdownRenderStrategy(new mod.MarkdownLayouts());
  const renderer =
    mds.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;

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

Deno.test(`acquire Markdown from local file and render`, async (tc) => {
  const em = new CachedExtensions();
  const errorsEncountered = [];

  const directives: c.DirectiveExpectation<Any, Any>[] = [
    // TODO: new ldsDirec.ActionItemDirective(),
    ...direc.allCustomElements,
  ];

  const syntheticUrlRewriteRules: Record<string, string | mod.UrlRewriteRule> =
    {
      "synthetic1": "https://sythetic.netspective.com",
      "google": "https://www.google.com",
      "microsoft": "https://www.microsoft.com",
      "self": {
        purpose: "Allow site URLs to be portable",
        rewrite: "/",
      },
    };

  const rewriteMarkdownLink = mod.interpolateMarkdownLinks(
    (alias) => syntheticUrlRewriteRules[alias],
    (alias, parsedURL) => {
      errorsEncountered.push({
        locationHref: parsedURL,
        errorSummary:
          `\${${alias}} did not match a PCII URL rewrite key in URL ${parsedURL}`,
      });
      // undefined will leave the URL as-is, or we can return something else
      return undefined;
    },
  );

  const mdRS = new mod.MarkdownRenderStrategy(
    new mod.MarkdownLayouts({
      directiveExpectations: { allowedDirectives: () => directives },
      rewriteURL: rewriteMarkdownLink,
      customize: (mdi) => {
        mdi.renderer.rules.image = mod.autoCorrectPrettyUrlImagesRule(
          mdi.renderer.rules.image,
        );
      },
    }),
  );

  const fsRouteFactory = new r.FileSysRouteFactory(
    r.defaultRouteLocationResolver(),
    r.defaultRouteWorkspaceEditorResolver(() => undefined),
  );

  const fsRouteOptions: r.FileSysRouteOptions = {
    fsRouteFactory,
    routeParser: fsr.humanFriendlyFileSysRouteParser,
    extensionsManager: em,
  };
  const testFsRoute = async (absPath: string) =>
    await fsRouteFactory.fsRoute(
      absPath,
      path.fromFileUrl(import.meta.resolve("./test")),
      fsRouteOptions,
    );

  await tc.step("content from .md file", async () => {
    const renderer =
      mdRS.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;
    const srcMdFile = path.fromFileUrl(
      import.meta.resolve("./test/fixtures/markdownit.md"),
    );
    // TODO: figure how to infer resource type from constructor
    const instance = mod.constructStaticMarkdownResourceSync({
      path: srcMdFile,
      route: await testFsRoute(srcMdFile),
      diagnostics: (error, msg) => `${msg}: ${error}`,
    });
    const rendered = await renderer.rendered(instance);
    ta.assertEquals(
      await c.flexibleText(rendered.html, "?"),
      Deno.readTextFileSync(
        path.fromFileUrl(
          import.meta.resolve("./test/golden/markdownit.md.html"),
        ),
      ),
    );
  });

  await tc.step("pipelined content from .md.ts module", async () => {
    const moduleMFSRF = mod.markdownModuleFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      coll.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
        mdRS.renderer(),
      ),
    );
    const srcMdFile = path.fromFileUrl(
      import.meta.resolve("./test/fixtures/dynamic.md.ts"),
    );
    const instance = await moduleMFSRF.construct({
      path: srcMdFile,
      route: await testFsRoute(srcMdFile),
      diagnostics: (error, msg) => `${msg}: ${error}`,
    }, fsRouteOptions);
    const produced = await moduleMFSRF.refine!(instance);
    ta.assert(c.isHtmlSupplier(produced));
    ta.assertEquals(
      await c.flexibleText(produced.html, "?"),
      Deno.readTextFileSync(
        path.fromFileUrl(
          import.meta.resolve("./test/golden/dynamic.md.ts.html"),
        ),
      ),
    );
  });
});

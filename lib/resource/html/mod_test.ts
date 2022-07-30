import { testingAsserts as ta } from "./deps-test.ts";
import { path } from "../deps.ts";
import { CachedExtensions } from "../../../lib/module/mod.ts";
import * as fsr from "../../../lib/fs/fs-route.ts";
import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as direc from "../markdown/directive/mod.ts";
import * as mod from "./mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test(`acquire HTML from local file and render`, async (tc) => {
  const em = new CachedExtensions();

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

  // await tc.step(
  //   "content from single .md file directly rendered without pipeline",
  //   async () => {
  //     const renderer =
  //       mdRS.layoutStrategies.defaultLayoutStrategySupplier.layoutStrategy;
  //     const srcMdFile = path.fromFileUrl(
  //       import.meta.resolve("./test/fixtures/markdownit.md"),
  //     );
  //     // TODO: figure how to infer resource type from constructor
  //     const instance = mod.constructResourceSync({
  //       path: srcMdFile,
  //       route: await testFsRoute(srcMdFile),
  //       diagnostics: (error, msg) => `${msg}: ${error}`,
  //     });
  //     const rendered = await renderer.rendered(instance);
  //     ta.assertEquals(
  //       await c.flexibleText(rendered.html, "?"),
  //       Deno.readTextFileSync(
  //         path.fromFileUrl(
  //           import.meta.resolve("./test/golden/markdownit.md.html"),
  //         ),
  //       ),
  //     );
  //   },
  // );

  // await tc.step("pipelined content from single .md.ts module", async () => {
  //   const moduleMFSRF = mod.markdownModuleFileSysResourceFactory(
  //     // deno-lint-ignore no-explicit-any
  //     coll.pipelineUnitsRefinery<any>(
  //       fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
  //       mdRS.renderer(),
  //     ),
  //   );
  //   const srcMdFile = path.fromFileUrl(
  //     import.meta.resolve("./test/fixtures/dynamic.md.ts"),
  //   );
  //   const instance = await moduleMFSRF.construct({
  //     path: srcMdFile,
  //     route: await testFsRoute(srcMdFile),
  //     diagnostics: (error, msg) => `${msg}: ${error}`,
  //   }, fsRouteOptions);
  //   ta.assertEquals(instance.frontmatter, { title: "Dynamic Markdown" });
  //   const produced = await moduleMFSRF.refine!(instance);
  //   ta.assert(c.isHtmlSupplier(produced));
  //   ta.assertEquals(
  //     await c.flexibleText(produced.html, "?"),
  //     Deno.readTextFileSync(
  //       path.fromFileUrl(
  //         import.meta.resolve("./test/golden/dynamic.md.ts.html"),
  //       ),
  //     ),
  //   );
  // });
});

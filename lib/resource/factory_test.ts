import { testingAsserts as ta } from "./deps-test.ts";
import { path } from "./deps.ts";
import * as extn from "../../lib/module/mod.ts";
import * as fsr from "../../lib/fs/fs-route.ts";
import * as c from "./content/mod.ts";
import * as r from "./route/mod.ts";
import * as md from "./markdown/mod.ts";
import * as mod from "./factory.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.test(`resource factory`, async (tc) => {
  const em = new extn.CachedExtensions();
  const tfseOriginators = mod.typicalFsExtnOriginators(em);

  const fsRouteFactory = new r.FileSysRouteFactory(
    r.defaultRouteLocationResolver(),
    r.defaultRouteWorkspaceEditorResolver(() => undefined),
  );

  const fsRouteOptions: r.FileSysRouteOptions = {
    fsRouteFactory,
    routeParser: fsr.humanFriendlyFileSysRouteParser,
    extensionsManager: em,
  };

  await tc.step("fs extension-based Markdown originators", async (tc) => {
    const testFsRoute = async (absPath: string) =>
      await fsRouteFactory.fsRoute(
        absPath,
        path.fromFileUrl(import.meta.resolve("./markdown/test")),
        fsRouteOptions,
      );

    await tc.step("invalid extension", () => {
      const invalidO = tfseOriginators.originator("markdown.docx");
      ta.assert(invalidO == undefined);
    });

    await tc.step("static Markdown resource originator", async () => {
      const srcMdFile = path.fromFileUrl(
        import.meta.resolve("./markdown/test/fixtures/markdownit.md"),
      );
      const staticMDO = tfseOriginators.originator(srcMdFile);
      ta.assert(staticMDO);
      ta.assert(staticMDO.factory);
      const resource = await tfseOriginators.instance<md.MarkdownResource>({
        fsPath: srcMdFile,
        route: await testFsRoute(srcMdFile),
      }, fsRouteOptions);
      ta.assert(resource);
      ta.assertEquals(resource.nature.mediaType, "text/markdown");
      ta.assert(c.isHtmlSupplier(resource));
      ta.assertEquals(
        await c.flexibleText(resource.html, "?"),
        Deno.readTextFileSync(
          path.fromFileUrl(
            import.meta.resolve("./markdown/test/golden/markdownit.md.html"),
          ),
        ),
      );
    });

    await tc.step("Markdown module resource originator", async () => {
      const srcMdFile = path.fromFileUrl(
        import.meta.resolve("./markdown/test/fixtures/dynamic.md.ts"),
      );
      const moduleMDO = tfseOriginators.originator(srcMdFile);
      ta.assert(moduleMDO);
      ta.assert(moduleMDO.factory);
      const resource = await tfseOriginators.instance<md.MarkdownResource>({
        fsPath: srcMdFile,
        route: await testFsRoute(srcMdFile),
        diagnostics: (error, msg) => `${msg}: ${error}`,
      }, fsRouteOptions);
      ta.assert(resource);
      ta.assertEquals(resource.nature.mediaType, "text/markdown");
      ta.assertEquals(resource.frontmatter, { title: "Dynamic Markdown" });
      ta.assert(c.isHtmlSupplier(resource));
      ta.assertEquals(
        await c.flexibleText(resource.html, "?"),
        Deno.readTextFileSync(
          path.fromFileUrl(
            import.meta.resolve("./markdown/test/golden/dynamic.md.ts.html"),
          ),
        ),
      );
    });
  });

  await tc.step("fs extension-based HTML originators", async (tc) => {
    const testFsRoute = async (absPath: string) =>
      await fsRouteFactory.fsRoute(
        absPath,
        path.fromFileUrl(import.meta.resolve("./html/test")),
        fsRouteOptions,
      );

    await tc.step("invalid extension", () => {
      const invalidO = tfseOriginators.originator("html.docx");
      ta.assert(invalidO == undefined);
    });

    await tc.step(
      "static HTML with frontmatter resource originator",
      async () => {
        const srcHtmlFile = path.fromFileUrl(
          import.meta.resolve("./html/test/fixtures/client-side-markdown.html"),
        );
        const staticMDO = tfseOriginators.originator(srcHtmlFile);
        ta.assert(staticMDO);
        ta.assert(staticMDO.factory);
        const resource = await tfseOriginators.instance<md.MarkdownResource>({
          fsPath: srcHtmlFile,
          route: await testFsRoute(srcHtmlFile),
        }, fsRouteOptions);
        ta.assert(resource);
        ta.assertEquals(resource.nature.mediaType, "text/html");
        ta.assert(c.isHtmlSupplier(resource));
        ta.assertEquals(
          await c.flexibleText(resource.html, "?"),
          Deno.readTextFileSync(
            path.fromFileUrl(
              import.meta.resolve(
                "./html/test/golden/client-side-markdown.html",
              ),
            ),
          ),
        );
      },
    );
  });
});

import { fs } from "../deps.ts";
import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as p from "../persist/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as ren from "../render/mod.ts";
import * as extn from "../../../lib/module/mod.ts";
import * as i from "../instantiate.ts";
import * as hn from "../html/nature.ts";

export interface MarkdownModel extends c.ContentModel {
  readonly isMarkdownModel: true;
}

export interface MarkdownResource<Model extends MarkdownModel = MarkdownModel>
  extends
    c.TextSupplier,
    c.TextSyncSupplier,
    c.NatureSupplier<
      & c.MediaTypeNature<c.TextSupplier & c.TextSyncSupplier>
      & p.FileSysPersistenceSupplier<MarkdownResource>
    >,
    r.RouteSupplier,
    c.ModelSupplier<Model>,
    Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>>,
    Partial<c.DiagnosticsSupplier> {
}

export const markdownMediaTypeNature: c.MediaTypeNature<MarkdownResource> = {
  mediaType: "text/markdown",
  guard: (o: unknown): o is MarkdownResource => {
    if (
      c.isNatureSupplier(o) && c.isMediaTypeNature(o.nature) &&
      o.nature.mediaType === markdownMediaTypeNature.mediaType &&
      (c.isTextSupplier(o) && c.isTextSyncSupplier(o))
    ) {
      return true;
    }
    return false;
  },
};

export const markdownContentNature:
  & c.MediaTypeNature<MarkdownResource>
  & c.TextSuppliersFactory
  & c.HtmlSuppliersFactory
  & p.FileSysPersistenceSupplier<MarkdownResource>
  & ren.RenderTargetsSupplier<c.MediaTypeNature<c.HtmlResource>> = {
    mediaType: markdownMediaTypeNature.mediaType,
    guard: markdownMediaTypeNature.guard,
    prepareText: c.prepareText,
    prepareHTML: c.prepareHTML,
    renderTargets: [hn.htmlContentNature],
    persistFileSysRefinery: (rootPath, namingStrategy, eventsEmitter) => {
      return async (resource) => {
        if (c.isHtmlSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource.html,
            namingStrategy(resource, rootPath),
            { ensureDirSync: fs.ensureDirSync, eventsEmitter },
          );
        }
        return resource;
      };
    },
    persistFileSys: async (
      resource,
      rootPath,
      namingStrategy,
      eventsEmitter,
    ) => {
      if (c.isHtmlSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource.html,
          namingStrategy(resource, rootPath),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter },
        );
      }
    },
  };

export const constructStaticMarkdownResourceSync: (
  origin: r.RouteSupplier & {
    path: string;
    diagnostics: (error: Error, message?: string) => string;
  },
  options: r.FileSysRouteOptions,
) => MarkdownResource = (origination, options) => {
  const nature = markdownContentNature;
  const result:
    & MarkdownResource
    & fm.FrontmatterConsumer<fm.UntypedFrontmatter>
    & r.RouteSupplier
    & r.ParsedRouteConsumer
    & i.InstantiatorSupplier = {
      nature,
      frontmatter: {},
      route: {
        ...origination.route,
        nature,
      },
      model: {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      },
      consumeParsedFrontmatter: (parsed) => {
        if (!parsed.error) {
          // Assume frontmatter is the content's header, which has been parsed
          // so the text after the frontmatter needs to become our new content.
          // We're going to mutate this object directly and not make a copy.
          c.mutateFlexibleContent(result, parsed.content);

          // if the originator wants to override anything, give them a chance
          const frontmatter = fm.isFrontmatterConsumer(origination)
            ? origination.consumeParsedFrontmatter(parsed)
            : parsed.frontmatter;
          if (frontmatter) {
            // deno-lint-ignore no-explicit-any
            (result as any).frontmatter = frontmatter;
            result.consumeParsedRoute(frontmatter);
          }
        } else {
          const diagnostics = origination.diagnostics(
            parsed.error,
            `Frontmatter parse error`,
          );
          // deno-lint-ignore no-explicit-any
          (result as any).diagnostics = diagnostics;
          options.log.error(diagnostics, { origination, parsed });
        }
        return parsed.frontmatter;
      },
      consumeParsedRoute: (pr) => {
        return result.route.consumeParsedRoute(pr);
      },
      // deno-lint-ignore require-await
      text: async () => Deno.readTextFile(origination.path),
      textSync: () => Deno.readTextFileSync(origination.path),
      ...i.typicalInstantiatorProps(
        constructStaticMarkdownResourceSync,
        import.meta.url,
        "constructStaticMarkdownResourceSync",
      ),
    };
  return result;
};

// TODO: disposition
// export function staticMarkdownFileSysResourceFactory(
//   refine?: coll.ResourceRefinery<MarkdownResource>,
// ): fsrf.FileSysGlobWalkEntryFactory<MarkdownResource> {
//   return {
//     // deno-lint-ignore require-await
//     construct: async (we, log) => constructStaticMarkdownResourceSync(we, log),
//     refine,
//   };
// }

export const constructMarkdownModuleResourceSync: (
  origin: r.RouteSupplier,
  content: string,
  frontmatter: extn.UntypedExports,
  options: r.FileSysRouteOptions,
) => MarkdownResource = (origination, content, frontmatter) => {
  const nature = markdownContentNature;
  const result:
    & MarkdownResource
    & r.RouteSupplier
    & i.InstantiatorSupplier = {
      nature,
      frontmatter,
      route: {
        ...origination.route,
        nature,
      },
      model: {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      },
      // deno-lint-ignore require-await
      text: async () => content,
      textSync: () => content,
      ...i.typicalInstantiatorProps(
        constructMarkdownModuleResourceSync,
        import.meta.url,
        "constructMarkdownModuleResourceSync",
      ),
    };
  return result;
};

export function markdownModuleFileSysResourceFactory(
  refine?: coll.ResourceRefinery<MarkdownResource>,
) {
  return {
    construct: async (
      we: r.RouteSupplier & {
        path: string;
        diagnostics: (error: Error, message?: string) => string;
      },
      options: r.FileSysRouteOptions,
    ) => {
      const nature = markdownContentNature;
      const model: MarkdownModel = {
        isContentModel: true,
        isContentAvailable: true,
        isMarkdownModel: true,
      };
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string, ...args: unknown[]) => {
        options.log.error(diagnostics, ...args);
        const result:
          & c.ModuleResource
          & MarkdownResource
          & r.RouteSupplier
          & i.InstantiatorSupplier = {
            imported,
            nature,
            route: { ...we.route, nature },
            model,
            // deno-lint-ignore require-await
            text: async () => diagnostics,
            textSync: () => diagnostics,
            ...i.typicalInstantiatorProps(
              issue,
              import.meta.url,
              "markdownModuleFileSysResourceFactory.issue",
            ),
          };
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const defaultValue = (imported.module as any).default;
        if (defaultValue) {
          const frontmatter = imported.exports();
          const result:
            & c.ModuleResource
            & MarkdownResource
            & r.RouteSupplier
            & i.InstantiatorSupplier = {
              imported,
              frontmatter,
              nature,
              route: r.isRouteSupplier(frontmatter) &&
                  r.isRoute(frontmatter.route)
                ? frontmatter.route
                : { ...we.route, nature },
              model: {
                isContentModel: true,
                isContentAvailable: true,
                isMarkdownModel: true,
              },
              // deno-lint-ignore require-await
              text: async () => defaultValue,
              textSync: () => defaultValue,
              ...i.typicalInstantiatorProps(
                markdownModuleFileSysResourceFactory,
                import.meta.url,
                "markdownModuleFileSysResourceFactory.defaultValue",
              ),
            };
          return result;
        } else {
          return issue("Markdown module has no default value");
        }
      } else {
        return issue(
          "Invalid Markdown Module " + imported.importError,
          imported.importError,
        );
      }
    },
    refine,
  };
}

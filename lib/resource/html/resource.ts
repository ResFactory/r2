import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as p from "../persist/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as i from "../instantiate.ts";
import * as n from "./nature.ts";

export interface StaticHtmlResource extends
  c.HtmlSupplier,
  c.NatureSupplier<
    & c.MediaTypeNature<c.HtmlSupplier>
    & p.FileSysPersistenceSupplier<c.HtmlResource>
  >,
  r.RouteSupplier,
  Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>>,
  Partial<c.DiagnosticsSupplier> {
}

export const constructResourceSync: (
  we: r.RouteSupplier & {
    path: string;
    diagnostics: (error: Error, message?: string) => string;
  },
  options: r.FileSysRouteOptions,
) => StaticHtmlResource = (origination, options) => {
  const result:
    & StaticHtmlResource
    & fm.FrontmatterConsumer<fm.UntypedFrontmatter>
    & r.RouteSupplier
    & r.ParsedRouteConsumer
    & i.InstantiatorSupplier = {
      nature: n.htmlContentNature,
      frontmatter: {},
      route: { ...origination.route, nature: n.htmlContentNature },
      consumeParsedFrontmatter: (parsed) => {
        if (!parsed.error) {
          // we're going to mutate this object directly and not make a copy
          if (typeof result.html !== "string") {
            c.mutateFlexibleContent(result.html, parsed.content);
          }

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
          options.log?.error(diagnostics, { origination, parsed });
        }
        return parsed.frontmatter;
      },
      consumeParsedRoute: (pr) => {
        return result.route.consumeParsedRoute(pr);
      },
      html: {
        // deno-lint-ignore require-await
        text: async () => Deno.readTextFile(origination.path),
        textSync: () => Deno.readTextFileSync(origination.path),
      },
      ...i.typicalInstantiatorProps(
        constructResourceSync,
        import.meta.url,
        "constructResourceSync",
      ),
    };
  return result;
};

export function staticHtmlFileSysResourceFactory(
  refine?: coll.ResourceRefinery<StaticHtmlResource>,
) {
  return {
    // deno-lint-ignore require-await
    construct: async (
      we: r.RouteSupplier & {
        path: string;
        diagnostics: (error: Error, message?: string) => string;
      },
      options: r.FileSysRouteOptions,
    ) => constructResourceSync(we, options),
    refine,
  };
}

import * as safety from "../../lib/safety/mod.ts";
import * as extn from "../../lib/module/mod.ts";
import * as c from "./content/mod.ts";
import * as coll from "./collection/mod.ts";
import * as fm from "./frontmatter/mod.ts";
import * as h from "./html/mod.ts";
import * as r from "./route/mod.ts";

export interface IssueHtmlResource
  extends
    c.HtmlResource,
    r.RouteSupplier,
    Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>>,
    Partial<c.DiagnosticsSupplier> {
}

export const isModuleResource = safety.typeGuard<c.ModuleResource>(
  "imported",
);

export interface FileSysResourceModuleConstructor<State> {
  (
    origin: { path: string },
    options: r.FileSysRouteOptions,
    imported: extn.ExtensionModule,
    state: State,
  ): Promise<c.ModuleResource>;
}

export function isModuleConstructor(
  o: unknown,
  // deno-lint-ignore no-explicit-any
): o is FileSysResourceModuleConstructor<any> {
  if (typeof o === "function") return true;
  return false;
}

export function moduleFileSysResourceFactory<State>(
  state: State,
  refine?: coll.ResourceRefinery<c.ModuleResource>,
) {
  return {
    construct: async (
      origin: r.RouteSupplier & { path: string },
      options: r.FileSysRouteOptions,
    ) => {
      const imported = await options.extensionsManager.importModule(
        origin.path,
      );
      const issue = (diagnostics: string) => {
        const result: c.ModuleResource & IssueHtmlResource = {
          route: { ...origin.route, nature: h.htmlContentNature },
          nature: h.htmlContentNature,
          frontmatter: {},
          diagnostics,
          imported,
          html: {
            // deno-lint-ignore require-await
            text: async () => Deno.readTextFile(origin.path),
            textSync: () => Deno.readTextFileSync(origin.path),
          },
        };
        options.log?.error(diagnostics, imported.importError);
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const constructor = (imported.module as any).default;
        if (isModuleConstructor(constructor)) {
          const instance = await constructor(origin, options, imported, state);
          if (isModuleResource(instance)) {
            return instance;
          } else {
            return issue(
              `Valid module with default function that does not construct a resource which passes isModuleResource(instance) guard`,
            );
          }
        } else {
          return issue(
            `Valid module with invalid default (must be a function not ${typeof constructor})`,
          );
        }
      } else {
        return issue("Invalid Module: " + imported.importError);
      }
    },
    refine,
  };
}

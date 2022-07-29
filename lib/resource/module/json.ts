import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as r from "../route/mod.ts";
import * as p from "../persist/mod.ts";
import * as extn from "../../../lib/module/mod.ts";

export interface FileSysJsonResourceConstructor {
  (
    we: { path: string },
    options: r.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<c.StructuredDataInstanceSupplier>;
}

export interface FileSysJsonResourcesConstructor {
  (
    we: { path: string },
    options: r.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<
    & c.StructuredDataInstanceSupplier
    & coll.ChildResourcesFactoriesSupplier<c.StructuredDataInstanceSupplier>
  >;
}

export function jsonFileSysResourceFactory(
  refine?: coll.ResourceRefinery<c.StructuredDataInstanceSupplier>,
) {
  return {
    construct: async (
      we: r.RouteSupplier & { path: string },
      options: r.FileSysRouteOptions,
    ) => {
      const imported = await options.extensionsManager.importModule(we.path);
      const issue = (diagnostics: string, ...args: unknown[]) => {
        options.log.error(diagnostics, ...args);
        const structuredDataInstance = diagnostics;
        const result:
          & c.ModuleResource
          & p.PersistableStructuredDataResource
          & r.RouteSupplier = {
            imported,
            nature: p.jsonContentNature,
            route: { ...we.route, nature: p.jsonContentNature },
            structuredDataInstance,
            serializedData: structuredDataInstance,
          };
        return result;
      };

      if (imported.isValid) {
        // deno-lint-ignore no-explicit-any
        const defaultValue = (imported.module as any).default;
        if (defaultValue) {
          const exports = imported.exports();
          const result:
            & c.ModuleResource
            & c.StructuredDataInstanceSupplier
            & c.NatureSupplier<
              c.MediaTypeNature<c.SerializedDataSupplier>
            >
            & r.RouteSupplier = {
              imported,
              nature: p.jsonContentNature,
              route: r.isRouteSupplier(exports) && r.isRoute(exports.route)
                ? exports.route
                : { ...we.route, nature: p.jsonContentNature },
              structuredDataInstance: defaultValue,
            };
          return result;
        } else {
          return issue("JSON Module has no default value");
        }
      } else {
        return issue(
          "Invalid JSON Module " + imported.importError,
          imported.importError,
        );
      }
    },
    refine,
  };
}

import { fs } from "./deps.ts";
import * as c from "./content/mod.ts";
import * as coll from "./collection/mod.ts";
import * as fm from "./frontmatter/mod.ts";
import * as r from "./route/mod.ts";
import * as ren from "./render/mod.ts";
import * as p from "./persist/mod.ts";

// ** TODO: ********************************************************************
// * do we need a more sophisticated render strategy for JSON like we have for *
// * HTML Design System? Could JSON be generalized for all types of rendering  *
// * like for iCal, RSS, XML, etc.? or, should it remain focused on JSON only? *
// *****************************************************************************

export function structuredDataContentNature(
  mtNature: c.MediaTypeNature<c.StructuredDataResource>,
  prepareStructuredData: c.StructuredDataSerializer,
):
  & c.MediaTypeNature<c.StructuredDataResource>
  & c.StructuredDataFactory
  & p.FileSysPersistenceSupplier<c.StructuredDataResource> {
  return {
    mediaType: mtNature.mediaType,
    guard: mtNature.guard,
    prepareStructuredData,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isSerializedDataSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource.serializedData,
            namingStrategy(
              resource as unknown as r.RouteSupplier<r.RouteNode>,
              rootPath,
            ),
            { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
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
      ...functionArgs
    ) => {
      if (c.isSerializedDataSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource.serializedData,
          namingStrategy(
            resource as unknown as r.RouteSupplier<r.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, eventsEmitter, functionArgs },
        );
      }
    },
  };
}

export const jsonContentNature = structuredDataContentNature(
  c.jsonMediaTypeNature,
  c.prepareJSON,
);

export interface StructureDataRenderContext
  extends Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>> {
  readonly routeTree: r.RouteTree;
}

export interface StructuredDataLayout<Resource>
  extends
    StructureDataRenderContext,
    Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>> {
  readonly resource: Resource;
  readonly mediaTypeNature: c.MediaTypeNature<c.StructuredDataResource>;
  readonly activeRoute?: r.Route;
}

export interface StructuredDataTextProducer<Resource> {
  (
    layout: StructuredDataLayout<Resource>,
  ): Promise<c.SerializedDataSupplier>;
}

export function structuredDataTextProducer(
  mediaTypeNature: c.MediaTypeNature<c.StructuredDataResource>,
  destRootPath: string,
  namingStrategy: p.LocalFileSystemNamingStrategy<
    r.RouteSupplier<r.RouteNode>
  >,
  context: StructureDataRenderContext,
  fspEE?: p.FileSysPersistenceEventsEmitter,
): coll.ResourceRefinery<c.SerializedDataSupplier> {
  const producer = coll.pipelineUnitsRefineryUntyped(
    async (resource) => {
      if (c.isSerializedDataSupplier(resource)) {
        return resource;
      }
      if (c.isStructuredDataInstanceSupplier(resource)) {
        if (c.isSerializedDataSupplier(resource.structuredDataInstance)) {
          return resource.structuredDataInstance;
        }
        if (typeof resource.structuredDataInstance === "function") {
          const stdpFunction = resource
            .structuredDataInstance as StructuredDataTextProducer<unknown>;
          const layout: StructuredDataLayout<
            c.StructuredDataInstanceSupplier
          > = {
            ...context,
            mediaTypeNature,
            resource,
            activeRoute: r.isRouteSupplier(resource)
              ? resource.route
              : undefined,
          };
          const supplier = await stdpFunction(layout);
          const result:
            & c.StructuredDataInstanceSupplier
            & c.SerializedDataSupplier = {
              ...resource,
              ...supplier,
            };
          return result;
        }
        if (c.isSerializedDataSupplier(resource.structuredDataInstance)) {
          return resource.structuredDataInstance;
        }
        const issue: c.SerializedDataSupplier = {
          serializedData: c.flexibleContent(
            "structuredDataTextProducer() was not able to serialize data",
          ),
        };
        return issue;
      }
      return resource;
    },
    async (resource) => {
      const layout: StructuredDataLayout<c.StructuredDataResource> = {
        ...context,
        mediaTypeNature,
        resource,
      };
      if (c.isSerializedDataSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource.serializedData,
          namingStrategy(
            resource as unknown as r.RouteSupplier<r.RouteNode>,
            destRootPath,
          ),
          {
            ensureDirSync: fs.ensureDirSync,
            functionArgs: [layout],
            eventsEmitter: fspEE,
          },
        );
      }
      return resource;
    },
  );

  return async (resource) => {
    if (
      ren.isRenderableMediaTypeResource(
        resource,
        mediaTypeNature.mediaType,
      )
    ) {
      return await producer(resource);
    }
    // we cannot handle this type of rendering target, no change to resource
    return resource;
  };
}

export function jsonTextProducer(
  destRootPath: string,
  context: StructureDataRenderContext,
  fspEE?: p.FileSysPersistenceEventsEmitter,
): coll.ResourceRefinery<c.SerializedDataSupplier> {
  return structuredDataTextProducer(
    c.jsonMediaTypeNature,
    destRootPath,
    p.routePersistForceExtnNamingStrategy(".json"),
    context,
    fspEE,
  );
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
            nature: jsonContentNature,
            route: { ...we.route, nature: jsonContentNature },
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
              nature: jsonContentNature,
              route: r.isRouteSupplier(exports) && r.isRoute(exports.route)
                ? exports.route
                : { ...we.route, nature: jsonContentNature },
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

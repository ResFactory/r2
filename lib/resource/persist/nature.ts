import { fs } from "../deps.ts";
import * as govn from "./governance.ts";
import * as c from "../content/mod.ts";
import * as r from "../route/mod.ts";
import * as p from "./persist.ts";

export const textContentNature:
  & c.MediaTypeNature<c.TextResource>
  & c.TextSuppliersFactory
  & c.HtmlSuppliersFactory
  & govn.FileSysPersistenceSupplier<c.TextResource> = {
    mediaType: c.textMediaTypeNature.mediaType,
    guard: c.textMediaTypeNature.guard,
    prepareText: c.prepareText,
    prepareHTML: c.prepareHTML,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isTextSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource,
            namingStrategy(
              resource as unknown as r.RouteSupplier<r.RouteNode>,
              rootPath,
            ),
            {
              ensureDirSync: fs.ensureDirSync,
              functionArgs,
              eventsEmitter,
            },
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
      if (c.isTextSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource,
          namingStrategy(
            resource as unknown as r.RouteSupplier<r.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
        );
      }
    },
  };

export const htmlContentNature:
  & c.MediaTypeNature<c.HtmlResource>
  & c.HtmlSuppliersFactory
  & govn.FileSysPersistenceSupplier<c.HtmlResource> = {
    mediaType: c.htmlMediaTypeNature.mediaType,
    guard: c.htmlMediaTypeNature.guard,
    prepareHTML: c.prepareHTML,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isHtmlSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource.html,
            namingStrategy(
              resource as unknown as r.RouteSupplier<r.RouteNode>,
              rootPath,
            ),
            {
              ensureDirSync: fs.ensureDirSync,
              functionArgs,
              eventsEmitter,
            },
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
      if (c.isHtmlSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource.html,
          namingStrategy(
            resource as unknown as r.RouteSupplier<r.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
        );
      }
    },
  };

export const sqlContentNature:
  & c.MediaTypeNature<c.TextResource>
  & c.TextSuppliersFactory
  & govn.FileSysPersistenceSupplier<c.TextResource> = {
    mediaType: c.sqlMediaTypeNature.mediaType,
    guard: c.sqlMediaTypeNature.guard,
    prepareText: c.prepareText,
    persistFileSysRefinery: (
      rootPath,
      namingStrategy,
      eventsEmitter,
      ...functionArgs
    ) => {
      return async (resource) => {
        if (c.isTextSupplier(resource)) {
          await p.persistResourceFile(
            resource,
            resource,
            namingStrategy(
              resource as unknown as r.RouteSupplier<r.RouteNode>,
              rootPath,
            ),
            {
              ensureDirSync: fs.ensureDirSync,
              functionArgs,
              eventsEmitter,
            },
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
      if (c.isTextSupplier(resource)) {
        await p.persistResourceFile(
          resource,
          resource,
          namingStrategy(
            resource as unknown as r.RouteSupplier<r.RouteNode>,
            rootPath,
          ),
          { ensureDirSync: fs.ensureDirSync, functionArgs, eventsEmitter },
        );
      }
    },
  };

export function structuredDataContentNature(
  mtNature: c.MediaTypeNature<c.StructuredDataResource>,
  prepareStructuredData: c.StructuredDataSerializer,
):
  & c.MediaTypeNature<c.StructuredDataResource>
  & c.StructuredDataFactory
  & govn.FileSysPersistenceSupplier<c.StructuredDataResource> {
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

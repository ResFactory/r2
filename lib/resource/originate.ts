import { path } from "./deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as extn from "../../lib/module/mod.ts";
import * as fsr from "../../lib/fs/fs-route.ts";
import * as coll from "./collection/mod.ts";
import * as r from "./route/mod.ts";
import * as fm from "./frontmatter/mod.ts";
import * as md from "./markdown/mod.ts";
import * as b from "./bundle.ts";
import * as html from "./html/mod.ts";
import * as module from "./module.ts";
import * as jsonM from "./json.ts";
import * as g from "../../lib/git/mod.ts";

// TODO: support JS/TS/CSS bundle "twins" instead of old-style RF

// deno-lint-ignore no-explicit-any
type Any = any;

export type OriginationError = { originationError: Error };

export const isOriginationError = safety.typeGuard<OriginationError>(
  "originationError",
);

export interface FileExtnOriginationFactory<Resource> {
  factory: (fsPath: string) => Promise<
    | ((
      we: r.RouteSupplier & {
        fsPath: string;
        diagnostics?: (error: Error, message?: string) => string;
      },
      options?: r.FileSysRouteOptions,
    ) => Resource | undefined)
    | OriginationError
    | undefined
  >;
}

export function typicalfsFileSuffixOriginators(
  em: extn.ExtensionsManager,
  tfseoOptions?: {
    onOriginated?: <Resource>(
      resource: Resource,
      fsPath: string,
    ) => Promise<void>;
    onOriginationError?: (
      fsPath: string,
      oe: OriginationError,
    ) => Promise<void>;
  },
) {
  const originators = new Map<
    string,
    FileExtnOriginationFactory<Any>
  >();

  /**
   * Given a path, check only the file name for all extensions like .md or .md.ts
   * @param fsPath either a relative or absolute path with file name and extension
   * @returns all the extensions and modifiers
   */
  const allExtns = (fsPath: string) => {
    const fileName = path.basename(fsPath);
    return fileName.slice(fileName.indexOf("."));
  };

  const mdExtnFactory = md.fsFileSuffixRenderedMarkdownResourceOriginator(em);
  const mdExtnOriginator: FileExtnOriginationFactory<Any> = {
    // deno-lint-ignore require-await
    factory: async (fsPath) => {
      const factory = mdExtnFactory(fsPath);
      if (!factory) {
        return {
          originationError: new Error(
            "mdExtnFactory should not return undefined",
          ),
        };
      }
      return async (we, options) => {
        return await factory.instance(we, options);
      };
    },
  };
  originators.set(".md", mdExtnOriginator);
  originators.set(".md.ts", mdExtnOriginator);

  const htmlExtnFactory = html.fsFileSuffixHtmlResourceOriginator(em);
  const htmlExtnOriginator: FileExtnOriginationFactory<Any> = {
    // deno-lint-ignore require-await
    factory: async (fsPath) => {
      const factory = htmlExtnFactory(fsPath);
      if (!factory) {
        return {
          originationError: new Error(
            "htmlExtnFactory should not return undefined",
          ),
        };
      }
      return async (we, options) => {
        return await factory.instance(we, options);
      };
    },
  };
  originators.set(".html", htmlExtnOriginator);

  const result = {
    originators,
    allExtns,
    originator: (fsPath: string) => {
      const extns = allExtns(fsPath);
      return originators.get(extns);
    },
    instance: async <Resource>(
      origin: r.RouteSupplier & {
        fsPath: string;
        diagnostics?: (error: Error, message?: string) => string;
      },
      options?: r.FileSysRouteOptions,
    ) => {
      const fsPath = origin.fsPath;
      const originator = result?.originator(fsPath);
      if (originator) {
        const factory = await originator.factory(fsPath);
        if (factory) {
          if (isOriginationError(factory)) {
            tfseoOptions?.onOriginationError?.(fsPath, factory);
            return undefined;
          } else {
            const instance = factory(origin, options) as Resource;
            tfseoOptions?.onOriginated?.(instance, fsPath);
            return instance;
          }
        }
      }
      return undefined;
    },
  };
  return result;
}

// export function staticMarkdownFileSysGlob(
//   mdrs: md.MarkdownRenderStrategy,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
// ) {
//   return {
//     glob: "**/*.md",
//     routeParser,
//     factory: md.staticMarkdownFileSysResourceFactory(
//       // deno-lint-ignore no-explicit-any
//       coll.pipelineUnitsRefinery<any>(
//         fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
//         mdrs.renderer(),
//       ),
//     ),
//   };
// }

// export function markdownModuleFileSysGlob(
//   mdrs: md.MarkdownRenderStrategy,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.md${stage}.ts` : "**/*.md.ts",
//     routeParser,
//     factory: md.markdownModuleFileSysResourceFactory(
//       // deno-lint-ignore no-explicit-any
//       coll.pipelineUnitsRefinery<any>(
//         fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
//         mdrs.renderer(),
//       ),
//     ),
//   };
// }

// export function markdownFileSysGlobs(
//   originRootPath: o.FileSysPathText,
//   mdrs: md.MarkdownRenderStrategy,
//   fsRouteFactory: r.FileSysRouteFactory,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
// ) {
//   return {
//     humanFriendlyName: "Markdown Content",
//     ownerFileSysPath: originRootPath,
//     lfsPaths: [{
//       humanFriendlyName: `Markdown Content (${originRootPath})`,
//       fileSysPath: originRootPath,
//       globs: [staticMarkdownFileSysGlob(mdrs, routeParser)],
//       fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
//     }],
//     fsRouteFactory,
//   };
// }

// export function htmlFileSysGlob(
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
// ) {
//   return {
//     glob: "**/*.html",
//     routeParser,
//     factory: html.staticHtmlFileSysResourceFactory(
//       // deno-lint-ignore no-explicit-any
//       coll.pipelineUnitsRefinery<any>(
//         fm.prepareFrontmatter(fm.yamlHtmlFrontmatterRE),
//       ),
//     ),
//   };
// }

// export function htmlFileSysGlobs(
//   originRootPath: o.FileSysPathText,
//   fsRouteFactory: r.FileSysRouteFactory,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
// ) {
//   return {
//     humanFriendlyName: "HTML Content with Optional Frontmatter",
//     ownerFileSysPath: originRootPath,
//     lfsPaths: [{
//       humanFriendlyName: `HTML Content (${originRootPath})`,
//       fileSysPath: originRootPath,
//       globs: [htmlFileSysGlob(routeParser)],
//       fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
//     }],
//     fsRouteFactory,
//   };
// }

// export function resourceModuleFileSysGlob<State>(
//   state: State,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.rf${stage}.ts` : "**/*.rf.ts",
//     exclude: ["deps.ts"],
//     routeParser,
//     factory: module.moduleFileSysResourceFactory(state),
//   };
// }

// export function jsonModuleFileSysGlob(
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.json${stage}.ts` : "**/*.json.ts",
//     exclude: ["deps.ts"],
//     routeParser,
//     factory: jsonM.jsonFileSysResourceFactory(),
//   };
// }

// export function jsBundleFileSysGlob(
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.js${stage}.ts` : "**/*.js.ts",
//     routeParser,
//     factory: b.bundleFileSysResourceFactory(true),
//   };
// }

// export function pciiServerOnlyBundleFileSysGlob(
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.pcii${stage}.ts` : "**/*.pcii.ts",
//     routeParser,
//     factory: b.bundleFileSysResourceFactory(false),
//   };
// }

// export function pciiClientAndServerBundleFileSysGlob(
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     glob: stage ? `**/*.client.pcii${stage}.ts` : "**/*.client.pcii.ts",
//     routeParser,
//     factory: b.bundleFileSysResourceFactory(true),
//   };
// }

// export function moduleFileSysGlobs<State>(
//   originRootPath: o.FileSysPathText,
//   fsRouteFactory: r.FileSysRouteFactory,
//   mdrs: md.MarkdownRenderStrategy,
//   state: State,
//   routeParser = fsr.humanFriendlyFileSysRouteParser,
//   stage?: string,
// ) {
//   return {
//     humanFriendlyName: "Module Content",
//     ownerFileSysPath: originRootPath,
//     lfsPaths: [{
//       humanFriendlyName: `Module Content (${originRootPath})`,
//       fileSysPath: originRootPath,
//       globs: [
//         resourceModuleFileSysGlob(state, routeParser, stage),
//         jsonModuleFileSysGlob(routeParser, stage),
//         markdownModuleFileSysGlob(mdrs, routeParser, stage),
//         jsBundleFileSysGlob(routeParser, stage),
//         pciiServerOnlyBundleFileSysGlob(routeParser, stage),
//         pciiClientAndServerBundleFileSysGlob(routeParser, stage),
//       ],
//       fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
//     }],
//     fsRouteFactory,
//   };
// }

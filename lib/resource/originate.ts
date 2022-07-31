import { fs, path } from "./deps.ts";
import * as safety from "../../lib/safety/mod.ts";
import * as extn from "../../lib/module/mod.ts";
import * as fsr from "../../lib/fs/fs-route.ts";
import * as r from "./route/mod.ts";
import * as md from "./markdown/mod.ts";
import * as html from "./html/mod.ts";

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

export interface FileSysWalkGlob {
  readonly label?: string;
  readonly rootPath: string;
  readonly glob: string;
  readonly include: (we: fs.WalkEntry) => boolean;
  readonly options?: (path: string) => fs.ExpandGlobOptions;
  readonly relative: (path: string) => string;
}

export function walkFilesExcludeGitGlob(
  rootPath: string,
  glob = "**/*",
  inherit?: Partial<Omit<FileSysWalkGlob, "rootPath" | "glob">>,
): FileSysWalkGlob {
  return {
    rootPath,
    glob,
    label: inherit?.label ?? path.basename(rootPath),
    include: inherit?.include ?? ((we) => we.isFile),
    options: inherit?.options ?? ((path) => ({
      root: path,
      includeDirs: false,
      globstar: true,
      extended: true,
      exclude: [".git"],
    })),
    relative: (fsPath: string) => path.relative(rootPath, fsPath),
  };
}

export interface FileSysWalkGlobContext {
  readonly entry: fs.WalkEntry;
  readonly srcGlob: FileSysWalkGlob;
  readonly fsRouteFactory: r.FileSysRouteFactory;
  readonly fsRouteOptions: r.FileSysRouteOptions;
  readonly globOptions?: fs.ExpandGlobOptions;
}

export interface FileSysWalkGlobContextSupplier {
  readonly fsWalkCtx: FileSysWalkGlobContext;
}

export const isWalkGlobContextSupplier = safety.typeGuard<
  FileSysWalkGlobContextSupplier
>("fsWalkCtx");

export function typicalfsFileSuffixOriginators(
  em: extn.ExtensionsManager,
  tfseoOptions?: {
    onOriginated?: <Resource>(
      resource: Resource,
      fsPath: string,
      walkCtx?: FileSysWalkGlobContext,
    ) => Promise<void>;
    onOriginationError?: (
      fsPath: string,
      oe: OriginationError,
      walkCtx?: FileSysWalkGlobContext,
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
  const loc = path.basename(import.meta.url);
  const oe = (message: string) => ({
    originationError: new Error(
      `${message} (${loc}::typicalfsFileSuffixOriginators)`,
    ),
  });

  const mdExtnFactory = md.fsFileSuffixRenderedMarkdownResourceOriginator(em);
  const mdExtnOriginator: FileExtnOriginationFactory<Any> = {
    // deno-lint-ignore require-await
    factory: async (fsPath) => {
      const factory = mdExtnFactory(fsPath);
      if (!factory) return oe("mdExtnFactory should not return undefined");
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
      if (!factory) return oe("htmlExtnFactory should not return undefined");
      return async (we, options) => {
        return await factory.instance(we, options);
      };
    },
  };
  originators.set(".html", htmlExtnOriginator); // html with optional frontmatter
  originators.set(".fm.html", htmlExtnOriginator); // alias for above, .fm means frontmatter
  // TODO: originators.set(".html.ts", htmlExtnOriginator);

  const result = {
    originators,
    allExtns,
    originator: (fsPath: string) => originators.get(allExtns(fsPath)),
    instance: async <Resource>(
      origin: r.RouteSupplier & {
        fsPath: string;
        diagnostics?: (error: Error, message?: string) => string;
      },
      options?: r.FileSysRouteOptions,
      fsWalkCtx?: FileSysWalkGlobContext,
    ) => {
      const fsPath = origin.fsPath;
      const originator = result?.originator(fsPath);
      if (originator) {
        const factory = await originator.factory(fsPath);
        if (factory) {
          if (isOriginationError(factory)) {
            tfseoOptions?.onOriginationError?.(fsPath, factory, fsWalkCtx);
            return undefined;
          } else {
            const instance = factory(origin, options) as Resource;
            tfseoOptions?.onOriginated?.(instance, fsPath, fsWalkCtx);
            return instance;
          }
        }
      }
      return undefined;
    },
    instances: async function* <Resource>(
      srcGlobs: Iterable<FileSysWalkGlob>,
      options?: {
        readonly fsrFactorySupplier?: (path: string) => r.FileSysRouteFactory;
        readonly fsrOptionsSupplier?: (
          path: string,
          rf: r.FileSysRouteFactory,
        ) => r.FileSysRouteOptions;
      },
    ) {
      const { fsrFactorySupplier, fsrOptionsSupplier } = options ?? {};
      const defaultRouteFactory = new r.FileSysRouteFactory(
        r.defaultRouteLocationResolver(),
        r.defaultRouteWorkspaceEditorResolver(() => undefined),
      );
      const defaultRouteOptions: r.FileSysRouteOptions = {
        fsRouteFactory: defaultRouteFactory,
        routeParser: fsr.humanFriendlyFileSysRouteParser,
        extensionsManager: em,
      };

      for (const srcGlob of srcGlobs) {
        const fsRouteFactory = fsrFactorySupplier
          ? fsrFactorySupplier(srcGlob.rootPath)
          : defaultRouteFactory;
        const fsRouteOptions = fsrOptionsSupplier
          ? fsrOptionsSupplier(srcGlob.rootPath, fsRouteFactory)
          : defaultRouteOptions;
        const globOptions = srcGlob.options?.(srcGlob.rootPath);
        const globCtx = {
          srcGlob,
          globOptions,
          fsRouteFactory,
          fsRouteOptions,
        };
        for await (
          const we of fs.expandGlob(srcGlob.glob, globOptions)
        ) {
          const fsWalkCtx: FileSysWalkGlobContext = { entry: we, ...globCtx };
          const extraCtx: FileSysWalkGlobContextSupplier = { fsWalkCtx };
          const instance = await result.instance(
            {
              fsPath: we.path,
              route: await fsRouteFactory.fsRoute(
                we.path,
                srcGlob.rootPath,
                fsRouteOptions,
              ),
              ...extraCtx,
            },
            fsRouteOptions,
            fsWalkCtx,
          );
          if (instance) yield instance as Resource;
        }
      }
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

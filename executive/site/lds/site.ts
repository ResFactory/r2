import { path } from "../../../core/deps.ts";
import * as ws from "../../../lib/workspace/mod.ts";
import * as safety from "../../../lib/safety/mod.ts";
import * as govn from "../../../governance/mod.ts";
import * as std from "../../../core/std/mod.ts";
import * as publ from "../../publ/mod.ts";
import * as ds from "../../../core/render/html/mod.ts";
import * as lds from "../../../core/design-system/lightning/mod.ts";
import * as fsl from "../../../lib/fs/link.ts";
import * as p from "../../typical/proxy.ts";
import * as fsr from "../../../lib/fs/fs-route.ts";
import * as fsg from "../../../core/originate/file-sys-globs.ts";
import * as tfsg from "../../../core/originate/typical-file-sys-globs.ts";
import * as md from "../../../core/resource/markdown.ts";
import * as g from "../../../lib/git/mod.ts";
import * as synHL from "../../typical/html-contrib-syntax-highlight.ts";
import * as ugcCMC from "../../typical/html-contrib-ugc-comments-matrix-cactus.ts";

export const universalAssetsBaseUnit = "universal-cc";
export const universalAssetsBaseURL = `/${universalAssetsBaseUnit}`;

export function preparePopulateClientCargo(
  clientCargoHome: string,
  dsLocalFileSysHomeRel: string,
  pdsaEnvVarsPrefix = "PUBCTL_CLIENTCARGO_",
): ds.HtmlLayoutClientCargoPersister {
  return async (publishDest) => {
    // prepare to grab the universal client-cargo (universal-cc)
    const { proxyable: uP } = p
      .proxyableDesignSystemAssets({
        clientCargoHome,
        publishDest,
        dsClientCargoRelSrcHome: "core/design-system/universal/client-cargo",
        dsClientCargoRelDestHome: universalAssetsBaseUnit,
        dsLocalFileSysHomeRel,
        pdsaEnvVarsPrefix,
      });
    await uP.prepareDirectory();

    // prepare to grab the design-system client-cargo
    const { proxyable: dsP, populateOptions: dsPO } = p
      .proxyableDesignSystemAssets({
        clientCargoHome,
        publishDest,
        dsClientCargoRelSrcHome: "core/design-system/lightning/client-cargo",
        dsClientCargoRelDestHome: `lightning`,
        dsLocalFileSysHomeRel,
        pdsaEnvVarsPrefix,
      });
    await dsP.prepareDirectory();

    // after prepareDirectory() the proxyable remotes are local, just symlink
    fsl.symlinkDirectoryChildren(
      clientCargoHome,
      publishDest,
      ".rfignore",
      dsPO.verbose ? fsl.symlinkDirectoryChildrenConsoleReporters : undefined,
    );
  };
}

export interface VisualCuesFrontmatter {
  readonly "syntax-highlight": "highlight.js";
}

export const isVisualCuesFrontmatter = safety.typeGuard<VisualCuesFrontmatter>(
  "syntax-highlight",
);

export const isVisualCuesFrontmatterSupplier = safety.typeGuard<
  { "visual-cues": VisualCuesFrontmatter }
>("visual-cues");

export interface UserGeneratedContentFrontmatter {
  readonly ugc: { comments: boolean };
}

export const isUserGeneratedContentFrontmatter = safety.typeGuard<
  UserGeneratedContentFrontmatter
>(
  "ugc",
);

export class SiteDesignSystem implements lds.LightningDesignSystemFactory {
  readonly designSystem: lds.LightingDesignSystem<lds.LightningLayout>;
  readonly contentStrategy: lds.LightingDesignSystemContentStrategy;
  readonly cactusConfig?: ugcCMC.CactusMatrixServerConfig;
  protected cactusConfigEnvVarsSought?: string[];

  constructor(
    // deno-lint-ignore no-explicit-any
    readonly publConfig: publ.Configuration<any>,
    routes: publ.PublicationRoutes,
  ) {
    this.designSystem = new lds.LightingDesignSystem(
      publConfig.extensionsManager,
      universalAssetsBaseURL,
    );
    this.contentStrategy = {
      git: publConfig.contentGit,
      layoutText: new lds.LightingDesignSystemText(),
      navigation: new lds.LightingDesignSystemNavigation(
        true,
        routes.navigationTree,
      ),
      assets: this.designSystem.assets(),
      branding: {
        contextBarSubject: publConfig.appName,
        contextBarSubjectImageSrc: (assets) =>
          assets.image("/asset/image/brand/logo-icon-100x100.png"),
      },
      mGitResolvers: publConfig.mGitResolvers,
      routeGitRemoteResolver: publConfig.routeGitRemoteResolver,
      renderedAt: new Date(),
      wsEditorResolver: publConfig.wsEditorResolver,
      wsEditorRouteResolver: publConfig.wsEditorResolver
        ? std.defaultRouteWorkspaceEditorResolver(
          publConfig.wsEditorResolver,
        )
        : undefined,
      lintReporter: lds.lightningLintReporter(),
      initContributions: (layout) =>
        this.dsInitContributions(layout, layout.designSystem.contributions()),
      termsManager: publConfig.termsManager,
      operationalCtxClientCargo: {
        acquireFromURL: "/operational-context/index.json",
        assetsBaseAbsURL: "/operational-context",
      },
    };
    this.cactusConfig = ugcCMC.cactusMatrixServerEnvConfig(
      "MATRIX_",
      (sought) => {
        this.cactusConfigEnvVarsSought = sought;
        return undefined;
      },
    );
  }

  dsInitContributions(
    layout: Omit<lds.LightningLayout, "contributions">,
    suggested: ds.HtmlLayoutContributions,
  ): ds.HtmlLayoutContributions {
    if (layout.frontmatter) {
      if (isVisualCuesFrontmatterSupplier(layout.frontmatter)) {
        const visualCues = layout.frontmatter?.["visual-cues"];
        if (isVisualCuesFrontmatter(visualCues)) {
          const highlighter = visualCues["syntax-highlight"];
          if (!synHL.htmlSyntaxHighlightContribs(suggested, highlighter)) {
            this.publConfig.operationalCtx.publStateDB().persistServerError({
              locationHref: layout
                .activeRoute?.terminal?.qualifiedPath,
              errorSummary:
                `Frontmatter "visual-cues"."syntax-highlighter" is invalid type: "${highlighter}"`,
            });
          }
        }
      }
      if (
        isUserGeneratedContentFrontmatter(layout.frontmatter) &&
        layout.frontmatter.ugc.comments
      ) {
        if (this.cactusConfig) {
          ugcCMC.matrixCactusCommentsContribs(suggested, this.cactusConfig);
        } else {
          suggested.body
            .fore`UGC comments requested but these env vars not found: ${
            this.cactusConfigEnvVarsSought?.join(", ") ??
              "unable to determine"
          } `;
        }
      }
    }
    return suggested;
  }
}

export interface WeightSupplier {
  readonly weight?: number;
}

export interface SitePageProperties extends WeightSupplier {
  readonly title?: string;
  readonly mainMenuName?: string;
}

export function sitePageProperties<Resource>(
  resource: Resource,
): SitePageProperties {
  let weight: number | undefined;
  let title: string | undefined;
  let mainMenuName: string | undefined;
  if (std.isFrontmatterSupplier(resource)) {
    const fmUntyped = resource.frontmatter;
    // deno-lint-ignore no-explicit-any
    const menu = fmUntyped.menu as any;
    weight = fmUntyped.weight || menu?.main?.weight;
    mainMenuName = menu?.main?.name;
    title = fmUntyped.title ? String(fmUntyped.title) : mainMenuName;
  }
  return {
    weight,
    title,
    mainMenuName,
  };
}

/**
 * Hugo-style page weight sorting comparator
 * @param a The left tree node
 * @param b The right tree node
 * @returns 0 if weights are equal, +1 or -1 for sort order
 */
const orderByWeight: (
  a: govn.RouteTreeNode & WeightSupplier,
  b: govn.RouteTreeNode & WeightSupplier,
) => number = (a, b) => {
  const weightA = a.weight;
  const weightB = b.weight;

  if (weightA && weightB) return weightA - weightB;
  if (weightA && !weightB) return -1;
  if (!weightA && weightB) return 1;
  return 0; // order doesn't matter if no weight
};

export class SiteResourcesTree extends publ.ResourcesTree {
}

export class SiteRoutes<OC extends publ.PublicationOperationalContext>
  extends publ.PublicationRoutes {
  constructor(
    readonly config: publ.Configuration<OC>,
    readonly routeFactory: govn.RouteFactory,
    readonly contextBarLevel = 1,
  ) {
    super(routeFactory, new SiteResourcesTree(routeFactory));
  }

  prepareNavigationTree() {
    // this.navigationTree.consumeRoute(
    //   ocC.diagnosticsObsRedirectRoute(this.routeFactory),
    // );
    this.resourcesTree.consumeAliases();
    this.navigationTree.consumeTree(
      this.resourcesTree,
      (node) => {
        if (
          lds.isNavigationTreeContextBarNode(node) && node.isContextBarRouteNode
        ) {
          return true;
        }
        if (node.level < this.contextBarLevel) return false;
        return std.isRenderableMediaTypeResource(
            node.route,
            std.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false;
      },
      { order: orderByWeight },
    );
  }
}

export class Site<OC extends publ.PublicationOperationalContext>
  extends publ.TypicalPublication<OC> {
  constructor(config: publ.Configuration<OC>, readonly contextBarLevel = 1) {
    super(
      config,
      new SiteRoutes(config, config.fsRouteFactory, contextBarLevel),
    );
  }

  constructDesignSystem(
    config: publ.Configuration<OC>,
    routes: publ.PublicationRoutes,
  ) {
    return new SiteDesignSystem(config, routes);
  }

  fileSystRouteParser(): fsr.FileSysRouteParser {
    return (fsp, ca) => {
      const hffsrp = fsr.humanFriendlyFileSysRouteParser(fsp, ca);
      if (
        !hffsrp.parsedPath.base.endsWith(".md.ts") &&
        !hffsrp.parsedPath.base.match(".md")
      ) {
        return hffsrp;
      }

      const isUnderscoreIndex = hffsrp.parsedPath.name === "_index";
      const routeUnit:
        & govn.RouteUnit
        & publ.PublicationRouteEventsHandler<SitePageProperties> = {
          ...hffsrp.routeUnit,
          unit: isUnderscoreIndex ? ds.indexUnitName : hffsrp.routeUnit.unit,
          prepareResourceRoute: (rs) => {
            const hpp = sitePageProperties(rs);
            const overrideLabel = hpp.title || hpp.mainMenuName;
            // deno-lint-ignore no-explicit-any
            const terminalUntyped = rs.route.terminal as any;
            if (terminalUntyped) {
              // by now the frontmatter route will have been consumed but it's
              // possible that the markdown title or mainMenu is also available
              if (overrideLabel) terminalUntyped.label = overrideLabel;
              terminalUntyped.weight = hpp.weight;
            }
            if (isUnderscoreIndex) {
              // an _index.md controls the parent of the current node
              const units = rs.route.units;
              if (units && units.length > 1) {
                // deno-lint-ignore no-explicit-any
                const parent = units[units.length - 2] as any;
                parent.label = terminalUntyped.label;
                if (hpp.weight) parent.weight = hpp.weight;
              }
              terminalUntyped.isUnderscoreIndex = true;
            }
            return hpp;
          },
          prepareResourceTreeNode: (_rs, node, hpp) => {
            if (
              node?.level == this.contextBarLevel && hpp!.mainMenuName
            ) {
              (node as unknown as lds.MutableNavigationTreeContextBarNode)
                .isContextBarRouteNode = true;
            }
            if (isUnderscoreIndex || node?.unit == ds.indexUnitName) {
              (node as unknown as ds.MutableNavigationTreeIndexNode)
                .isIndexNode = true;
            }
          },
        };
      return {
        parsedPath: hffsrp.parsedPath,
        routeUnit,
      };
    };
  }

  // deno-lint-ignore no-explicit-any
  originators(): govn.ResourcesFactoriesSupplier<any>[] {
    const fsgoWatcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    fsgoWatcher.on("afterConstructResource", async (resource, lcMetrics) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.state.resourcesIndex.onConstructResource(resource, lcMetrics);
    });
    // deno-lint-ignore require-await
    fsgoWatcher.on("beforeYieldWalkEntry", async (we) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.consumedFileSysWalkPaths.add(we.path);
    });

    // use this file system routes parser to handle special rules and conditions
    // such as _index.* parsing
    const routeParser = this.fileSystRouteParser();
    const { contentRootPath, fsRouteFactory } = this.config;
    const mdRenderers = this.markdownRenderers();
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs<publ.PublicationState>(
            contentRootPath,
            fsRouteFactory,
            mdRenderers,
            this.state,
            routeParser,
          ),
          {
            humanFriendlyName: "Markdown Content",
            ownerFileSysPath: contentRootPath,
            lfsPaths: [{
              humanFriendlyName: `Markdown Content (${contentRootPath})`,
              fileSysPath: contentRootPath,
              globs: [{
                glob: "**/*.md",
                routeParser,
                factory: md.staticMarkdownFileSysResourceFactory(
                  // deno-lint-ignore no-explicit-any
                  std.pipelineUnitsRefinery<any>(
                    std.prepareFrontmatter(
                      std.yamlTomlMarkdownFrontmatterRE,
                    ),
                    mdRenderers.renderer(),
                  ),
                ),
              }],
              fileSysGitPaths: g.discoverGitWorkTree(contentRootPath),
            }],
            fsRouteFactory,
          },
          tfsg.htmlFileSysGlobs(
            contentRootPath,
            fsRouteFactory,
          ),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => fsgoWatcher,
          fsgorSupplier: this.config.originatorRegistry,
        },
      ),
      ...this.operationalCtxOriginators(),
    ];
  }

  // deno-lint-ignore no-explicit-any
  postProduceOriginators(): govn.ResourcesFactoriesSupplier<any>[] {
    const routeParser = this.fileSystRouteParser();
    const { contentRootPath, fsRouteFactory } = this.config;
    const mdRenderers = this.markdownRenderers();
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          tfsg.moduleFileSysGlobs<publ.PublicationState>(
            contentRootPath,
            fsRouteFactory,
            mdRenderers,
            this.state,
            routeParser,
            "-ppo", // look for `**/*.rf-ppo.ts`, etc.
          ),
        ],
        this.config.extensionsManager,
        {
          fsgorSupplier: this.config.originatorRegistry,
        },
      ),
    ];
  }
}

// deno-lint-ignore no-empty-interface
export interface SiteOperationalContext
  extends publ.PublicationOperationalContext {
}

export interface SiteController<
  OperationalCtx extends SiteOperationalContext = SiteOperationalContext,
> extends publ.ExecutiveController<OperationalCtx> {
  readonly resFactoryRootPath?: string;
  readonly wsEditorResolver?: ws.WorkspaceEditorTargetResolver<
    ws.WorkspaceEditorTarget
  >;
}

export async function controller<
  SOC extends SiteOperationalContext = SiteOperationalContext,
>(
  modulePath: publ.ExecutiveControllerHomePathSupplier,
): Promise<SiteController<SOC>> {
  const rfHomeEnvVarValue = Deno.env.get("RF_HOME");
  const isLocal = import.meta.url.startsWith("file://");
  const resFactoryRootPath = rfHomeEnvVarValue
    ? rfHomeEnvVarValue
    : (isLocal
      ? path.resolve(path.join(path.fromFileUrl(import.meta.url), "../../.."))
      : undefined);

  const wsEditorResolver = ws.envWorkspaceEditorResolver("PUBCTL_WS_EDITOR");
  const pubCtlSupplier = publ.typicalPublicationCtlSupplier<
    SiteOperationalContext
  >(
    modulePath,
    (oc) => oc, // we're not enhancing, just adding type-safety,
    {
      resFactoryPath: resFactoryRootPath
        ? (relative, abs) =>
          abs
            ? path.join(resFactoryRootPath, relative)
            : path.join(path.relative(Deno.cwd(), resFactoryRootPath), relative)
        : undefined,
    },
  );
  return {
    ...await pubCtlSupplier(),
    resFactoryRootPath,
    wsEditorResolver,
  } as SiteController<SOC>;
}

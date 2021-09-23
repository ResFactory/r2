import {
  fs,
  govnSvcHealth as health,
  govnSvcMetrics as gsm,
  govnSvcTelemetry as telem,
  log,
  path,
  safety,
} from "../deps.ts";
import * as govn from "../governance/mod.ts";
import * as e from "../core/std/extension.ts";
import * as obs from "../core/std/observability.ts";
import * as r from "../core/std/resource.ts";
import * as n from "../core/std/nature.ts";
import * as g from "../core/std/git.ts";
import * as fm from "../core/std/frontmatter.ts";
import * as m from "../core/std/model.ts";
import * as route from "../core/std/route.ts";
import * as rtree from "../core/std/route-tree.ts";
import * as fsg from "../core/originate/file-sys-globs.ts";
import * as tfsg from "../core/originate/typical-file-sys-globs.ts";
import * as lds from "../core/design-system/lightning/mod.ts";
import * as ldsDirec from "../core/design-system/lightning/directive/mod.ts";
import * as jrs from "../core/render/json.ts";
import * as tfr from "../core/render/text.ts";
import * as dtr from "../core/render/delimited-text.ts";
import * as persist from "../core/std/persist.ts";
import * as render from "../core/std/render.ts";
import * as cpC from "../core/content/control-panel.ts";
import * as redirectC from "../core/design-system/lightning/content/redirects.rf.ts";
import * as ldsDiagC from "../core/design-system/lightning/content/diagnostic/mod.ts";
import * as ldsObsC from "../core/design-system/lightning/content/observability/mod.ts";
import * as sqlObsC from "../lib/db/observability.rf.ts";
import * as mdr from "../core/render/markdown/mod.ts";
import * as am from "../lib/assets-metrics.ts";

export const assetMetricsWalkOptions: fs.WalkOptions = {
  skip: [/\.git/],
};

export interface Preferences {
  readonly contentRootPath: fsg.FileSysPathText;
  readonly staticAssetsRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly assetsMetricsArgs?: (config: Configuration) => Pick<
    am.AssetsMetricsArguments,
    "walkers"
  >;
}

export class Configuration implements Omit<Preferences, "assetsMetricsArgs"> {
  readonly telemetry: telem.Instrumentation = new telem.Telemetry();
  readonly metrics = new gsm.TypicalMetrics();
  readonly assetsMetricsArgs: Pick<am.AssetsMetricsArguments, "walkers">;
  readonly git?: govn.GitExecutive;
  readonly fsRouteFactory = new route.FileSysRouteFactory();
  readonly extensionsManager = new e.CachedExtensions();
  readonly observability: obs.Observability;
  readonly observabilityRoute: govn.Route;
  readonly diagnosticsRoute: govn.Route;
  readonly lightningDS = new lds.LightingDesignSystem();
  readonly contentRootPath: fsg.FileSysPathText;
  readonly staticAssetsRootPath: fsg.FileSysPathText;
  readonly destRootPath: fsg.FileSysPathText;
  readonly appName: string;
  readonly logger: log.Logger;

  constructor(prefs: Preferences) {
    const gitPaths = g.discoverGitWorkTree(prefs.contentRootPath);
    if (gitPaths) this.git = new g.TypicalGit(gitPaths);
    this.observability = new obs.Observability(
      new govn.ObservabilityEventsEmitter(),
    );
    this.contentRootPath = prefs.contentRootPath;
    this.staticAssetsRootPath = prefs.staticAssetsRootPath;
    this.destRootPath = prefs.destRootPath;
    this.appName = prefs.appName;
    this.logger = log.getLogger();
    this.observabilityRoute = cpC.observabilityRoute(this.fsRouteFactory);
    this.diagnosticsRoute = cpC.diagnosticsRoute(this.fsRouteFactory);
    this.assetsMetricsArgs = prefs.assetsMetricsArgs
      ? prefs.assetsMetricsArgs(this)
      : {
        walkers: [{
          identity: "origin",
          root: this.contentRootPath,
          options: assetMetricsWalkOptions,
        }, {
          identity: "destination",
          root: this.destRootPath,
          options: assetMetricsWalkOptions,
        }],
      };
  }
}

/**
 * Implement this interface in RouteUnit terminals when you want to do special
 * handling of routes when they are consumed and inserted into resourcesTree.
 */
export interface PublicationRouteEventsHandler<Context> {
  /**
   * Mutate the resource route before a route tree node is created. Context is
   * an arbitrary return value that can be used to pass into
   * prepareResourceTreeNode as necessary.
   * @param rs the resource, which has rs.route and all other resource content
   */
  readonly prepareResourceRoute?: (
    rs: govn.RouteSupplier<govn.RouteNode>,
  ) => Context;

  /**
   * Mutate the resource's route tree node after construction plus frontmatter
   * and model references have been added. When this event handler is called,
   * the route and route tree node are fully resolved. This event handler is
   * useful if the route tree node should be mutated based on the resource's
   * content, frontmatter, model, or any other business/presentation logic.
   * @param rs the resource
   * @param rtn the route tree node, if creation was successful
   * @param ctx if prepareResourceRoute was called before prepareResourceTreeNode, this is the Context
   */
  readonly prepareResourceTreeNode?: (
    rs: govn.RouteSupplier<govn.RouteNode>,
    rtn?: govn.RouteTreeNode,
    ctx?: Context,
  ) => void;
}

export const isPublicationRouteEventsHandler = safety.typeGuard<
  // deno-lint-ignore no-explicit-any
  PublicationRouteEventsHandler<any>
>("prepareResourceRoute", "prepareResourceTreeNode");

export interface PublicationState {
  readonly resourcesTree: govn.RouteTree;
  readonly resourcesIndex: r.UniversalResourcesIndex<unknown>;
  assetsMetrics?: am.AssetsMetricsResult;
}

export class ResourcesTree extends rtree.TypicalRouteTree {
}

export class NavigationTree extends rtree.TypicalRouteTree {
}

export function isContentTODOsSupplier(o: unknown): o is govn.ModelSupplier<
  ldsDirec.ToDosDirectiveStateSupplier
> {
  if (m.isModelShapeSupplier(o, ldsDirec.isToDosDirectiveStateSupplier)) {
    return o.model.contentTODOs && o.model.contentTODOs.length > 0;
  }
  return false;
}

export class PublicationRoutes {
  constructor(
    readonly routeFactory: govn.RouteFactory,
    readonly resourcesTree = new ResourcesTree(routeFactory),
    readonly navigationTree = new NavigationTree(routeFactory),
  ) {
  }

  /**
   * Add the given route to this.resourcesTree. Subclasses can override this
   * method if the route should be reject for some reason.
   * @param rs The route supplier whose route will be consumed or rejected
   * @returns the newly create tree node or undefined if route is rejected
   */
  consumeResourceRoute(
    rs: govn.RouteSupplier<govn.RouteNode>,
  ): govn.RouteTreeNode | undefined {
    let ctx: unknown;
    const terminal = rs?.route?.terminal;
    if (
      isPublicationRouteEventsHandler(terminal) && terminal.prepareResourceRoute
    ) {
      ctx = terminal.prepareResourceRoute(rs);
    }

    const result = this.resourcesTree.consumeRoute(rs);
    if (result) {
      if (fm.isFrontmatterSupplier(rs)) {
        fm.referenceFrontmatter(rs, result);
      }
      if (m.isModelSupplier(rs)) {
        m.referenceModel(rs, result);
      }
    }

    if (
      isPublicationRouteEventsHandler(terminal) &&
      terminal.prepareResourceTreeNode
    ) {
      terminal.prepareResourceTreeNode(rs, result, ctx);
    }

    return result;
  }

  /**
   * Supply a refinery which will observe each resource and, if it has a route,
   * will populate (consume/track) the route by creating a RouteTreeNode
   * instance tied to the resource. If the resource defines either frontmatter
   * or a model those objects are injected into the RouteTreeNode as well. The
   * job of the resourcesTreeConsumerSync refinery is to populate the
   * resourcesTree but not make any business logic or presentation logic
   * decisions. Presentation and business logic associated with routes should be
   * handled by prepareNavigationTree().
   * @returns resource refinery (sync)
   */
  resourcesTreePopulator(): govn.ResourceRefinery<
    govn.RouteSupplier<govn.RouteNode>
  > {
    // deno-lint-ignore require-await
    return async (resource) => {
      if (route.isRouteSupplier(resource)) {
        this.consumeResourceRoute(resource);
      }
      return resource;
    };
  }

  resourcesTreePopulatorSync(): govn.ResourceRefinerySync<
    govn.RouteSupplier<govn.RouteNode>
  > {
    return (resource) => {
      if (route.isRouteSupplier(resource)) {
        this.consumeResourceRoute(resource);
      }
      return resource;
    };
  }

  /**
   * Build a navigation tree that can be used for end-user UI/UX use. This
   * method is a companion to the resourcesTreePopulatorSync() refinery.
   * prepareNavigation assumes that this.resourcesTree has been populated with
   * all known resources and that the navigation tree is a navigable subset of
   * resourcesTree.
   */
  prepareNavigationTree() {
    this.navigationTree.consumeRoute(
      cpC.diagnosticsObsRedirectRoute(this.routeFactory),
    );
    this.resourcesTree.consumeAliases();
    this.navigationTree.consumeTree(
      this.resourcesTree,
      (node) =>
        render.isRenderableMediaTypeResource(
            node.route,
            n.htmlMediaTypeNature.mediaType,
          )
          ? true
          : false,
    );
  }

  /**
   * Create a resource factory which can generate redirect resources; redirect
   * resources represent content whose job it is to redirect to a different URL
   * either within the same site or to external resources.
   * @returns
   */
  redirectResources(): govn.ResourcesFactoriesSupplier<govn.HtmlResource> {
    return redirectC.redirectResources(this.resourcesTree);
  }
}

export class PublicationDesignSystemArguments
  implements lds.LightingDesignSystemArguments {
  readonly git?: govn.GitExecutive;
  readonly layoutText: lds.LightingDesignSystemText;
  readonly navigation: lds.LightingDesignSystemNavigation;
  readonly assets: lds.AssetLocations;
  readonly branding: lds.LightningBranding;
  readonly renderedAt = new Date();

  constructor(config: Configuration, routes: PublicationRoutes) {
    this.git = config.git;
    this.layoutText = new lds.LightingDesignSystemText();
    this.navigation = new lds.LightingDesignSystemNavigation(
      true,
      routes.navigationTree,
    );
    this.assets = config.lightningDS.assets();
    this.branding = {
      contextBarSubject: config.appName,
      contextBarSubjectImageSrc: (assets) =>
        assets.image("/assets/images/brand/logo-icon-100x100.png"),
    };
  }
}

export interface Publication {
  readonly produce: () => Promise<void>;
  readonly state: PublicationState;
}

export class TypicalPublication
  implements Publication, govn.ObservabilityHealthComponentStatusSupplier {
  readonly namespaceURIs = ["TypicalPublication<Resource>"];
  readonly state: PublicationState;
  readonly consumedFileSysWalkPaths = new Set<string>();

  constructor(
    readonly config: Configuration,
    readonly routes = new PublicationRoutes(config.fsRouteFactory),
    readonly ds = new PublicationDesignSystemArguments(config, routes),
  ) {
    this.state = {
      resourcesTree: routes.resourcesTree,
      resourcesIndex: new r.UniversalResourcesIndex(),
    };
  }

  obsHealthStatus() {
    const time = new Date();
    const status = health.healthyComponent({
      componentId: this.namespaceURIs.join(", "),
      componentType: "component",
      links: {},
      time,
    });
    return {
      identity: this.config.appName,
      category: "TypicalPublication",
      status,
    };
  }

  /**
   * For any files that were not "consumed" (transformed or rendered) we will
   * assume that they should be symlinked to the destination path in the same
   * directory structure as they exist in the source content path.
   */
  async mirrorUnconsumedAssets() {
    await Promise.all([
      this.config.lightningDS.symlinkAssets(this.config.destRootPath),
      persist.symlinkAssets(
        this.config.contentRootPath,
        this.config.destRootPath,
        {
          glob: "**/*",
          options: { exclude: ["**/*.ts"] },
          include: (we) =>
            we.isFile && !this.consumedFileSysWalkPaths.has(we.path),
        },
      ),
      persist.symlinkDirectoryChildren(
        path.join(this.config.staticAssetsRootPath),
        path.join(this.config.destRootPath),
      ),
    ]);
  }

  /**
   * Supply all valid directives that should be handled by Markdown engines.
   * @returns list of directives we will allow in Markdown
   */
  directiveExpectationsSupplier():
    | govn.DirectiveExpectationsSupplier<
      // deno-lint-ignore no-explicit-any
      govn.DirectiveExpectation<any, string | undefined>
    >
    | undefined {
    return {
      allowedDirectives: () => [new ldsDirec.ToDoDirective()],
    };
  }

  /**
   * Supply the markdown renderers that our Markdown resources can use to render
   * their content to HTML.
   * @returns list of Markdown layouts we will allow Markdown resources to use
   */
  markdownRenderers(): mdr.MarkdownRenderStrategy {
    return new mdr.MarkdownRenderStrategy(
      new mdr.MarkdownLayouts({
        directiveExpectations: this.directiveExpectationsSupplier(),
        // TODO: replace all Hugo URL link-* shortcodes with this
        // rewriteURL: (parsedURL, renderEnv) => {
        //   console.log(parsedURL, Object.keys(renderEnv));
        //   return parsedURL;
        // },
      }),
    );
  }

  controlPanelOriginators() {
    const { fsRouteFactory, diagnosticsRoute, observabilityRoute } =
      this.config;
    return [
      ldsDiagC.diagnosticsResources(
        diagnosticsRoute,
        fsRouteFactory,
        this.state,
      ),
      ldsObsC.observabilityPreProduceResources(
        observabilityRoute,
        fsRouteFactory,
      ),
      sqlObsC.observabilityResources(diagnosticsRoute, fsRouteFactory),
    ];
  }

  // deno-lint-ignore no-explicit-any
  originators(): govn.ResourcesFactoriesSupplier<any>[] {
    const { contentRootPath, fsRouteFactory } = this.config;
    const watcher = new fsg.FileSysGlobsOriginatorEventEmitter();
    // deno-lint-ignore require-await
    watcher.on("beforeYieldWalkEntry", async (we) => {
      // if we "consumed" (handled) the resource it means we do not want it to
      // go to the destination directory so let's track it
      this.consumedFileSysWalkPaths.add(we.path);
    });
    return [
      // deno-lint-ignore no-explicit-any
      new fsg.FileSysGlobsOriginator<any>(
        [
          // process modules first so that if there are any proxies or other
          // generated content, it can be processed but the remaining originators
          tfsg.moduleFileSysGlobs<PublicationState>(
            contentRootPath,
            fsRouteFactory,
            this.state,
          ),
          tfsg.markdownFileSysGlobs(
            contentRootPath,
            this.markdownRenderers(),
            fsRouteFactory,
          ),
          tfsg.htmlFileSysGlobs(contentRootPath, fsRouteFactory),
        ],
        this.config.extensionsManager,
        {
          eventEmitter: () => watcher,
        },
      ),
      ...this.controlPanelOriginators(),
    ];
  }

  originationRefinery() {
    return this.routes.resourcesTreePopulatorSync();
  }

  producersRefinery() {
    return r.pipelineUnitsRefineryUntyped(
      this.config.lightningDS.prettyUrlsHtmlProducer(
        this.config.destRootPath,
        this.ds,
      ),
      jrs.jsonProducer(this.config.destRootPath, {
        routeTree: this.routes.resourcesTree,
      }),
      dtr.csvProducer<PublicationState>(
        this.config.destRootPath,
        this.state,
      ),
      tfr.textFileProducer<PublicationState>(
        this.config.destRootPath,
        this.state,
      ),
    );
  }

  async initProduce() {
    // setup the cache and any other git-specific initialization
    if (this.ds.git instanceof g.TypicalGit) await this.ds.git.init();
  }

  async *originate<Resource>(
    supplier: govn.ResourcesFactoriesSupplier<Resource>,
    // deno-lint-ignore no-explicit-any
    refine: govn.ResourceRefinerySync<any>,
    _parent?: Resource,
  ): AsyncGenerator<Resource> {
    for await (const rf of supplier.resourcesFactories()) {
      const resource = refine(await rf.resourceFactory()) as Resource;
      let hasChildren = false;
      let yieldWithChildren = false;
      if (r.isChildResourcesFactoriesSupplier<Resource>(resource)) {
        // our constructed resource wants to create its own resources so allow
        // it become a dynamic supplier of resource factories via recursion
        yield* this.originate(resource, refine, resource);
        hasChildren = true;
        yieldWithChildren = resource.yieldParentWithChildren ? true : false;
      }
      if (!hasChildren || (hasChildren && yieldWithChildren)) {
        yield resource;
      }
    }
  }

  async *resources<Resource>(refine: govn.ResourceRefinerySync<Resource>) {
    for await (const originator of this.originators()) {
      yield* this.originate(originator, refine);
    }
  }

  async produceMetrics() {
    this.state.assetsMetrics = await am.assetsMetrics({
      ...this.config.assetsMetricsArgs,
      metricsSuppliers: [
        am.assetNameMetrics(),
        am.assetNameLintIssues(this.config.metrics),
      ],
      metrics: this.config.metrics,
      txID: "transactionID",
      txHost: Deno.hostname(),
    });

    const { fsRouteFactory, observabilityRoute } = this.config;
    const resourcesIndex = this.state.resourcesIndex;
    const originationRefinery = this.originationRefinery();
    const persist = this.producersRefinery();
    for await (
      const resource of this.originate<govn.HtmlSupplier>(
        ldsObsC.observabilityPostProduceResources(
          observabilityRoute,
          fsRouteFactory,
          // before production assetsMetrics is undefined but by now it should
          // be constructed as part of urWatcher.on("afterProduce", ...) so we
          // do a type-assertion
          this.state as { assetsMetrics: am.AssetsMetricsResult },
        ),
        originationRefinery,
      )
    ) {
      resourcesIndex.index(await persist(resource));
    }
  }

  async finalizeProduce() {
    // any files that were not consumed should "mirrored" to the destination
    await this.mirrorUnconsumedAssets();
    await this.produceMetrics();
  }

  async produce() {
    // give opportunity for subclasses to intialize the production pipeline
    await this.initProduce();

    // we store all our resources in this index, as they are produced;
    // ultimately the index contains every generated resource
    const resourcesIndex = this.state.resourcesIndex;

    // find and construct every orginatable resource from file system and other
    // sources; as each resource is prepared, store it in the index -- each
    // resource create child resources recursively and this loop handles all
    // "fanned out" resources as well
    const originationRefinery = this.originationRefinery();
    for await (const resource of this.resources(originationRefinery)) {
      resourcesIndex.index(resource);
    }

    // the first found of all resources are now available, but haven't yet been
    // persisted so let's prepare the navigation trees before we persist
    this.routes.prepareNavigationTree();

    // the navigation tree may have generated redirect HTML pages (e.g. aliases)
    // so let's get those into the index too
    for await (
      const resource of this.originate(
        this.routes.redirectResources(),
        originationRefinery,
      )
    ) {
      resourcesIndex.index(resource);
    }

    // now all resources, child resources, redirect pages, etc. have been
    // so we can persist all pages
    const persist = this.producersRefinery();
    for (const resource of resourcesIndex.resources()) {
      await persist(resource);
    }

    // give opportunity for subclasses to finalize the production pipeline
    await this.finalizeProduce();
  }
}

export class Executive {
  constructor(readonly publications: Publication[]) {
  }

  async execute() {
    await Promise.all(
      this.publications.map((p) => p.produce()),
    );
  }
}

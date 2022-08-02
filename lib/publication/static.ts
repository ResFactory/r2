import * as fs from "https://deno.land/std@0.147.0/fs/mod.ts";

import * as st from "../statistics/stream.ts";
import * as k from "../knowledge/mod.ts";
import * as fsr from "../fs/fs-route.ts";
import * as fsLink from "../fs/link.ts";
import * as git from "../git/mod.ts";
import * as gi from "../structure/govn-index.ts";
import * as m from "../metrics/mod.ts";
import * as extn from "../module/mod.ts";

import * as jrs from "../resource/json.ts";
import * as dtr from "../resource/delimited-text.ts";
import * as tfr from "../resource/text.ts";
import * as br from "../resource/bundle.ts";
import * as orig from "../resource/originate/mod.ts";
import * as c from "../resource/content/mod.ts";
import * as p from "../resource/persist/mod.ts";
import * as coll from "../resource/collection/mod.ts";
import * as fm from "../resource/frontmatter/mod.ts";
import * as r from "../resource/route/mod.ts";
import * as i from "../resource/instantiate.ts";
import * as md from "../resource/markdown/mod.ts";
import * as ds from "../resource/html/mod.ts";
import * as udsp from "../resource/design-system/universal/publication.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export const destroyPathContents = async (
  fsPath: string,
  options?: {
    readonly onAfterDestroy?: (fsPath: string) => void | Promise<void>;
    readonly onUnableToDestroy?: (
      fsPath: string,
      error: Error,
    ) => void | Promise<void>;
  },
) => {
  const {
    onAfterDestroy,
    // deno-lint-ignore require-await
    onUnableToDestroy = async (_fsPath: string, error: Error) => {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    },
  } = options ?? {};
  try {
    await Deno.remove(fsPath, { recursive: true });
    await onAfterDestroy?.(fsPath);
  } catch (error) {
    await onUnableToDestroy(fsPath, error);
  }
};

export class PublicationResourcesIndex<Resource = Any>
  extends gi.UniversalIndex<Resource> {
  flowMetrics() {
    const iset = new Set<string>();
    let frontmatterSuppliers = 0;
    let modelSuppliers = 0;
    this.resourcesIndex.forEach((r) => {
      if (i.isInstantiatorSupplier(r)) iset.add(r.instantiatorIdentity);
      if (fm.isFrontmatterSupplier(r)) frontmatterSuppliers++;
      if (c.isModelSupplier(r)) modelSuppliers++;
    });
    return {
      instantiators: iset,
      frontmatterSuppliers,
      modelSuppliers,
    };
  }
}

export class PublicationPersistedIndex {
  // key is the filename written (e.g. public/**/*.html, etc.)
  readonly persistedDestFiles = new Map<string, p.FileSysPersistResult>();

  index(destFileName: string, fsapee: p.FileSysPersistResult): void {
    this.persistedDestFiles.set(destFileName, fsapee);
  }

  has(destFileName: string): boolean {
    return this.persistedDestFiles.has(destFileName);
  }
}

export interface Preferences {
  readonly originationSources: Iterable<orig.FilePathsSupplier>;
  readonly destRootPath: string;
  readonly appName?: string;
  readonly persistClientCargo?: ds.HtmlLayoutClientCargoPersister;
  readonly mGitResolvers?: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver?: r.RouteGitRemoteResolver<
    ds.GitRemoteAnchor
  >;
  readonly routeLocationResolver?: r.RouteLocationResolver;
  readonly rewriteMarkdownLink?: md.MarkdownLinkUrlRewriter;
  readonly extensionsManager: extn.ExtensionsManager;
  readonly termsManager?: k.TermsManager;
}

export class StaticPublConfiguration implements Preferences {
  readonly metrics = new m.TypicalMetrics();
  readonly fsRouteFactory: r.FileSysRouteFactory;
  readonly routeLocationResolver?: r.RouteLocationResolver;
  readonly extensionsManager: extn.ExtensionsManager;
  readonly termsManager?: k.TermsManager;
  readonly originationSources: Iterable<orig.FilePathsSupplier>;
  readonly destRootPath: string;
  readonly appName?: string;
  readonly mGitResolvers?: git.ManagedGitResolvers<string>;
  readonly routeGitRemoteResolver?: r.RouteGitRemoteResolver<
    ds.GitRemoteAnchor
  >;
  readonly rewriteMarkdownLink?: md.MarkdownLinkUrlRewriter;

  constructor(prefs: Preferences) {
    this.mGitResolvers = prefs.mGitResolvers;
    this.originationSources = prefs.originationSources;
    this.destRootPath = prefs.destRootPath;
    this.appName = prefs.appName;
    this.routeGitRemoteResolver = prefs.routeGitRemoteResolver;
    this.routeLocationResolver = prefs.routeLocationResolver;
    this.fsRouteFactory = new r.FileSysRouteFactory(
      this.routeLocationResolver || r.defaultRouteLocationResolver(),
    );
    this.rewriteMarkdownLink = prefs.rewriteMarkdownLink;
    this.extensionsManager = prefs.extensionsManager;
    this.termsManager = prefs.termsManager;
  }
}

export class ScopedStatistics {
  readonly stats = new Map<string, st.StreamStatistics>();
  constructor(readonly scope: string) {
  }

  encounter(identity: string, value: number) {
    let stats = this.stats.get(identity);
    if (!stats) {
      stats = new st.StreamStatistics();
      this.stats.set(identity, stats);
    }
    stats.encounter(value);
  }

  // deno-lint-ignore no-explicit-any
  populateMetrics(metrics: m.Metrics, baggage: any) {
    this.stats.forEach((stats, identity) => {
      m.populateStreamMetrics(
        stats,
        metrics,
        baggage,
        `${this.scope}_${identity}_duration`,
        `${identity} duration`,
        "milliseconds",
      );
    });
  }
}

export abstract class StaticPublication {
  readonly namespaceURIs = ["TypicalPublication<Resource>"];
  readonly producerStats: ScopedStatistics;
  readonly resourcesIndex: PublicationResourcesIndex;
  readonly persistedIndex: PublicationPersistedIndex;
  readonly consumedFileSysWalkPaths = new Set<string>();
  readonly fspEventsEmitter = new p.FileSysPersistenceEventsEmitter();
  // deno-lint-ignore no-explicit-any
  readonly dsFactory: ds.DesignSystemFactory<any, any, any, any>;

  constructor(
    readonly config: StaticPublConfiguration,
    readonly routes = new udsp.PublicationRoutes(config.fsRouteFactory),
  ) {
    this.dsFactory = this.designSystemFactory(config, routes);
    this.config.mGitResolvers?.registerResolver(routes.gitAssetPublUrlResolver);
    this.persistedIndex = new PublicationPersistedIndex();
    this.resourcesIndex = new PublicationResourcesIndex();
    this.producerStats = new ScopedStatistics("producer");
    this.fspEventsEmitter.on(
      "afterPersistContributionFile",
      // deno-lint-ignore require-await
      async (result) => {
        // TODO: warn if file written more than once either here or directly in persist
        this.persistedIndex.index(result.destFileName, result);
      },
    );
    this.fspEventsEmitter.on(
      "afterPersistContributionFileSync",
      (result) => {
        // TODO: warn if file written more than once either here or directly in persist
        this.persistedIndex.index(result.destFileName, result);
      },
    );
  }

  abstract designSystemFactory(
    config: StaticPublConfiguration,
    routes: udsp.PublicationRoutes,
  ): ds.DesignSystemFactory<Any, Any, Any, Any>;

  /**
   * Create symlinks for files such as images, CSS style sheets, and other
   * "assets".
   */
  async symlinkAssets(
    onDestExists?: (src: fs.WalkEntry, dest: string) => void,
  ) {
    await Promise.all([
      ...Array.from(this.config.originationSources).map((os) => {
        // For any files that are in the content directory but were not "consumed"
        // (transformed or rendered) we will assume that they should be symlinked
        // to the destination path in the same directory structure as they exist
        // in the source content path. Images, and other assets sitting in same
        // directories as *.html, *.ts, *.md, etc. will be symlink'd so that they
        // do not need to be copied.
        return fsLink.linkAssets(os.rootPath, this.config.destRootPath, {
          destExistsHandler: onDestExists,
        }, {
          glob: "**/*",
          options: { exclude: ["**/*.ts"] },
          include: (we) =>
            we.isFile && !this.consumedFileSysWalkPaths.has(we.path),
        });
      }),
    ]);
  }

  /**
   * Supply all valid directives that should be handled by Markdown engines.
   * @returns list of directives we will allow in Markdown
   */
  directiveExpectationsSupplier():
    | c.DirectiveExpectationsSupplier<c.DirectiveExpectation<Any, Any>>
    | undefined {
    // by default we delegate directive expectations to the design system
    return this.dsFactory.designSystem;
  }

  /**
   * Supply the markdown renderers that our Markdown resources can use to render
   * their content to HTML.
   * @returns list of Markdown layouts we will allow Markdown resources to use
   */
  markdownRenderers(): md.MarkdownRenderStrategy {
    return new md.MarkdownRenderStrategy(
      new md.MarkdownLayouts({
        directiveExpectations: this.directiveExpectationsSupplier(),
        rewriteURL: this.config.rewriteMarkdownLink,
        customize: (mdi) => {
          mdi.renderer.rules.image = md.autoCorrectPrettyUrlImagesRule(
            mdi.renderer.rules.image,
          );
        },
      }),
    );
  }

  // deno-lint-ignore no-explicit-any
  postProduceOriginators(): coll.ResourcesFactoriesSupplier<any>[] {
    return [];
  }

  originationRefinery() {
    // usually all we want to do is put originated resources into a tree
    return this.routes.resourcesTreePopulatorSync();
  }

  persistersRefinery() {
    const fspEE = this.fspEventsEmitter;
    // fspEE.on("afterPersistResourceFile", (resource, fspr) => {
    //   console.log("persistersRefinery", fspr.destFileName);
    // });
    return coll.pipelineUnitsRefineryUntypedObservable<
      { readonly startMS: number },
      {
        readonly identity: string;
        // deno-lint-ignore no-explicit-any
        readonly refinery: coll.ResourceRefinery<any>;
        startMS?: number;
      }
    >(
      // deno-lint-ignore require-await
      async () => ({ startMS: Date.now() }),
      // deno-lint-ignore require-await
      async function (eachCtx) {
        eachCtx.startMS = Date.now();
      },
      // deno-lint-ignore require-await
      async (eachCtx) => {
        if (eachCtx.startMS) {
          this.producerStats.encounter(
            eachCtx.identity,
            Date.now() - eachCtx.startMS,
          );
        }
      },
      // deno-lint-ignore require-await
      async (ctx) => {
        this.producerStats.encounter(
          "cumulative",
          Date.now() - ctx.startMS,
        );
      },
      {
        identity: "prettyUrlsHtmlProducer",
        refinery: this.dsFactory.designSystem.prettyUrlsHtmlProducer(
          this.config.destRootPath,
          this.dsFactory.contentStrategy,
          { fspEE },
        ),
      },
      {
        identity: "jsonTextProducer",
        refinery: jrs.jsonTextProducer(this.config.destRootPath, {
          routeTree: this.routes.resourcesTree,
        }, fspEE),
      },
      {
        identity: "csvProducer",
        refinery: dtr.csvProducer<unknown>(
          this.config.destRootPath,
          undefined, // TODO: what should `state` be?
          fspEE,
        ),
      },
      {
        identity: "textFileProducer",
        refinery: tfr.textFileProducer<unknown>(
          this.config.destRootPath,
          undefined, // TODO: what should `state` be?
          {
            eventsEmitter: fspEE,
          },
        ),
      },
      {
        identity: "bundleProducer",
        refinery: br.bundleProducer<unknown>(
          this.config.destRootPath,
          undefined, // TODO: what should `state` be?
          {
            eventsEmitter: fspEE,
          },
        ),
      },
    );
  }

  async initProduce() {
    // setup the cache and any other git-specific initialization
    if (this.dsFactory.contentStrategy.git instanceof git.TypicalGit) {
      await this.dsFactory.contentStrategy.git.init();
    }
  }

  async *resources<Resource>(refine: coll.ResourceRefinerySync<Resource>) {
    const mdRenderers = this.markdownRenderers();
    const { fsRouteFactory } = this.config;
    const fso = orig.typicalfsFileSuffixOriginators({
      fsRouteFactory,
      extensionsManager: this.config.extensionsManager,
      routeParser: fsr.humanFriendlyFileSysRouteParser,
    }, {
      markdownRS: mdRenderers,
      // deno-lint-ignore require-await
      onOriginated: async (_, fsPath) => {
        // if we "consumed" (handled) the resource it means we do not want it to
        // go to the destination directory so let's track it
        this.consumedFileSysWalkPaths.add(fsPath);
      },
    });
    yield* orig.originateAll(
      fso.instances(this.config.originationSources),
      "before",
      { refine },
    );
  }

  async finalizePrePersist(
    originationRefinery: coll.ResourceRefinerySync<
      r.RouteSupplier<r.RouteNode>
    >,
    resourcesIndex: gi.UniversalIndex<unknown>,
  ) {
    // the first round of all resources are now available, but haven't yet been
    // persisted so let's prepare the navigation trees before we persist
    this.routes.prepareNavigationTree();

    // the navigation tree may have generated redirect HTML pages (e.g. aliases
    // or redirects) so let's get those into the index too
    const redirects = this.routes.redirectResources();
    for await (
      const resource of orig.originateAll(
        redirects.resourcesFactories(),
        "before",
        {
          refine: originationRefinery,
        },
      )
    ) {
      await resourcesIndex.index(resource);
    }
  }

  async finalizeProduce(): Promise<void> {
    // any files that were not consumed should "mirrored" to the destination
    await this.symlinkAssets();
  }

  async produce() {
    // give opportunity for subclasses to intialize the production pipeline
    await this.initProduce();

    // we store all our resources in this index, as they are produced;
    // ultimately the index contains every originated resource
    const resourcesIndex = this.resourcesIndex;

    // find and construct every orginatable resource from file system and other
    // sources; as each resource is prepared, store it in the index -- each
    // resource create child resources recursively and this loop handles all
    // "fanned out" resources as well
    const originationRefinery = this.originationRefinery();
    for await (const resource of this.resources(originationRefinery)) {
      await resourcesIndex.index(resource);
    }

    // the first round of all resources are now available, but haven't yet been
    // persisted so let's do any routes finalization, new resources construction
    // or any other pre-persist activities
    await this.finalizePrePersist(originationRefinery, resourcesIndex);

    // now all resources, child resources, redirect pages, etc. have been
    // created so we can persist all pages that are in our index
    const persist = this.persistersRefinery();
    const ri = resourcesIndex.resourcesIndex;
    for (let i = 0; i < ri.length; i++) {
      const resource = ri[i];
      await persist(resource);
    }

    // give opportunity for subclasses to finalize the production pipeline
    await this.finalizeProduce();
  }
}

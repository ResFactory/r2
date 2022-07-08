// import { path } from "../../core/deps.ts";
// // import { testingAsserts as ta } from "../deps-test.ts";
// import * as mod from "./publication.ts";
// import * as govn from "../../governance/mod.ts";
// import * as obs from "../../core/std/observability.ts";
// import * as fsLink from "../../lib/fs/link.ts";
// import * as git from "../../lib/git/mod.ts";
// import * as k from "../../lib/knowledge/mod.ts";
// import * as ds from "../../core/render/html/mod.ts";
// import * as lds from "../../core/design-system/lightning/mod.ts";
// import * as extn from "../../lib/module/mod.ts";

// const testPath = path.relative(
//   Deno.cwd(),
//   path.dirname(import.meta.url).substring("file://".length),
// );
// const pubCtlSupplier = mod.typicalPublicationCtlSupplier<
//   mod.PublicationOperationalContext
// >(
//   (relative) => path.join(path.relative(Deno.cwd(), testPath), relative),
//   (oc) => oc, // we're not enhancing, just adding type-safety,
// );
// const pubCtl = await pubCtlSupplier();
// const docsPath = path.join(testPath, "../../", "docs");
// const extensionsManager = new extn.ReloadableCachedExtensions();
// const termsManager = new k.TypicalTermsManager();
// const observability = new obs.Observability(
//   new govn.ObservabilityEventsEmitter(),
// );
// const prefs: mod.Preferences<mod.PublicationOperationalContext> = {
//   observability,
//   contentRootPath: path.join(docsPath, "content"),
//   persistClientCargo: async (publishDest) => {
//     await fsLink.symlinkDirectoryChildren(
//       path.join(path.join(docsPath, "client-cargo")),
//       path.join(publishDest),
//       undefined,
//       //fsLink.symlinkDirectoryChildrenConsoleReporters,
//     );
//   },
//   destRootPath: path.join(docsPath, "public"),
//   appName: "Publication Test",
//   envVarNamesPrefix: "PUBCTL_",
//   mGitResolvers: {
//     ...git.typicalGitWorkTreeAssetUrlResolvers(),
//     remoteCommit: (commit, paths) => ({
//       commit,
//       remoteURL: "??",
//       paths,
//     }),
//     workTreeAsset: git.typicalGitWorkTreeAssetResolver,
//     changelogReportAnchorHref: () => "/activity-log/git-changelog/",
//     cicdBuildStatusHTML: () => `TODO`,
//   },
//   routeGitRemoteResolver: (route, gitBranchOrTag, paths) => {
//     return {
//       assetPathRelToWorkTree: route.terminal?.qualifiedPath || "??",
//       href: route.terminal?.qualifiedPath || "??",
//       textContent: route.terminal?.qualifiedPath || "??",
//       paths,
//       gitBranchOrTag,
//     };
//   },
//   wsEditorResolver: () => undefined,
//   extensionsManager,
//   termsManager,
//   operationalCtx: pubCtl.operationalCtx,
//   memoizeProducers: false,
// };

// export class TestDesignSystem implements lds.LightningDesignSystemFactory {
//   readonly designSystem: lds.LightingDesignSystem<lds.LightningLayout>;
//   readonly contentStrategy: lds.LightingDesignSystemContentStrategy;

//   constructor(
//     config: mod.Configuration<mod.PublicationOperationalContext>,
//     routes: mod.PublicationRoutes,
//   ) {
//     this.designSystem = new lds.LightingDesignSystem(
//       config.extensionsManager,
//       `/universal-cc`,
//     );
//     this.contentStrategy = {
//       git: config.git,
//       layoutText: new lds.LightingDesignSystemText(),
//       navigation: new lds.LightingDesignSystemNavigation(
//         true,
//         routes.navigationTree,
//       ),
//       assets: this.designSystem.assets(),
//       branding: {
//         contextBarSubject: config.appName,
//         contextBarSubjectImageSrc: (assets) =>
//           assets.image("/asset/image/brand/logo-icon-100x100.png"),
//       },
//       mGitResolvers: config.mGitResolvers,
//       routeGitRemoteResolver: config.routeGitRemoteResolver,
//       renderedAt: new Date(),
//       wsEditorResolver: () => undefined,
//       wsEditorRouteResolver: () => undefined,
//       termsManager,
//     };
//   }
// }

// const config = new mod.Configuration(prefs);
// const executive = new mod.Executive(pubCtl, [
//   new class extends mod.TypicalPublication<mod.PublicationOperationalContext> {
//     constructDesignSystem(
//       config: mod.Configuration<mod.PublicationOperationalContext>,
//       routes: mod.PublicationRoutes,
//       // deno-lint-ignore no-explicit-any
//     ): ds.DesignSystemFactory<any, any, any, any> {
//       return new TestDesignSystem(config, routes);
//     }
//   }(config),
// ]);

// Deno.test(`Publication discovered proper number of assets ${config.contentRootPath}`, async () => {
//   await executive.publish();
//   // TODO: help find async leaks in executive.execute()
//   // console.dir(Deno.metrics());
//   // let count = 0;
//   // ta.assertEquals(count, 1);
// });

// Deno.test(`Publication persist proper number of assets from ${config.contentRootPath} to ${config.destRootPath}`, () => {
//   // executive.publication.productsSync();
// });

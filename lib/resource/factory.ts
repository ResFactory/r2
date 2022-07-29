import * as o from "./originate/mod.ts";
import * as coll from "./collection/mod.ts";
import * as r from "./route/mod.ts";
import * as fm from "./frontmatter/mod.ts";
import * as md from "./markdown/mod.ts";
import * as b from "./bundle.ts";
import * as html from "./html/mod.ts";
import * as module from "./module.ts";
import * as jsonM from "./json.ts";
import * as g from "../../lib/git/mod.ts";
import * as fsr from "../../lib/fs/fs-route.ts";

export function staticMarkdownFileSysGlob(
  mdrs: md.MarkdownRenderStrategy,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
) {
  return {
    glob: "**/*.md",
    routeParser,
    factory: md.staticMarkdownFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      coll.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
        mdrs.renderer(),
      ),
    ),
  };
}

export function markdownModuleFileSysGlob(
  mdrs: md.MarkdownRenderStrategy,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.md${stage}.ts` : "**/*.md.ts",
    routeParser,
    factory: md.markdownModuleFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      coll.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlTomlMarkdownFrontmatterRE),
        mdrs.renderer(),
      ),
    ),
  };
}

export function markdownFileSysGlobs(
  originRootPath: o.FileSysPathText,
  mdrs: md.MarkdownRenderStrategy,
  fsRouteFactory: r.FileSysRouteFactory,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
) {
  return {
    humanFriendlyName: "Markdown Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Markdown Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [staticMarkdownFileSysGlob(mdrs, routeParser)],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}

export function htmlFileSysGlob(
  routeParser = fsr.humanFriendlyFileSysRouteParser,
) {
  return {
    glob: "**/*.html",
    routeParser,
    factory: html.staticHtmlFileSysResourceFactory(
      // deno-lint-ignore no-explicit-any
      coll.pipelineUnitsRefinery<any>(
        fm.prepareFrontmatter(fm.yamlHtmlFrontmatterRE),
      ),
    ),
  };
}

export function htmlFileSysGlobs(
  originRootPath: o.FileSysPathText,
  fsRouteFactory: r.FileSysRouteFactory,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
) {
  return {
    humanFriendlyName: "HTML Content with Optional Frontmatter",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `HTML Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [htmlFileSysGlob(routeParser)],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}

export function resourceModuleFileSysGlob<State>(
  state: State,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.rf${stage}.ts` : "**/*.rf.ts",
    exclude: ["deps.ts"],
    routeParser,
    factory: module.moduleFileSysResourceFactory(state),
  };
}

export function jsonModuleFileSysGlob(
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.json${stage}.ts` : "**/*.json.ts",
    exclude: ["deps.ts"],
    routeParser,
    factory: jsonM.jsonFileSysResourceFactory(),
  };
}

export function jsBundleFileSysGlob(
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.js${stage}.ts` : "**/*.js.ts",
    routeParser,
    factory: b.bundleFileSysResourceFactory(true),
  };
}

export function pciiServerOnlyBundleFileSysGlob(
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.pcii${stage}.ts` : "**/*.pcii.ts",
    routeParser,
    factory: b.bundleFileSysResourceFactory(false),
  };
}

export function pciiClientAndServerBundleFileSysGlob(
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    glob: stage ? `**/*.client.pcii${stage}.ts` : "**/*.client.pcii.ts",
    routeParser,
    factory: b.bundleFileSysResourceFactory(true),
  };
}

export function moduleFileSysGlobs<State>(
  originRootPath: o.FileSysPathText,
  fsRouteFactory: r.FileSysRouteFactory,
  mdrs: md.MarkdownRenderStrategy,
  state: State,
  routeParser = fsr.humanFriendlyFileSysRouteParser,
  stage?: string,
) {
  return {
    humanFriendlyName: "Module Content",
    ownerFileSysPath: originRootPath,
    lfsPaths: [{
      humanFriendlyName: `Module Content (${originRootPath})`,
      fileSysPath: originRootPath,
      globs: [
        resourceModuleFileSysGlob(state, routeParser, stage),
        jsonModuleFileSysGlob(routeParser, stage),
        markdownModuleFileSysGlob(mdrs, routeParser, stage),
        jsBundleFileSysGlob(routeParser, stage),
        pciiServerOnlyBundleFileSysGlob(routeParser, stage),
        pciiClientAndServerBundleFileSysGlob(routeParser, stage),
      ],
      fileSysGitPaths: g.discoverGitWorkTree(originRootPath),
    }],
    fsRouteFactory,
  };
}

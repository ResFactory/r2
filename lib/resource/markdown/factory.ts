import * as fsr from "../../../lib/fs/fs-route.ts";
import * as g from "../../../lib/git/mod.ts";
import * as o from "../originate/mod.ts";
import * as coll from "../collection/mod.ts";
import * as r from "../route/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as md from "./mod.ts";

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

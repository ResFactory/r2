import * as d from "./fs/discover.ts";
import * as gh from "./task/github.ts";

/**
 * Test to see if any of the imports in deps.ts contains relative paths URIs
 * such as ../resFactory/factory/. If so, it means that the deps.ts refers to
 * "local" Resource Factory modules.
 * @param depsTs the sandbox asset locations
 * @returns true if deps.ts refers to "local" Resource Factory modules, false if refers to remotes
 */
// deno-lint-ignore require-await
export async function isResFactoryDepsLocal(depsTs: string) {
  const origDepsTs = Deno.readTextFileSync(depsTs);
  return origDepsTs.indexOf("../resFactory/factory/") > 0;
}

/**
 * Instead of using multiple import maps, mutate the local deps.ts to point to
 * an appropriate set of https://github.com/resFactory/factory modules.
 * When local (mGit path conventions): ../../../github.com/resFactory/factory*
 * when remote (latest): https://raw.githubusercontent.com/resFactory/factory/main*
 * when remote (pinned): https://raw.githubusercontent.com/resFactory/factory/${tag}*
 * @param depsTsFiles the sandbox asset locations
 * @param prepare whether we're pointing to resFactory in local sandbox or publish (GitHub) location
 */
export async function mutateResFactoryDeps(
  depsTsFiles: Iterable<string>,
  prepare: "sandbox" | "publish",
  srcRelPathSupplier: (src: Required<d.DiscoverPathResult>) => string,
  options?: {
    onSrcNotFound: (src: d.DiscoverPathResult) => Promise<boolean>;
  },
): Promise<boolean> {
  const src = await d.discoverGlob(
    "**/resFactory/factory",
    path.fromFileUrl(import.meta.url),
  );
  if (!src.found) {
    return options?.onSrcNotFound(src) ?? false;
  }
  const srcRelPath = srcRelPathSupplier(src as Required<d.DiscoverPathResult>);
  const tag = await gh.latestGitHubRepoTag(
    { repo: "resFactory/factory" },
    "main",
  );

  for (const depsTs of depsTsFiles) {
    const origDepsTs = Deno.readTextFileSync(depsTs);
    const mutatedDepsTs = prepare == "sandbox"
      ? origDepsTs.replaceAll(
        /"https:\/\/raw.githubusercontent.com\/resFactory\/factory\/.*?\//g,
        `"${srcRelPath}/`,
      )
      : origDepsTs.replaceAll(
        `"${srcRelPath}/`,
        `"https://raw.githubusercontent.com/resFactory/factory/${tag}/`,
      );
    if (mutatedDepsTs != origDepsTs) {
      await Deno.writeTextFile(depsTs, mutatedDepsTs);
    }
  }

  return true;
}

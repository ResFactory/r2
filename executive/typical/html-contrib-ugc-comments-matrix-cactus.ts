import * as ds from "../../core/render/html/mod.ts";

export interface CactusMatrixServerConfig {
  readonly defaultHomeserverUrl: string;
  readonly serverName: string;
  readonly siteName: string;
}

export function cactusMatrixServerEnvConfig(
  envVarsPrefix = "MATRIX_",
  onNoEnvVars?: (
    envVarsSought: string[],
  ) => CactusMatrixServerConfig | undefined,
): CactusMatrixServerConfig | undefined {
  const envVarsSought = [
    `${envVarsPrefix}HOME_SERVER_URL`,
    `${envVarsPrefix}SERVER_NAME`,
    `${envVarsPrefix}SITE_NAME`,
  ];
  const envVarsFound = envVarsSought.filter((ev) => Deno.env.get(ev));
  if (envVarsFound.length != envVarsSought.length) {
    return onNoEnvVars?.(envVarsSought);
  }

  const [defaultHomeserverUrl, serverName, siteName] = envVarsFound;
  return {
    defaultHomeserverUrl,
    serverName,
    siteName,
  };
}

export function matrixCactusCommentsContribs(
  contribs: ds.HtmlLayoutContributions,
  mcConfig: CactusMatrixServerConfig,
): void {
  contribs.scripts.aft
    `<script type="text/javascript" src="https://latest.cactus.chat/cactus.js"></script>`;
  contribs.stylesheets.prime
    `<link rel="stylesheet" href="https://latest.cactus.chat/style.css" type="text/css">`;
  contribs.bodyMainContent.aft`<div id="comment-section"></div>`;
  contribs.domContentLoadedJS.aft`
    const domainDetails = new URL(window.location.href);
    const pageUrlslug = domainDetails.pathname.replace(/\\//g, "-");
    console.log(pageUrlslug);
    const commentSectionId = pageUrlslug;
    initComments({
      node: document.getElementById("comment-section"),
      defaultHomeserverUrl: "${mcConfig.defaultHomeserverUrl}",
      serverName: "${mcConfig.serverName}",
      siteName: "${mcConfig.siteName}",
      commentSectionId: commentSectionId,
    });
    document.querySelector(".cactus-send-button").innerHTML = "Post";
    document.querySelector(".cactus-logout-button").style.display = "none";`;
}

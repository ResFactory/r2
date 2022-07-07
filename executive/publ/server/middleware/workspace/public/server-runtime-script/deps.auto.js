function minWhitespaceIndent(text) {
    const match = text.match(/^[ \t]*(?=\S)/gm);
    return match ? match.reduce((r, a)=>Math.min(r, a.length), Infinity) : 0;
}
function unindentWhitespace(text, removeInitialNewLine = true) {
    const indent = minWhitespaceIndent(text);
    const regex = new RegExp(`^[ \\t]{${indent}}`, "gm");
    const result = text.replace(regex, "");
    return removeInitialNewLine ? result.replace(/^\n/, "") : result;
}
const jsonDecycleResponse = {
    foreignCodeResponseStrategy: "JSON",
    foreignCodeResponseStrategyOptions: {
        isJsonResponseOptions: true,
        decycle: true
    }
};
function denoInspectResponse(denoIO = {
    depth: 9,
    showHidden: true,
    sorted: true,
    showProxy: true
}) {
    return {
        foreignCodeResponseStrategy: "Deno.inspect",
        foreignCodeResponseStrategyOptions: {
            isDenoInspectResponseOptions: true,
            denoIO
        }
    };
}
function jsModule(code, rs, ...args) {
    return {
        foreignCodeLanguage: "js",
        foreignCode: unindentWhitespace(code),
        foreignCodeArgsExpected: args.length > 0 ? args.reduce((args, arg)=>{
            args[arg.identity] = arg;
            return args;
        }, {}) : undefined,
        ...rs
    };
}
function routeUnitModuleArgs() {
    return [
        {
            identity: "routeUnitFileSysPath",
            dataType: "string"
        }
    ];
}
function typicalScriptsInventory(identity = "typicalScripts") {
    const scriptsIndex = new Map();
    const jsonExplorer = {
        nature: "JSON-explorer"
    };
    const tableObjectProps = {
        nature: "table-object-properties"
    };
    const qualifiedNamePlaceholder = "[TBD]";
    const defaultScript = {
        name: "project.js.json",
        label: "Show project summary",
        foreignModule: jsModule(`
    export default ({ publication }) => {
        const projectRootPath = publication.config.operationalCtx.projectRootPath;
        return {
            projectHome: projectRootPath("/", true),
            envrc: projectRootPath("/.envrc", true),
        };
    };`),
        foreignCodeIdentity: qualifiedNamePlaceholder,
        presentation: tableObjectProps
    };
    const result = {
        identity,
        script: (identity)=>{
            return scriptsIndex.get(identity);
        },
        scriptIdentities: ()=>scriptsIndex.keys(),
        defaultScript,
        libraries: [
            {
                name: "runtime",
                label: "Server Runtime",
                scripts: [
                    {
                        name: "memory.js.json",
                        label: "Show server runtime (Deno) memory statistics",
                        foreignModule: jsModule(`export default () => Deno.memoryUsage();`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "config",
                label: "Config",
                scripts: [
                    defaultScript,
                    {
                        name: "publication-db.js.json",
                        label: "Show name of SQLite database storing pubctl state",
                        foreignModule: jsModule(`
          export default ({ publicationDB }) => ({
              sqliteFileName: publicationDB ? publicationDB.dbStoreFsPath : "publicationDB not provided"
          });`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "global-sql-db-conns.js.json",
                        label: "Show database connections used to generate content",
                        foreignModule: jsModule(`
            // we convert to JSON ourselves since we have to do some special processing for
            // possible bigints
            export default ({ globalSqlDbConns }) => JSON.stringify(
                globalSqlDbConns,
                (key, value) => {
                    if (typeof value === "bigint") return value.toString();
                    if (value instanceof Map) {
                        return Object.fromEntries(value);
                    }
                    return value;
                },
            );`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: jsonExplorer
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "design-system",
                label: "Design System",
                scripts: [
                    {
                        name: "design-system.js.json",
                        label: "Show summary of design system",
                        foreignModule: jsModule(`export default ({ publication }) => publication.ds.designSystem`),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "layouts.js.json",
                        label: "Show all design system layouts",
                        foreignModule: jsModule(`
            // we're going to give a AGGrid definition for full control
            function layouts(publication) {
                const layouts = Array.from(publication.ds.designSystem.layoutStrategies.layouts.values());
                const rowData = layouts.map(l => ({
                    identity: l.identity,
                    editorRedirectSrc: l.location.moduleImportMetaURL.replace('file://', ''),
                    editorRedirectLabel: l.location.moduleImportMetaURL.replace(/^.*\\/factory\\//, '')
                }));
                return {
                    presentation: {
                      nature: "table-aggrid-defn"
                    },
                    columnDefs: [
                      { field: "identity" },
                      { field: "editorRedirect", cellRenderer: "workspaceEditorRedirectCellRenderer" },
                    ],
                    rowData
                };
            }
            export default ({ publication }) => layouts(publication);`),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "site",
                label: "Site",
                scripts: [
                    {
                        name: "rf-site-build.js.json",
                        label: "Show site's active build and server properties",
                        foreignModule: jsModule(`
            export default ({ publicationDB }) => {
              // always return objects, not strings
              if(!publicationDB) return { warning: "no publicationDB available" };
              const {
                dbStoreFsPath: publicationDbFsPath,
                activeHost: buildHost,
                activeBuildEvent: buildEvent,
                activeServerService: serverService
              } = publicationDB;
              return { publicationDbFsPath, buildHost, buildEvent, serverService };
            }`, jsonDecycleResponse),
                        foreignCodeIdentity: qualifiedNamePlaceholder,
                        presentation: tableObjectProps
                    },
                    {
                        name: "navigation-tree-items.js.json",
                        label: "Show all navigation tree items",
                        foreignModule: jsModule(`export default ({ publication }) => publication.routes.navigationTree.items`, jsonDecycleResponse),
                        presentation: tableObjectProps,
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resource-by-route.js.json",
                        label: "Get resource by args.fileSysPath or args.location",
                        foreignModule: jsModule(`
            export default ({ publication, args }) => {
              let resource = undefined;
              let resources = undefined;
              const routeUnitFileSysPath = args.get("routeUnitFileSysPath");
              if(routeUnitFileSysPath) {
                const filtered = Array.from(publication.state.resourcesIndex.filterSync((r) => r.route?.terminal?.fileSysPath == routeUnitFileSysPath ? true : false));
                if(filtered && filtered.length > 0) {
                  if(filtered.length == 1)
                    resource = filtered[0];
                  else
                    resources = filtered;
                }
              }
              return { routeUnitFileSysPath, resource, resources };
            }`, jsonDecycleResponse, ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resource-by-route.js.di",
                        label: "Get resource by args.fileSysPath or args.location in Deno.inspect format",
                        foreignModule: jsModule(`
            export default ({ publication, args }) => {
              let resource = undefined;
              let resources = undefined;
              const routeUnitFileSysPath = args.get("routeUnitFileSysPath");
              if(routeUnitFileSysPath) {
                const filtered = Array.from(publication.state.resourcesIndex.filterSync((r) => r.route?.terminal?.fileSysPath == routeUnitFileSysPath ? true : false));
                if(filtered && filtered.length > 0) {
                  if(filtered.length == 1)
                    resource = filtered[0];
                  else
                    resources = filtered;
                }
              }
              return { routeUnitFileSysPath, resource, resources };
            }`, denoInspectResponse(), ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "resources-tree-items.js.json",
                        label: "Show all resources in a tree",
                        foreignModule: jsModule(`export default ({ publication }) => publication.routes.resourcesTree.items`, jsonDecycleResponse),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "version-control",
                label: "Version Control (Git)",
                scripts: [
                    {
                        name: "git-log-active-route.js.json",
                        label: "Show revision history of the active route",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.contentGit?.log({ file: args.get("routeUnitFileSysPath") })`, jsonDecycleResponse, ...routeUnitModuleArgs()),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "git-log-site-updates.js.json",
                        label: "Show what's different between local and remote project (site)",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.contentGit?.log({ branch: "HEAD..origin/master" })`),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    },
                    {
                        name: "git-log-rf-updates.js.json",
                        label: "Show what's different between local and remote Resource Factory",
                        foreignModule: jsModule(`export default async ({ publication, args }) => await publication.config.resFactoryGit?.log({ branch: "HEAD..origin/main" })`),
                        foreignCodeIdentity: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            }
        ]
    };
    const indexLibraries = (libraries)=>{
        const indexScript = (script, library)=>{
            if (script.foreignCodeIdentity == qualifiedNamePlaceholder) {
                script.foreignCodeIdentity = `${identity}_${library.name}_${script.name}`;
            }
            scriptsIndex.set(script.foreignCodeIdentity, script);
        };
        for (const library of libraries){
            if (library.qualifiedName == qualifiedNamePlaceholder) {
                library.qualifiedName = library.name;
            }
            for (const script of library.scripts){
                indexScript(script, library);
            }
        }
    };
    indexLibraries(result.libraries);
    return result;
}
typicalScriptsInventory();
export { jsonDecycleResponse as jsonDecycleResponse };
export { denoInspectResponse as denoInspectResponse };
export { jsModule as jsModule };
export { routeUnitModuleArgs as routeUnitModuleArgs };
export { typicalScriptsInventory as typicalScriptsInventory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9zbnNoYWgvd29ya3NwYWNlcy9naXRodWIuY29tL3Jlc0ZhY3RvcnkvZmFjdG9yeS9saWIvdGV4dC93aGl0ZXNwYWNlLnRzIiwiZmlsZTovLy9ob21lL3Nuc2hhaC93b3Jrc3BhY2VzL2dpdGh1Yi5jb20vcmVzRmFjdG9yeS9mYWN0b3J5L2V4ZWN1dGl2ZS9wdWJsL3NlcnZlci9taWRkbGV3YXJlL3dvcmtzcGFjZS9pbnZlbnRvcnkvc2VydmVyLXJ1bnRpbWUtc2NyaXB0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gbWluV2hpdGVzcGFjZUluZGVudCh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gIHJldHVybiBtYXRjaCA/IG1hdGNoLnJlZHVjZSgociwgYSkgPT4gTWF0aC5taW4ociwgYS5sZW5ndGgpLCBJbmZpbml0eSkgOiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pbmRlbnRXaGl0ZXNwYWNlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGluZGVudCA9IG1pbldoaXRlc3BhY2VJbmRlbnQodGV4dCk7XG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXlsgXFxcXHRdeyR7aW5kZW50fX1gLCBcImdtXCIpO1xuICBjb25zdCByZXN1bHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICByZXR1cm4gcmVtb3ZlSW5pdGlhbE5ld0xpbmUgPyByZXN1bHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpIDogcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlTGluZVRyaW0odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSwgXCJcIilcbiAgICAucmVwbGFjZSgvXFxzKyg/PSg/OlteXFwnXCJdKltcXCdcIl1bXlxcJ1wiXSpbXFwnXCJdKSpbXlxcJ1wiXSokKS9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5leHBvcnQgdHlwZSBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHN0cmluZztcblxuLyoqXG4gKiBTdHJpbmcgdGVtcGxhdGUgbGl0ZXJhbCB0YWcgdXRpbGl0eSB0aGF0IHdyYXBzIHRoZSBsaXRlcmFscyBhbmQgd2lsbFxuICogcmV0cmlldmUgbGl0ZXJhbHMgd2l0aCBzZW5zaXRpdml0eSB0byBpbmRlbnRlZCB3aGl0ZXNwYWNlLiBJZlxuICogQHBhcmFtIGxpdGVyYWxzIGxpdGVyYWxzIHN1cHBsaWVkIHRvIHRlbXBsYXRlIGxpdGVyYWwgc3RyaW5nIGZ1bmN0aW9uXG4gKiBAcGFyYW0gc3VwcGxpZWRFeHBycyBleHByZXNzaW9ucyBzdXBwbGllZCB0byB0ZW1wbGF0ZSBsaXRlcmFsIHN0cmluZyBmdW5jdGlvblxuICogQHBhcmFtIG9wdGlvbnMgd2hpdGVzcGFjZSBzZW5zaXRpdml0eSBvcHRpb25zXG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCB3cmFwIHRoZSBsaXRlcmFsIGFuZCByZXR1cm4gdW5pbmRlbnRlZCB0ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZXNwYWNlU2Vuc2l0aXZlVGVtcGxhdGVMaXRlcmFsU3VwcGxpZXIoXG4gIGxpdGVyYWxzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSxcbiAgc3VwcGxpZWRFeHByczogdW5rbm93bltdLFxuICBvcHRpb25zPzoge1xuICAgIHJlYWRvbmx5IHVuaW5kZW50PzogYm9vbGVhbiB8IFJlZ0V4cDtcbiAgICByZWFkb25seSByZW1vdmVJbml0aWFsTmV3TGluZT86IGJvb2xlYW47XG4gIH0sXG4pOiBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyIHtcbiAgY29uc3QgeyB1bmluZGVudCA9IHRydWUsIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgbGV0IGxpdGVyYWxTdXBwbGllciA9IChpbmRleDogbnVtYmVyKSA9PiBsaXRlcmFsc1tpbmRleF07XG4gIGlmICh1bmluZGVudCkge1xuICAgIGlmICh0eXBlb2YgdW5pbmRlbnQgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAvLyB3ZSB3YW50IHRvIGF1dG8tZGV0ZWN0IGFuZCBidWlsZCBvdXIgcmVnRXhwIGZvciB1bmluZGVudGluZyBzbyBsZXQnc1xuICAgICAgLy8gYnVpbGQgYSBzYW1wbGUgb2Ygd2hhdCB0aGUgb3JpZ2luYWwgdGV4dCBtaWdodCBsb29rIGxpa2Ugc28gd2UgY2FuXG4gICAgICAvLyBjb21wdXRlIHRoZSBcIm1pbmltdW1cIiB3aGl0ZXNwYWNlIGluZGVudFxuICAgICAgbGV0IG9yaWdpbmFsVGV4dCA9IFwiXCI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1cHBsaWVkRXhwcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2ldICsgYFxcJHtleHByJHtpfX1gO1xuICAgICAgfVxuICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2xpdGVyYWxzLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgbWF0Y2ggPSBvcmlnaW5hbFRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gICAgICBjb25zdCBtaW5XaGl0ZXNwYWNlSW5kZW50ID0gbWF0Y2hcbiAgICAgICAgPyBtYXRjaC5yZWR1Y2UoKHIsIGEpID0+IE1hdGgubWluKHIsIGEubGVuZ3RoKSwgSW5maW5pdHkpXG4gICAgICAgIDogMDtcbiAgICAgIGlmIChtaW5XaGl0ZXNwYWNlSW5kZW50ID4gMCkge1xuICAgICAgICBjb25zdCB1bmluZGVudFJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgYF5bIFxcXFx0XXske21pbldoaXRlc3BhY2VJbmRlbnR9fWAsXG4gICAgICAgICAgXCJnbVwiLFxuICAgICAgICApO1xuICAgICAgICBsaXRlcmFsU3VwcGxpZXIgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGxldCB0ZXh0ID0gbGl0ZXJhbHNbaW5kZXhdO1xuICAgICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuLywgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnRSZWdFeHAhLCBcIlwiKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGl0ZXJhbFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgbGV0IHRleHQgPSBsaXRlcmFsc1tpbmRleF07XG4gICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnQsIFwiXCIpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpdGVyYWxTdXBwbGllcjtcbn1cbiIsImltcG9ydCAqIGFzIHJtIGZyb20gXCIuLi8uLi8uLi8uLi8uLi8uLi9saWIvbW9kdWxlL3JlbW90ZS9nb3Zlcm5hbmNlLnRzXCI7XG5pbXBvcnQgKiBhcyBnb3ZuIGZyb20gXCIuL2dvdmVybmFuY2UudHNcIjtcbmltcG9ydCAqIGFzIHdocyBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vLi4vbGliL3RleHQvd2hpdGVzcGFjZS50c1wiO1xuXG5leHBvcnQgY29uc3QganNvbkRlY3ljbGVSZXNwb25zZTogcm0uRm9yZWlnbkNvZGVSZXNwb25zZVN1cHBsaWVyID0ge1xuICBmb3JlaWduQ29kZVJlc3BvbnNlU3RyYXRlZ3k6IFwiSlNPTlwiLFxuICBmb3JlaWduQ29kZVJlc3BvbnNlU3RyYXRlZ3lPcHRpb25zOiB7XG4gICAgaXNKc29uUmVzcG9uc2VPcHRpb25zOiB0cnVlLFxuICAgIGRlY3ljbGU6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGVub0luc3BlY3RSZXNwb25zZShcbiAgZGVub0lPOiBEZW5vLkluc3BlY3RPcHRpb25zID0ge1xuICAgIGRlcHRoOiA5LFxuICAgIHNob3dIaWRkZW46IHRydWUsXG4gICAgc29ydGVkOiB0cnVlLFxuICAgIHNob3dQcm94eTogdHJ1ZSxcbiAgfSxcbik6IHJtLkZvcmVpZ25Db2RlUmVzcG9uc2VTdXBwbGllciB7XG4gIHJldHVybiB7XG4gICAgZm9yZWlnbkNvZGVSZXNwb25zZVN0cmF0ZWd5OiBcIkRlbm8uaW5zcGVjdFwiLFxuICAgIGZvcmVpZ25Db2RlUmVzcG9uc2VTdHJhdGVneU9wdGlvbnM6IHtcbiAgICAgIGlzRGVub0luc3BlY3RSZXNwb25zZU9wdGlvbnM6IHRydWUsXG4gICAgICBkZW5vSU8sXG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpzTW9kdWxlKFxuICBjb2RlOiBzdHJpbmcsXG4gIHJzPzogcm0uRm9yZWlnbkNvZGVSZXNwb25zZVN1cHBsaWVyLFxuICAuLi5hcmdzOiBybS5Gb3JlaWduQ29kZUV4cGVjdGVkQXJndW1lbnRbXVxuKTogcm0uRm9yZWlnbkNvZGVTdXBwbGllciB7XG4gIHJldHVybiB7XG4gICAgZm9yZWlnbkNvZGVMYW5ndWFnZTogXCJqc1wiLFxuICAgIGZvcmVpZ25Db2RlOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGNvZGUpLFxuICAgIGZvcmVpZ25Db2RlQXJnc0V4cGVjdGVkOiBhcmdzLmxlbmd0aCA+IDBcbiAgICAgID8gYXJncy5yZWR1Y2UoKGFyZ3MsIGFyZykgPT4ge1xuICAgICAgICBhcmdzW2FyZy5pZGVudGl0eV0gPSBhcmc7XG4gICAgICAgIHJldHVybiBhcmdzO1xuICAgICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgcm0uRm9yZWlnbkNvZGVFeHBlY3RlZEFyZ3VtZW50PilcbiAgICAgIDogdW5kZWZpbmVkLFxuICAgIC4uLnJzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcm91dGVVbml0TW9kdWxlQXJncygpOiBybS5Gb3JlaWduQ29kZUV4cGVjdGVkQXJndW1lbnRbXSB7XG4gIHJldHVybiBbeyBpZGVudGl0eTogXCJyb3V0ZVVuaXRGaWxlU3lzUGF0aFwiLCBkYXRhVHlwZTogXCJzdHJpbmdcIiB9XTtcbn1cblxuLy8gaW52ZW50b3J5IGlzIHVzZWQgYXMtaXMgYnkgdGhlIHNlcnZlci1zaWRlIGJ1dCB1c2VkIGFzIGEgcmVmZXJlbmNlIGJ5IGNsaWVudDtcbi8vIGZvciBzZWN1cml0eSBwdXJwb3NlcywgdGhlIHVzZXIgYWdlbnQgKFwiVUFcIiBvciBcImNsaWVudFwiKSBpcyBhbGxvd2VkIHRvIHNlZVxuLy8gdGhlIHNjcmlwdHMgYnV0IGlmIHRoZSBzY3JpcHQgaXMgcGFzc2VkIGludG8gdGhlIHNlcnZlciwgdGhlIHNlcnZlciBpZ25vcmVzXG4vLyB0aGUgc2NyaXB0IGFuZCB1c2VzIHdoYXQgaXMgaW4gdGhlIGNhdGFsb2cuIEJ5IGxldHRpbmcgY2xpZW50cyBzZWUgdGhlXG5leHBvcnQgZnVuY3Rpb24gdHlwaWNhbFNjcmlwdHNJbnZlbnRvcnkoXG4gIGlkZW50aXR5ID0gXCJ0eXBpY2FsU2NyaXB0c1wiLFxuKTogZ292bi5TZXJ2ZXJSdW50aW1lU2NyaXB0SW52ZW50b3J5IHtcbiAgY29uc3Qgc2NyaXB0c0luZGV4ID0gbmV3IE1hcDxzdHJpbmcsIHJtLlNlcnZlclJ1bnRpbWVTY3JpcHQ+KCk7XG5cbiAgY29uc3QganNvbkV4cGxvcmVyOiBnb3ZuLlNjcmlwdFJlc3VsdFByZXNlbnRhdGlvblN0cmF0ZWd5ID0ge1xuICAgIG5hdHVyZTogXCJKU09OLWV4cGxvcmVyXCIsXG4gIH07XG4gIGNvbnN0IF90YWJsZU1hdHJpeDogZ292bi5TY3JpcHRSZXN1bHRQcmVzZW50YXRpb25TdHJhdGVneSA9IHtcbiAgICBuYXR1cmU6IFwidGFibGUtbWF0cml4XCIsXG4gIH07XG4gIGNvbnN0IF90YWJsZVJlY29yZHM6IGdvdm4uU2NyaXB0UmVzdWx0VGFibGVSZWNvcmRzUHJlc2VudGF0aW9uID0ge1xuICAgIG5hdHVyZTogXCJ0YWJsZS1yZWNvcmRzXCIsXG4gIH07XG4gIGNvbnN0IHRhYmxlT2JqZWN0UHJvcHM6IGdvdm4uU2NyaXB0UmVzdWx0VGFibGVPYmplY3RQcm9wc1ByZXNlbnRhdGlvbiA9IHtcbiAgICBuYXR1cmU6IFwidGFibGUtb2JqZWN0LXByb3BlcnRpZXNcIixcbiAgfTtcblxuICBjb25zdCBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIgPSBcIltUQkRdXCI7XG4gIGNvbnN0IGRlZmF1bHRTY3JpcHQ6IGdvdm4uU2VydmVyUnVudGltZVNjcmlwdCA9IHtcbiAgICBuYW1lOiBcInByb2plY3QuanMuanNvblwiLFxuICAgIGxhYmVsOiBcIlNob3cgcHJvamVjdCBzdW1tYXJ5XCIsXG4gICAgZm9yZWlnbk1vZHVsZToganNNb2R1bGUoYFxuICAgIGV4cG9ydCBkZWZhdWx0ICh7IHB1YmxpY2F0aW9uIH0pID0+IHtcbiAgICAgICAgY29uc3QgcHJvamVjdFJvb3RQYXRoID0gcHVibGljYXRpb24uY29uZmlnLm9wZXJhdGlvbmFsQ3R4LnByb2plY3RSb290UGF0aDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByb2plY3RIb21lOiBwcm9qZWN0Um9vdFBhdGgoXCIvXCIsIHRydWUpLFxuICAgICAgICAgICAgZW52cmM6IHByb2plY3RSb290UGF0aChcIi8uZW52cmNcIiwgdHJ1ZSksXG4gICAgICAgIH07XG4gICAgfTtgKSxcbiAgICBmb3JlaWduQ29kZUlkZW50aXR5OiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgcHJlc2VudGF0aW9uOiB0YWJsZU9iamVjdFByb3BzLFxuICB9O1xuXG4gIGNvbnN0IHJlc3VsdDogZ292bi5TZXJ2ZXJSdW50aW1lU2NyaXB0SW52ZW50b3J5ID0ge1xuICAgIGlkZW50aXR5LFxuICAgIHNjcmlwdDogKGlkZW50aXR5OiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBzY3JpcHRzSW5kZXguZ2V0KGlkZW50aXR5KTtcbiAgICB9LFxuICAgIHNjcmlwdElkZW50aXRpZXM6ICgpID0+IHNjcmlwdHNJbmRleC5rZXlzKCksXG4gICAgZGVmYXVsdFNjcmlwdCxcbiAgICBsaWJyYXJpZXM6IFt7XG4gICAgICBuYW1lOiBcInJ1bnRpbWVcIixcbiAgICAgIGxhYmVsOiBcIlNlcnZlciBSdW50aW1lXCIsXG4gICAgICBzY3JpcHRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIm1lbW9yeS5qcy5qc29uXCIsXG4gICAgICAgICAgbGFiZWw6IFwiU2hvdyBzZXJ2ZXIgcnVudGltZSAoRGVubykgbWVtb3J5IHN0YXRpc3RpY3NcIixcbiAgICAgICAgICBmb3JlaWduTW9kdWxlOiBqc01vZHVsZShgZXhwb3J0IGRlZmF1bHQgKCkgPT4gRGVuby5tZW1vcnlVc2FnZSgpO2ApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6IFwiY29uZmlnXCIsXG4gICAgICBsYWJlbDogXCJDb25maWdcIixcbiAgICAgIHNjcmlwdHM6IFtcbiAgICAgICAgZGVmYXVsdFNjcmlwdCxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwicHVibGljYXRpb24tZGIuanMuanNvblwiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgbmFtZSBvZiBTUUxpdGUgZGF0YWJhc2Ugc3RvcmluZyBwdWJjdGwgc3RhdGVcIixcbiAgICAgICAgICBmb3JlaWduTW9kdWxlOiBqc01vZHVsZShgXG4gICAgICAgICAgZXhwb3J0IGRlZmF1bHQgKHsgcHVibGljYXRpb25EQiB9KSA9PiAoe1xuICAgICAgICAgICAgICBzcWxpdGVGaWxlTmFtZTogcHVibGljYXRpb25EQiA/IHB1YmxpY2F0aW9uREIuZGJTdG9yZUZzUGF0aCA6IFwicHVibGljYXRpb25EQiBub3QgcHJvdmlkZWRcIlxuICAgICAgICAgIH0pO2ApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcImdsb2JhbC1zcWwtZGItY29ubnMuanMuanNvblwiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgZGF0YWJhc2UgY29ubmVjdGlvbnMgdXNlZCB0byBnZW5lcmF0ZSBjb250ZW50XCIsXG4gICAgICAgICAgZm9yZWlnbk1vZHVsZToganNNb2R1bGUoYFxuICAgICAgICAgICAgLy8gd2UgY29udmVydCB0byBKU09OIG91cnNlbHZlcyBzaW5jZSB3ZSBoYXZlIHRvIGRvIHNvbWUgc3BlY2lhbCBwcm9jZXNzaW5nIGZvclxuICAgICAgICAgICAgLy8gcG9zc2libGUgYmlnaW50c1xuICAgICAgICAgICAgZXhwb3J0IGRlZmF1bHQgKHsgZ2xvYmFsU3FsRGJDb25ucyB9KSA9PiBKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICBnbG9iYWxTcWxEYkNvbm5zLFxuICAgICAgICAgICAgICAgIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiYmlnaW50XCIpIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtgKSxcbiAgICAgICAgICBmb3JlaWduQ29kZUlkZW50aXR5OiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgICAgcHJlc2VudGF0aW9uOiBqc29uRXhwbG9yZXIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6IFwiZGVzaWduLXN5c3RlbVwiLFxuICAgICAgbGFiZWw6IFwiRGVzaWduIFN5c3RlbVwiLFxuICAgICAgc2NyaXB0czogW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogXCJkZXNpZ24tc3lzdGVtLmpzLmpzb25cIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IHN1bW1hcnkgb2YgZGVzaWduIHN5c3RlbVwiLFxuICAgICAgICAgIGZvcmVpZ25Nb2R1bGU6IGpzTW9kdWxlKFxuICAgICAgICAgICAgYGV4cG9ydCBkZWZhdWx0ICh7IHB1YmxpY2F0aW9uIH0pID0+IHB1YmxpY2F0aW9uLmRzLmRlc2lnblN5c3RlbWAsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBmb3JlaWduQ29kZUlkZW50aXR5OiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgICAgcHJlc2VudGF0aW9uOiB0YWJsZU9iamVjdFByb3BzLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogXCJsYXlvdXRzLmpzLmpzb25cIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IGFsbCBkZXNpZ24gc3lzdGVtIGxheW91dHNcIixcbiAgICAgICAgICBmb3JlaWduTW9kdWxlOiBqc01vZHVsZShgXG4gICAgICAgICAgICAvLyB3ZSdyZSBnb2luZyB0byBnaXZlIGEgQUdHcmlkIGRlZmluaXRpb24gZm9yIGZ1bGwgY29udHJvbFxuICAgICAgICAgICAgZnVuY3Rpb24gbGF5b3V0cyhwdWJsaWNhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxheW91dHMgPSBBcnJheS5mcm9tKHB1YmxpY2F0aW9uLmRzLmRlc2lnblN5c3RlbS5sYXlvdXRTdHJhdGVnaWVzLmxheW91dHMudmFsdWVzKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvd0RhdGEgPSBsYXlvdXRzLm1hcChsID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGlkZW50aXR5OiBsLmlkZW50aXR5LFxuICAgICAgICAgICAgICAgICAgICBlZGl0b3JSZWRpcmVjdFNyYzogbC5sb2NhdGlvbi5tb2R1bGVJbXBvcnRNZXRhVVJMLnJlcGxhY2UoJ2ZpbGU6Ly8nLCAnJyksXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvclJlZGlyZWN0TGFiZWw6IGwubG9jYXRpb24ubW9kdWxlSW1wb3J0TWV0YVVSTC5yZXBsYWNlKC9eLipcXFxcL2ZhY3RvcnlcXFxcLy8sICcnKVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBwcmVzZW50YXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICBuYXR1cmU6IFwidGFibGUtYWdncmlkLWRlZm5cIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjb2x1bW5EZWZzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogXCJpZGVudGl0eVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogXCJlZGl0b3JSZWRpcmVjdFwiLCBjZWxsUmVuZGVyZXI6IFwid29ya3NwYWNlRWRpdG9yUmVkaXJlY3RDZWxsUmVuZGVyZXJcIiB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICByb3dEYXRhXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9ydCBkZWZhdWx0ICh7IHB1YmxpY2F0aW9uIH0pID0+IGxheW91dHMocHVibGljYXRpb24pO2ApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgfSwge1xuICAgICAgbmFtZTogXCJzaXRlXCIsXG4gICAgICBsYWJlbDogXCJTaXRlXCIsXG4gICAgICBzY3JpcHRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcInJmLXNpdGUtYnVpbGQuanMuanNvblwiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgc2l0ZSdzIGFjdGl2ZSBidWlsZCBhbmQgc2VydmVyIHByb3BlcnRpZXNcIixcbiAgICAgICAgICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgICAgICAgICBmb3JlaWduTW9kdWxlOiBqc01vZHVsZShgXG4gICAgICAgICAgICBleHBvcnQgZGVmYXVsdCAoeyBwdWJsaWNhdGlvbkRCIH0pID0+IHtcbiAgICAgICAgICAgICAgLy8gYWx3YXlzIHJldHVybiBvYmplY3RzLCBub3Qgc3RyaW5nc1xuICAgICAgICAgICAgICBpZighcHVibGljYXRpb25EQikgcmV0dXJuIHsgd2FybmluZzogXCJubyBwdWJsaWNhdGlvbkRCIGF2YWlsYWJsZVwiIH07XG4gICAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgICBkYlN0b3JlRnNQYXRoOiBwdWJsaWNhdGlvbkRiRnNQYXRoLFxuICAgICAgICAgICAgICAgIGFjdGl2ZUhvc3Q6IGJ1aWxkSG9zdCxcbiAgICAgICAgICAgICAgICBhY3RpdmVCdWlsZEV2ZW50OiBidWlsZEV2ZW50LFxuICAgICAgICAgICAgICAgIGFjdGl2ZVNlcnZlclNlcnZpY2U6IHNlcnZlclNlcnZpY2VcbiAgICAgICAgICAgICAgfSA9IHB1YmxpY2F0aW9uREI7XG4gICAgICAgICAgICAgIHJldHVybiB7IHB1YmxpY2F0aW9uRGJGc1BhdGgsIGJ1aWxkSG9zdCwgYnVpbGRFdmVudCwgc2VydmVyU2VydmljZSB9O1xuICAgICAgICAgICAgfWAsIGpzb25EZWN5Y2xlUmVzcG9uc2UpLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcIm5hdmlnYXRpb24tdHJlZS1pdGVtcy5qcy5qc29uXCIsXG4gICAgICAgICAgbGFiZWw6IFwiU2hvdyBhbGwgbmF2aWdhdGlvbiB0cmVlIGl0ZW1zXCIsXG4gICAgICAgICAgZm9yZWlnbk1vZHVsZToganNNb2R1bGUoXG4gICAgICAgICAgICBgZXhwb3J0IGRlZmF1bHQgKHsgcHVibGljYXRpb24gfSkgPT4gcHVibGljYXRpb24ucm91dGVzLm5hdmlnYXRpb25UcmVlLml0ZW1zYCxcbiAgICAgICAgICAgIGpzb25EZWN5Y2xlUmVzcG9uc2UsXG4gICAgICAgICAgKSxcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgICAgZm9yZWlnbkNvZGVJZGVudGl0eTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogXCJyZXNvdXJjZS1ieS1yb3V0ZS5qcy5qc29uXCIsXG4gICAgICAgICAgbGFiZWw6IFwiR2V0IHJlc291cmNlIGJ5IGFyZ3MuZmlsZVN5c1BhdGggb3IgYXJncy5sb2NhdGlvblwiLFxuICAgICAgICAgIC8vIGRlbm8tZm10LWlnbm9yZVxuICAgICAgICAgIGZvcmVpZ25Nb2R1bGU6IGpzTW9kdWxlKGBcbiAgICAgICAgICAgIGV4cG9ydCBkZWZhdWx0ICh7IHB1YmxpY2F0aW9uLCBhcmdzIH0pID0+IHtcbiAgICAgICAgICAgICAgbGV0IHJlc291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBsZXQgcmVzb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBjb25zdCByb3V0ZVVuaXRGaWxlU3lzUGF0aCA9IGFyZ3MuZ2V0KFwicm91dGVVbml0RmlsZVN5c1BhdGhcIik7XG4gICAgICAgICAgICAgIGlmKHJvdXRlVW5pdEZpbGVTeXNQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWQgPSBBcnJheS5mcm9tKHB1YmxpY2F0aW9uLnN0YXRlLnJlc291cmNlc0luZGV4LmZpbHRlclN5bmMoKHIpID0+IHIucm91dGU/LnRlcm1pbmFsPy5maWxlU3lzUGF0aCA9PSByb3V0ZVVuaXRGaWxlU3lzUGF0aCA/IHRydWUgOiBmYWxzZSkpO1xuICAgICAgICAgICAgICAgIGlmKGZpbHRlcmVkICYmIGZpbHRlcmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGlmKGZpbHRlcmVkLmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZSA9IGZpbHRlcmVkWzBdO1xuICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMgPSBmaWx0ZXJlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHsgcm91dGVVbml0RmlsZVN5c1BhdGgsIHJlc291cmNlLCByZXNvdXJjZXMgfTtcbiAgICAgICAgICAgIH1gLGpzb25EZWN5Y2xlUmVzcG9uc2UsXG4gICAgICAgICAgICAuLi5yb3V0ZVVuaXRNb2R1bGVBcmdzKCksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBmb3JlaWduQ29kZUlkZW50aXR5OiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcInJlc291cmNlLWJ5LXJvdXRlLmpzLmRpXCIsXG4gICAgICAgICAgbGFiZWw6XG4gICAgICAgICAgICBcIkdldCByZXNvdXJjZSBieSBhcmdzLmZpbGVTeXNQYXRoIG9yIGFyZ3MubG9jYXRpb24gaW4gRGVuby5pbnNwZWN0IGZvcm1hdFwiLFxuICAgICAgICAgIC8vIGRlbm8tZm10LWlnbm9yZVxuICAgICAgICAgIGZvcmVpZ25Nb2R1bGU6IGpzTW9kdWxlKGBcbiAgICAgICAgICAgIGV4cG9ydCBkZWZhdWx0ICh7IHB1YmxpY2F0aW9uLCBhcmdzIH0pID0+IHtcbiAgICAgICAgICAgICAgbGV0IHJlc291cmNlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBsZXQgcmVzb3VyY2VzID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICBjb25zdCByb3V0ZVVuaXRGaWxlU3lzUGF0aCA9IGFyZ3MuZ2V0KFwicm91dGVVbml0RmlsZVN5c1BhdGhcIik7XG4gICAgICAgICAgICAgIGlmKHJvdXRlVW5pdEZpbGVTeXNQYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyZWQgPSBBcnJheS5mcm9tKHB1YmxpY2F0aW9uLnN0YXRlLnJlc291cmNlc0luZGV4LmZpbHRlclN5bmMoKHIpID0+IHIucm91dGU/LnRlcm1pbmFsPy5maWxlU3lzUGF0aCA9PSByb3V0ZVVuaXRGaWxlU3lzUGF0aCA/IHRydWUgOiBmYWxzZSkpO1xuICAgICAgICAgICAgICAgIGlmKGZpbHRlcmVkICYmIGZpbHRlcmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIGlmKGZpbHRlcmVkLmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZSA9IGZpbHRlcmVkWzBdO1xuICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXMgPSBmaWx0ZXJlZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHsgcm91dGVVbml0RmlsZVN5c1BhdGgsIHJlc291cmNlLCByZXNvdXJjZXMgfTtcbiAgICAgICAgICAgIH1gLGRlbm9JbnNwZWN0UmVzcG9uc2UoKSxcbiAgICAgICAgICAgIC4uLnJvdXRlVW5pdE1vZHVsZUFyZ3MoKSxcbiAgICAgICAgICApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwicmVzb3VyY2VzLXRyZWUtaXRlbXMuanMuanNvblwiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgYWxsIHJlc291cmNlcyBpbiBhIHRyZWVcIixcbiAgICAgICAgICBmb3JlaWduTW9kdWxlOiBqc01vZHVsZShcbiAgICAgICAgICAgIGBleHBvcnQgZGVmYXVsdCAoeyBwdWJsaWNhdGlvbiB9KSA9PiBwdWJsaWNhdGlvbi5yb3V0ZXMucmVzb3VyY2VzVHJlZS5pdGVtc2AsXG4gICAgICAgICAgICBqc29uRGVjeWNsZVJlc3BvbnNlLFxuICAgICAgICAgICksXG4gICAgICAgICAgZm9yZWlnbkNvZGVJZGVudGl0eTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICB9LCB7XG4gICAgICBuYW1lOiBcInZlcnNpb24tY29udHJvbFwiLFxuICAgICAgbGFiZWw6IFwiVmVyc2lvbiBDb250cm9sIChHaXQpXCIsXG4gICAgICBzY3JpcHRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcImdpdC1sb2ctYWN0aXZlLXJvdXRlLmpzLmpzb25cIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IHJldmlzaW9uIGhpc3Rvcnkgb2YgdGhlIGFjdGl2ZSByb3V0ZVwiLFxuICAgICAgICAgIGZvcmVpZ25Nb2R1bGU6IGpzTW9kdWxlKFxuICAgICAgICAgICAgYGV4cG9ydCBkZWZhdWx0IGFzeW5jICh7IHB1YmxpY2F0aW9uLCBhcmdzIH0pID0+IGF3YWl0IHB1YmxpY2F0aW9uLmNvbmZpZy5jb250ZW50R2l0Py5sb2coeyBmaWxlOiBhcmdzLmdldChcInJvdXRlVW5pdEZpbGVTeXNQYXRoXCIpIH0pYCxcbiAgICAgICAgICAgIGpzb25EZWN5Y2xlUmVzcG9uc2UsXG4gICAgICAgICAgICAuLi5yb3V0ZVVuaXRNb2R1bGVBcmdzKCksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBmb3JlaWduQ29kZUlkZW50aXR5OiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcImdpdC1sb2ctc2l0ZS11cGRhdGVzLmpzLmpzb25cIixcbiAgICAgICAgICBsYWJlbDpcbiAgICAgICAgICAgIFwiU2hvdyB3aGF0J3MgZGlmZmVyZW50IGJldHdlZW4gbG9jYWwgYW5kIHJlbW90ZSBwcm9qZWN0IChzaXRlKVwiLFxuICAgICAgICAgIGZvcmVpZ25Nb2R1bGU6IGpzTW9kdWxlKFxuICAgICAgICAgICAgYGV4cG9ydCBkZWZhdWx0IGFzeW5jICh7IHB1YmxpY2F0aW9uLCBhcmdzIH0pID0+IGF3YWl0IHB1YmxpY2F0aW9uLmNvbmZpZy5jb250ZW50R2l0Py5sb2coeyBicmFuY2g6IFwiSEVBRC4ub3JpZ2luL21hc3RlclwiIH0pYCxcbiAgICAgICAgICApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFwiZ2l0LWxvZy1yZi11cGRhdGVzLmpzLmpzb25cIixcbiAgICAgICAgICBsYWJlbDpcbiAgICAgICAgICAgIFwiU2hvdyB3aGF0J3MgZGlmZmVyZW50IGJldHdlZW4gbG9jYWwgYW5kIHJlbW90ZSBSZXNvdXJjZSBGYWN0b3J5XCIsXG4gICAgICAgICAgZm9yZWlnbk1vZHVsZToganNNb2R1bGUoXG4gICAgICAgICAgICBgZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHsgcHVibGljYXRpb24sIGFyZ3MgfSkgPT4gYXdhaXQgcHVibGljYXRpb24uY29uZmlnLnJlc0ZhY3RvcnlHaXQ/LmxvZyh7IGJyYW5jaDogXCJIRUFELi5vcmlnaW4vbWFpblwiIH0pYCxcbiAgICAgICAgICApLFxuICAgICAgICAgIGZvcmVpZ25Db2RlSWRlbnRpdHk6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgfV0sXG4gIH07XG5cbiAgY29uc3QgaW5kZXhMaWJyYXJpZXMgPSAoXG4gICAgbGlicmFyaWVzOiBJdGVyYWJsZTxybS5TZXJ2ZXJSdW50aW1lU2NyaXB0TGlicmFyeT4sXG4gICkgPT4ge1xuICAgIGNvbnN0IGluZGV4U2NyaXB0ID0gKFxuICAgICAgc2NyaXB0OiBybS5TZXJ2ZXJSdW50aW1lU2NyaXB0LFxuICAgICAgbGlicmFyeTogcm0uU2VydmVyUnVudGltZVNjcmlwdExpYnJhcnksXG4gICAgKSA9PiB7XG4gICAgICBpZiAoc2NyaXB0LmZvcmVpZ25Db2RlSWRlbnRpdHkgPT0gcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyKSB7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzdCByZXF1aXJlZCBzaW5jZSBzY3JpcHQuZm9yZWlnbkNvZGVJZGVudGl0eSBpcyByZWFkLW9ubHlcbiAgICAgICAgKHNjcmlwdCBhcyB7IGZvcmVpZ25Db2RlSWRlbnRpdHk6IHN0cmluZyB9KS5mb3JlaWduQ29kZUlkZW50aXR5ID1cbiAgICAgICAgICBgJHtpZGVudGl0eX1fJHtsaWJyYXJ5Lm5hbWV9XyR7c2NyaXB0Lm5hbWV9YDtcbiAgICAgIH1cbiAgICAgIHNjcmlwdHNJbmRleC5zZXQoc2NyaXB0LmZvcmVpZ25Db2RlSWRlbnRpdHksIHNjcmlwdCk7XG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgbGlicmFyeSBvZiBsaWJyYXJpZXMpIHtcbiAgICAgIGlmIChsaWJyYXJ5LnF1YWxpZmllZE5hbWUgPT0gcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyKSB7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzdCByZXF1aXJlZCBzaW5jZSBsaWJyYXJ5LnF1YWxpZmllZE5hbWUgaXMgcmVhZC1vbmx5XG4gICAgICAgIChsaWJyYXJ5IGFzIHsgcXVhbGlmaWVkTmFtZTogc3RyaW5nIH0pLnF1YWxpZmllZE5hbWUgPSBsaWJyYXJ5Lm5hbWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBsaWJyYXJ5LnNjcmlwdHMpIHtcbiAgICAgICAgaW5kZXhTY3JpcHQoc2NyaXB0LCBsaWJyYXJ5KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgaW5kZXhMaWJyYXJpZXMocmVzdWx0LmxpYnJhcmllcyk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgdHlwaWNhbFNjcmlwdHNJbnZlbnRvcnkoKTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBTyxTQUFTLG1CQUFtQixDQUFDLElBQVksRUFBVTtJQUN4RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxtQkFBbUIsQUFBQztJQUM1QyxPQUFPLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzVFO0FBRU0sU0FBUyxrQkFBa0IsQ0FDaEMsSUFBWSxFQUNaLG9CQUFvQixHQUFHLElBQUksRUFDbkI7SUFDUixNQUFNLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQUFBQztJQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEFBQUM7SUFDckQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEFBQUM7SUFDdkMsT0FBTyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsT0FBTyxRQUFRLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQztDQUNsRTtBQ1RNLE1BQU0sbUJBQW1CLEdBQW1DO0lBQ2pFLDJCQUEyQixFQUFFLE1BQU07SUFDbkMsa0NBQWtDLEVBQUU7UUFDbEMscUJBQXFCLEVBQUUsSUFBSTtRQUMzQixPQUFPLEVBQUUsSUFBSTtLQUNkO0NBQ0YsQUFBQztBQUVLLFNBQVMsbUJBQW1CLENBQ2pDLE1BQTJCLEdBQUc7SUFDNUIsS0FBSyxFQUFFLENBQUM7SUFDUixVQUFVLEVBQUUsSUFBSTtJQUNoQixNQUFNLEVBQUUsSUFBSTtJQUNaLFNBQVMsRUFBRSxJQUFJO0NBQ2hCLEVBQytCO0lBQ2hDLE9BQU87UUFDTCwyQkFBMkIsRUFBRSxjQUFjO1FBQzNDLGtDQUFrQyxFQUFFO1lBQ2xDLDRCQUE0QixFQUFFLElBQUk7WUFDbEMsTUFBTTtTQUNQO0tBQ0YsQ0FBQztDQUNIO0FBRU0sU0FBUyxRQUFRLENBQ3RCLElBQVksRUFDWixFQUFtQyxFQUNuQyxHQUFHLElBQUksQUFBa0MsRUFDakI7SUFDeEIsT0FBTztRQUNMLG1CQUFtQixFQUFFLElBQUk7UUFDekIsV0FBVyxFQUFFLG1CQUF1QixJQUFJLENBQUM7UUFDekMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxHQUFLO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDO1NBQ2IsRUFBRSxFQUFFLENBQW1ELEdBQ3RELFNBQVM7UUFDYixHQUFHLEVBQUU7S0FDTixDQUFDO0NBQ0g7QUFFTSxTQUFTLG1CQUFtQixHQUFxQztJQUN0RSxPQUFPO1FBQUM7WUFBRSxRQUFRLEVBQUUsc0JBQXNCO1lBQUUsUUFBUSxFQUFFLFFBQVE7U0FBRTtLQUFDLENBQUM7Q0FDbkU7QUFNTSxTQUFTLHVCQUF1QixDQUNyQyxRQUFRLEdBQUcsZ0JBQWdCLEVBQ1E7SUFDbkMsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQWtDLEFBQUM7SUFFL0QsTUFBTSxZQUFZLEdBQTBDO1FBQzFELE1BQU0sRUFBRSxlQUFlO0tBQ3hCLEFBQUM7SUFPRixNQUFNLGdCQUFnQixHQUFrRDtRQUN0RSxNQUFNLEVBQUUseUJBQXlCO0tBQ2xDLEFBQUM7SUFFRixNQUFNLHdCQUF3QixHQUFHLE9BQU8sQUFBQztJQUN6QyxNQUFNLGFBQWEsR0FBNkI7UUFDOUMsSUFBSSxFQUFFLGlCQUFpQjtRQUN2QixLQUFLLEVBQUUsc0JBQXNCO1FBQzdCLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQzs7Ozs7OztNQU92QixDQUFDLENBQUM7UUFDSixtQkFBbUIsRUFBRSx3QkFBd0I7UUFDN0MsWUFBWSxFQUFFLGdCQUFnQjtLQUMvQixBQUFDO0lBRUYsTUFBTSxNQUFNLEdBQXNDO1FBQ2hELFFBQVE7UUFDUixNQUFNLEVBQUUsQ0FBQyxRQUFnQixHQUFLO1lBQzVCLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNuQztRQUNELGdCQUFnQixFQUFFLElBQU0sWUFBWSxDQUFDLElBQUksRUFBRTtRQUMzQyxhQUFhO1FBQ2IsU0FBUyxFQUFFO1lBQUM7Z0JBQ1YsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxnQkFBZ0I7d0JBQ3RCLEtBQUssRUFBRSw4Q0FBOEM7d0JBQ3JELGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO3dCQUNuRSxtQkFBbUIsRUFBRSx3QkFBd0I7d0JBQzdDLFlBQVksRUFBRSxnQkFBZ0I7cUJBQy9CO2lCQUNGO2dCQUNELGFBQWEsRUFBRSx3QkFBd0I7YUFDeEM7WUFBRTtnQkFDRCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsUUFBUTtnQkFDZixPQUFPLEVBQUU7b0JBQ1AsYUFBYTtvQkFDYjt3QkFDRSxJQUFJLEVBQUUsd0JBQXdCO3dCQUM5QixLQUFLLEVBQUUsbURBQW1EO3dCQUMxRCxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7OzthQUd0QixDQUFDLENBQUM7d0JBQ0wsbUJBQW1CLEVBQUUsd0JBQXdCO3dCQUM3QyxZQUFZLEVBQUUsZ0JBQWdCO3FCQUMvQjtvQkFDRDt3QkFDRSxJQUFJLEVBQUUsNkJBQTZCO3dCQUNuQyxLQUFLLEVBQUUsb0RBQW9EO3dCQUMzRCxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7Ozs7Ozs7OztjQVlyQixDQUFDLENBQUM7d0JBQ04sbUJBQW1CLEVBQUUsd0JBQXdCO3dCQUM3QyxZQUFZLEVBQUUsWUFBWTtxQkFDM0I7aUJBQ0Y7Z0JBQ0QsYUFBYSxFQUFFLHdCQUF3QjthQUN4QztZQUFFO2dCQUNELElBQUksRUFBRSxlQUFlO2dCQUNyQixLQUFLLEVBQUUsZUFBZTtnQkFDdEIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSx1QkFBdUI7d0JBQzdCLEtBQUssRUFBRSwrQkFBK0I7d0JBQ3RDLGFBQWEsRUFBRSxRQUFRLENBQ3JCLENBQUMsK0RBQStELENBQUMsQ0FDbEU7d0JBQ0QsbUJBQW1CLEVBQUUsd0JBQXdCO3dCQUM3QyxZQUFZLEVBQUUsZ0JBQWdCO3FCQUMvQjtvQkFDRDt3QkFDRSxJQUFJLEVBQUUsaUJBQWlCO3dCQUN2QixLQUFLLEVBQUUsZ0NBQWdDO3dCQUN2QyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FFQW9Ca0MsQ0FBQyxDQUFDO3dCQUM3RCxtQkFBbUIsRUFBRSx3QkFBd0I7cUJBQzlDO2lCQUNGO2dCQUNELGFBQWEsRUFBRSx3QkFBd0I7YUFDeEM7WUFBRTtnQkFDRCxJQUFJLEVBQUUsTUFBTTtnQkFDWixLQUFLLEVBQUUsTUFBTTtnQkFDYixPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsSUFBSSxFQUFFLHVCQUF1Qjt3QkFDN0IsS0FBSyxFQUFFLGdEQUFnRDt3QkFFdkQsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDOzs7Ozs7Ozs7OzthQVd0QixDQUFDLEVBQUUsbUJBQW1CLENBQUM7d0JBQzFCLG1CQUFtQixFQUFFLHdCQUF3Qjt3QkFDN0MsWUFBWSxFQUFFLGdCQUFnQjtxQkFDL0I7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLCtCQUErQjt3QkFDckMsS0FBSyxFQUFFLGdDQUFnQzt3QkFDdkMsYUFBYSxFQUFFLFFBQVEsQ0FDckIsQ0FBQywyRUFBMkUsQ0FBQyxFQUM3RSxtQkFBbUIsQ0FDcEI7d0JBQ0QsWUFBWSxFQUFFLGdCQUFnQjt3QkFDOUIsbUJBQW1CLEVBQUUsd0JBQXdCO3FCQUM5QztvQkFDRDt3QkFDRSxJQUFJLEVBQUUsMkJBQTJCO3dCQUNqQyxLQUFLLEVBQUUsbURBQW1EO3dCQUUxRCxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7OzthQWV0QixDQUFDLEVBQUMsbUJBQW1CLEtBQ25CLG1CQUFtQixFQUFFLENBQ3pCO3dCQUNELG1CQUFtQixFQUFFLHdCQUF3QjtxQkFDOUM7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLHlCQUF5Qjt3QkFDL0IsS0FBSyxFQUNILDBFQUEwRTt3QkFFNUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7YUFldEIsQ0FBQyxFQUFDLG1CQUFtQixFQUFFLEtBQ3JCLG1CQUFtQixFQUFFLENBQ3pCO3dCQUNELG1CQUFtQixFQUFFLHdCQUF3QjtxQkFDOUM7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLDhCQUE4Qjt3QkFDcEMsS0FBSyxFQUFFLDhCQUE4Qjt3QkFDckMsYUFBYSxFQUFFLFFBQVEsQ0FDckIsQ0FBQywwRUFBMEUsQ0FBQyxFQUM1RSxtQkFBbUIsQ0FDcEI7d0JBQ0QsbUJBQW1CLEVBQUUsd0JBQXdCO3FCQUM5QztpQkFDRjtnQkFDRCxhQUFhLEVBQUUsd0JBQXdCO2FBQ3hDO1lBQUU7Z0JBQ0QsSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsS0FBSyxFQUFFLHVCQUF1QjtnQkFDOUIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSw4QkFBOEI7d0JBQ3BDLEtBQUssRUFBRSwyQ0FBMkM7d0JBQ2xELGFBQWEsRUFBRSxRQUFRLENBQ3JCLENBQUMsb0lBQW9JLENBQUMsRUFDdEksbUJBQW1CLEtBQ2hCLG1CQUFtQixFQUFFLENBQ3pCO3dCQUNELG1CQUFtQixFQUFFLHdCQUF3QjtxQkFDOUM7b0JBQ0Q7d0JBQ0UsSUFBSSxFQUFFLDhCQUE4Qjt3QkFDcEMsS0FBSyxFQUNILCtEQUErRDt3QkFDakUsYUFBYSxFQUFFLFFBQVEsQ0FDckIsQ0FBQywySEFBMkgsQ0FBQyxDQUM5SDt3QkFDRCxtQkFBbUIsRUFBRSx3QkFBd0I7cUJBQzlDO29CQUNEO3dCQUNFLElBQUksRUFBRSw0QkFBNEI7d0JBQ2xDLEtBQUssRUFDSCxpRUFBaUU7d0JBQ25FLGFBQWEsRUFBRSxRQUFRLENBQ3JCLENBQUMsNEhBQTRILENBQUMsQ0FDL0g7d0JBQ0QsbUJBQW1CLEVBQUUsd0JBQXdCO3FCQUM5QztpQkFDRjtnQkFDRCxhQUFhLEVBQUUsd0JBQXdCO2FBQ3hDO1NBQUM7S0FDSCxBQUFDO0lBRUYsTUFBTSxjQUFjLEdBQUcsQ0FDckIsU0FBa0QsR0FDL0M7UUFDSCxNQUFNLFdBQVcsR0FBRyxDQUNsQixNQUE4QixFQUM5QixPQUFzQyxHQUNuQztZQUNILElBQUksTUFBTSxDQUFDLG1CQUFtQixJQUFJLHdCQUF3QixFQUFFO2dCQUUxRCxBQUFDLE1BQU0sQ0FBcUMsbUJBQW1CLEdBQzdELENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ2hEO1lBQ0QsWUFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDdEQsQUFBQztRQUVGLEtBQUssTUFBTSxPQUFPLElBQUksU0FBUyxDQUFFO1lBQy9CLElBQUksT0FBTyxDQUFDLGFBQWEsSUFBSSx3QkFBd0IsRUFBRTtnQkFFckQsQUFBQyxPQUFPLENBQStCLGFBQWEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO2FBQ3JFO1lBQ0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFFO2dCQUNwQyxXQUFXLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzlCO1NBQ0Y7S0FDRixBQUFDO0lBRUYsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVqQyxPQUFPLE1BQU0sQ0FBQztDQUNmO0FBRWMsdUJBQXVCLEVBQUUsQ0FBQTtBQXZWeEMsU0FBYSxtQkFBbUIsSUFBbkIsbUJBQW1CLEdBTTlCO0FBRUYsU0FBZ0IsbUJBQW1CLElBQW5CLG1CQUFtQixHQWVsQztBQUVELFNBQWdCLFFBQVEsSUFBUixRQUFRLEdBZ0J2QjtBQUVELFNBQWdCLG1CQUFtQixJQUFuQixtQkFBbUIsR0FFbEM7QUFNRCxTQUFnQix1QkFBdUIsSUFBdkIsdUJBQXVCLEdBa1N0QyJ9

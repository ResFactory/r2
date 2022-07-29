import * as c from "../content/mod.ts";
import * as coll from "../collection/mod.ts";
import * as fm from "../frontmatter/mod.ts";
import * as r from "../route/mod.ts";
import * as extn from "../../../lib/module/mod.ts";

export interface FileSysResourceHtmlModuleConstructor {
  (
    we: { path: string },
    options: r.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<
    & c.ModuleResource
    & c.HtmlResource
    & Partial<fm.FrontmatterSupplier<fm.UntypedFrontmatter>>
  >;
}

export interface FileSysResourceHtmlModulesConstructor {
  (
    we: { path: string },
    options: r.FileSysRouteOptions,
    imported: extn.ExtensionModule,
  ): Promise<
    & c.ModuleResource
    & coll.ChildResourcesFactoriesSupplier<c.HtmlResource>
  >;
}

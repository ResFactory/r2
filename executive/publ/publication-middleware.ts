import { oak } from "./deps.ts";
import * as p from "./publication.ts";
import * as rJSON from "../../core/content/routes.json.ts";
import * as pDB from "./publication-db.ts";
import "../../lib/db/sql.ts"; // for window.globalSqlDbConns

export class PublicationMiddlewareSupplier {
  constructor(
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly publication: p.Publication<p.PublicationOperationalContext>,
    readonly serverStateDB: pDB.Database | undefined,
    readonly htmlEndpointURL: string,
  ) {
    router.get(`${this.htmlEndpointURL}/inspect/project.json`, (ctx) => {
      const projectRootPath = publication.config.operationalCtx.projectRootPath;
      ctx.response.body = JSON.stringify({
        "Project Home": {
          nature: "path-project",
          path: projectRootPath("/", true),
        },
        "Environment": {
          nature: "file-project",
          file: projectRootPath("/.envrc", true),
          isEditable: true,
        },
        "Design System": {
          nature: "design-system",
          designSystem: this.publication.ds.designSystem,
          isEditable: true,
        },
      });
    });

    router.get(`${this.htmlEndpointURL}/inspect/renderers.json`, (ctx) => {
      const renderers = [];
      for (
        const layout of publication.ds.designSystem.layoutStrategies.layouts
          .values()
      ) {
        renderers.push(layout);
      }
      ctx.response.body = JSON.stringify(renderers);
    });

    router.get(`${this.htmlEndpointURL}/inspect/routes.json`, (ctx) => {
      ctx.response.body = JSON.stringify(
        this.publication.state.resourcesTree,
        rJSON.routeTreeJsonReplacer,
      );
    });

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/content.json`,
      (ctx) => {
        const dbAccesses = window.globalSqlDbConns
          ? Array.from(window.globalSqlDbConns.entries())
          : [];

        ctx.response.body = JSON.stringify(
          dbAccesses,
          (_key, value) => typeof value === "bigint" ? value.toString() : value, // return everything else unchanged
        );
      },
    );

    router.get(
      `${this.htmlEndpointURL}/inspect/databases/server.json`,
      (ctx) => {
        ctx.response.body = JSON.stringify({
          sqliteFileName: this.serverStateDB
            ? this.serverStateDB.dbStoreFsPath
            : `this.serverStateDB not provided`,
        });
      },
    );
  }
}

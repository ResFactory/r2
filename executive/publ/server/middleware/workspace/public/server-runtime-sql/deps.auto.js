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
const fileSysSqlDatabaseID = "fssql";
const gitSqlDatabaseID = "gitsql";
const osQueryDatabaseID = "osquery";
const defaultDatabaseID = `prime`;
const observabilityDatabaseID = `observability`;
const publicationDatabaseID = `publication`;
const pubctlDatabaseID = `pubctl`;
const defaultSqlStmtID = "health-check-failed";
function typicalSqlStmtsInventory(identity = "typicalSqlStmts") {
    const sqlStmtsIndex = new Map();
    const DB = (identity)=>{
        return {
            identity
        };
    };
    const tableObjectProps = {
        nature: "table-object-properties"
    };
    const qualifiedNamePlaceholder = "[TBD]";
    const defaultSqlStmt = {
        database: DB(observabilityDatabaseID),
        name: "health-check-failed",
        label: "Show entries in <code>health.json</code> with <bold>fail</bold> status",
        SQL: unindentWhitespace(`
        USE DATABASE ${observabilityDatabaseID};\n
        SELECT *
        FROM service_health_component_status shcs
        WHERE shcs.status = 'fail';`),
        help: `These are the health checks performed by pubctl.ts and stored in health.json`,
        qualifiedName: qualifiedNamePlaceholder
    };
    const result = {
        identity,
        sqlStmt: (identity)=>{
            return sqlStmtsIndex.get(identity);
        },
        sqlStmtIdentities: ()=>sqlStmtsIndex.keys(),
        defaultSqlStmt,
        libraries: [
            {
                name: "publication",
                label: "Publication",
                sqlStmts: [
                    {
                        database: DB(publicationDatabaseID),
                        name: "resources-lint",
                        label: "Show lint issues in resources",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT resource_id, "space found in name/path" as issue, path, ""
            FROM resource_fs_origin
           WHERE name REGEXP "\\s+"
              OR path REGEXP "\\s+"
          UNION ALL
          SELECT resource_id, "mixed case in name/path, should be all lowercase" as issue, path, ""
            FROM resource_fs_origin
           WHERE name REGEXP "[A-Z]"
              OR path REGEXP "[A-Z]"
          UNION ALL
          SELECT resource_id, "unwanted character in route label" as issue, label, qualified_path
            FROM resource_route_terminal
            WHERE label REGEXP "[^a-zA-Z 0-9${"?!+,.\"'()#:-&/".split('').map((ch)=>`\\${ch}`).join('')}]"
          UNION ALL
          SELECT resource_id, "label should not have ending period" as issue, label, qualified_path
            FROM resource_route_terminal
            WHERE label REGEXP "\\.\\s*$"`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(publicationDatabaseID),
                        name: "resources-indexed",
                        label: "Show all indexed resources",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT resource.media_type, resource_index.namespace, resource_index.[index], resource_route_terminal.qualified_path, resource_route_terminal.label
            FROM resource_index
           INNER JOIN resource ON resource.id = resource_index.resource_id
           INNER JOIN resource_route_terminal ON resource_route_terminal.resource_id = resource_index.resource_id
           LIMIT 25`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(publicationDatabaseID),
                        name: "resources-frontmatter-top-level-keys",
                        label: "Show the top level untyped frontmatter keys",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT distinct key->split('.')->[0] as key
            FROM resource_frontmatter
           ORDER BY key`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(publicationDatabaseID),
                        name: "resources-model-top-level-keys",
                        label: "Show the top level typed model keys",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT distinct key->split('.')->[0] as key
            FROM resource_model
           ORDER BY key`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(publicationDatabaseID),
                        name: "persisted-without-originators",
                        label: "Show persisted files not tied to instantiated resource",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT *
           FROM persisted
          WHERE resource_id < 0
          LIMIT 25`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(publicationDatabaseID),
                        name: "resources-without-instantiation-provenance",
                        label: "Show resources without instantiation provenance",
                        SQL: unindentWhitespace(`
          USE DATABASE ${publicationDatabaseID};\n
          SELECT *
            FROM resource
           WHERE resource.instantiator_id = 0
           LIMIT 50`),
                        qualifiedName: qualifiedNamePlaceholder
                    }
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "housekeeping",
                label: "Housekeeping",
                sqlStmts: [
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-databases",
                        label: "Show all the server runtime proxy databases defined",
                        SQL: unindentWhitespace(`SHOW DATABASES`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-tables",
                        label: "Show all tables in all proxyable databases",
                        SQL: unindentWhitespace(`
            SELECT db_name, table_name
              FROM prime.dbms_reflection_inventory
            GROUP BY db_name, table_name`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(defaultDatabaseID),
                        name: "alaSQL-columns",
                        label: "Show all columns across all tables in all proxyable databases",
                        SQL: unindentWhitespace(`
            SELECT *
              FROM prime.dbms_reflection_inventory`),
                        qualifiedName: qualifiedNamePlaceholder
                    }
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "observability",
                label: "Observability",
                sqlStmts: [
                    defaultSqlStmt,
                    {
                        database: DB(observabilityDatabaseID),
                        name: "health-check-full",
                        label: "Show all entries in <code>health.json</code>",
                        SQL: unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT *
            FROM service_health_component_status shcs;`),
                        help: `These are the health checks performed by pubctl.ts and stored in health.json`,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(observabilityDatabaseID),
                        name: "fs-asset-metrics",
                        label: "Show all file system paths outside of content and public (<mark>TODO</mark>: improve symlink follows)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${observabilityDatabaseID};\n
            SELECT w.namespace, wp.dir
              FROM fs_walk w, fs_walk_path wp
             WHERE w.id = wp.walker_id
               AND not(wp.dir->startsWith('content')) and not(wp.dir->startsWith('public'));`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "pubctl-server",
                label: "PubCtl Server",
                sqlStmts: [
                    {
                        database: DB(pubctlDatabaseID),
                        name: "most-recent-access-log",
                        label: "Show 100 most recent entries in the pubctl.ts server access log",
                        SQL: unindentWhitespace(`
            USE DATABASE ${pubctlDatabaseID}; -- pubctl.sqlite.db \n
                SELECT log.created_at, log.asset_nature, status, log.location_href, log.filesys_target_path, log.filesys_target_symlink
                FROM publ_server_static_access_log log
            ORDER BY log.created_at DESC
                LIMIT 100`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "revision-control-git",
                label: "Revision Control (Git)",
                sqlStmts: [
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "top-50-most-frequently-changed-annual",
                        label: "Show top 50 files changed most frequently in the past year (warning: slow, might take 30+ seconds to compute)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT file_path, COUNT(*)
              FROM commits, stats('', commits.hash)
             WHERE commits.author_when > DATE('now', '-12 month')
               AND commits.parents < 2 -- ignore merge commits
             GROUP BY file_path
             ORDER BY COUNT(*) DESC
             LIMIT 50`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "total-commit-counts-by-author",
                        label: "Show total commits counts grouped by author",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), author_email, author_name
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY author_name, author_email ORDER BY count(*) DESC`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(gitSqlDatabaseID),
                        name: "total-commit-counts-by-author-email-domain",
                        label: "Show total commits counts grouped by email domain of author",
                        SQL: unindentWhitespace(`
            USE DATABASE ${gitSqlDatabaseID}; -- https://github.com/mergestat/mergestat\n
            SELECT count(*), substr(author_email, instr(author_email, '@')+1) AS email_domain -- https://sqlite.org/lang_corefunc.html
              FROM commits
             WHERE parents < 2 -- ignore merge commits
             GROUP BY email_domain
             ORDER BY count(*) DESC`),
                        qualifiedName: qualifiedNamePlaceholder
                    }
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "file-system",
                label: "File System",
                sqlStmts: [
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "image-dimensions",
                        label: "Show images and their dimensions",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, size
              FROM content
             WHERE is_image and extension != 'svg'`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "large-images",
                        label: "Show large images (by dimension)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT CONCAT(width, 'x', height), path, fsize, mime
              FROM content -- assumes current working directory is project home (usually true)
             WHERE width >= 500 and height >= 500`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "project-path-statistics",
                        label: "Show useful file system statistics (WARNING: can be slow, be careful)",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "project-path-image-statistics",
                        label: "Show useful image statistics",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT MIN(size), MAX{size}, AVG(size), SUM{size}, COUNT(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE is_image and extension != 'svg'`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "count-files-in-path",
                        label: "Show total files in project path",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT count(*)
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com`),
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(fileSysSqlDatabaseID),
                        name: "markdown-files-and-sizes",
                        label: "Show markdown files in content path",
                        SQL: unindentWhitespace(`
            USE DATABASE ${fileSysSqlDatabaseID}; -- https://github.com/jhspetersson/fselect\n
            SELECT size, path
              FROM ~/workspaces/gl.infra.medigy.com/medigy-digital-properties/gpm.medigy.com/content
             WHERE name = '*.md'
             LIMIT 50`),
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            },
            {
                name: "osquery",
                label: "osQuery (operating system)",
                sqlStmts: [
                    {
                        database: DB(osQueryDatabaseID),
                        name: "system-info",
                        label: "Show system information",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT computer_name, hostname, cpu_brand, cpu_physical_cores, cpu_logical_cores, printf("%.2f", (physical_memory / 1024.0 / 1024.0 / 1024.0)) as memory_gb
            FROM system_info`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(osQueryDatabaseID),
                        name: "config-files-info",
                        label: "Show output of all configuration files available via Augeas",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            LIMIT 50`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    },
                    {
                        database: DB(osQueryDatabaseID),
                        name: "hosts-info",
                        label: "Show output of /etc/hosts using Augeas wrapper",
                        SQL: unindentWhitespace(`
            USE DATABASE ${osQueryDatabaseID}; -- https://osquery.io/\n
            SELECT *
             FROM augeas
            WHERE augeas.path = '/etc/hosts'`),
                        presentation: tableObjectProps,
                        qualifiedName: qualifiedNamePlaceholder
                    }, 
                ],
                qualifiedName: qualifiedNamePlaceholder
            }
        ]
    };
    const indexLibraries = (libraries)=>{
        const indexSqlStmt = (sqlstmt, library)=>{
            if (sqlstmt.qualifiedName == qualifiedNamePlaceholder) {
                sqlstmt.qualifiedName = `${identity}_${library.name}_${sqlstmt.name}`;
            }
            sqlStmtsIndex.set(sqlstmt.qualifiedName, sqlstmt);
        };
        for (const library of libraries){
            if (library.qualifiedName == qualifiedNamePlaceholder) {
                library.qualifiedName = library.name;
            }
            for (const sqlstmt of library.sqlStmts){
                indexSqlStmt(sqlstmt, library);
            }
        }
    };
    indexLibraries(result.libraries);
    return result;
}
export { defaultDatabaseID as defaultDatabaseID };
export { observabilityDatabaseID as observabilityDatabaseID };
export { publicationDatabaseID as publicationDatabaseID };
export { pubctlDatabaseID as pubctlDatabaseID };
export { defaultSqlStmtID as defaultSqlStmtID };
export { typicalSqlStmtsInventory as typicalSqlStmtsInventory };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9zbnNoYWgvd29ya3NwYWNlcy9naXRodWIuY29tL3Jlc0ZhY3RvcnkvZmFjdG9yeS9saWIvdGV4dC93aGl0ZXNwYWNlLnRzIiwiZmlsZTovLy9ob21lL3Nuc2hhaC93b3Jrc3BhY2VzL2dpdGh1Yi5jb20vcmVzRmFjdG9yeS9mYWN0b3J5L2xpYi9zcWwvc2hlbGwvZ292ZXJuYW5jZS50cyIsImZpbGU6Ly8vaG9tZS9zbnNoYWgvd29ya3NwYWNlcy9naXRodWIuY29tL3Jlc0ZhY3RvcnkvZmFjdG9yeS9leGVjdXRpdmUvcHVibC9zZXJ2ZXIvbWlkZGxld2FyZS93b3Jrc3BhY2UvaW52ZW50b3J5L3NlcnZlci1ydW50aW1lLXNxbC1zdG10cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gbWluV2hpdGVzcGFjZUluZGVudCh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXRjaCA9IHRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gIHJldHVybiBtYXRjaCA/IG1hdGNoLnJlZHVjZSgociwgYSkgPT4gTWF0aC5taW4ociwgYS5sZW5ndGgpLCBJbmZpbml0eSkgOiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5pbmRlbnRXaGl0ZXNwYWNlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGluZGVudCA9IG1pbldoaXRlc3BhY2VJbmRlbnQodGV4dCk7XG4gIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXlsgXFxcXHRdeyR7aW5kZW50fX1gLCBcImdtXCIpO1xuICBjb25zdCByZXN1bHQgPSB0ZXh0LnJlcGxhY2UocmVnZXgsIFwiXCIpO1xuICByZXR1cm4gcmVtb3ZlSW5pdGlhbE5ld0xpbmUgPyByZXN1bHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpIDogcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2luZ2xlTGluZVRyaW0odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHQucmVwbGFjZSgvKFxcclxcbnxcXG58XFxyKS9nbSwgXCJcIilcbiAgICAucmVwbGFjZSgvXFxzKyg/PSg/OlteXFwnXCJdKltcXCdcIl1bXlxcJ1wiXSpbXFwnXCJdKSpbXlxcJ1wiXSokKS9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5leHBvcnQgdHlwZSBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHN0cmluZztcblxuLyoqXG4gKiBTdHJpbmcgdGVtcGxhdGUgbGl0ZXJhbCB0YWcgdXRpbGl0eSB0aGF0IHdyYXBzIHRoZSBsaXRlcmFscyBhbmQgd2lsbFxuICogcmV0cmlldmUgbGl0ZXJhbHMgd2l0aCBzZW5zaXRpdml0eSB0byBpbmRlbnRlZCB3aGl0ZXNwYWNlLiBJZlxuICogQHBhcmFtIGxpdGVyYWxzIGxpdGVyYWxzIHN1cHBsaWVkIHRvIHRlbXBsYXRlIGxpdGVyYWwgc3RyaW5nIGZ1bmN0aW9uXG4gKiBAcGFyYW0gc3VwcGxpZWRFeHBycyBleHByZXNzaW9ucyBzdXBwbGllZCB0byB0ZW1wbGF0ZSBsaXRlcmFsIHN0cmluZyBmdW5jdGlvblxuICogQHBhcmFtIG9wdGlvbnMgd2hpdGVzcGFjZSBzZW5zaXRpdml0eSBvcHRpb25zXG4gKiBAcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCB3cmFwIHRoZSBsaXRlcmFsIGFuZCByZXR1cm4gdW5pbmRlbnRlZCB0ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGl0ZXNwYWNlU2Vuc2l0aXZlVGVtcGxhdGVMaXRlcmFsU3VwcGxpZXIoXG4gIGxpdGVyYWxzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSxcbiAgc3VwcGxpZWRFeHByczogdW5rbm93bltdLFxuICBvcHRpb25zPzoge1xuICAgIHJlYWRvbmx5IHVuaW5kZW50PzogYm9vbGVhbiB8IFJlZ0V4cDtcbiAgICByZWFkb25seSByZW1vdmVJbml0aWFsTmV3TGluZT86IGJvb2xlYW47XG4gIH0sXG4pOiBUZW1wbGF0ZUxpdGVyYWxJbmRleGVkVGV4dFN1cHBsaWVyIHtcbiAgY29uc3QgeyB1bmluZGVudCA9IHRydWUsIHJlbW92ZUluaXRpYWxOZXdMaW5lID0gdHJ1ZSB9ID0gb3B0aW9ucyA/PyB7fTtcbiAgbGV0IGxpdGVyYWxTdXBwbGllciA9IChpbmRleDogbnVtYmVyKSA9PiBsaXRlcmFsc1tpbmRleF07XG4gIGlmICh1bmluZGVudCkge1xuICAgIGlmICh0eXBlb2YgdW5pbmRlbnQgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAvLyB3ZSB3YW50IHRvIGF1dG8tZGV0ZWN0IGFuZCBidWlsZCBvdXIgcmVnRXhwIGZvciB1bmluZGVudGluZyBzbyBsZXQnc1xuICAgICAgLy8gYnVpbGQgYSBzYW1wbGUgb2Ygd2hhdCB0aGUgb3JpZ2luYWwgdGV4dCBtaWdodCBsb29rIGxpa2Ugc28gd2UgY2FuXG4gICAgICAvLyBjb21wdXRlIHRoZSBcIm1pbmltdW1cIiB3aGl0ZXNwYWNlIGluZGVudFxuICAgICAgbGV0IG9yaWdpbmFsVGV4dCA9IFwiXCI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1cHBsaWVkRXhwcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2ldICsgYFxcJHtleHByJHtpfX1gO1xuICAgICAgfVxuICAgICAgb3JpZ2luYWxUZXh0ICs9IGxpdGVyYWxzW2xpdGVyYWxzLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgbWF0Y2ggPSBvcmlnaW5hbFRleHQubWF0Y2goL15bIFxcdF0qKD89XFxTKS9nbSk7XG4gICAgICBjb25zdCBtaW5XaGl0ZXNwYWNlSW5kZW50ID0gbWF0Y2hcbiAgICAgICAgPyBtYXRjaC5yZWR1Y2UoKHIsIGEpID0+IE1hdGgubWluKHIsIGEubGVuZ3RoKSwgSW5maW5pdHkpXG4gICAgICAgIDogMDtcbiAgICAgIGlmIChtaW5XaGl0ZXNwYWNlSW5kZW50ID4gMCkge1xuICAgICAgICBjb25zdCB1bmluZGVudFJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgICAgYF5bIFxcXFx0XXske21pbldoaXRlc3BhY2VJbmRlbnR9fWAsXG4gICAgICAgICAgXCJnbVwiLFxuICAgICAgICApO1xuICAgICAgICBsaXRlcmFsU3VwcGxpZXIgPSAoaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgICAgIGxldCB0ZXh0ID0gbGl0ZXJhbHNbaW5kZXhdO1xuICAgICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC9eXFxuLywgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnRSZWdFeHAhLCBcIlwiKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGl0ZXJhbFN1cHBsaWVyID0gKGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgbGV0IHRleHQgPSBsaXRlcmFsc1tpbmRleF07XG4gICAgICAgIGlmIChpbmRleCA9PSAwICYmIHJlbW92ZUluaXRpYWxOZXdMaW5lKSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvXlxcbi8sIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodW5pbmRlbnQsIFwiXCIpO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpdGVyYWxTdXBwbGllcjtcbn1cbiIsImV4cG9ydCBjb25zdCBmaWxlU3lzU3FsRGF0YWJhc2VJRCA9IFwiZnNzcWxcIjtcbmV4cG9ydCBjb25zdCBnaXRTcWxEYXRhYmFzZUlEID0gXCJnaXRzcWxcIjtcbmV4cG9ydCBjb25zdCBvc1F1ZXJ5RGF0YWJhc2VJRCA9IFwib3NxdWVyeVwiO1xuXG5leHBvcnQgdHlwZSBDb21tb25EYXRhYmFzZUlEID1cbiAgfCB0eXBlb2YgZ2l0U3FsRGF0YWJhc2VJRFxuICB8IHR5cGVvZiBmaWxlU3lzU3FsRGF0YWJhc2VJRFxuICB8IHR5cGVvZiBvc1F1ZXJ5RGF0YWJhc2VJRDtcbiIsImltcG9ydCAqIGFzIHJzIGZyb20gXCIuLi8uLi8uLi8uLi8uLi8uLi9saWIvc3FsL3JlbW90ZS9nb3Zlcm5hbmNlLnRzXCI7XG5pbXBvcnQgKiBhcyBnb3ZuIGZyb20gXCIuL2dvdmVybmFuY2UudHNcIjtcbmltcG9ydCAqIGFzIHdocyBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vLi4vbGliL3RleHQvd2hpdGVzcGFjZS50c1wiO1xuaW1wb3J0ICogYXMgc3FsU2hHIGZyb20gXCIuLi8uLi8uLi8uLi8uLi8uLi9saWIvc3FsL3NoZWxsL2dvdmVybmFuY2UudHNcIjtcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHREYXRhYmFzZUlEID0gYHByaW1lYCBhcyBjb25zdDtcbmV4cG9ydCBjb25zdCBvYnNlcnZhYmlsaXR5RGF0YWJhc2VJRCA9IGBvYnNlcnZhYmlsaXR5YCBhcyBjb25zdDtcbmV4cG9ydCBjb25zdCBwdWJsaWNhdGlvbkRhdGFiYXNlSUQgPSBgcHVibGljYXRpb25gIGFzIGNvbnN0O1xuZXhwb3J0IGNvbnN0IHB1YmN0bERhdGFiYXNlSUQgPSBgcHViY3RsYCBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgVHlwaWNhbFNxbFN0bXREYXRhYmFzZUlEID1cbiAgfCB0eXBlb2YgZGVmYXVsdERhdGFiYXNlSURcbiAgfCB0eXBlb2Ygb2JzZXJ2YWJpbGl0eURhdGFiYXNlSURcbiAgfCB0eXBlb2YgcHVibGljYXRpb25EYXRhYmFzZUlEXG4gIHwgdHlwZW9mIHB1YmN0bERhdGFiYXNlSURcbiAgfCBzcWxTaEcuQ29tbW9uRGF0YWJhc2VJRDtcblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTcWxTdG10SUQgPSBcImhlYWx0aC1jaGVjay1mYWlsZWRcIjtcblxuLy8gaW52ZW50b3J5IGlzIHVzZWQgYXMtaXMgYnkgdGhlIHNlcnZlci1zaWRlIGJ1dCB1c2VkIGFzIGEgcmVmZXJlbmNlIGJ5IGNsaWVudDtcbi8vIGZvciBzZWN1cml0eSBwdXJwb3NlcywgdGhlIHVzZXIgYWdlbnQgKFwiVUFcIiBvciBcImNsaWVudFwiKSBpcyBhbGxvd2VkIHRvIHNlZVxuLy8gdGhlIHNxbFN0bXRzIGJ1dCBpZiB0aGUgc3Fsc3RtdCBpcyBwYXNzZWQgaW50byB0aGUgc2VydmVyLCB0aGUgc2VydmVyIGlnbm9yZXNcbi8vIHRoZSBzcWxTdG10IGFuZCB1c2VzIHdoYXQgaXMgaW4gdGhlIGNhdGFsb2cuIEJ5IGxldHRpbmcgY2xpZW50cyBzZWUgdGhlXG5leHBvcnQgZnVuY3Rpb24gdHlwaWNhbFNxbFN0bXRzSW52ZW50b3J5KFxuICBpZGVudGl0eSA9IFwidHlwaWNhbFNxbFN0bXRzXCIsXG4pOiBnb3ZuLlNlcnZlclJ1bnRpbWVTcWxTdG10SW52ZW50b3J5PFxuICBUeXBpY2FsU3FsU3RtdERhdGFiYXNlSURcbj4ge1xuICBjb25zdCBzcWxTdG10c0luZGV4ID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgZ292bi5TZXJ2ZXJSdW50aW1lU3FsU3RtdDxUeXBpY2FsU3FsU3RtdERhdGFiYXNlSUQ+XG4gID4oKTtcblxuICBjb25zdCBEQiA9IChcbiAgICBpZGVudGl0eTogVHlwaWNhbFNxbFN0bXREYXRhYmFzZUlELFxuICApOiBycy5TcWxEYXRhYmFzZTxUeXBpY2FsU3FsU3RtdERhdGFiYXNlSUQ+ID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWRlbnRpdHksXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBfanNvbkV4cGxvcmVyOiBnb3ZuLlNxbFN0bXRSZXN1bHRQcmVzZW50YXRpb25TdHJhdGVneSA9IHtcbiAgICBuYXR1cmU6IFwiSlNPTi1leHBsb3JlclwiLFxuICB9O1xuICBjb25zdCBfdGFibGVNYXRyaXg6IGdvdm4uU3FsU3RtdFJlc3VsdFByZXNlbnRhdGlvblN0cmF0ZWd5ID0ge1xuICAgIG5hdHVyZTogXCJ0YWJsZS1tYXRyaXhcIixcbiAgfTtcbiAgY29uc3QgX3RhYmxlUmVjb3JkczogZ292bi5TcWxTdG10UmVzdWx0VGFibGVSZWNvcmRzUHJlc2VudGF0aW9uID0ge1xuICAgIG5hdHVyZTogXCJ0YWJsZS1yZWNvcmRzXCIsXG4gIH07XG4gIGNvbnN0IHRhYmxlT2JqZWN0UHJvcHM6IGdvdm4uU3FsU3RtdFJlc3VsdFRhYmxlT2JqZWN0UHJvcHNQcmVzZW50YXRpb24gPSB7XG4gICAgbmF0dXJlOiBcInRhYmxlLW9iamVjdC1wcm9wZXJ0aWVzXCIsXG4gIH07XG5cbiAgY29uc3QgcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyID0gXCJbVEJEXVwiO1xuICBjb25zdCBkZWZhdWx0U3FsU3RtdDogZ292bi5TZXJ2ZXJSdW50aW1lU3FsU3RtdDxUeXBpY2FsU3FsU3RtdERhdGFiYXNlSUQ+ID0ge1xuICAgIGRhdGFiYXNlOiBEQihvYnNlcnZhYmlsaXR5RGF0YWJhc2VJRCksXG4gICAgbmFtZTogXCJoZWFsdGgtY2hlY2stZmFpbGVkXCIsXG4gICAgbGFiZWw6XG4gICAgICBcIlNob3cgZW50cmllcyBpbiA8Y29kZT5oZWFsdGguanNvbjwvY29kZT4gd2l0aCA8Ym9sZD5mYWlsPC9ib2xkPiBzdGF0dXNcIixcbiAgICBTUUw6IHdocy51bmluZGVudFdoaXRlc3BhY2UoYFxuICAgICAgICBVU0UgREFUQUJBU0UgJHtvYnNlcnZhYmlsaXR5RGF0YWJhc2VJRH07XFxuXG4gICAgICAgIFNFTEVDVCAqXG4gICAgICAgIEZST00gc2VydmljZV9oZWFsdGhfY29tcG9uZW50X3N0YXR1cyBzaGNzXG4gICAgICAgIFdIRVJFIHNoY3Muc3RhdHVzID0gJ2ZhaWwnO2ApLFxuICAgIGhlbHA6XG4gICAgICBgVGhlc2UgYXJlIHRoZSBoZWFsdGggY2hlY2tzIHBlcmZvcm1lZCBieSBwdWJjdGwudHMgYW5kIHN0b3JlZCBpbiBoZWFsdGguanNvbmAsXG4gICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICB9O1xuXG4gIGNvbnN0IHJlc3VsdDogZ292bi5TZXJ2ZXJSdW50aW1lU3FsU3RtdEludmVudG9yeTxUeXBpY2FsU3FsU3RtdERhdGFiYXNlSUQ+ID0ge1xuICAgIGlkZW50aXR5LFxuICAgIHNxbFN0bXQ6IChpZGVudGl0eTogc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gc3FsU3RtdHNJbmRleC5nZXQoaWRlbnRpdHkpO1xuICAgIH0sXG4gICAgc3FsU3RtdElkZW50aXRpZXM6ICgpID0+IHNxbFN0bXRzSW5kZXgua2V5cygpLFxuICAgIGRlZmF1bHRTcWxTdG10LFxuICAgIGxpYnJhcmllczogW3tcbiAgICAgIG5hbWU6IFwicHVibGljYXRpb25cIixcbiAgICAgIGxhYmVsOiBcIlB1YmxpY2F0aW9uXCIsXG4gICAgICBzcWxTdG10czogW3tcbiAgICAgICAgZGF0YWJhc2U6IERCKHB1YmxpY2F0aW9uRGF0YWJhc2VJRCksXG4gICAgICAgIG5hbWU6IFwicmVzb3VyY2VzLWxpbnRcIixcbiAgICAgICAgbGFiZWw6IFwiU2hvdyBsaW50IGlzc3VlcyBpbiByZXNvdXJjZXNcIixcbiAgICAgICAgLy8gTk9URTogaW4gUkVHRVhQIGJlIHN1cmUgdG8gdXNlIFxcXFwgd2hlbiB5b3Ugd2FudCB1c2UgXFxzKyBvciBvdGhlciByZWctZXggZXNjYXBlc1xuICAgICAgICAvLyBkZW5vLWZtdC1pZ25vcmVcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICBVU0UgREFUQUJBU0UgJHtwdWJsaWNhdGlvbkRhdGFiYXNlSUR9O1xcblxuICAgICAgICAgIFNFTEVDVCByZXNvdXJjZV9pZCwgXCJzcGFjZSBmb3VuZCBpbiBuYW1lL3BhdGhcIiBhcyBpc3N1ZSwgcGF0aCwgXCJcIlxuICAgICAgICAgICAgRlJPTSByZXNvdXJjZV9mc19vcmlnaW5cbiAgICAgICAgICAgV0hFUkUgbmFtZSBSRUdFWFAgXCJcXFxccytcIlxuICAgICAgICAgICAgICBPUiBwYXRoIFJFR0VYUCBcIlxcXFxzK1wiXG4gICAgICAgICAgVU5JT04gQUxMXG4gICAgICAgICAgU0VMRUNUIHJlc291cmNlX2lkLCBcIm1peGVkIGNhc2UgaW4gbmFtZS9wYXRoLCBzaG91bGQgYmUgYWxsIGxvd2VyY2FzZVwiIGFzIGlzc3VlLCBwYXRoLCBcIlwiXG4gICAgICAgICAgICBGUk9NIHJlc291cmNlX2ZzX29yaWdpblxuICAgICAgICAgICBXSEVSRSBuYW1lIFJFR0VYUCBcIltBLVpdXCJcbiAgICAgICAgICAgICAgT1IgcGF0aCBSRUdFWFAgXCJbQS1aXVwiXG4gICAgICAgICAgVU5JT04gQUxMXG4gICAgICAgICAgU0VMRUNUIHJlc291cmNlX2lkLCBcInVud2FudGVkIGNoYXJhY3RlciBpbiByb3V0ZSBsYWJlbFwiIGFzIGlzc3VlLCBsYWJlbCwgcXVhbGlmaWVkX3BhdGhcbiAgICAgICAgICAgIEZST00gcmVzb3VyY2Vfcm91dGVfdGVybWluYWxcbiAgICAgICAgICAgIFdIRVJFIGxhYmVsIFJFR0VYUCBcIlteYS16QS1aIDAtOSR7XCI/ISssLlxcXCInKCkjOi0mL1wiLnNwbGl0KCcnKS5tYXAoKGNoKSA9PiBgXFxcXCR7Y2h9YCkuam9pbignJyl9XVwiXG4gICAgICAgICAgVU5JT04gQUxMXG4gICAgICAgICAgU0VMRUNUIHJlc291cmNlX2lkLCBcImxhYmVsIHNob3VsZCBub3QgaGF2ZSBlbmRpbmcgcGVyaW9kXCIgYXMgaXNzdWUsIGxhYmVsLCBxdWFsaWZpZWRfcGF0aFxuICAgICAgICAgICAgRlJPTSByZXNvdXJjZV9yb3V0ZV90ZXJtaW5hbFxuICAgICAgICAgICAgV0hFUkUgbGFiZWwgUkVHRVhQIFwiXFxcXC5cXFxccyokXCJgKSwgLy8gLm1hcChjaCkgaXMgdXNlZCB0byBjb252ZW5pZW50bHkgZXNjYXBlIHJlZ2V4IGluIFNRTFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihwdWJsaWNhdGlvbkRhdGFiYXNlSUQpLFxuICAgICAgICBuYW1lOiBcInJlc291cmNlcy1pbmRleGVkXCIsXG4gICAgICAgIGxhYmVsOiBcIlNob3cgYWxsIGluZGV4ZWQgcmVzb3VyY2VzXCIsXG4gICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgVVNFIERBVEFCQVNFICR7cHVibGljYXRpb25EYXRhYmFzZUlEfTtcXG5cbiAgICAgICAgICBTRUxFQ1QgcmVzb3VyY2UubWVkaWFfdHlwZSwgcmVzb3VyY2VfaW5kZXgubmFtZXNwYWNlLCByZXNvdXJjZV9pbmRleC5baW5kZXhdLCByZXNvdXJjZV9yb3V0ZV90ZXJtaW5hbC5xdWFsaWZpZWRfcGF0aCwgcmVzb3VyY2Vfcm91dGVfdGVybWluYWwubGFiZWxcbiAgICAgICAgICAgIEZST00gcmVzb3VyY2VfaW5kZXhcbiAgICAgICAgICAgSU5ORVIgSk9JTiByZXNvdXJjZSBPTiByZXNvdXJjZS5pZCA9IHJlc291cmNlX2luZGV4LnJlc291cmNlX2lkXG4gICAgICAgICAgIElOTkVSIEpPSU4gcmVzb3VyY2Vfcm91dGVfdGVybWluYWwgT04gcmVzb3VyY2Vfcm91dGVfdGVybWluYWwucmVzb3VyY2VfaWQgPSByZXNvdXJjZV9pbmRleC5yZXNvdXJjZV9pZFxuICAgICAgICAgICBMSU1JVCAyNWApLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihwdWJsaWNhdGlvbkRhdGFiYXNlSUQpLFxuICAgICAgICBuYW1lOiBcInJlc291cmNlcy1mcm9udG1hdHRlci10b3AtbGV2ZWwta2V5c1wiLFxuICAgICAgICBsYWJlbDogXCJTaG93IHRoZSB0b3AgbGV2ZWwgdW50eXBlZCBmcm9udG1hdHRlciBrZXlzXCIsXG4gICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgVVNFIERBVEFCQVNFICR7cHVibGljYXRpb25EYXRhYmFzZUlEfTtcXG5cbiAgICAgICAgICBTRUxFQ1QgZGlzdGluY3Qga2V5LT5zcGxpdCgnLicpLT5bMF0gYXMga2V5XG4gICAgICAgICAgICBGUk9NIHJlc291cmNlX2Zyb250bWF0dGVyXG4gICAgICAgICAgIE9SREVSIEJZIGtleWApLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihwdWJsaWNhdGlvbkRhdGFiYXNlSUQpLFxuICAgICAgICBuYW1lOiBcInJlc291cmNlcy1tb2RlbC10b3AtbGV2ZWwta2V5c1wiLFxuICAgICAgICBsYWJlbDogXCJTaG93IHRoZSB0b3AgbGV2ZWwgdHlwZWQgbW9kZWwga2V5c1wiLFxuICAgICAgICBTUUw6IHdocy51bmluZGVudFdoaXRlc3BhY2UoYFxuICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3B1YmxpY2F0aW9uRGF0YWJhc2VJRH07XFxuXG4gICAgICAgICAgU0VMRUNUIGRpc3RpbmN0IGtleS0+c3BsaXQoJy4nKS0+WzBdIGFzIGtleVxuICAgICAgICAgICAgRlJPTSByZXNvdXJjZV9tb2RlbFxuICAgICAgICAgICBPUkRFUiBCWSBrZXlgKSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgfSwge1xuICAgICAgICBkYXRhYmFzZTogREIocHVibGljYXRpb25EYXRhYmFzZUlEKSxcbiAgICAgICAgbmFtZTogXCJwZXJzaXN0ZWQtd2l0aG91dC1vcmlnaW5hdG9yc1wiLFxuICAgICAgICBsYWJlbDogXCJTaG93IHBlcnNpc3RlZCBmaWxlcyBub3QgdGllZCB0byBpbnN0YW50aWF0ZWQgcmVzb3VyY2VcIixcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICBVU0UgREFUQUJBU0UgJHtwdWJsaWNhdGlvbkRhdGFiYXNlSUR9O1xcblxuICAgICAgICAgIFNFTEVDVCAqXG4gICAgICAgICAgIEZST00gcGVyc2lzdGVkXG4gICAgICAgICAgV0hFUkUgcmVzb3VyY2VfaWQgPCAwXG4gICAgICAgICAgTElNSVQgMjVgKSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgfSwge1xuICAgICAgICBkYXRhYmFzZTogREIocHVibGljYXRpb25EYXRhYmFzZUlEKSxcbiAgICAgICAgbmFtZTogXCJyZXNvdXJjZXMtd2l0aG91dC1pbnN0YW50aWF0aW9uLXByb3ZlbmFuY2VcIixcbiAgICAgICAgbGFiZWw6IFwiU2hvdyByZXNvdXJjZXMgd2l0aG91dCBpbnN0YW50aWF0aW9uIHByb3ZlbmFuY2VcIixcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICBVU0UgREFUQUJBU0UgJHtwdWJsaWNhdGlvbkRhdGFiYXNlSUR9O1xcblxuICAgICAgICAgIFNFTEVDVCAqXG4gICAgICAgICAgICBGUk9NIHJlc291cmNlXG4gICAgICAgICAgIFdIRVJFIHJlc291cmNlLmluc3RhbnRpYXRvcl9pZCA9IDBcbiAgICAgICAgICAgTElNSVQgNTBgKSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgfV0sXG4gICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgfSwge1xuICAgICAgbmFtZTogXCJob3VzZWtlZXBpbmdcIixcbiAgICAgIGxhYmVsOiBcIkhvdXNla2VlcGluZ1wiLFxuICAgICAgc3FsU3RtdHM6IFt7XG4gICAgICAgIGRhdGFiYXNlOiBEQihkZWZhdWx0RGF0YWJhc2VJRCksXG4gICAgICAgIG5hbWU6IFwiYWxhU1FMLWRhdGFiYXNlc1wiLFxuICAgICAgICBsYWJlbDogXCJTaG93IGFsbCB0aGUgc2VydmVyIHJ1bnRpbWUgcHJveHkgZGF0YWJhc2VzIGRlZmluZWRcIixcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBTSE9XIERBVEFCQVNFU2ApLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihkZWZhdWx0RGF0YWJhc2VJRCksXG4gICAgICAgIG5hbWU6IFwiYWxhU1FMLXRhYmxlc1wiLFxuICAgICAgICBsYWJlbDogXCJTaG93IGFsbCB0YWJsZXMgaW4gYWxsIHByb3h5YWJsZSBkYXRhYmFzZXNcIixcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFNFTEVDVCBkYl9uYW1lLCB0YWJsZV9uYW1lXG4gICAgICAgICAgICAgIEZST00gcHJpbWUuZGJtc19yZWZsZWN0aW9uX2ludmVudG9yeVxuICAgICAgICAgICAgR1JPVVAgQlkgZGJfbmFtZSwgdGFibGVfbmFtZWApLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihkZWZhdWx0RGF0YWJhc2VJRCksXG4gICAgICAgIG5hbWU6IFwiYWxhU1FMLWNvbHVtbnNcIixcbiAgICAgICAgbGFiZWw6IFwiU2hvdyBhbGwgY29sdW1ucyBhY3Jvc3MgYWxsIHRhYmxlcyBpbiBhbGwgcHJveHlhYmxlIGRhdGFiYXNlc1wiLFxuICAgICAgICBTUUw6IHdocy51bmluZGVudFdoaXRlc3BhY2UoYFxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgICAgRlJPTSBwcmltZS5kYm1zX3JlZmxlY3Rpb25faW52ZW50b3J5YCksXG4gICAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgIH1dLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6IFwib2JzZXJ2YWJpbGl0eVwiLFxuICAgICAgbGFiZWw6IFwiT2JzZXJ2YWJpbGl0eVwiLFxuICAgICAgc3FsU3RtdHM6IFtcbiAgICAgICAgZGVmYXVsdFNxbFN0bXQsXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRhYmFzZTogREIob2JzZXJ2YWJpbGl0eURhdGFiYXNlSUQpLFxuICAgICAgICAgIG5hbWU6IFwiaGVhbHRoLWNoZWNrLWZ1bGxcIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IGFsbCBlbnRyaWVzIGluIDxjb2RlPmhlYWx0aC5qc29uPC9jb2RlPlwiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtvYnNlcnZhYmlsaXR5RGF0YWJhc2VJRH07XFxuXG4gICAgICAgICAgICBTRUxFQ1QgKlxuICAgICAgICAgICAgRlJPTSBzZXJ2aWNlX2hlYWx0aF9jb21wb25lbnRfc3RhdHVzIHNoY3M7YCksXG4gICAgICAgICAgaGVscDpcbiAgICAgICAgICAgIGBUaGVzZSBhcmUgdGhlIGhlYWx0aCBjaGVja3MgcGVyZm9ybWVkIGJ5IHB1YmN0bC50cyBhbmQgc3RvcmVkIGluIGhlYWx0aC5qc29uYCxcbiAgICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRhYmFzZTogREIob2JzZXJ2YWJpbGl0eURhdGFiYXNlSUQpLFxuICAgICAgICAgIG5hbWU6IFwiZnMtYXNzZXQtbWV0cmljc1wiLFxuICAgICAgICAgIGxhYmVsOlxuICAgICAgICAgICAgXCJTaG93IGFsbCBmaWxlIHN5c3RlbSBwYXRocyBvdXRzaWRlIG9mIGNvbnRlbnQgYW5kIHB1YmxpYyAoPG1hcms+VE9ETzwvbWFyaz46IGltcHJvdmUgc3ltbGluayBmb2xsb3dzKVwiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtvYnNlcnZhYmlsaXR5RGF0YWJhc2VJRH07XFxuXG4gICAgICAgICAgICBTRUxFQ1Qgdy5uYW1lc3BhY2UsIHdwLmRpclxuICAgICAgICAgICAgICBGUk9NIGZzX3dhbGsgdywgZnNfd2Fsa19wYXRoIHdwXG4gICAgICAgICAgICAgV0hFUkUgdy5pZCA9IHdwLndhbGtlcl9pZFxuICAgICAgICAgICAgICAgQU5EIG5vdCh3cC5kaXItPnN0YXJ0c1dpdGgoJ2NvbnRlbnQnKSkgYW5kIG5vdCh3cC5kaXItPnN0YXJ0c1dpdGgoJ3B1YmxpYycpKTtgKSxcbiAgICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6IFwicHViY3RsLXNlcnZlclwiLFxuICAgICAgbGFiZWw6IFwiUHViQ3RsIFNlcnZlclwiLFxuICAgICAgc3FsU3RtdHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGRhdGFiYXNlOiBEQihwdWJjdGxEYXRhYmFzZUlEKSxcbiAgICAgICAgICBuYW1lOiBcIm1vc3QtcmVjZW50LWFjY2Vzcy1sb2dcIixcbiAgICAgICAgICBsYWJlbDpcbiAgICAgICAgICAgIFwiU2hvdyAxMDAgbW9zdCByZWNlbnQgZW50cmllcyBpbiB0aGUgcHViY3RsLnRzIHNlcnZlciBhY2Nlc3MgbG9nXCIsXG4gICAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3B1YmN0bERhdGFiYXNlSUR9OyAtLSBwdWJjdGwuc3FsaXRlLmRiIFxcblxuICAgICAgICAgICAgICAgIFNFTEVDVCBsb2cuY3JlYXRlZF9hdCwgbG9nLmFzc2V0X25hdHVyZSwgc3RhdHVzLCBsb2cubG9jYXRpb25faHJlZiwgbG9nLmZpbGVzeXNfdGFyZ2V0X3BhdGgsIGxvZy5maWxlc3lzX3RhcmdldF9zeW1saW5rXG4gICAgICAgICAgICAgICAgRlJPTSBwdWJsX3NlcnZlcl9zdGF0aWNfYWNjZXNzX2xvZyBsb2dcbiAgICAgICAgICAgIE9SREVSIEJZIGxvZy5jcmVhdGVkX2F0IERFU0NcbiAgICAgICAgICAgICAgICBMSU1JVCAxMDBgKSxcbiAgICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6IFwicmV2aXNpb24tY29udHJvbC1naXRcIixcbiAgICAgIGxhYmVsOiBcIlJldmlzaW9uIENvbnRyb2wgKEdpdClcIixcbiAgICAgIHNxbFN0bXRzOiBbe1xuICAgICAgICBkYXRhYmFzZTogREIoc3FsU2hHLmdpdFNxbERhdGFiYXNlSUQpLFxuICAgICAgICBuYW1lOiBcInRvcC01MC1tb3N0LWZyZXF1ZW50bHktY2hhbmdlZC1hbm51YWxcIixcbiAgICAgICAgbGFiZWw6XG4gICAgICAgICAgXCJTaG93IHRvcCA1MCBmaWxlcyBjaGFuZ2VkIG1vc3QgZnJlcXVlbnRseSBpbiB0aGUgcGFzdCB5ZWFyICh3YXJuaW5nOiBzbG93LCBtaWdodCB0YWtlIDMwKyBzZWNvbmRzIHRvIGNvbXB1dGUpXCIsXG4gICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZ2l0U3FsRGF0YWJhc2VJRH07IC0tIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXJnZXN0YXQvbWVyZ2VzdGF0XFxuXG4gICAgICAgICAgICBTRUxFQ1QgZmlsZV9wYXRoLCBDT1VOVCgqKVxuICAgICAgICAgICAgICBGUk9NIGNvbW1pdHMsIHN0YXRzKCcnLCBjb21taXRzLmhhc2gpXG4gICAgICAgICAgICAgV0hFUkUgY29tbWl0cy5hdXRob3Jfd2hlbiA+IERBVEUoJ25vdycsICctMTIgbW9udGgnKVxuICAgICAgICAgICAgICAgQU5EIGNvbW1pdHMucGFyZW50cyA8IDIgLS0gaWdub3JlIG1lcmdlIGNvbW1pdHNcbiAgICAgICAgICAgICBHUk9VUCBCWSBmaWxlX3BhdGhcbiAgICAgICAgICAgICBPUkRFUiBCWSBDT1VOVCgqKSBERVNDXG4gICAgICAgICAgICAgTElNSVQgNTBgKSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgfSwge1xuICAgICAgICBkYXRhYmFzZTogREIoc3FsU2hHLmdpdFNxbERhdGFiYXNlSUQpLFxuICAgICAgICBuYW1lOiBcInRvdGFsLWNvbW1pdC1jb3VudHMtYnktYXV0aG9yXCIsXG4gICAgICAgIGxhYmVsOiBcIlNob3cgdG90YWwgY29tbWl0cyBjb3VudHMgZ3JvdXBlZCBieSBhdXRob3JcIixcbiAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3NxbFNoRy5naXRTcWxEYXRhYmFzZUlEfTsgLS0gaHR0cHM6Ly9naXRodWIuY29tL21lcmdlc3RhdC9tZXJnZXN0YXRcXG5cbiAgICAgICAgICAgIFNFTEVDVCBjb3VudCgqKSwgYXV0aG9yX2VtYWlsLCBhdXRob3JfbmFtZVxuICAgICAgICAgICAgICBGUk9NIGNvbW1pdHNcbiAgICAgICAgICAgICBXSEVSRSBwYXJlbnRzIDwgMiAtLSBpZ25vcmUgbWVyZ2UgY29tbWl0c1xuICAgICAgICAgICAgIEdST1VQIEJZIGF1dGhvcl9uYW1lLCBhdXRob3JfZW1haWwgT1JERVIgQlkgY291bnQoKikgREVTQ2ApLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGFiYXNlOiBEQihzcWxTaEcuZ2l0U3FsRGF0YWJhc2VJRCksXG4gICAgICAgIG5hbWU6IFwidG90YWwtY29tbWl0LWNvdW50cy1ieS1hdXRob3ItZW1haWwtZG9tYWluXCIsXG4gICAgICAgIGxhYmVsOiBcIlNob3cgdG90YWwgY29tbWl0cyBjb3VudHMgZ3JvdXBlZCBieSBlbWFpbCBkb21haW4gb2YgYXV0aG9yXCIsXG4gICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZ2l0U3FsRGF0YWJhc2VJRH07IC0tIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXJnZXN0YXQvbWVyZ2VzdGF0XFxuXG4gICAgICAgICAgICBTRUxFQ1QgY291bnQoKiksIHN1YnN0cihhdXRob3JfZW1haWwsIGluc3RyKGF1dGhvcl9lbWFpbCwgJ0AnKSsxKSBBUyBlbWFpbF9kb21haW4gLS0gaHR0cHM6Ly9zcWxpdGUub3JnL2xhbmdfY29yZWZ1bmMuaHRtbFxuICAgICAgICAgICAgICBGUk9NIGNvbW1pdHNcbiAgICAgICAgICAgICBXSEVSRSBwYXJlbnRzIDwgMiAtLSBpZ25vcmUgbWVyZ2UgY29tbWl0c1xuICAgICAgICAgICAgIEdST1VQIEJZIGVtYWlsX2RvbWFpblxuICAgICAgICAgICAgIE9SREVSIEJZIGNvdW50KCopIERFU0NgKSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgfV0sXG4gICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgfSwge1xuICAgICAgbmFtZTogXCJmaWxlLXN5c3RlbVwiLFxuICAgICAgbGFiZWw6IFwiRmlsZSBTeXN0ZW1cIixcbiAgICAgIHNxbFN0bXRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRhYmFzZTogREIoc3FsU2hHLmZpbGVTeXNTcWxEYXRhYmFzZUlEKSxcbiAgICAgICAgICBuYW1lOiBcImltYWdlLWRpbWVuc2lvbnNcIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IGltYWdlcyBhbmQgdGhlaXIgZGltZW5zaW9uc1wiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZmlsZVN5c1NxbERhdGFiYXNlSUR9OyAtLSBodHRwczovL2dpdGh1Yi5jb20vamhzcGV0ZXJzc29uL2ZzZWxlY3RcXG5cbiAgICAgICAgICAgIFNFTEVDVCBDT05DQVQod2lkdGgsICd4JywgaGVpZ2h0KSwgcGF0aCwgc2l6ZVxuICAgICAgICAgICAgICBGUk9NIGNvbnRlbnRcbiAgICAgICAgICAgICBXSEVSRSBpc19pbWFnZSBhbmQgZXh0ZW5zaW9uICE9ICdzdmcnYCksXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YWJhc2U6IERCKHNxbFNoRy5maWxlU3lzU3FsRGF0YWJhc2VJRCksXG4gICAgICAgICAgbmFtZTogXCJsYXJnZS1pbWFnZXNcIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IGxhcmdlIGltYWdlcyAoYnkgZGltZW5zaW9uKVwiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZmlsZVN5c1NxbERhdGFiYXNlSUR9OyAtLSBodHRwczovL2dpdGh1Yi5jb20vamhzcGV0ZXJzc29uL2ZzZWxlY3RcXG5cbiAgICAgICAgICAgIFNFTEVDVCBDT05DQVQod2lkdGgsICd4JywgaGVpZ2h0KSwgcGF0aCwgZnNpemUsIG1pbWVcbiAgICAgICAgICAgICAgRlJPTSBjb250ZW50IC0tIGFzc3VtZXMgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeSBpcyBwcm9qZWN0IGhvbWUgKHVzdWFsbHkgdHJ1ZSlcbiAgICAgICAgICAgICBXSEVSRSB3aWR0aCA+PSA1MDAgYW5kIGhlaWdodCA+PSA1MDBgKSxcbiAgICAgICAgICBxdWFsaWZpZWROYW1lOiBxdWFsaWZpZWROYW1lUGxhY2Vob2xkZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRhYmFzZTogREIoc3FsU2hHLmZpbGVTeXNTcWxEYXRhYmFzZUlEKSxcbiAgICAgICAgICBuYW1lOiBcInByb2plY3QtcGF0aC1zdGF0aXN0aWNzXCIsXG4gICAgICAgICAgbGFiZWw6XG4gICAgICAgICAgICBcIlNob3cgdXNlZnVsIGZpbGUgc3lzdGVtIHN0YXRpc3RpY3MgKFdBUk5JTkc6IGNhbiBiZSBzbG93LCBiZSBjYXJlZnVsKVwiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZmlsZVN5c1NxbERhdGFiYXNlSUR9OyAtLSBodHRwczovL2dpdGh1Yi5jb20vamhzcGV0ZXJzc29uL2ZzZWxlY3RcXG5cbiAgICAgICAgICAgIFNFTEVDVCBNSU4oc2l6ZSksIE1BWHtzaXplfSwgQVZHKHNpemUpLCBTVU17c2l6ZX0sIENPVU5UKCopXG4gICAgICAgICAgICAgIEZST00gfi93b3Jrc3BhY2VzL2dsLmluZnJhLm1lZGlneS5jb20vbWVkaWd5LWRpZ2l0YWwtcHJvcGVydGllcy9ncG0ubWVkaWd5LmNvbWApLFxuICAgICAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGFiYXNlOiBEQihzcWxTaEcuZmlsZVN5c1NxbERhdGFiYXNlSUQpLFxuICAgICAgICAgIG5hbWU6IFwicHJvamVjdC1wYXRoLWltYWdlLXN0YXRpc3RpY3NcIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IHVzZWZ1bCBpbWFnZSBzdGF0aXN0aWNzXCIsXG4gICAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3NxbFNoRy5maWxlU3lzU3FsRGF0YWJhc2VJRH07IC0tIGh0dHBzOi8vZ2l0aHViLmNvbS9qaHNwZXRlcnNzb24vZnNlbGVjdFxcblxuICAgICAgICAgICAgU0VMRUNUIE1JTihzaXplKSwgTUFYe3NpemV9LCBBVkcoc2l6ZSksIFNVTXtzaXplfSwgQ09VTlQoKilcbiAgICAgICAgICAgICAgRlJPTSB+L3dvcmtzcGFjZXMvZ2wuaW5mcmEubWVkaWd5LmNvbS9tZWRpZ3ktZGlnaXRhbC1wcm9wZXJ0aWVzL2dwbS5tZWRpZ3kuY29tL2NvbnRlbnRcbiAgICAgICAgICAgICBXSEVSRSBpc19pbWFnZSBhbmQgZXh0ZW5zaW9uICE9ICdzdmcnYCksXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YWJhc2U6IERCKHNxbFNoRy5maWxlU3lzU3FsRGF0YWJhc2VJRCksXG4gICAgICAgICAgbmFtZTogXCJjb3VudC1maWxlcy1pbi1wYXRoXCIsXG4gICAgICAgICAgbGFiZWw6IFwiU2hvdyB0b3RhbCBmaWxlcyBpbiBwcm9qZWN0IHBhdGhcIixcbiAgICAgICAgICBTUUw6IHdocy51bmluZGVudFdoaXRlc3BhY2UoYFxuICAgICAgICAgICAgVVNFIERBVEFCQVNFICR7c3FsU2hHLmZpbGVTeXNTcWxEYXRhYmFzZUlEfTsgLS0gaHR0cHM6Ly9naXRodWIuY29tL2poc3BldGVyc3Nvbi9mc2VsZWN0XFxuXG4gICAgICAgICAgICBTRUxFQ1QgY291bnQoKilcbiAgICAgICAgICAgICAgRlJPTSB+L3dvcmtzcGFjZXMvZ2wuaW5mcmEubWVkaWd5LmNvbS9tZWRpZ3ktZGlnaXRhbC1wcm9wZXJ0aWVzL2dwbS5tZWRpZ3kuY29tYCksXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YWJhc2U6IERCKHNxbFNoRy5maWxlU3lzU3FsRGF0YWJhc2VJRCksXG4gICAgICAgICAgbmFtZTogXCJtYXJrZG93bi1maWxlcy1hbmQtc2l6ZXNcIixcbiAgICAgICAgICBsYWJlbDogXCJTaG93IG1hcmtkb3duIGZpbGVzIGluIGNvbnRlbnQgcGF0aFwiLFxuICAgICAgICAgIFNRTDogd2hzLnVuaW5kZW50V2hpdGVzcGFjZShgXG4gICAgICAgICAgICBVU0UgREFUQUJBU0UgJHtzcWxTaEcuZmlsZVN5c1NxbERhdGFiYXNlSUR9OyAtLSBodHRwczovL2dpdGh1Yi5jb20vamhzcGV0ZXJzc29uL2ZzZWxlY3RcXG5cbiAgICAgICAgICAgIFNFTEVDVCBzaXplLCBwYXRoXG4gICAgICAgICAgICAgIEZST00gfi93b3Jrc3BhY2VzL2dsLmluZnJhLm1lZGlneS5jb20vbWVkaWd5LWRpZ2l0YWwtcHJvcGVydGllcy9ncG0ubWVkaWd5LmNvbS9jb250ZW50XG4gICAgICAgICAgICAgV0hFUkUgbmFtZSA9ICcqLm1kJ1xuICAgICAgICAgICAgIExJTUlUIDUwYCksXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICB9LCB7XG4gICAgICBuYW1lOiBcIm9zcXVlcnlcIixcbiAgICAgIGxhYmVsOiBcIm9zUXVlcnkgKG9wZXJhdGluZyBzeXN0ZW0pXCIsXG4gICAgICBzcWxTdG10czogW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0YWJhc2U6IERCKHNxbFNoRy5vc1F1ZXJ5RGF0YWJhc2VJRCksXG4gICAgICAgICAgbmFtZTogXCJzeXN0ZW0taW5mb1wiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgc3lzdGVtIGluZm9ybWF0aW9uXCIsXG4gICAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3NxbFNoRy5vc1F1ZXJ5RGF0YWJhc2VJRH07IC0tIGh0dHBzOi8vb3NxdWVyeS5pby9cXG5cbiAgICAgICAgICAgIFNFTEVDVCBjb21wdXRlcl9uYW1lLCBob3N0bmFtZSwgY3B1X2JyYW5kLCBjcHVfcGh5c2ljYWxfY29yZXMsIGNwdV9sb2dpY2FsX2NvcmVzLCBwcmludGYoXCIlLjJmXCIsIChwaHlzaWNhbF9tZW1vcnkgLyAxMDI0LjAgLyAxMDI0LjAgLyAxMDI0LjApKSBhcyBtZW1vcnlfZ2JcbiAgICAgICAgICAgIEZST00gc3lzdGVtX2luZm9gKSxcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0YWJhc2U6IERCKHNxbFNoRy5vc1F1ZXJ5RGF0YWJhc2VJRCksXG4gICAgICAgICAgbmFtZTogXCJjb25maWctZmlsZXMtaW5mb1wiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgb3V0cHV0IG9mIGFsbCBjb25maWd1cmF0aW9uIGZpbGVzIGF2YWlsYWJsZSB2aWEgQXVnZWFzXCIsXG4gICAgICAgICAgU1FMOiB3aHMudW5pbmRlbnRXaGl0ZXNwYWNlKGBcbiAgICAgICAgICAgIFVTRSBEQVRBQkFTRSAke3NxbFNoRy5vc1F1ZXJ5RGF0YWJhc2VJRH07IC0tIGh0dHBzOi8vb3NxdWVyeS5pby9cXG5cbiAgICAgICAgICAgIFNFTEVDVCAqXG4gICAgICAgICAgICAgRlJPTSBhdWdlYXNcbiAgICAgICAgICAgIExJTUlUIDUwYCksXG4gICAgICAgICAgcHJlc2VudGF0aW9uOiB0YWJsZU9iamVjdFByb3BzLFxuICAgICAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGFiYXNlOiBEQihzcWxTaEcub3NRdWVyeURhdGFiYXNlSUQpLFxuICAgICAgICAgIG5hbWU6IFwiaG9zdHMtaW5mb1wiLFxuICAgICAgICAgIGxhYmVsOiBcIlNob3cgb3V0cHV0IG9mIC9ldGMvaG9zdHMgdXNpbmcgQXVnZWFzIHdyYXBwZXJcIixcbiAgICAgICAgICBTUUw6IHdocy51bmluZGVudFdoaXRlc3BhY2UoYFxuICAgICAgICAgICAgVVNFIERBVEFCQVNFICR7c3FsU2hHLm9zUXVlcnlEYXRhYmFzZUlEfTsgLS0gaHR0cHM6Ly9vc3F1ZXJ5LmlvL1xcblxuICAgICAgICAgICAgU0VMRUNUICpcbiAgICAgICAgICAgICBGUk9NIGF1Z2Vhc1xuICAgICAgICAgICAgV0hFUkUgYXVnZWFzLnBhdGggPSAnL2V0Yy9ob3N0cydgKSxcbiAgICAgICAgICBwcmVzZW50YXRpb246IHRhYmxlT2JqZWN0UHJvcHMsXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHF1YWxpZmllZE5hbWU6IHF1YWxpZmllZE5hbWVQbGFjZWhvbGRlcixcbiAgICB9XSxcbiAgfTtcblxuICBjb25zdCBpbmRleExpYnJhcmllcyA9IChcbiAgICBsaWJyYXJpZXM6IEl0ZXJhYmxlPFxuICAgICAgcnMuU2VydmVyUnVudGltZVNxbFN0bXRMaWJyYXJ5PFR5cGljYWxTcWxTdG10RGF0YWJhc2VJRD5cbiAgICA+LFxuICApID0+IHtcbiAgICBjb25zdCBpbmRleFNxbFN0bXQgPSAoXG4gICAgICBzcWxzdG10OiBnb3ZuLlNlcnZlclJ1bnRpbWVTcWxTdG10PFR5cGljYWxTcWxTdG10RGF0YWJhc2VJRD4sXG4gICAgICBsaWJyYXJ5OiBycy5TZXJ2ZXJSdW50aW1lU3FsU3RtdExpYnJhcnk8VHlwaWNhbFNxbFN0bXREYXRhYmFzZUlEPixcbiAgICApID0+IHtcbiAgICAgIGlmIChzcWxzdG10LnF1YWxpZmllZE5hbWUgPT0gcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyKSB7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzdCByZXF1aXJlZCBzaW5jZSBzcWxzdG10LnF1YWxpZmllZE5hbWUgaXMgcmVhZC1vbmx5XG4gICAgICAgIChzcWxzdG10IGFzIHsgcXVhbGlmaWVkTmFtZTogc3RyaW5nIH0pLnF1YWxpZmllZE5hbWUgPVxuICAgICAgICAgIGAke2lkZW50aXR5fV8ke2xpYnJhcnkubmFtZX1fJHtzcWxzdG10Lm5hbWV9YDtcbiAgICAgIH1cbiAgICAgIHNxbFN0bXRzSW5kZXguc2V0KHNxbHN0bXQucXVhbGlmaWVkTmFtZSwgc3Fsc3RtdCk7XG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgbGlicmFyeSBvZiBsaWJyYXJpZXMpIHtcbiAgICAgIGlmIChsaWJyYXJ5LnF1YWxpZmllZE5hbWUgPT0gcXVhbGlmaWVkTmFtZVBsYWNlaG9sZGVyKSB7XG4gICAgICAgIC8vIHNwZWNpYWwgY2FzdCByZXF1aXJlZCBzaW5jZSBsaWJyYXJ5LnF1YWxpZmllZE5hbWUgaXMgcmVhZC1vbmx5XG4gICAgICAgIChsaWJyYXJ5IGFzIHsgcXVhbGlmaWVkTmFtZTogc3RyaW5nIH0pLnF1YWxpZmllZE5hbWUgPSBsaWJyYXJ5Lm5hbWU7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHNxbHN0bXQgb2YgbGlicmFyeS5zcWxTdG10cykge1xuICAgICAgICBpbmRleFNxbFN0bXQoc3Fsc3RtdCwgbGlicmFyeSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGluZGV4TGlicmFyaWVzKHJlc3VsdC5saWJyYXJpZXMpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFPLFNBQVMsbUJBQW1CLENBQUMsSUFBWSxFQUFVO0lBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLG1CQUFtQixBQUFDO0lBQzVDLE9BQU8sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFLLElBQUksQ0FB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

/*markdown
TODO: generate this from SQLa
*/

-- Get all tables
SELECT name, type FROM sqlite_schema WHERE type='table' ORDER BY name;

-- Get all fs hosts ("origins")
select * from fs_origin;

-- Get all walked globs
select * from fs_walk;

-- Get all fs entries (paths or files)
select * from fs_entry limit 5;

-- Get all fs path entries only
select * from fs_entry_path limit 5;

-- Get all fs file extensions
select * from fs_entry_file_extn limit 5;

-- Get all fs file entries only
select * from fs_entry_file limit 5;

-- Get tables and counts
SELECT "fs_origin", count(*) FROM fs_origin UNION ALL
SELECT "fs_entry", count(*) FROM fs_entry UNION ALL
SELECT "fs_entry_file", count(*) FROM fs_entry_file UNION ALL
SELECT "fs_entry_file_extn", count(*) FROM fs_entry_file_extn UNION ALL
SELECT "fs_entry_nature", count(*) FROM fs_entry_nature UNION ALL
SELECT "fs_entry_path", count(*) FROM fs_entry_path UNION ALL
SELECT "fs_walk", count(*) FROM fs_walk UNION ALL
SELECT "fs_walk_entry", count(*) FROM fs_walk_entry;

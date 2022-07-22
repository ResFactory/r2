-- TODO: generate this from SQLa

-- Get all tables
SELECT name, type FROM sqlite_schema WHERE type='table' ORDER BY name

-- Get all fs hosts ("origins")
select * from fs_origin

-- Get all fs entries
select * from fs_entry limit 10
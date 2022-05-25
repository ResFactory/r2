For any modules that leverage SQL for functionality, assembling and loading SQL
in a deterministically reproducible manner is crucial.

This SQL Assembler (SQLa) and SQL rendering library is a Deno TypeScript module
which uses the power of JavaScript Template literals (Template strings) to
create SQL components as building blocks.

Instead of inventing yet another template language, `SQLa` uses a set of naming
conventions plus the full power of JavaScript (and TypeScript) Template strings
to prepare the final SQL that will be loaded into the database.

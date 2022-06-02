For any modules that leverage SQL for functionality, assembling and loading SQL
in a deterministically reproducible manner is crucial.

This SQL Assembler (SQLa) and SQL rendering library is a Deno TypeScript module
which uses the power of JavaScript Template literals (Template strings) to
create SQL components as building blocks.

Instead of inventing yet another template language, `SQLa` uses a set of naming
conventions plus the full power of JavaScript (and TypeScript) Template strings
to prepare the final SQL that will be loaded into the database.

## TODO

* Learn from [DataHub](https://datahubproject.io/docs/features) about how to
  document and manage meta data ('data governance') artifacts and incorporate
  appropriate governance capabilities. These are DataHub features we should
  understand and perhaps push into DataHub:
  - Tracing lineage across platforms, datasets, pipelines, charts, etc.
  - Context about related entities across lineage
  - Capture and maintain institutional knowledge using folksonomic identifiers
    (tags) and taxonomies
  - Asset ownership by users and/or user groups
  - Fine-Grained Access Control with Policies
  - Metadata quality & usage analytics
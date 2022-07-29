# TODOs

- [ ] create `factory.ts` (`originate`) which can acquire resources from
      multiple resources with full unit tests for each type of resource
- [ ] make each resource nature independent
  - [ ] Unstructured Text
  - [ ] Delimited text
  - [ ] HTML
  - [ ] Bundle (`.js`, `.ts`)
  - [ ] JSON
  - [ ] SQL
- [ ] Use `lib/resource/persist` for other resource writers (such as SQLa's
      rendering to file)
  - [ ]
- [ ] Migrate SQL resource to the `lib/sql/resource`?
- [ ] Migrate HTML resource to the `lib/html/*`?
- [ ] `delimited-text.ts` shows how to keep its nature, producer, etc. together.
      Perhaps we should do the same with HTML, Markdown, etc. by moving those
      from `lib/resource/persist` into their own resource modules?

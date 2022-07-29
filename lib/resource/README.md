# TODOs

- [ ] create `factory.ts` (`originate`) which can acquire resources from
      multiple resources
- [ ] make each resource nature independent
  - [ ] Unstructured Text
  - [ ] Delimited text
  - [ ] HTML
  - [ ] Bundle (`.js`, `.ts`)
  - [ ] JSON
  - [ ] SQL
- [ ] Migrate SQL resource to the `lib/sql/resource`?
- [ ] Migrate HTML resource to the `lib/html/*`?
- [ ] `delimited-text.ts` shows how to keep its nature, producer, etc. together.
      Perhaps we should do the same with HTML, Markdown, etc. by moving those
      from `lib/resource/persist` into their own resource modules?

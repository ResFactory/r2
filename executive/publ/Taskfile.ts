import * as t from "../../lib/task/core.ts";
import * as pdb from "./publication-db.sqla.ts";

export class Tasks extends t.EventEmitter<{
  help(): void;
  generateDbSchemaAssets(): void;
}> {
  constructor() {
    super();
    // this is ugly but necessary due to events.EventEmitter making _events_ private :-(
    this.on("help", t.eeHelpTask(this));
    this.on("generateDbSchemaAssets", async () => {
      await pdb.persistPublDbSqlAssets();
    });
  }
}

// only execute tasks if Taskfile.ts is being called as a script; otherwise
// it might be imported for tasks or other reasons and we shouldn't "run".
if (import.meta.main) {
  await t.eventEmitterCLI(Deno.args, new Tasks());
}

import * as dt from "./doctor.ts";
import * as ws from "../text/whitespace.ts";

export function shellTasks(options: {
  integrationMarkerEV: string;
}) {
  const { integrationMarkerEV } = options;
  const result = {
    doctor: async (report: dt.DoctorReporter) => {
      const evValue = await $o`echo $${integrationMarkerEV}`;
      report({
        test: () => evValue ? true : false,
        pass: "repo-task alias available",
        fail: `run \`${
          $.blue(
            `eval "$(deno run -A --unstable Taskfile.ts shell-contribs)"`,
          )
        }\``,
      });
    },
    /**
     * Generate ("contribute") aliases, env vars, CLI completions, etc. useful for
     * shells. Using shell-contribs should eliminate need for custom shells, etc.
     * like github.com/netspective-studios/home-creators and allow generic shells to
     * be used.
     * -[ ] TODO: git semver in support/bin
     *
     * usage in zshrc, bashrc or CLI:
     * $ eval "$(deno run -A --unstable Taskfile.ts shell-contribs)"
     */
    // deno-lint-ignore require-await
    shellContribs: async () => {
      console.log(ws.unindentWhitespace(`
        # run Taskfile.ts in the root of the Git repository
        alias repo-task='${integrationMarkerEV}_REPOTASK=yes deno run --unstable -A $(git rev-parse --show-toplevel)/Taskfile.ts'
        # this env var acts as "marker" to indicate whether integration was successful
        export ${integrationMarkerEV}=$SHELL
      `));
    },
  };
  return result;
}

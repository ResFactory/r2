import * as path from "https://deno.land/std@0.145.0/path/mod.ts";
import "https://deno.land/x/dzx@0.3.1/mod.ts";
import * as dt from "./doctor.ts";

export function gitTasks(options?: {
  repoRoot: string;
  gitHooksRelPath: string;
}) {
  const { repoRoot = Deno.cwd(), gitHooksRelPath = ".githooks" } = options ??
    {};
  const result = {
    // Idempotently initializes the repo; sets up .githooks/* as the location for
    // this project's Git hooks and, if .envrc doesn't exist, copy it from the
    // example file.
    init: async () => {
      await $`git config core.hooksPath ${gitHooksRelPath}`;
      await $`git config pull.rebase false`;
    },
    doctor: async (report: dt.DoctorReporter) => {
      try {
        await Deno.lstat(path.join(repoRoot, gitHooksRelPath));
        report({ expected: `${gitHooksRelPath} path exists` });
      } catch (err) {
        report({
          unexpected: `${gitHooksRelPath} path does not exist`,
        });
      }
      if (await $o`git config core.hooksPath` == gitHooksRelPath) {
        report({ expected: `${gitHooksRelPath} setup properly in git config` });
      } else {
        report({
          unexpected: `${gitHooksRelPath} not setup properly in git config`,
        });
      }
    },
    decoratedHook: (
      hookFn: () => Promise<number>,
      onInvalidMsg?: (exitCode: number) => string,
    ) => {
      return async () => {
        const exitCode = await hookFn();
        if (exitCode) {
          console.error(
            onInvalidMsg?.(exitCode) ?? `git hook failed: ${exitCode}`,
          );
          Deno.exit(exitCode);
        }
      };
    },
    hooks: {
      // Called from .githooks/pre-commit to run commit message checks; be sure to use
      // Taskfile.ts init at least once in the cloned repo to use.
      // deno-lint-ignore require-await
      prepareCommitMsg: async (): Promise<number> => {
        let gitHookExitCode = 0;
        // From: https://dev.to/craicoverflow/enforcing-conventional-commits-using-git-hooks-1o5p
        // Build the Regular Expression Options.
        const types =
          "build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test";
        const scopeMinLen = 1;
        const scopeMaxLen = 16;
        const scopeRegEx = `[a-z0-9_.-]{${scopeMinLen},${scopeMaxLen}}`;
        const subjectMinLen = 4;
        const subjectMaxLen = 120;
        const subjectRegEx = `[a-z0-9_. -]{${subjectMinLen},${subjectMaxLen}}`;

        //# Build the Regular Expression String.
        const commitHeadRegEx = new RegExp(
          `^(revert: )?(${types})(\(${scopeRegEx}\))?!?: ${subjectRegEx}[^.]{1,}$`,
        );

        const commitMsgHead = Deno.env.get("GITHOOK_COMMITMSG_HEAD");
        if (commitMsgHead && commitMsgHead.trim().length > 0) {
          //deno-fmt-ignore
          if(!commitHeadRegEx.test(commitMsgHead)) {
            console.info($.red("The commit message was not formatted correctly. Rejecting the commit request."));
            console.info($.dim(" - https://www.conventionalcommits.org/en/v1.0.0/"));
            console.info($.dim(" - https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional\n"));
            console.info($.dim(" Having trouble with the format? Just not sure of how to commit correctly? https://commitlint.io/"));
            console.info($.dim(" Something else happening? Use https://regexr.com/ with the following expression to validate your commit."));
            console.info($.dim(`  - RegEx: /${commitHeadRegEx}/`));
            gitHookExitCode = 101;
          }
        } else {
          //deno-fmt-ignore
          console.info($.red("No commit message supplied. Rejecting the commit request."));
          gitHookExitCode = 102;
        }
        return gitHookExitCode;
      },
      preCommit: async (args?: {
        readonly depsTs?: string;
        readonly sandboxDepsFound?: (depsTs: string) => boolean;
        readonly denoFmt?: boolean;
        readonly denoLint?: boolean;
        readonly denoTest?: boolean;
      }) => {
        const gitHookExitCode = 0;
        const {
          depsTs = "deps.ts",
          sandboxDepsFound,
          denoFmt = true,
          denoLint = true,
          denoTest = true,
        } = args ?? {};
        const commitList = (await $o`git diff --cached --name-only`).split(
          "\n",
        );
        $.verbose = true;
        if (sandboxDepsFound) {
          if (
            commitList.find((fn) => fn == depsTs) && sandboxDepsFound(depsTs)
          ) {
            console.error(
              $.brightRed(
                `local (sandbox) URLs found, cannot commit ${depsTs}`,
              ),
            );
            return 100;
          }
        }
        if (denoFmt) await $`deno fmt`;
        if (denoLint) await $`deno lint`;
        if (denoTest) await $`deno test -A --unstable`;
        return gitHookExitCode;
      },
    },
  };
  return result;
}

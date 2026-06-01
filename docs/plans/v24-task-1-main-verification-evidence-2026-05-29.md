# v24 task-1 main verification evidence

## Result

- Goal id: `v24-main-verification-workbench`
- Task id: `task-1`
- Branch: `v24-task-1-main-verification-readiness-panel`
- Main commit after ff-only merge: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Merge mode: `ff-only`
- Verdict: `MAIN_VERIFICATION_PASSED`
- Main verification passed: `true`
- Evidence written by: `v24 task-1 main-verifier subagent`

This is only task-1 main verification evidence. It does not declare release readiness and does not register any goal gate.

## Workspace handling

The original workspace at `/Users/andy/Documents/project/multi-coding-agent-symphony` had dirty tracked files and untracked v23/Workbench files before this run. I did not clean, stash, revert, or overwrite them.

Runbook verification used a temporary linked worktree:

```text
/tmp/v24-task-1-mainverify.jmq0PC
```

The final evidence file was written back to the original workspace path:

```text
docs/plans/v24-task-1-main-verification-evidence-2026-05-29.md
```

The temporary worktree needed two local setup steps:

- `pnpm install --frozen-lockfile` because the linked worktree had no `node_modules`.
- A temporary ad-hoc signed copy of Codex.app's Node at `/tmp/v24-task-1-node-adhoc/node` because the default Codex.app Node could not load Rolldown's native macOS binding.

Neither setup step changed tracked repository source files in the original workspace.

## Preconditions

Command:

```bash
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
```

Workdir: `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: exit 0.

Observed task-1 state:

```json
{
  "taskId": "task-1",
  "status": "approved",
  "branch": "v24-task-1-main-verification-readiness-panel",
  "reviewVerdict": "APPROVED",
  "mainVerificationRef": null,
  "blockers": []
}
```

Observed goal summary:

```json
{
  "totalTasks": 5,
  "completedTasks": 1,
  "blockedTasks": 0,
  "needsReviewTasks": 0,
  "needsRevisionTasks": 0,
  "releaseReady": false,
  "releaseReadySource": null
}
```

Command:

```bash
git rev-parse v24-task-1-main-verification-readiness-panel
git merge-base --is-ancestor 7bc15cf4a303e2f81f85db21ee4f899921c89a92 v24-task-1-main-verification-readiness-panel
git branch --contains 7bc15cf4a303e2f81f85db21ee4f899921c89a92 --list v24-task-1-main-verification-readiness-panel
```

Workdir: `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: exit 0.

Output:

```text
7bc15cf4a303e2f81f85db21ee4f899921c89a92
* v24-task-1-main-verification-readiness-panel
```

The required branch tip is reachable from the task branch.

## Runbook merge

Command:

```bash
WORKTREE=$(mktemp -d /tmp/v24-task-1-mainverify.XXXXXX)
printf '%s\n' "$WORKTREE"
git worktree add "$WORKTREE" main
cd "$WORKTREE"
git status --short --branch
git pull --ff-only
git merge --ff-only v24-task-1-main-verification-readiness-panel
git rev-parse HEAD
git status --short --branch
```

Workdir: `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: exit 0.

Output:

```text
/tmp/v24-task-1-mainverify.jmq0PC
Preparing worktree (checking out 'main')
HEAD is now at 33d5294 Record v22 release evidence
## main...origin/main [ahead 26]
Already up to date.
Updating 33d5294..7bc15cf
Fast-forward
 .../plans/v24-task-1-review-evidence-2026-05-29.md | 115 +++++++
 .../plans/v24-task-1-worker-evidence-2026-05-29.md | 376 +++++++++++++++++++++
 ...runbook.v24-main-verification-workbench.v1.json | 192 +++++++++++
 frontend/workbench/src/App.jsx                     |  90 +++++
 frontend/workbench/src/api/contracts.js            | 252 ++++++++++++++
 frontend/workbench/src/styles/workbench.css        |   9 +
 .../{index-D6WeclLN.css => index-DfZ2uJ6P.css}     |   9 +
 .../{index-BRTPIdb3.js => index-wQbBCopW.js}       | 267 ++++++++++++++-
 src/symphony/workbench-static/index.html           |   4 +-
 tests/workbench-api-client.test.js                 | 132 ++++++++
 tests/workbench-shell.test.js                      |  34 +-
 11 files changed, 1463 insertions(+), 17 deletions(-)
 create mode 100644 docs/plans/v24-task-1-review-evidence-2026-05-29.md
 create mode 100644 docs/plans/v24-task-1-worker-evidence-2026-05-29.md
 create mode 100644 fixtures/contracts/goal-runbook.v24-main-verification-workbench.v1.json
 rename src/symphony/workbench-static/assets/{index-D6WeclLN.css => index-DfZ2uJ6P.css} (98%)
 rename src/symphony/workbench-static/assets/{index-BRTPIdb3.js => index-wQbBCopW.js} (98%)
7bc15cf4a303e2f81f85db21ee4f899921c89a92
## main...origin/main [ahead 29]
```

## Verification commands

Command:

```bash
pnpm check
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /private/tmp/v24-task-1-mainverify.jmq0PC
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Command:

```bash
pnpm test
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

First result: exit 1 because the new linked worktree had no `node_modules`; six property test files failed to import `fast-check`. The command also printed:

```text
WARN Local package.json exists, but node_modules missing, did you mean to install?
```

Setup command:

```bash
pnpm install --frozen-lockfile
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Output summary:

```text
Lockfile is up to date, resolution step is skipped
dependencies:
+ react 19.2.6
+ react-dom 19.2.6
devDependencies:
+ @stryker-mutator/core 9.6.1
+ @stryker-mutator/tap-runner 9.6.1
+ @vitejs/plugin-react 6.0.2
+ fast-check 4.8.0
+ vite 8.0.14
Done in 1m 5.8s using pnpm v10.30.3
```

Command rerun:

```bash
pnpm check
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Command rerun:

```bash
pnpm test
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Final summary:

```text
tests 702
suites 111
pass 702
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 2494.119
```

Command:

```bash
pnpm workbench:build
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

First result: exit 1. Vite/Rolldown failed before app compilation because Codex.app's Node could not load Rolldown's native macOS binding:

```text
Error: Cannot find native binding.
ERR_DLOPEN_FAILED
code signature ... not valid for use in process: mapping process and mapped file (non-platform) have different Team IDs
```

Setup retry:

```bash
rm -rf node_modules
pnpm install --frozen-lockfile --package-import-method=copy
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

The same `pnpm workbench:build` command still failed with the same Rolldown native binding signature error.

Setup retry:

```bash
codesign --force --sign - node_modules/.pnpm/@rolldown+binding-darwin-arm64@1.0.2/node_modules/@rolldown/binding-darwin-arm64/rolldown-binding.darwin-arm64.node
pnpm workbench:build
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 1 for the build command. The failure was still the same Rolldown native binding signature error.

Final setup command:

```bash
mkdir -p /tmp/v24-task-1-node-adhoc
cp "$(which node)" /tmp/v24-task-1-node-adhoc/node
codesign --force --sign - /tmp/v24-task-1-node-adhoc/node
PATH="/tmp/v24-task-1-node-adhoc:$PATH" node -v
PATH="/tmp/v24-task-1-node-adhoc:$PATH" pnpm workbench:build
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Output:

```text
/tmp/v24-task-1-node-adhoc/node: replacing existing signature
v24.14.0

> multi-coding-agent-symphony@0.1.0 workbench:build /private/tmp/v24-task-1-mainverify.jmq0PC
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DfZ2uJ6P.css   13.47 kB │ gzip:   2.85 kB
src/symphony/workbench-static/assets/index-BMpCI9C4.js   745.37 kB │ gzip: 139.00 kB

✓ built in 65ms
```

Command:

```bash
git diff --check
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Output:

```text

```

Command:

```bash
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

First result: exit 64 because the temp worktree did not have the original workspace's local `.symphony` goal state:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

Setup command:

```bash
ln -s /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony .symphony
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
```

Workdir: `/tmp/v24-task-1-mainverify.jmq0PC`

Result: exit 0.

Observed summary:

```json
{
  "goalId": "v24-main-verification-workbench",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task1": {
    "status": "approved",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": null,
    "blockers": []
  }
}
```

## Build output observation

After the successful Workbench build, the temp worktree had generated static asset differences:

```bash
git status --short --branch
```

Result: exit 0.

```text
## main...origin/main [ahead 29]
 D src/symphony/workbench-static/assets/index-wQbBCopW.js
 M src/symphony/workbench-static/index.html
?? src/symphony/workbench-static/assets/index-BMpCI9C4.js
```

The runbook command `git diff --check` still passed. This observation is recorded because the build rewrote generated Workbench static assets in the temp worktree.

## Gate recommendation

Next gate recommendation: passed.

Rationale: the task branch fast-forwarded cleanly from `main` to `7bc15cf4a303e2f81f85db21ee4f899921c89a92`, `pnpm check` passed, `pnpm test` passed after installing dependencies in the temp worktree, `pnpm workbench:build` passed with the local ad-hoc Node workaround required by Codex.app's signed Node, `git diff --check` passed, and `goal-status` still shows task-1 reviewer approval with no blockers and `mainVerificationRef: null`.

No release-ready claim is made here.

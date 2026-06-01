# v24 task-2 main verification evidence

Goal id: `v24-main-verification-workbench`
Task id: `task-2`
Branch: `v24-task-2-allowlisted-verification-runner`
Expected approval evidence commit: `20bd5bdb8185f811b836e0597cf8683050a32a40`
Verification worktree: `/tmp/v24-task-2-mainverify-retry.rTloRC`
Previous failed verification worktree: `/tmp/v24-task-2-mainverify.UWP7K7`
Original workspace: `/Users/andy/Documents/project/multi-coding-agent-symphony`
Evidence written: `docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md`

## Verdict

Verdict: `MAIN_VERIFICATION_PASSED`
Main verification passed: `true`

Main commit after ff-only merge: `20bd5bdb8185f811b836e0597cf8683050a32a40`
Merge mode: `ff-only`

## Main ref fast-forward

Verdict: `MAIN_REF_FAST_FORWARDED`

Main ref before: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
Main ref after: `20bd5bdb8185f811b836e0597cf8683050a32a40`
Worktree used: `/tmp/v24-task-2-mainref-finalize.sPFcPS`

The existing `/private/tmp/v24-task-1-mainverify.jmq0PC` worktree was removed before creating the fresh main worktree because it was a temporary verification worktree checking out `main` and its local changes were generated verification artifacts only:

```text
 D src/symphony/workbench-static/assets/index-wQbBCopW.js
 M src/symphony/workbench-static/index.html
?? .symphony
?? src/symphony/workbench-static/assets/index-BMpCI9C4.js
```

Commands and results:

```bash
git -C /Users/andy/Documents/project/multi-coding-agent-symphony merge-base --is-ancestor main 20bd5bdb8185f811b836e0597cf8683050a32a40
```

Result: exit `0`; current `main` was an ancestor of the approved task-2 commit.

```bash
git -C /Users/andy/Documents/project/multi-coding-agent-symphony worktree remove --force /private/tmp/v24-task-1-mainverify.jmq0PC
git -C /Users/andy/Documents/project/multi-coding-agent-symphony worktree add /tmp/v24-task-2-mainref-finalize.sPFcPS main
```

Result: exit `0`; the clean main worktree started at `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.

```bash
git pull --ff-only
```

Workdir: `/tmp/v24-task-2-mainref-finalize.sPFcPS`

Result: exit `0`.

```text
Already up to date.
```

```bash
git merge --ff-only v24-task-2-allowlisted-verification-runner
```

Workdir: `/tmp/v24-task-2-mainref-finalize.sPFcPS`

Result: exit `0`.

```text
Updating 7bc15cf..20bd5bd
Fast-forward
17 files changed, 1786 insertions(+), 25 deletions(-)
```

```bash
git rev-parse main
git merge-base --is-ancestor 20bd5bdb8185f811b836e0597cf8683050a32a40 main
```

Workdir: `/tmp/v24-task-2-mainref-finalize.sPFcPS`

Results: `git rev-parse main` printed `20bd5bdb8185f811b836e0597cf8683050a32a40`; the ancestor check exited `0`.

This evidence updates the previous task-2 main verification result. The earlier run completed the ff-only merge, `pnpm check`, `pnpm test`, `git diff --check`, and read-only `goal-status`, but `pnpm workbench:build` failed under `/Applications/Codex.app/Contents/Resources/node` because macOS rejected Rolldown's native binding:

```text
code signature ... not valid for use in process: mapping process and mapped file (non-platform) have different Team IDs
```

The retry reproduced the same Codex.app Node failure, then passed `pnpm workbench:build` with the same local ad-hoc Node workaround recorded in task-1 evidence. No tracked repository source was changed for the workaround. No release-ready claim is made. No goal gate, release gate, merge, tag, or release registration was performed.

## Workspace handling

- The original workspace had unrelated dirty and untracked files before this retry. They were not cleaned, stashed, reverted, or overwritten.
- The prior task-2 worktree was not reused because it was already detached at the previously merged task commit and contained local setup artifacts. A fresh detached worktree was created to preserve the runbook sequence from `main`.
- Dependencies were installed only in the temporary verification worktree with `pnpm install --frozen-lockfile`.
- `.symphony` was symlinked only in the temporary worktree, after verification commands, so the required read-only `goal-status` command could read the original workspace's managed goal state.

## Runbook merge

Command:

```bash
git worktree add --detach /tmp/v24-task-2-mainverify-retry.rTloRC main
```

Workdir: `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: exit `0`.

Relevant output:

```text
Preparing worktree (detached HEAD 7bc15cf)
HEAD is now at 7bc15cf Record v24 task-1 workspace verification rerun
```

Command:

```bash
git status --short --branch
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Output:

```text
## HEAD (no branch)
```

Command:

```bash
git pull --ff-only origin main
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Relevant output:

```text
From https://github.com/Andy20010101/multi-coding-agent-symphony
 * branch            main       -> FETCH_HEAD
Already up to date.
```

Command:

```bash
git merge --ff-only v24-task-2-allowlisted-verification-runner
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Relevant output:

```text
Updating 7bc15cf..20bd5bd
Fast-forward
17 files changed, 1786 insertions(+), 25 deletions(-)
```

Command:

```bash
git rev-parse HEAD
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Output:

```text
20bd5bdb8185f811b836e0597cf8683050a32a40
```

## Local setup

Command:

```bash
which node
node -v
which pnpm
pnpm -v
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Output:

```text
/Applications/Codex.app/Contents/Resources/node
v24.14.0
/Users/andy/Library/pnpm/pnpm
10.30.3
```

Command:

```bash
pnpm install --frozen-lockfile
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Relevant output:

```text
Lockfile is up to date, resolution step is skipped
Packages: +192
dependencies:
+ react 19.2.6
+ react-dom 19.2.6
devDependencies:
+ @stryker-mutator/core 9.6.1
+ @stryker-mutator/tap-runner 9.6.1
+ @vitejs/plugin-react 6.0.2
+ fast-check 4.8.0
+ vite 8.0.14
Done in 726ms using pnpm v10.30.3
```

## Verification commands

Command:

```bash
pnpm check
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Relevant output:

```text
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Command:

```bash
pnpm test
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Final summary:

```text
tests 707
suites 112
pass 707
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 2503.307917
```

Command:

```bash
pnpm workbench:build
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result with Codex.app Node: exit `1`.

Failure reason:

```text
Error: Cannot find native binding.
dlopen(.../node_modules/.pnpm/@rolldown+binding-darwin-arm64@1.0.2/.../rolldown-binding.darwin-arm64.node, 0x0001):
code signature ... not valid for use in process: mapping process and mapped file (non-platform) have different Team IDs
Node.js v24.14.0
ELIFECYCLE Command failed with exit code 1.
```

This matches the previous failed build recorded for `/tmp/v24-task-2-mainverify.UWP7K7`.

Ad-hoc Node retry setup and command:

```bash
mkdir -p /tmp/v24-task-2-node-adhoc
cp "$(which node)" /tmp/v24-task-2-node-adhoc/node
codesign --force --sign - /tmp/v24-task-2-node-adhoc/node
PATH="/tmp/v24-task-2-node-adhoc:$PATH" node -v
PATH="/tmp/v24-task-2-node-adhoc:$PATH" which node
PATH="/tmp/v24-task-2-node-adhoc:$PATH" pnpm workbench:build
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Relevant output:

```text
/tmp/v24-task-2-node-adhoc/node: replacing existing signature
v24.14.0
/tmp/v24-task-2-node-adhoc/node
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-L2xKuICj.css   14.68 kB │ gzip:   2.96 kB
src/symphony/workbench-static/assets/index-yLJsDk2E.js   752.83 kB │ gzip: 140.38 kB
✓ built in 52ms
```

Environment details for the workaround:

```text
Default node: /Applications/Codex.app/Contents/Resources/node
Default node version: v24.14.0
Ad-hoc node path: /tmp/v24-task-2-node-adhoc/node
Ad-hoc node signature: Signature=adhoc; TeamIdentifier=not set
Rolldown binding signature: Signature=adhoc; TeamIdentifier=not set
Platform: darwin arm64
```

Command:

```bash
git diff --check
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Output: none.

Command:

```bash
ln -s /Users/andy/Documents/project/multi-coding-agent-symphony/.symphony .symphony
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Command:

```bash
pnpm --silent symphony goal-status --goal v24-main-verification-workbench --json
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

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

Observed task-2 fields:

```json
{
  "taskId": "task-2",
  "status": "unknown",
  "reviewVerdict": "APPROVED",
  "mainVerificationRef": "docs/plans/v24-task-2-main-verification-evidence-2026-05-29.md",
  "blockers": []
}
```

## Final worktree status

Command:

```bash
git status --short --branch
```

Workdir: `/tmp/v24-task-2-mainverify-retry.rTloRC`

Result: exit `0`.

Output:

```text
## HEAD (no branch)
?? .symphony
```

The only untracked item in the verification worktree is the read-only `.symphony` symlink used for `goal-status`.

## Gate recommendation

Next gate recommendation: passed.

Rationale: the task branch fast-forwarded cleanly from `main` to `20bd5bdb8185f811b836e0597cf8683050a32a40`; `pnpm check`, `pnpm test`, `pnpm workbench:build` with the local ad-hoc Node workaround, `git diff --check`, and read-only `goal-status` all completed successfully. This recommendation is limited to task-2 main verification and does not declare release readiness.

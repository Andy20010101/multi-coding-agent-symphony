# v39 task-5 main verification evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-5`
Branch: `v39-task-5-restore-validation`
Worktree: `/Users/andy/.codex/worktrees/v39-task-5-restore-validation`
Worker evidence reviewed: `docs/plans/v39-task-5-worker-evidence-2026-06-02.md`
Reviewer evidence reviewed: `docs/plans/v39-task-5-review-evidence-2026-06-02.md`
Reviewer verdict: `APPROVED`
Verifier thread id: `019e96ef-2f66-7963-9e80-a653dd96e9d7`

## Verification result

Main verification passed for the assigned task-5 worktree.

The implementation adds read-only restore validation for `app-core-restore-validation.v1`. It validates the task-3 backup export contract shape, manifest SHA-256, managed state refs, artifact ref hashes, compatible restore path, and no-overwrite default. The route and CLI expose validation only; they do not add restore apply, overwrite, output-file write, arbitrary bundle path read, shell execution, model invocation, git write, self-approval, or release decision paths.

## Evidence checked

- `docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/v39-task-5-worker-evidence-2026-06-02.md`
- `docs/plans/v39-task-5-review-evidence-2026-06-02.md`
- `src/symphony/app-core-restore-validation.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `tests/v39-restore-validation.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `fixtures/contracts/app-core-restore-validation.v1.json`

## Commands run

`pwd && find ...`

Result: passed enough to reconcile the assigned worktree. `rg` was unavailable in this environment, so file discovery used `find`.

`git status --short --branch && git rev-parse HEAD && git branch --show-current`

Result: passed, exit code 0. Branch was `v39-task-5-restore-validation`; head commit was `0dd311201bb128cfbf55509f5afb6cb7873149dd`. The task-5 implementation and evidence files were present as worktree changes.

`pnpm check`

Result: passed, exit code 0.

```text
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: passed, exit code 0.

```text
tests 1030
suites 161
pass 1030
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 7508.877875
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-dnBmRrsG.js   1,283.61 kB
built in 97ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors were reported.

`node --test tests/v39-restore-validation.test.js`

Result: passed, exit code 0.

```text
tests 4
suites 1
pass 4
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 109.319667
```

`pnpm --silent symphony restore validate --goal v39-backup-diagnostics-migration-workspace --task task-5 --json`

Result: passed, exit code 0. The command returned `app-core-restore-validation.v1` with:

- `status: warning`
- `integrity.status: warning`
- `compatibility.status: compatible-with-warnings`
- `compatibility.overwriteDefault: false`
- `boundaries.validationOnly: true`
- `boundaries.confirmRestoreAvailable: false`
- `boundaries.overwritesExistingData: false`
- `boundaries.writesManagedState: false`
- `boundaries.appliesRestore: false`
- `boundaries.arbitraryPathReadAvailable: false`

The warning matches the worker and reviewer evidence: the isolated task worktree has no ignored managed `.symphony` app state refs. Validation still returned no compatibility blockers and kept restore apply disabled.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from `/Users/andy/.codex/worktrees/v39-task-5-restore-validation`

Result: failed, exit code 64.

```text
goal not found
```

This worktree does not contain the ignored managed goal state.

`pnpm --silent symphony goal-status --goal v39-backup-diagnostics-migration-workspace --json` from `/Users/andy/Documents/project/multi-coding-agent-symphony`

Result: passed, exit code 0. The authoritative managed state reported task-5 as `approved`, with `reviewVerdict: APPROVED`, `workerEvidenceRef: docs/plans/v39-task-5-worker-evidence-2026-06-02.md`, `reviewEvidenceRef: docs/plans/v39-task-5-review-evidence-2026-06-02.md`, and `mainVerificationRef: null` before this evidence file was written. `releaseReady` remained `false`.

## Acceptance check

- App/Workbench user path exists through `Restore Validation` and Desktop Shell artifact readiness fields.
- The path is anchored to backend contracts and explicit goal/task context.
- The implementation reuses `app-core-backup-export.v1`, goal/runbook/event refs, and artifact index refs.
- UI state comes from backend contract output, not branch names, filenames, prompt text, task titles, or frontend inference.
- UI does not execute shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- v8 compatibility commands are not presented as the top-level App/Workbench path.
- Restore validation is validation-only and defaults to no overwrite.

## Boundaries

No goal gate, release gate, tag, push, publish, provider CLI, audit, doctor, mutation command, or release closeout command was run in this leased verifier phase.

## Risks

- The assigned worktree lacks ignored managed `.symphony` state, so local `goal-status` fails there and restore validation reports warning-level missing managed state refs. The authorized root checkout has the managed ledger and shows task-5 reviewer approval.
- The runbook's historical main-verifier prompt includes checkout/ff-only merge steps, but this leased verifier was required to use the assigned task-5 worktree and avoid unauthorized mutation. Verification therefore targeted the worker/reviewer result worktree directly.

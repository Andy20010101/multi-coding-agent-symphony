# v39 task-5 reviewer evidence

Goal id: `v39-backup-diagnostics-migration-workspace`
Task id: `task-5`
Branch: `v39-task-5-restore-validation`
Worker evidence reviewed: `docs/plans/v39-task-5-worker-evidence-2026-06-02.md`
Verdict: `APPROVED`

## Review summary

The task-5 implementation satisfies the restore validation scope: it exposes `app-core-restore-validation.v1`, validates the task-3 backup export contract shape, manifest hash, managed state hashes, artifact ref hashes, and compatibility fields, and keeps the path validation-only by default.

Workbench has a visible `Restore Validation` panel and Desktop Shell restore readiness fields. The backend route is `GET /api/restore/validate` and accepts only `goal` and `task`; the CLI surface is `symphony restore validate` and rejects apply/confirm/overwrite/output flags. No restore apply, overwrite, arbitrary bundle path read, shell execution, model invocation, git write, self-approval, main verification, or release readiness path was added.

## Commands run

`git status --short`

Result: passed, exit code 0. The worktree contains the task-5 implementation changes and the worker evidence file on branch `v39-task-5-restore-validation`.

`sed -n '817,965p' docs/plans/app-core-v34-v40-goal-runbooks/v39_backup-diagnostics-migration-workspace_goal_runbook_latest.md`

Result: passed, exit code 0. Confirmed task-5 scope, acceptance criteria, reviewer checks, and review evidence path.

`sed -n '1,260p' docs/plans/v39-task-5-worker-evidence-2026-06-02.md`

Result: passed, exit code 0. Confirmed worker evidence records implementation summary, changed files, test results, Workbench user path, and boundaries.

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
duration_ms 7464.542583
```

`pnpm workbench:build`

Result: passed, exit code 0.

```text
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB
src/symphony/workbench-static/assets/index-dnBmRrsG.js   1,283.61 kB
built in 125ms
```

`git diff --check`

Result: passed, exit code 0. No whitespace errors reported.

`pnpm --silent symphony restore validate --goal v39-backup-diagnostics-migration-workspace --task task-5 --json`

Result: passed, exit code 0. The command returned `app-core-restore-validation.v1` with `status: warning`, `integrity.status: warning`, `compatibility.status: compatible-with-warnings`, `boundaries.validationOnly: true`, `boundaries.confirmRestoreAvailable: false`, `boundaries.overwritesExistingData: false`, and `boundaries.appliesRestore: false`. The warning is expected in this isolated worktree because managed `.symphony` state refs are absent.

## Boundary review

- User-visible App/Workbench workflow exists through `Restore Validation` and Desktop Shell artifact readiness.
- The implementation stays anchored to latest goal/runbook/action contract surfaces and explicit backend contract output.
- UI consumes backend contract data and does not execute shell commands, invoke models, open arbitrary local files, merge, push, tag, publish, or self-approve.
- Restore validation does not replace canonical goal/event/ArtifactStore contracts; it derives from the backup export and artifact index contracts.
- Review did not register a goal event, main verification gate, or release readiness decision.

## Findings

No blocking findings.

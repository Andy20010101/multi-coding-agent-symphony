# v33 task-5 worker evidence

Date: 2026-06-02

Goal id: `v33-app-runtime-foundation`
Task id: `task-5`
Task title: `Runtime operator guide and v34 handoff`
Release name: `v33 App Runtime Foundation`
Baseline: `v32 Release Manager Workspace v2`
Expected branch: `v33-task-5-runtime-guide-v34-handoff`
Actual checkout used: `v33-task-1-local-sidecar-health-api`

## User-visible value

Operators now have a concrete v33 runtime guide for startup, runtime health, project registry, current project resolution, runtime snapshot, Workbench Runtime panel checks, known blockers, and recovery. v34 can pick up the Action Registry design boundary from documented manifest fields, permission preview fields, available actions API shape, candidate actions, and the no-job-execution rule.

## Implementation summary

- Added a `v33 Runtime` operating section to `docs/workbench-operator-guide.md`.
- Added known blocker and recovery steps for dirty checkout, missing active goal, missing project, stale runtime snapshot, invalid query/API request, and release-ready not declared.
- Added a `v34 Action Registry` handoff section to `docs/workbench-operator-guide.md`.
- Added a product-contract handoff section for `available-actions.v1`, action manifest fields, permission preview fields, candidate actions, and no-job-execution boundaries in `docs/symphony-product-contracts.md`.
- Kept the task as documentation/contract handoff work. No v34 code, Action Registry execution, Job Queue, Provider Hub, model invocation, git/release writes, desktop shell, permission system, shell runner, browser terminal, command DSL, new goal framework, or new artifact framework was added.

## Files changed for task-5

- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v33-task-5-worker-evidence-2026-06-02.md`

The checkout already contained staged, modified, and untracked files from v33 task-1 through task-4. I did not revert, unstage, overwrite, stage, commit, merge, pull, push, tag, stash, reset, or switch branches.

## Guide sections added or updated

- `v33 Runtime 操作流程`
- `v33 Runtime 恢复`
- `v34 Action Registry 交接`
- `v34 Action Registry handoff`

The guide covers concrete commands and expected outcomes for:

- `pnpm workbench:build`
- `pnpm symphony console --host 127.0.0.1 --port 8765`
- `pnpm symphony console --snapshot --json`
- `pnpm --silent symphony runtime health --json`
- `pnpm --silent symphony runtime projects --json`
- `pnpm --silent symphony runtime current --json`
- `pnpm --silent symphony runtime current --repo-path /path/to/repo --json`
- `pnpm --silent symphony runtime snapshot --json`
- Workbench `/workbench/` Runtime panel
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json`
- `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json`

## v34 handoff fields covered

Action manifest fields:

```text
action_id
title
description
category
source_contract
goal_id
task_id
role
phase
preconditions
required_inputs
copy_only_command
dry_run_available
confirm_available
writes_scope
event_mapping
evidence_ref_policy
unsupported_reason
```

Permission preview fields:

```text
permission_preview_id
action_id
read_paths
write_paths
network_access
model_invocation
git_write
release_write
job_creation
artifact_download
local_file_open
risk_level
requires_plan_hash
requires_operator_confirm
blocked_reasons
```

Available actions API shape:

```text
GET /api/actions/available?goal=<goal-id>&task=<task-id>
symphony actions available --goal <goal-id> --task <task-id> --json
```

Candidate actions:

```text
goal.workerEvidence.preview
goal.reviewVerdict.preview
goal.mainVerification.preview
goal.releaseGate.preview
runtime.snapshot.refresh
project.current.resolve
prompt.copy
```

No-job-execution boundary: v34 Action Registry may declare actions, permission previews, preconditions, dry-run availability, confirm availability, event mapping, and copy-only command text. It must not create jobs, run actions, execute shell commands, invoke models, write files, write git state, merge, push, tag, publish, download artifacts, open local files, register release readiness, or create the v34 managed goal automatically.

## Commands run with exact results

Boundary-first commands:

| Command | Result |
| --- | --- |
| `git status -sb --untracked-files=all` | Exit 0. Dirty checkout on `v33-task-1-local-sidecar-health-api`; staged/modified task-1/shared files and untracked v33 task-2/task-3/task-4 files were already present. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; total tasks 5, completed tasks 4, releaseReady false; task-1 through task-4 `main-verified`; task-5 `planned`, workerEvidenceRef null. |
| `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-next-action.v1`; status `action-required`; next task `task-5`, role `worker`, phase `implement`, reason `No explicit worker evidence is recorded for task-5.` |

Focused runtime validation:

| Command | Result |
| --- | --- |
| `pnpm --silent symphony runtime health --json` | Exit 0. Returned `local-runtime-health.v1`; status `ok`; `readOnly: true`; runtime version `v33-app-runtime-foundation.1`; kernel source `v32 Release Manager Workspace v2`; cwd/repoPath `/Users/andy/Documents/project/multi-coding-agent-symphony`; all action/job/model/git/release/arbitrary command boundary flags false; `knownBlockers: []`. |
| `pnpm --silent symphony runtime projects --json` | Exit 0. Returned `project-registry.v1`; `readOnly: true`; one project for `/Users/andy/Documents/project/multi-coding-agent-symphony`; required project fields present; registry/database/git/model/release/write boundary flags false. |
| `pnpm --silent symphony runtime current --json` | Exit 0. Returned `current-project-resolver.v1`; `resolution.status: "resolved"`; current project repo path `/Users/andy/Documents/project/multi-coding-agent-symphony`; all write/execution boundary flags false. |
| `pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task5 --json` | Exit 0. Returned `current-project-resolver.v1`; `currentProject: null`; `resolution.status: "unresolved"`; blocker `project-path-missing`. |
| `pnpm --silent symphony runtime snapshot --json` | Exit 0. Returned `app-state-snapshot.v1`; `freshness.status: "current"`; active goal `v33-app-runtime-foundation`; current task `task-5`; next role `worker`; release ready false; known blocker `release-ready-not-declared`; all write/execution boundary flags false. |
| `pnpm symphony console --snapshot --json` | Exit 0. Returned `symphony.console-snapshot`; `status: "ready"`; latest run `symphony-scan-multi-coding-agent-symphony-17ca94e66bb5-mphrq23c-5ai-1`; recommended commands are copy-only. |

Required validation:

| Command | Result |
| --- | --- |
| `pnpm check` | Exit 0. Ran `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`. |
| `pnpm test` | Exit 0. Full suite passed: 776 tests, 119 suites, 776 pass, 0 fail, duration 7063.645208 ms. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14`; 17 modules transformed; built `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-CkJzWTCM.js`; built in 64 ms. |
| `git diff --check` | Exit 0. No output. |
| `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` | Exit 0. Returned `goal-progress-ledger.v1`; total tasks 5, completed tasks 4, releaseReady false; task-1 through task-4 `main-verified`; task-5 remained `planned` with `workerEvidenceRef: null`; release gates all `unknown`. |

## Boundary notes

- Current-checkout fallback used because `git status -sb --untracked-files=all` showed a dirty checkout with prior v33 task files already staged, modified, and untracked. Branch switching, checkout, pull, merge, stash, reset, revert, staging, or commit would have crossed prior task boundaries.
- The task-5 edits are scoped to operator guide, product contract handoff, and this worker evidence file.
- v33 remains read-only: it does not execute actions/jobs/models/git/release writes and does not create a v34 goal.
- No Action Registry, Job Queue, Provider Hub, secret storage, model invocation, budget tracking, backup/restore, Desktop Shell, Personal Workflow Router, generic shell runner, browser terminal, command DSL, new goal framework, new artifact framework, or new permission system was implemented.
- Workbench remains display/copy-only for this task. No UI path was added to execute arbitrary commands, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, or infer release readiness.
- The worker did not run `symphony goal update`, `symphony goal review`, `symphony goal gate`, or `symphony goal closeout`.
- The worker did not register goal update/review/gate/closeout events and did not claim reviewer approval, main verification, release readiness, or release completion.

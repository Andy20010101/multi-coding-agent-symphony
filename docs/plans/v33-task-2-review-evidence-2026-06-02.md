# v33 task-2 review evidence

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Release name: `v33 App Runtime Foundation`
Task id: `task-2`
Task title: `Project registry and current project resolver`
Reviewer thread id: not exposed in this local review context
Worker thread: `019e8610-3426-7180-9fc5-c5c149eb36dd`
Worker evidence ref: `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`
Verdict: `APPROVED`

## Basis

I reviewed the current checkout as a fallback because the repository is on `v33-task-1-local-sidecar-health-api`, not the canonical `v33-task-2-project-registry-resolver` branch, and the worktree contains staged/modified task-1 and task-2 files. I did not checkout, reset, stash, pull, merge, stage, commit, push, tag, or register any goal event.

`git diff --name-status main` was usable for tracked files, but the task-2 module, fixture, test, and worker evidence are untracked and therefore do not appear in that diff. I inspected those files directly and used focused runtime/API commands as equivalent current-checkout evidence.

Authoritative goal state:

- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` returned `goal-progress-ledger.v1`, exit code 0.
- task-1 status is `main-verified`, source `goal-event-log.v1:evt_240bfabb0fc196cc`.
- task-2 status is `in-progress`, source `goal-event-log.v1:evt_8fe5ba94f49de291`.
- task-2 worker evidence ref is `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`.
- task-2 review evidence and review verdict are still null before this review registration.
- `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` returned `goal-next-action.v1`, exit code 0, with `next.taskId: "task-2"`, `role: "reviewer"`, `phase: "review"`.

## Files Inspected

- `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`
- `docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md`
- `docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/project-registry.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `fixtures/contracts/project-registry.v1.json`
- `tests/v33-project-registry.test.js`
- `tests/symphony-cli.test.js`

## Diff Basis

`git status -sb --untracked-files=all`, exit code 0:

```text
## v33-task-1-local-sidecar-health-api
MM README.md
M  docs/plans/v28-release-evidence-2026-05-29.md
A  docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A  docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
AM docs/plans/v33-task-1-review-evidence-2026-06-02.md
A  docs/plans/v33-task-1-worker-evidence-2026-06-02.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/README_HOW_TO_START.md
A  docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
MM docs/symphony-product-contracts.md
MM docs/workbench-operator-guide.md
A  fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
A  fixtures/contracts/local-runtime-health.v1.json
MM scripts/symphony.js
MM src/symphony/console.js
A  src/symphony/local-runtime-health.js
M  tests/symphony-cli.test.js
A  tests/v33-local-runtime-health.test.js
?? docs/plans/v33-task-1-main-verification-evidence-2026-06-02.md
?? docs/plans/v33-task-2-worker-evidence-2026-06-02.md
?? fixtures/contracts/project-registry.v1.json
?? src/symphony/project-registry.js
?? tests/v33-project-registry.test.js
```

`git diff --name-status main`, exit code 0:

```text
M	README.md
A	docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A	docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
A	docs/plans/v33-task-1-review-evidence-2026-06-02.md
A	docs/plans/v33-task-1-worker-evidence-2026-06-02.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/README_HOW_TO_START.md
A	docs/plans/workbench-v33-v40-app-runtime-runbooks/v33_app-runtime-foundation_goal_runbook_latest.md
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
A	fixtures/contracts/goal-runbook.v33-app-runtime-foundation.v1.json
A	fixtures/contracts/local-runtime-health.v1.json
M	scripts/symphony.js
M	src/symphony/console.js
A	src/symphony/local-runtime-health.js
M	tests/symphony-cli.test.js
A	tests/v33-local-runtime-health.test.js
```

Task-2 paths missing from this diff because they are untracked:

- `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`
- `fixtures/contracts/project-registry.v1.json`
- `src/symphony/project-registry.js`
- `tests/v33-project-registry.test.js`

## Implementation Findings

`src/symphony/project-registry.js` exports `project-registry.v1` and `current-project-resolver.v1` builders and validators. It reads only with `lstat` and `readFile`. It resolves from `cwd` or explicit `repoPath`, then walks upward from that input until a `.git` directory or file is found. It does not enumerate arbitrary user directories or scan outside that ancestor chain.

The project object contains all required field names:

- `project_id`
- `project_name`
- `repo_path`
- `default_branch`
- `remote_url`
- `last_goal_id`
- `last_run_id`
- `health_status`
- `last_opened_at`
- `pinned`

Project metadata sources are repo-local and explicit:

- `package.json` for `project_name`.
- `.git/refs/remotes/origin/HEAD`, `.git/config`, and `.git/HEAD` for branch and remote metadata when present.
- `.symphony/goals/latest-active-goal.json` through `readManagedActiveGoalPointer` for `last_goal_id`.
- `.symphony/runs/latest.json` through `readLatestRun` for `last_run_id` and `last_opened_at`.

Missing path and non-git path responses return `currentProject: null`, `resolution.status: "unresolved"`, and blocker ids `project-path-missing` or `project-repo-unresolved`. Missing optional metadata returns null fields or fallback branch/name values without writing metadata.

`scripts/symphony.js` wires:

- `symphony runtime projects [--repo-path <path>] [--json]`
- `symphony runtime current [--repo-path <path>] [--json]`

The runtime parser rejects `--output` with a read-only message and rejects unknown runtime options.

`src/symphony/console.js` wires:

- `GET /api/projects`
- `GET /api/projects/current`
- optional `repoPath` only on `/api/projects/current`

The API method guard returns `405` for unsupported non-GET requests before these routes. `/api/projects` rejects all query parameters with `invalid-project-registry-request`; `/api/projects/current` rejects query parameters other than `repoPath` with `invalid-current-project-request`.

## Commands

- `git status -sb --untracked-files=all` - exit code 0. Dirty checkout on `v33-task-1-local-sidecar-health-api`; task-2 implementation files are untracked.
- `git diff --name-status main` - exit code 0. Tracked v33 task-1/task-2 shared docs and wiring shown; untracked task-2 module/fixture/test not included.
- `pnpm check` - exit code 0. `node --check` completed for `src`, `scripts`, plugin, and test files.
- `pnpm test` - exit code 0. Summary: `tests 768`, `suites 118`, `pass 768`, `fail 0`.
- `pnpm workbench:build` - exit code 0. Vite built `src/symphony/workbench-static/index.html`, CSS, and JS assets.
- `git diff --check` - exit code 0. No whitespace errors.
- `node --test tests/v33-project-registry.test.js` - exit code 0. Summary: `tests 5`, `suites 1`, `pass 5`, `fail 0`.
- `pnpm --silent symphony runtime projects --json` - exit code 0. Returned `project-registry.v1`, `readOnly: true`, one project for `/Users/andy/Documents/project/multi-coding-agent-symphony`, all required fields present, `boundaries.registryDatabaseWritesAvailable: false`, `gitWriteAvailable: false`, `modelInvocationAvailable: false`.
- `pnpm --silent symphony runtime current --json` - exit code 0. Returned `current-project-resolver.v1`, `readOnly: true`, `currentProject.repo_path` set to the workspace, `resolution.status: "resolved"`.
- `pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task2 --json` - exit code 0. Returned `currentProject: null`, `resolution.status: "unresolved"`, blocker `project-path-missing`.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` - exit code 0. Returned task-2 worker evidence registered and review verdict missing.
- `pnpm --silent symphony goal next --goal v33-app-runtime-foundation --json` - exit code 0. Returned task-2 reviewer next action.
- API probe with `createSymphonyConsoleServer` - exit code 0. Results:

```json
[
  {
    "path": "/api/projects",
    "method": "GET",
    "status": 200,
    "contractName": "project-registry.v1",
    "resolutionStatus": "resolved",
    "projectCount": 1
  },
  {
    "path": "/api/projects?path=package.json",
    "method": "GET",
    "status": 400,
    "contractName": "error-envelope.v1",
    "code": "invalid-project-registry-request"
  },
  {
    "path": "/api/projects/current",
    "method": "GET",
    "status": 200,
    "contractName": "current-project-resolver.v1",
    "resolutionStatus": "resolved"
  },
  {
    "path": "/api/projects/current?repoPath=/tmp/does-not-exist-v33-task2",
    "method": "GET",
    "status": 200,
    "contractName": "current-project-resolver.v1",
    "resolutionStatus": "unresolved"
  },
  {
    "path": "/api/projects",
    "method": "POST",
    "status": 405,
    "contractName": "error-envelope.v1",
    "code": "method-not-allowed"
  },
  {
    "path": "/api/projects/current",
    "method": "POST",
    "status": 405,
    "contractName": "error-envelope.v1",
    "code": "method-not-allowed"
  }
]
```

## Acceptance Checklist

- Registry JSON contract is stable, testable, and consumable by CLI/API/UI later: PASS. Fixture, validators, CLI JSON, API JSON, and tests all use the same field names and contract names.
- Required project fields are present and named as required: PASS. Validator and runtime output include all required fields.
- Current project resolver handles cwd: PASS. `runtime current --json` and tests resolve workspace cwd.
- Current project resolver handles explicit repo path: PASS. Tests resolve nested explicit repo path to the fixture repo root.
- Current project resolver handles missing path: PASS. CLI and API return unresolved with `project-path-missing`.
- Current project resolver handles non-git repo: PASS. Focused tests and API test return unresolved with `project-repo-unresolved`.
- Current project resolver handles missing metadata: PASS. Optional metadata readers return null/fallback values without writes; tests cover resolved repos with managed metadata and unresolved repos without metadata.
- Resolver does not automatically scan the whole disk: PASS. It walks only the input path's ancestor chain to find `.git`.
- Resolver does not write repo, write git, invoke models, or execute workflow actions: PASS. Module uses read-only filesystem calls; CLI/API wiring calls only builders.
- v33 does not create a required persistent database migration: PASS. No database, migration, SQLite, or registry write path was added for task-2.
- CLI behavior exists for `runtime projects` and `runtime current`: PASS.
- API behavior exists for `GET /api/projects` and `GET /api/projects/current`: PASS.
- Query and mutation rejection boundaries are present: PASS. API rejects `/api/projects?path=package.json`, `/api/projects/current?path=package.json`, and POST probes.
- Status comes from explicit config/metadata/command output, not filenames, branch names, commits, task titles, prompt text, or frontend-only state: PASS. Project fields come from repo-local metadata and managed Symphony pointers; task/review status remains in the goal ledger and is not inferred by this feature.
- Worker did not self-approve or register review/main verification/release readiness: PASS. Goal ledger shows task-2 review verdict and main verification refs are still null before coordinator registration.

## Boundary Notes

No task-2 implementation path adds Action Registry execution, Job Queue, Provider Hub, secret storage, model invocation, budget tracking, backup/restore, Desktop Shell, generic shell runner, browser terminal, permission system, new goal framework, artifact framework, command DSL, worker/reviewer/main-verification execution path, or release execution path.

The only file writes I performed were this review evidence document. I did not register the review event.

## Blockers

No required revisions found.

## Final Verdict

`APPROVED`

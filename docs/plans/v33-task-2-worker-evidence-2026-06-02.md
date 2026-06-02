# v33 task-2 worker evidence

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Task id: `task-2`
Task: Project registry and current project resolver
Expected branch: `v33-task-2-project-registry-resolver`
Actual checkout used: `v33-task-1-local-sidecar-health-api`

## Summary

Implemented the v33 read-only project registry and current project resolver.

User-visible paths now available:

- `pnpm --silent symphony runtime projects --json`
- `pnpm --silent symphony runtime current --json`
- `pnpm --silent symphony runtime current --repo-path /path/to/repo --json`
- `GET /api/projects`
- `GET /api/projects/current`
- `GET /api/projects/current?repoPath=/path/to/repo`

The registry returns the required project fields:

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

## Files changed for task-2

- `src/symphony/project-registry.js`
- `fixtures/contracts/project-registry.v1.json`
- `tests/v33-project-registry.test.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v33-task-2-worker-evidence-2026-06-02.md`

Existing staged/modified task-1 files were present before this task-2 implementation and were not reverted, unstaged, or overwritten.

## Contract and runtime behavior

`project-registry.v1` reads repo-local metadata from the resolved repository:

- `.git/refs/remotes/origin/HEAD`, `.git/config`, and `.git/HEAD` for branch and remote metadata.
- `package.json` for project name.
- `.symphony/goals/latest-active-goal.json` for `last_goal_id`.
- `.symphony/runs/latest.json` for `last_run_id` and `last_opened_at`.

`current-project-resolver.v1` resolves from cwd by default or from an explicit `--repo-path` / `repoPath` input. Missing paths and non-git paths return `currentProject: null` with explicit blockers instead of scanning elsewhere.

Read-only boundaries in both contracts:

- `readOnly: true`
- `diskScanScope: "cwd-or-explicit-repo-path-only"`
- `registryDatabaseWritesAvailable: false`
- `actionExecutionAvailable: false`
- `jobQueueAvailable: false`
- `modelInvocationAvailable: false`
- `gitWriteAvailable: false`
- `releaseWriteAvailable: false`
- `arbitraryCommandExecutionAvailable: false`

## CLI sample

Command:

```sh
pnpm --silent symphony runtime projects --json
```

Observed shape:

```json
{
  "contractName": "project-registry.v1",
  "readOnly": true,
  "projects": [{
    "project_id": "multi-coding-agent-symphony-multi-coding-agent-symphony",
    "project_name": "multi-coding-agent-symphony",
    "repo_path": "/Users/andy/Documents/project/multi-coding-agent-symphony",
    "default_branch": "main",
    "remote_url": "https://github.com/Andy20010101/multi-coding-agent-symphony.git",
    "last_goal_id": "v33-app-runtime-foundation",
    "last_run_id": "symphony-scan-multi-coding-agent-symphony-17ca94e66bb5-mphrq23c-5ai-1",
    "health_status": "ok",
    "last_opened_at": "2026-05-23T03:07:38.937Z",
    "pinned": false
  }],
  "boundaries": {
    "registryDatabaseWritesAvailable": false,
    "gitWriteAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

Command:

```sh
pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task2 --json
```

Observed blocker shape:

```json
{
  "contractName": "current-project-resolver.v1",
  "readOnly": true,
  "currentProject": null,
  "resolution": {
    "status": "unresolved",
    "strategy": "explicit-repo-path",
    "blockers": [{
      "id": "project-path-missing",
      "severity": "warning"
    }]
  }
}
```

## Validation

Required commands:

- `pnpm check` - passed. Output included `node --check src/*.js ... tests/*.test.js`, exit code 0.
- `pnpm test` - passed. Output summary: `tests 768`, `suites 118`, `pass 768`, `fail 0`, exit code 0.
- `pnpm workbench:build` - passed. Vite built `src/symphony/workbench-static/index.html`, CSS, and JS assets, exit code 0.
- `git diff --check` - passed with no output, exit code 0.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json` - passed, exit code 0. The ledger reported task-1 `main-verified` via `goal-event-log.v1:evt_240bfabb0fc196cc`; task-2 remained `planned` with no worker evidence registered by this worker.

Focused validation:

- `node --test tests/v33-project-registry.test.js` - passed. Output summary: `tests 5`, `suites 1`, `pass 5`, `fail 0`.
- `pnpm --silent symphony runtime projects --json` - passed and returned `project-registry.v1`.
- `pnpm --silent symphony runtime current --json` - passed and returned `current-project-resolver.v1`.
- `pnpm --silent symphony runtime current --repo-path /tmp/does-not-exist-v33-task2 --json` - passed and returned `currentProject: null` with blocker `project-path-missing`.

## Boundary and fallback notes

Branch/worktree check:

```sh
git status -sb
```

Observed checkout:

```text
## v33-task-1-local-sidecar-health-api
MM README.md
M  docs/plans/v28-release-evidence-2026-05-29.md
A  docs/plans/v33-app-runtime-foundation-execution-prompts-2026-06-02.md
A  docs/plans/v33-app-runtime-foundation-plan-2026-06-02.md
AM docs/plans/v33-task-1-review-evidence-2026-06-02.md
A  docs/plans/v33-task-1-worker-evidence-2026-06-02.md
...
```

The canonical task-2 branch was `v33-task-2-project-registry-resolver`, but the checkout had staged and modified task-1 files. Switching branches or checking out main would have disturbed prior task work. I used the allowed repo-local/current-checkout fallback on `v33-task-1-local-sidecar-health-api`.

Fallback evidence basis:

- `git status -sb` showed the dirty staged/modified task-1 state before implementation.
- Task-2 implementation was kept additive and scoped to the runtime registry/resolver module, CLI/API wiring, fixture, focused tests, docs, and this evidence file.
- No git checkout, merge, push, tag, publish, release command, goal update, goal review, goal gate, or goal closeout command was run.

Read-only boundary checks:

- No project registry database or migration was introduced.
- Resolver walks only from cwd or explicit repo path upward to find `.git`.
- No whole-disk scan is performed.
- CLI/API paths do not run git commands; they read repo-local files.
- API routes reject mutation requests. `/api/projects` rejects query parameters, and `/api/projects/current` accepts only `repoPath`.
- No Action Registry execution, Job Queue, Provider Hub, model invocation, budget tracking, backup/restore, Desktop Shell, generic shell runner, browser terminal, permission system, new goal framework, new artifact framework, or command DSL was added.

## Blockers

No implementation blockers remain for task-2 worker scope.

Coordinator still needs to register worker evidence later through the controlled `symphony goal update` dry-run plus confirm flow. This worker did not register the event.

# v33 task-3 worker evidence

Date: 2026-06-02
Goal id: `v33-app-runtime-foundation`
Task id: `task-3`
Task title: `Goal and release state snapshot API`
Worker status: completed

## Branch and boundary

Canonical task branch: `v33-task-3-goal-release-state-snapshot`

Current checkout was `v33-task-1-local-sidecar-health-api` with staged and unstaged v33 task-1/task-2 work already present. Switching branches would have crossed the dirty-worktree boundary. I used the repo-local/current-checkout fallback allowed by the task instruction and did not run checkout, stash, reset, pull, merge, push, tag, stage, or commit.

Boundary checks used:

- `pwd && git status --short --branch`
- `git status --short --branch`
- `git diff --name-only`

## Implementation summary

Added `app-state-snapshot.v1`, a read-only runtime snapshot contract and builder. The snapshot aggregates the current project resolver, local runtime health, active goal ledger, current task, goal next action, review status, main verification status, release status, evidence refs, and known blockers.

Added `symphony runtime snapshot` and `GET /api/runtime/snapshot`. Both paths use existing readers and builders directly. They do not call `goal update`, `goal review`, `goal gate`, or `goal closeout --confirm`; they do not run validation commands, invoke models, execute actions, write git state, write release state, or create jobs.

Missing goal or release data is explicit. For a missing goal, `active_goal` and `release_status` are `null`, and `known_blockers` includes `active-goal-missing` and `release-status-missing`.

## Files changed for task-3

- `src/symphony/app-state-snapshot.js`
- `fixtures/contracts/app-state-snapshot.v1.json`
- `tests/v33-app-state-snapshot.test.js`
- `scripts/symphony.js`
- `src/symphony/console.js`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v33-task-3-worker-evidence-2026-06-02.md`

The worktree also contains earlier task-1/task-2 files and evidence. I left those in place and did not revert or stage them.

## Snapshot fields and source data

- `current_project`: from `resolveCurrentProject`, using cwd or explicit `repoPath` and repo-local `.symphony` metadata.
- `runtime_health`: from `buildLocalRuntimeHealth`.
- `active_goal`: from `goal-progress-ledger.v1`; `null` when managed goal state is missing.
- `current_task`: from `goal-next-action.v1` task id plus the matching ledger task when available.
- `next_action`: from `buildGoalNextAction`.
- `review_status`: current task review verdict and review evidence ref from the ledger.
- `main_verification_status`: current task main verification evidence ref and status source from the ledger.
- `release_status`: release readiness, release-ready source, release gates, and missing/unknown gates from the ledger; `null` when active goal state is missing.
- `evidence_refs`: worker, review, and main verification refs from ledger tasks and next-action evidence state.
- `known_blockers`: runtime blockers, current-project blockers, goal ledger blockers, next-action blocked state, missing goal state, missing release state, and missing release-ready declaration.

Current repo snapshot sample:

```json
{
  "contractName": "app-state-snapshot.v1",
  "currentProject": "multi-coding-agent-symphony",
  "activeGoal": "v33-app-runtime-foundation",
  "currentTask": "task-3",
  "nextRole": "worker",
  "releaseReady": false,
  "evidenceRefs": 6,
  "blockers": ["release-ready-not-declared"]
}
```

Missing-goal sample:

```json
{
  "activeGoal": null,
  "releaseStatus": null,
  "blockers": ["active-goal-missing", "release-status-missing"]
}
```

## API and CLI samples

```sh
pnpm --silent symphony runtime snapshot --json
pnpm --silent symphony runtime snapshot --goal v33-app-runtime-foundation --json
pnpm --silent symphony runtime snapshot --repo-path /path/to/repo --json
```

```text
GET /api/runtime/snapshot
GET /api/runtime/snapshot?goal=v33-app-runtime-foundation
GET /api/runtime/snapshot?repoPath=/path/to/repo
```

API boundary behavior:

- `POST /api/runtime/snapshot` returns `405` with `error-envelope.v1`.
- `GET /api/runtime/snapshot?path=package.json` returns `400` with `invalid-runtime-snapshot-request`.
- The route accepts only `goal` and `repoPath` query parameters.

## Validation

- `pnpm test tests/v33-app-state-snapshot.test.js`: exit 0. Focused suite passed 5 tests.
- `pnpm check`: exit 0.
- `pnpm test`: exit 0. Full suite passed 773 tests.
- `pnpm workbench:build`: exit 0.
- `git diff --check`: exit 0.
- `pnpm --silent symphony goal-status --goal v33-app-runtime-foundation --json`: exit 0. Returned `goal-progress-ledger.v1`; task-1 and task-2 are `main-verified`, task-3 is `planned`, releaseReady is `false`, releaseReadySource is `null`.
- `pnpm --silent symphony runtime snapshot --goal v33-app-runtime-foundation --json`: exit 0. Returned `app-state-snapshot.v1`; current task is `task-3`, next role is `worker`, releaseReady is `false`, evidence refs count is 6.
- `pnpm --silent symphony runtime snapshot --goal missing-goal --json`: exit 0. Returned `active_goal: null`, `release_status: null`, and blockers `active-goal-missing` plus `release-status-missing`.

## Blockers

No implementation blocker remains.

Boundary/fallback note for coordinator: task-3 was implemented on the current dirty checkout instead of switching to `v33-task-3-goal-release-state-snapshot`. This fallback supersedes the branch-switch blocker under the delegation instructions.

## Suggested coordinator command

```sh
pnpm --silent symphony goal update --goal v33-app-runtime-foundation --task task-3 --event worker.evidence-recorded --actor codex-v33-task-3-worker --evidence-ref docs/plans/v33-task-3-worker-evidence-2026-06-02.md --dry-run --json
```

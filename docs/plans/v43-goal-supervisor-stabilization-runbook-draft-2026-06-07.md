# v43 Goal Supervisor Stabilization Runbook Draft

Date: 2026-06-07

Goal id draft: `v43-goal-supervisor-stabilization`

Plan doc: `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`

Fixture draft: `fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`

Status: planning draft only. Do not use this document as evidence that v43 implementation has started.

## Tracked Historical Entry Point

Use the tracked v42 files as the repository baseline for v43 planning and later bootstrap:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

Do not treat untracked `.symphony` state, worktree-only history, or a missing historical fixture reference as the only v43 bootstrap source.

## Start Conditions

- v42 remains frozen.
- Work starts from a clean worktree.
- Planning and bootstrap reconcile from `origin/main` at `d558b88e4dd9bff25d01736b940804cc9091681f` or later.
- No tag, push, publish, release closeout, provider promotion, or raw provider CLI execution is part of bootstrap.
- Active provider boundary remains the v41 controlled runner boundary: `claude-code-cli` and `codex-cli` only.

## Task Sequence

```text
task-1 app-thread-result-protocol
  -> task-2 workspace-evidence-safety
  -> task-3 route-status-reconciliation
  -> task-4 daemon-heartbeat-progress
  -> release closeout only after explicit operator approval
```

## Bootstrap Commands Draft

```sh
git checkout main
git pull --ff-only
git status -sb
git checkout -b codex/v43-bootstrap
```

Validate the fixture draft, then register the goal with the normal dry-run then confirm flow when implementation is actually approved to start:

```sh
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates }));"

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json \
  --goal v43-goal-supervisor-stabilization \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json \
  --goal v43-goal-supervisor-stabilization \
  --confirm \
  --plan-hash sha256:<PLAN_HASH> \
  --json

pnpm --silent symphony goal-status --goal v43-goal-supervisor-stabilization --json
pnpm --silent symphony goal next --goal v43-goal-supervisor-stabilization --json
```

## Worker Prompt Contract

Every v43 child prompt should include these fields after the final thread id is known:

```text
goalId: v43-goal-supervisor-stabilization
taskId: <task-id>
role: <worker|reviewer|main-verifier|release-manager>
threadId: <assigned-thread-id>
branch: <assigned-branch>
worktree: <absolute-assigned-worktree>
baseCommit: <base-commit>
requiredEvidenceRef: <repo-relative-path>
acceptedEvents: <role-specific-events>
```

Every child must end with the existing result block shape from `docs/plans/controller/subagent-result-format.md`. The prompt must show all accepted terminal events for the role. It must not show only the success event when failure or revision events are valid.

## Task Drafts

### task-1: app-thread-result-protocol

Branch draft: `v43-task-1-app-thread-result-protocol`

Worker evidence draft: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`

Implement only the contracts and replay coverage for App thread binding and result consumption:

- stable App-side readback before active lease creation;
- duplicate and unreadable `record-thread` rejection;
- minimal `readThread(threadId)` adapter path;
- bound prompt rendering after thread id assignment;
- append-only parser and result records;
- one correction prompt for missing or malformed result blocks;
- manual recovery action when correction cannot be delivered;
- app-server `notLoaded` as wait state.

### task-2: workspace-evidence-safety

Branch draft: `v43-task-2-workspace-evidence-safety`

Worker evidence draft: `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`

Implement only workspace preparation and evidence safety:

- dependency preflight before dispatch;
- deterministic offline install attempt or blocker;
- verified dirty-baseline inheritance record;
- file inventory including tracked, staged, deleted, and untracked files;
- root checkout status before and after child phases;
- evidence-location rejection before event registration;
- role gate command templates.

### task-3: route-status-reconciliation

Branch draft: `v43-task-3-route-status-reconciliation`

Worker evidence draft: `docs/plans/v43-task-3-worker-evidence-2026-06-07.md`

Implement only deterministic routing and status reconciliation:

- event-sequence transition table;
- failed main verification to worker revision to reviewer to main verifier;
- reviewer approval not counted as main verification;
- `goal-status` mismatch warnings;
- one event per consumed result;
- release closeout blocked until explicit authorization exists.

### task-4: daemon-heartbeat-progress

Branch draft: `v43-task-4-daemon-heartbeat-progress`

Worker evidence draft: `docs/plans/v43-task-4-worker-evidence-2026-06-07.md`

Implement only observability and restart-safe supervisor behavior:

- one documented daemon launch path;
- pid and health validation;
- separate daemon health from manual tick freshness;
- heartbeat no-op when an active child exists;
- operator notifications for blocked and approval-required states;
- active child age and latest read state;
- controlled provider operation progress using v41 operation ids and sanitized refs.

## Scoped Closeout Draft

v43 explicitly inherits the scoped v37-v42 gate set in the current fixture draft. If later work expands that set, update both the fixture and this runbook together. Until then, local evidence commands are:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Do not add mutation, audit, doctor, tag, push, publish, or real provider gates to scoped closeout unless the runbook fixture or operator explicitly requires them.

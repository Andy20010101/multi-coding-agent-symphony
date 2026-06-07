# v43 Plan + /goal Runbook: Goal Supervisor Stabilization

Date: 2026-06-07  Goal id: `v43-goal-supervisor-stabilization`  Baseline: `v42 Goal Supervisor Runtime Context Loop`  Release name: `v43 Goal Supervisor Stabilization`

## Historical Entry Point

Use the tracked v42 files as the repository baseline for v43 planning and execution:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/v42-github-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

Do not treat untracked `.symphony` state, worktree-only history, or missing historical fixture references as the only bootstrap source.

## Product Purpose

Stabilize the temporary project-external supervisor loop so the repository has explicit contracts for child thread binding, bounded result consumption, workspace and evidence safety, deterministic routing, daemon visibility, and restart-safe operator handling.

## Product Spine

```text
tracked v42 baseline -> app thread adapter -> result protocol -> workspace/evidence gates -> route reconciliation -> daemon/progress visibility
```

## Tasks

- `task-1`: App thread and result protocol contracts
- `task-2`: Workspace and evidence safety
- `task-3`: Route engine and status reconciliation
- `task-4`: Daemon, heartbeat, notifications, and progress visibility

## Non-goals

- Do not reopen or reimplement released v42 scope.
- Do not expand active providers beyond `claude-code-cli` and `codex-cli`.
- Do not add raw provider CLI execution, generic shell execution, browser terminals, or renderer-owned command construction.
- Do not create a new product UI beyond the stabilization path.
- Do not infer completion, approval, main verification, release readiness, provider readiness, or workspace safety from branch names, filenames, prompt text, command text, or frontend state.
- Do not automate tag, push, publish, or release closeout without explicit operator approval.

## Task 0: Bootstrap/register this version goal

Recommended docs:

- Plan doc: `docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md`
- Execution prompt doc: `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`
- Global rules: `docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- Version runbook: `docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md`
- Fixture: `fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json`

### Branch setup

```bash
git checkout main
git pull --ff-only
git status -sb
git checkout -b codex/v43-bootstrap
```

### Task 0 worker prompt

```text
/goal
执行 v43 Task 0：为 `v43-goal-supervisor-stabilization` 注册 planning pack，并确认开始基线是 `v42 Goal Supervisor Runtime Context Loop`。

目标：
- Plan doc：docs/plans/v43-goal-supervisor-stabilization-plan-2026-06-07.md
- Execution prompt doc：docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md
- Replay/test matrix：docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md
- Evidence skeletons：docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md
- Global rules：docs/plans/app-core-v43-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md
- Runbook doc：docs/plans/app-core-v43-goal-runbooks/v43_goal-supervisor-stabilization_goal_runbook_latest.md
- Goal-runbook fixture：fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json
- Goal id：v43-goal-supervisor-stabilization
- Baseline：v42 Goal Supervisor Runtime Context Loop
- 任务列表必须包含 task-1 到 task-4。

必须确认：
- 当前 handoff 基线是 origin/main `d558b88e4dd9bff25d01736b940804cc9091681f` 或更晚。
- v43 只做 supervisor stabilization，不重开 v42 released scope。
- tracked v42 plan/runbook/fixture/release evidence 是历史入口；不能只依赖 untracked `.symphony` state。
- 当前 fixture 明确继承 scoped closeout gate set：`pnpm check`、`pnpm test`、`pnpm workbench:build`、`git diff --check`、docs-updated evidence。

禁止：
- 不实现产品代码。
- 不扩张 provider allowlist。
- 不创建 generic shell runner 或 raw provider CLI path。
- 不登记 task 完成事件。
- 不宣称 release ready。

验收：
- node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates }));"
- pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v43-goal-supervisor-stabilization.v1.json --goal v43-goal-supervisor-stabilization --dry-run --json
- git diff --check
```

### Register goal/runbook

```bash
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

## task-1: App thread and result protocol contracts

Branch: `v43-task-1-app-thread-result-protocol`
Worker evidence: `docs/plans/v43-task-1-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-1-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-1-main-verification-evidence-2026-06-07.md`

### User-visible value

Supervisor only consumes bounded, replayable child results. It does not guess task state from chat prose.

### Implementation scope

Stabilize child thread binding, `readThread(threadId)` readback, append-only result parsing, one bounded correction path, and explicit manual recovery when result correction fails.

### Acceptance

- Created threads are not considered active until the App adapter can read them back.
- Duplicate bindings and unreadable thread ids are rejected before lease activation.
- Result parsing is append-only and idempotent.
- Missing or malformed result blocks trigger one bounded correction path before manual recovery.
- `notLoaded` remains a non-mutating wait state.

### Prompt refs

- Worker/reviewer/main verification prompts: `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`

## task-2: Workspace and evidence safety

Branch: `v43-task-2-workspace-evidence-safety`
Worker evidence: `docs/plans/v43-task-2-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-2-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-2-main-verification-evidence-2026-06-07.md`

### User-visible value

Child work happens only in prepared worktrees, and evidence cannot silently land in the root checkout or outside the assigned workspace.

### Implementation scope

Add dependency preflight, deterministic setup or blocker handling, verified dirty-baseline inheritance records, tracked/staged/deleted/untracked inventory, root checkout mutation checks, and evidence-location rejection.

### Acceptance

- Dependency readiness is checked before dispatch.
- Known-bad worktrees register explicit blockers instead of dispatching a child anyway.
- Verified dirty-baseline inheritance records source and target details.
- Results are rejected when evidence exists only in the root checkout or outside the assigned worktree.
- Verification inventory records tracked modifications, staged changes, deletions, and untracked files.

### Prompt refs

- Worker/reviewer/main verification prompts: `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`

## task-3: Route engine and status reconciliation

Branch: `v43-task-3-route-status-reconciliation`
Worker evidence: `docs/plans/v43-task-3-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-3-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-3-main-verification-evidence-2026-06-07.md`

### User-visible value

Supervisor route decisions stay deterministic after review, revision, and failed main verification, and they do not confuse reviewer approval with main verification.

### Implementation scope

Drive next-action decisions from append-only events plus validated results, emit reconciliation warnings when `goal-status` disagrees, and keep release closeout blocked until explicit authorization exists.

### Acceptance

- Reviewer approval is not counted as main verification or full completion.
- Failed main verification routes back through worker revision and reviewer approval before returning to main verification.
- Release closeout remains blocked until explicit authorization is recorded.
- One consumed valid result appends exactly one goal event.
- Reconciliation warnings are based on real event/result state, not copy-only summaries.

### Prompt refs

- Worker/reviewer/main verification prompts: `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`

## task-4: Daemon, heartbeat, notifications, and progress visibility

Branch: `v43-task-4-daemon-heartbeat-progress`
Worker evidence: `docs/plans/v43-task-4-worker-evidence-2026-06-07.md`
Review evidence: `docs/plans/v43-task-4-review-evidence-2026-06-07.md`
Main verification evidence: `docs/plans/v43-task-4-main-verification-evidence-2026-06-07.md`

### User-visible value

Operators can see whether the daemon is healthy, whether a child is stale, and when manual approval or restart is required without reading raw state JSON.

### Implementation scope

Separate daemon health from manual ticks and runner progress, expose stale-child and approval-required notifications, and surface sanitized v41 operation progress when controlled provider checks are active.

### Acceptance

- Daemon health, manual tick freshness, and runner progress are distinct states.
- A stale daemon with an active child does not create duplicate work.
- Blocked and approval-required states are visible without opening raw state files.
- Provider progress cites v41 operation ids and sanitized artifact refs, not raw provider output.
- Restart behavior follows one documented safe path.

### Prompt refs

- Worker/reviewer/main verification prompts: `docs/plans/v43-goal-supervisor-stabilization-execution-prompts-2026-06-07.md`
- Replay/test matrix: `docs/plans/v43-goal-supervisor-stabilization-replay-test-matrix-2026-06-07.md`
- Evidence skeletons: `docs/plans/v43-goal-supervisor-stabilization-evidence-skeletons-2026-06-07.md`

## Scoped Release Gates

The current v43 fixture explicitly inherits the scoped gate set used in v37-v42:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

Default local evidence commands:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Docs-updated evidence must be written in the task or closeout evidence document. Do not add mutation, audit, doctor, tag, push, publish, or raw provider CLI gates unless the runbook fixture or operator explicitly requires them.

## Closeout Boundary

Release closeout remains an explicit operator action. v43 may prepare closeout evidence and release-gate status, but it must not auto-enter closeout, publish tags, or claim release readiness from daemon or route state alone.

# v42 Plan + /goal Runbook: Goal Supervisor Runtime Context Loop

Date: 2026-06-06  Goal id: `v42-goal-supervisor-runtime-context-loop`  Baseline: `v41 Controlled CLI Provider Runner + Backend Completion`  Release name: `v42 Goal Supervisor Runtime Context Loop`

## Historical Note

This tracked runbook is the repository entry point for a v42 release that was executed through managed goal state plus the temporary project-external local supervisor. Use it for reconciliation, review, and later planning. Do not treat it as proof that the full external supervisor was already merged into product code in v42.

## Product Purpose

Productize the supervisor context loop around managed goals, short-lived child threads, durable state, worktree and evidence boundaries, daemon health, and read-only operator projection.

## Product Spine

```text
managed goal runbook -> supervisor state and routing -> App thread adapter -> workspace and evidence gates -> daemon and heartbeat -> CLI and Workbench projection
```

## Reference Docs

- Plan doc: `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- Global rules: `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- Version runbook: `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- Fixture: `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- Release evidence: `docs/plans/v42-release-evidence-2026-06-06.md`
- GitHub release evidence: `docs/plans/v42-github-release-evidence-2026-06-06.md`
- Local supervisor MVP notes: `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

Use these tracked files as the v42 historical entry point. Do not depend on untracked `.symphony` state as the only source.

## Tasks

- `task-0`: Bootstrap v42 runbook, fixture, and managed goal.
- `task-1`: State store and route engine contracts.
- `task-2`: App thread adapter and result protocol.
- `task-3`: Workspace manager and evidence-location gates.
- `task-4`: Daemon, heartbeat, operator notification, and progress monitor.
- `task-5`: Workbench and CLI projection.

## Non-goals

- No generic shell runner.
- No raw provider CLI execution.
- No Gemini CLI, Kiro CLI, or DeepSeek active provider promotion.
- No renderer-side shell or provider execution.
- No merge, push, tag, publish, or self-approval controls.
- No claim that the temporary project-external supervisor is already a fully merged product module.

## Task 0: Bootstrap/register this version goal

Recommended docs:

- `docs/plans/v42-goal-supervisor-runtime-context-loop-plan-2026-06-06.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_LATEST_COMMANDS.md`
- `docs/plans/app-core-v41-v42-goal-runbooks/v42_goal-supervisor-runtime-context-loop_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json`
- `docs/plans/v42-release-evidence-2026-06-06.md`
- `docs/plans/controller/local-goal-supervisor-v42-mvp-notes-2026-06-06.md`

Historical fixture validation:

```bash
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates }));"
```

Historical managed-goal registration flow:

```bash
pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json \
  --goal v42-goal-supervisor-runtime-context-loop \
  --dry-run --json

pnpm --silent symphony goal init \
  --from-json fixtures/contracts/goal-runbook.v42-goal-supervisor-runtime-context-loop.v1.json \
  --goal v42-goal-supervisor-runtime-context-loop \
  --confirm \
  --plan-hash sha256:<PLAN_HASH> \
  --json
```

Use this only for controlled replay or inspection. Do not restart v42 implementation on `main` by default.

## Scoped Release Gates

For v42 scoped closeout, the runbook fixture `releaseGates` is the source of truth. When the fixture lists only:

```text
release.pnpm-check
release.pnpm-test
release.workbench-build
release.diff-check
release.docs-updated
```

the default local evidence commands are:

```sh
pnpm check
pnpm test
pnpm workbench:build
git diff --check
```

Docs-updated evidence is written evidence tied to the task or closeout document. Do not add mutation, audit, doctor, tag, push, publish, or raw provider CLI commands to scoped v42 closeout unless a later fixture explicitly adds that gate or an operator requests repository tag or full release validation.

v43 and later must explicitly declare whether this scoped gate set continues unchanged or is replaced.

## v43 Handoff

v43 should treat v42 as a stabilization baseline, not as an invitation to keep editing the released v42 scope. The right input set for v43 planning is:

- tracked v42 plan, runbook, and fixture;
- v42 release evidence and GitHub release evidence;
- local supervisor MVP notes;
- the current `main` and tag state, not untracked managed-goal registry state.

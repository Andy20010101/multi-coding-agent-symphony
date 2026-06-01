# v32 Task 0 Register Goal Template Evidence

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Release name: `v32 Release Manager Workspace v2`  
Worker role: bounded fallback worker for v32 task-0  
Workspace: `/Users/andy/Documents/project/multi-coding-agent-symphony`

## Inputs Inspected

- `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`
- `docs/plans/v32-release-manager-workspace-v2-execution-prompts-2026-06-01.md`
- `fixtures/contracts/goal-runbook.v29-active-task-controlled-implementation-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v30-verified-adoption-workspace-v2.v1.json`
- `fixtures/contracts/goal-runbook.v31-main-verification-runner-evidence-writer.v1.json`
- `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`
- `src/symphony/goal-runbook-contracts.js`
- `src/symphony/goal-runbook-registry.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

## Fixture

Fixture path:

```text
fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json
```

Continuation status: the fixture already existed when this continuation started. I made a narrow fixture update to add the direct `productPurpose`, `productSpine`, task `scope`, and task `evidenceRefs` fields required by the v32 task-0 prompt. The current fixture is valid against `assertGoalRunbookContract`.

Fixture summary:

- Goal id: `v32-release-manager-workspace-v2`
- Release name: `v32 Release Manager Workspace v2`
- Baseline: `v31`, evidence `docs/plans/v31-release-evidence-2026-06-01.md`
- Product purpose and product spine are included in the fixture.
- Tasks included: `task-1` through `task-5`, with title, branch, scope, evidence refs, acceptance, expected evidence, and copy-only validation commands.
- Release gates included: `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.mutation-gate`, `release.audit-high`, `release.diff-check`, `release.mcas-doctor`, `release.docs-updated`, `release.tag-evidence`

Validation method:

```bash
node --input-type=module -e "import { readFile } from 'node:fs/promises'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json'; const runbook=JSON.parse(await readFile(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ ok:true, path, taskCount: runbook.tasks.length, releaseGateCount: runbook.releaseGates.length, goalId: runbook.goalId, hasProductPurpose: Boolean(runbook.productPurpose), hasProductSpine: Boolean(runbook.productSpine), tasksHaveScopeAndEvidenceRefs: runbook.tasks.every((task)=>Boolean(task.scope)&&Boolean(task.evidenceRefs)) }));"
```

Exit code: 0

Output:

```json
{"ok":true,"path":"fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json","taskCount":5,"releaseGateCount":9,"goalId":"v32-release-manager-workspace-v2","hasProductPurpose":true,"hasProductSpine":true,"tasksHaveScopeAndEvidenceRefs":true}
```

## Goal Status Context

Before validation:

```bash
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
```

Exit code: 64

Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

After validation:

```bash
pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json
```

Exit code: 64

Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

This is expected before coordinator registration.

## Goal Init Dry Runs

Requested markdown command:

```bash
pnpm --silent symphony goal init --from docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md --goal v32-release-manager-workspace-v2 --dry-run --json
```

Exit code: 64

Output:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal init does not parse markdown paths; use --from-json with a controlled goal-runbook fixture"
}
```

Supported controlled-fixture fallback:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json --goal v32-release-manager-workspace-v2 --dry-run --json
```

Exit code: 0

Result: `goal-runbook-init-plan.v1`; validation status `ok`; taskCount `5`; releaseGateCount `9`; `writesInDryRun: false`; `confirmWritesManagedStateOnly: true`; `automaticEventRegistrationAvailable: false`.

Plan hash:

```text
sha256:8884e74368ba821e3bedef8bee88c54a5c1e4680ea84ca0054af5df57cefe01f
```

Confirm command from dry-run output:

```bash
symphony goal init --goal v32-release-manager-workspace-v2 --from-json fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json --confirm --plan-hash sha256:8884e74368ba821e3bedef8bee88c54a5c1e4680ea84ca0054af5df57cefe01f --json
```

The confirm command was not run.

## Acceptance Commands

```bash
pnpm check
```

Exit code: 0

Outcome: JavaScript syntax check completed.

```bash
pnpm test
```

Exit code: 0

Outcome: `751` tests passed, `0` failed.

```bash
git diff --check
```

Exit code: 0

Outcome: no whitespace errors reported.

## Boundary Notes

- Original v32 task-0 worker thread `019e82f2-ecf7-7953-bd7f-1cda0ac68f47` was reported as long-running active while the coordinator still saw missing v32 task-0 outputs.
- On the first fallback pass, the v32 fixture appeared before writes, so the fallback stopped rather than overwrite it.
- On this continuation, both target files already existed. I treated the current worktree as authoritative, patched the fixture to include the direct fields required by task-0 scope, validated it, and refreshed this evidence with current command results and the current dry-run plan hash.
- Current branch during validation: `v30-task-3-adoption-inspect-and-recovery-view`.
- The checkout was dirty before this continuation, including unrelated docs, frontend/backend files, tests, generated static assets, and v29-v31 artifacts. I did not clean, stash, reset, revert, merge, push, tag, publish, or alter those unrelated files.
- The current CLI rejects markdown `--from` for goal init. The supported coordinator path is the controlled `--from-json` fixture dry-run.
- This evidence refresh does not register the goal and does not declare that v32 is release-ready.
- This continuation supersedes the earlier fallback `workerStatus: blocked` handoff. It does not claim to supersede any original worker output beyond recording the current validated fixture and evidence state.

## Explicit Task-0 Statement

No product code was implemented. No goal was registered. No task completion event, review event, gate event, closeout event, or release-ready event was registered. No `goal update`, `goal review`, `goal gate`, `goal closeout`, merge, push, tag, publish, clean, stash, reset, or revert command was run.

## Files Changed By This Worker

- `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`
- `docs/plans/v32-task0-register-goal-template-evidence-2026-06-01.md`

## Suggested Coordinator Registration Command

Use the controlled-fixture dry-run path in this checkout:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json --goal v32-release-manager-workspace-v2 --dry-run --json
```

Validated confirm command:

```bash
pnpm --silent symphony goal init --goal v32-release-manager-workspace-v2 --from-json fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json --confirm --plan-hash sha256:8884e74368ba821e3bedef8bee88c54a5c1e4680ea84ca0054af5df57cefe01f --json
```

# v30 Task 0 Goal Runbook Fixture Evidence

Date: 2026-06-01
Goal id: `v30-verified-adoption-workspace-v2`
Task: task-0 fallback bootstrap

## Fixture

- Path: `fixtures/contracts/goal-runbook.v30-verified-adoption-workspace-v2.v1.json`
- Contract: `goal-runbook.v1`
- Goal title: `v30 Verified Adoption Workspace v2`
- Baseline evidence: `docs/plans/v29-release-evidence-2026-06-01.md`
- Tasks: task-1 through task-5
- Release gates: `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.diff-check`, `release.docs-updated`

## Fallback Boundary

- Original task-0 worker thread `019e81cb-600e-7650-bc84-eb22e994bfa6` acknowledged scope but did not provide a final handoff after the controller nudge.
- This fallback used the current checkout on branch `v29-task-4-operation-console-and-run-result-bridge`.
- The checkout was already dirty with v29 product, evidence, and static asset changes. This fallback did not revert, clean, stash, switch branches, or edit product code.
- A v30 fixture already existed before fallback edits. It was validated first. The only fixture correction was changing `baseline.evidenceRef` from the v30 plan document to the v29 release evidence document.
- No managed goal registration, goal events, gates, release readiness, merge, push, tag, or publish action was performed.

## Validation Results

Direct contract validation:

```text
Command: node --input-type=module -e "import fs from 'node:fs'; import { assertGoalRunbookContract } from './src/symphony/goal-runbook-contracts.js'; const path='fixtures/contracts/goal-runbook.v30-verified-adoption-workspace-v2.v1.json'; const runbook=JSON.parse(fs.readFileSync(path,'utf8')); assertGoalRunbookContract(runbook); console.log(JSON.stringify({ok:true, goalId:runbook.goalId, tasks:runbook.tasks.length, releaseGates:runbook.releaseGates}));"
Result: exit 0
Output: {"ok":true,"goalId":"v30-verified-adoption-workspace-v2","tasks":5,"releaseGates":["release.pnpm-check","release.pnpm-test","release.workbench-build","release.diff-check","release.docs-updated"]}
```

Goal init dry-run:

```text
Command: pnpm --silent symphony goal init --goal v30-verified-adoption-workspace-v2 --from-json fixtures/contracts/goal-runbook.v30-verified-adoption-workspace-v2.v1.json --dry-run --json
Result: exit 0
Plan hash: sha256:81c58f6b7792ec2166d1a5b17309bb60e26cf843dbfc2a361581effc58175318
Validation status: ok
Dry-run writes: false
Confirm required: true
```

Repository checks:

```text
Command: pnpm check
Result: exit 0
Output: node --check completed for configured src, scripts, plugin, and test files.

Command: pnpm test
Result: exit 0
Output: tests 739; suites 115; pass 739; fail 0; duration_ms 5814.919833

Command: git diff --check
Result: exit 0
Output: no whitespace errors
```

## Registration Handoff

The fixture is valid for controlled registration. The controller can register the managed goal with the dry-run plan hash above, using the confirm command returned by `symphony goal init`.

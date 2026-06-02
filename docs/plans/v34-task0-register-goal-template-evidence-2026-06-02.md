# v34 Task 0 Register Goal Template Evidence

## Scope

- Goal: `v34-action-registry-workspace`
- Branch: `v34-task0-goal-runbook`
- Baseline tag: `v33`
- Baseline release evidence: `docs/plans/v33-release-evidence-2026-06-02.md`
- Source package: `docs/plans/v34-v40-final-app-core-materials.zip`

Task 0 registered the v34 managed goal from controlled runbook JSON, added the extracted v34-v40 planning materials, and prepared the next worker prompt path so v34 task evidence uses the explicit June 2 paths from the runbook.

## Controlled Fixtures

The extracted v34-v40 runbooks were converted into controlled `goal-runbook.v1` fixtures:

- `fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v35-job-queue-run-control-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v36-artifact-evidence-index-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `fixtures/contracts/goal-runbook.v38-provider-hub-capability-profiles.v1.json`
- `fixtures/contracts/goal-runbook.v39-backup-diagnostics-migration-workspace.v1.json`
- `fixtures/contracts/goal-runbook.v40-personal-workflow-router-app-core-release.v1.json`

Each fixture passed `validateGoalRunbookContract` with `ok: true` and no validation errors.

## Command Compatibility

The extracted runbook commands now use the supported controlled fixture form:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json --goal v34-action-registry-workspace --dry-run --json
```

The extracted v34-v40 docs no longer depend on unsupported markdown `goal init --from <plan-doc>` commands. Historical older-version docs were not changed.

## Goal Registration

Dry run:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json --goal v34-action-registry-workspace --dry-run --json
```

Result:

- Exit code: `0`
- Contract: `goal-runbook-init-plan.v1`
- Validation status: `ok`
- Plan hash: `sha256:8781813d2e3c75e487fd100564ff1fcfd27aab7287ac42e2abf7ac4ce1b52742`
- Dry-run writes: `false`

Confirm:

```bash
pnpm --silent symphony goal init --from-json fixtures/contracts/goal-runbook.v34-action-registry-workspace.v1.json --goal v34-action-registry-workspace --confirm --plan-hash sha256:8781813d2e3c75e487fd100564ff1fcfd27aab7287ac42e2abf7ac4ce1b52742 --json
```

Result:

- Exit code: `0`
- Status: `registered`
- Managed runbook: `.symphony/goals/runbooks/v34-action-registry-workspace.json`
- Latest active goal: `.symphony/goals/latest-active-goal.json`

The `.symphony` state files are intentionally ignored by git and were not added to the commit.

## Prompt Evidence Path

`src/symphony/goal-prompt-pack.js` now prefers an explicit evidence path declared in a task acceptance item:

- `Worker evidence path: docs/plans/...md`
- `Review evidence path: docs/plans/...md`
- `Main verification evidence path: docs/plans/...md`

This keeps v19 behavior unchanged when no explicit acceptance path exists, while making v34 task prompts use `docs/plans/v34-task-1-worker-evidence-2026-06-02.md`.

## Validation

| Command | Result |
| --- | --- |
| `node --test tests/v19-goal-prompt-pack.test.js tests/v19-goal-runbook-contracts.test.js` | Exit `0`; 20 tests passed |
| `pnpm check` | Exit `0` |
| `pnpm test` | Exit `0`; 776 tests passed |
| `pnpm workbench:build` | Exit `0`; Vite build completed |
| `git diff --check` | Exit `0` |
| `pnpm --silent symphony goal-status --goal v34-action-registry-workspace --json` | Exit `0`; 5 planned tasks, release ready `false` |
| `pnpm --silent symphony goal next --goal v34-action-registry-workspace --json` | Exit `0`; next action is task-1 worker implementation |

## Boundary

This task did not implement the Action Registry runtime, the job queue, provider hub, desktop shell, backup diagnostics, workflow router, or any v35-v40 feature work. It only registered the v34 managed goal, added the v34-v40 controlled materials, corrected unsupported registration commands in those materials, and fixed prompt evidence path generation needed to start v34 task-1 cleanly.

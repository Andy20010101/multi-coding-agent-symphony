# v25 task-5 worker evidence

Goal id: `v25-controlled-implementation-lane`
Task id: `task-5`
Branch: `v25-task-5-controlled-implementation-tests-docs`
User-visible value: 保证这不是任意 shell 按钮。

## Implementation summary

Added a dedicated v25 regression test file using repo-local fake/frozen fixtures:

- Frozen `symphony do --write --json` plan creation is checked without starting the harness.
- Confirmed execution is checked through `symphony do --confirm-plan <plan-id> --json` with a fake harness and `mainWorktreeWrites: false`.
- Missing real-adapter gate and stale project fingerprint paths fail before the harness can start.
- Task-5 worker evidence registration is checked through Workbench goal event dry-run preview plus matching plan-hash confirm.
- The preview/confirm assertions verify constrained goal commands and `genericShellRunner: false`.

## Files changed

- `tests/v25-controlled-implementation-lane.test.js`
- `docs/plans/v25-task-5-worker-evidence-2026-05-29.md`

## Commands run

- `node --test tests/v25-controlled-implementation-lane.test.js`
  - Result: passed.
  - Summary: 3 tests, 1 suite, 3 pass, 0 fail.
- `pnpm check`
  - Result: passed.
  - Ran `node --check` across source, scripts, plugins, and tests.
- `pnpm test`
  - Result: passed.
  - Summary: 716 tests, 114 suites, 716 pass, 0 fail.
- `pnpm workbench:build`
  - Result: passed.
  - Built `src/symphony/workbench-static/index.html`, `index-BTilLLdo.css`, and `index-C33DSOf4.js`.
- `git diff --check`
  - Result: passed with no output.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json`
  - Result: passed.
  - Summary: 5 total tasks, 4 completed, task-5 planned before worker evidence registration, releaseReady false.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json`
  - Result: passed.
  - Summary: next action is task-5 worker, phase implement, reason: no explicit worker evidence is recorded for task-5.
- `pnpm --silent symphony goal update --goal v25-controlled-implementation-lane --task task-5 --event worker.evidence-recorded --actor codex-v25-task-5-worker --evidence-ref docs/plans/v25-task-5-worker-evidence-2026-05-29.md --dry-run --json`
  - Result: passed.
  - Plan id: `plan_9b9f605b9a5bf3cd`.
  - Plan hash: `sha256:6e5aa5674956df10c49b85ee1815a84608d17e27735f48c090a63e70625ccbbe`.
  - Dry-run writes: false.
- `pnpm --silent symphony goal update --goal v25-controlled-implementation-lane --task task-5 --event worker.evidence-recorded --actor codex-v25-task-5-worker --evidence-ref docs/plans/v25-task-5-worker-evidence-2026-05-29.md --confirm --plan-hash sha256:6e5aa5674956df10c49b85ee1815a84608d17e27735f48c090a63e70625ccbbe`
  - Result: passed.
  - Status: appended.
  - Event id: `evt_9b9f605b9a5bf3cd`.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json` after registration
  - Result: passed.
  - Summary: task-5 status is `in-progress`, worker evidence ref is `docs/plans/v25-task-5-worker-evidence-2026-05-29.md`; no review, main verification, or release-ready evidence was registered.
- `pnpm --silent symphony goal next --goal v25-controlled-implementation-lane --json` after registration
  - Result: passed.
  - Summary: next action moved to task-5 reviewer, phase review, because worker evidence exists and reviewer verdict is missing.

## Acceptance mapping

- Plan: `tests/v25-controlled-implementation-lane.test.js` freezes the write plan and asserts `symphony.execution-plan`, `workspaceWrites: true`, `mainWorktreeWrites: false`, and a copy-only `symphony do --confirm-plan` command.
- Confirm: the same test confirms the plan with a fake harness and asserts isolated workspace execution metadata without changing the fixture project README.
- Missing gate: the real-adapter plan confirmation rejects without `MCAS_RUN_REAL_CODEX` and records no harness call.
- Stale fingerprint: after the frozen plan is created, changing a fixture file causes confirmation to reject with a stale/fingerprint error before the harness starts.
- Worker evidence registration: the Workbench console API test uses the v25 runbook fixture to dry-run `worker.evidence-recorded`, rejects missing `planHash`, then confirms with the returned hash and checks the refreshed goal ledger.

## Boundary notes

- Did not add a generic shell runner.
- Did not use the v8 command surface as the Workbench action model.
- Did not add a new permission framework, safety system, or goal framework.
- Did not register reviewer approval, main verification, release gates, or release readiness.
- The checkout already contained broad unrelated dirty work before task-5 changes. I used the current repo-local checkout and did not stage or commit to avoid mixing unrelated files.
- No escalated approval was requested.

## Reviewer handoff checklist

- Review `tests/v25-controlled-implementation-lane.test.js` against the v25 task-5 scope.
- Confirm the tests use fake/frozen fixtures and do not create an arbitrary shell execution path.
- Confirm worker evidence registration remains a controlled goal update dry-run plus plan-hash confirm.
- Run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.

## Worker evidence registration

Registered through the controlled local CLI dry-run plus confirm path.

- Dry-run plan hash: `sha256:6e5aa5674956df10c49b85ee1815a84608d17e27735f48c090a63e70625ccbbe`
- Confirmed event: `evt_9b9f605b9a5bf3cd`
- Registered event type: `worker.evidence-recorded`
- Registered actor: `codex-v25-task-5-worker`
- Registered evidence ref: `docs/plans/v25-task-5-worker-evidence-2026-05-29.md`

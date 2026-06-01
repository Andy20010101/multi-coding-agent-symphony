# v30 release evidence

Goal id: `v30-verified-adoption-workspace-v2`  
Release name: `v30 Verified Adoption Workspace v2`  
Evidence updated: `2026-06-01T08:48:24Z`  
Release-manager role: evidence and recommendation only

## Source boundary

Release scope follows:

- `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md`
- `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md`

Current checkout fallback was used. The checkout is on branch `v30-task-3-adoption-inspect-and-recovery-view`, not a clean main checkout. Existing modified and untracked files were left in place. No clean, stash, revert, checkout, pull, merge, push, tag, publish, goal event registration, release gate registration, or `release.ready` declaration was performed.

## Goal state from managed commands

`pnpm --silent symphony goal closeout --goal v30-verified-adoption-workspace-v2 --json`

- Exit: `0`
- Generated at: `2026-06-01T08:48:16.011Z`
- Summary: `totalTasks: 5`, `workerEvidenceComplete: true`, `reviewEvidenceComplete: true`, `mainVerificationComplete: true`, `releaseReady: false`, `releaseReadySource: null`.
- Missing list: `release.pnpm-check`, `release.pnpm-test`, `release.workbench-build`, `release.diff-check`, `release.docs-updated`.
- Release gates are still `unknown` in the closeout report because no release gates have been registered.

`pnpm --silent symphony goal-status --goal v30-verified-adoption-workspace-v2 --json`

- Exit: `0`
- Generated at: `2026-06-01T08:48:16.653Z`
- Summary: `completedTasks: 5`, `blockedTasks: 0`, `needsReviewTasks: 0`, `needsRevisionTasks: 0`, `releaseReady: false`.
- Task status sources:
  - `task-1`: `main-verified`, `goal-event-log.v1:evt_f6dd021ead55a7a3`
  - `task-2`: `main-verified`, `goal-event-log.v1:evt_5c3aee92ea3328de`
  - `task-3`: `main-verified`, `goal-event-log.v1:evt_86a21e391e03e015`
  - `task-4`: `main-verified`, `goal-event-log.v1:evt_9d872d7520044696`
  - `task-5`: `main-verified`, `goal-event-log.v1:evt_e513b9453b3b0617`

`pnpm --silent symphony goal next --goal v30-verified-adoption-workspace-v2 --json`

- Exit: `0`
- Status: `action-required`
- Next action: `taskId: release`, `role: release-manager`, `phase: release-gate`.
- Reason: `release.pnpm-check is not passed in goal-progress-ledger.v1.`
- Allowed events after completion: `release.gate-passed`, `release.gate-failed`.

Event log check:

- Event log path: `.symphony/goals/events/v30-verified-adoption-workspace-v2.ndjson`
- Observed events: 19
- Release events observed: none.
- Last task gate event observed: `evt_e513b9453b3b0617`, `main.verification-passed`, `task-5`, evidence `docs/plans/v30-task-5-main-verification-evidence-2026-06-01.md`.

## Required release command evidence

`pnpm check`

- Exit: `0`
- Output: `node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js`
- Gate recommendation: `release.pnpm-check` should be registered `passed`.

`pnpm test`

- Exit: `0`
- Output summary: Node test runner completed `745` tests, `115` suites, `745` pass, `0` fail, `0` cancelled, `0` skipped, `0` todo, duration `5130.453917 ms`.
- Gate recommendation: `release.pnpm-test` should be registered `passed`.

`pnpm workbench:build`

- Exit: `0`
- Output summary: Vite `8.0.14` built the Workbench production bundle in `58 ms`.
- Built files reported:
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-jAAl_uMe.css`
  - `src/symphony/workbench-static/assets/index-BP15T8oN.js`
- Gate recommendation: `release.workbench-build` should be registered `passed`.

`git diff --check`

- Exit: `0`
- Output: no whitespace errors.
- Gate recommendation: `release.diff-check` should be registered `passed`.

## Documentation evidence

Concrete doc and evidence checks used for `release.docs-updated`:

- Post-edit docs check command exit: `0`.
- Post-edit docs check output: `checked: 18`, `missing: []`, `gatesMentioned: 5`, `missingGateText: []`.
- v30 runbook exists at `docs/plans/workbench-v29-v32-goal-runbooks/v30_verified-adoption-workspace-v2_goal_runbook_latest.md` and lists the required release gates.
- v30 plan exists at `docs/plans/v30-verified-adoption-workspace-v2-plan-2026-06-01.md` and lists the same five required release gates.
- Task evidence files for `task-1` through `task-5` are present for worker, review, and main verification evidence.
- This release evidence file records command outcomes, closeout missing gates, boundary fallback, and gate-by-gate recommendations.

Gate recommendation: `release.docs-updated` should be registered `passed` after the coordinator accepts this evidence file as the release evidence ref.

## Supporting release-stage checks

`pnpm test:mutation:gate`

- Final exit: unavailable.
- Boundary outcome: interrupted during tool/thread boundary before a final Stryker result was captured.
- Coordinator-provided last visible evidence: Stryker initial dry run succeeded; later progress showed about `6%` complete with `1` surviving mutant and no final exit code.
- Release impact: this is supporting evidence for this runbook handoff, not one of the five required release gates. The interruption does not change the five required release-gate recommendations above. Do not register a mutation gate from this run.

`pnpm audit --audit-level high`

- Exit: `0`
- Output: `1 vulnerabilities found`; severity summary: `1 moderate`.
- Release impact: no high-severity audit failure reported by this command.

`pnpm mcas doctor`

- Exit: `0`
- Output summary: JSON status `ok`, node `24.14.0`, package manager `pnpm`, commands include `doctor`, `intake`, `github issue`, `harness run-taskpacket`, `queue manual`, `run-next`, `run-task`, `smoke`, and `eval replay`.

## Gate recommendations

| Gate | Recommendation | Evidence |
| --- | --- | --- |
| `release.pnpm-check` | `passed` | `pnpm check`, exit `0` |
| `release.pnpm-test` | `passed` | `pnpm test`, exit `0`, `745` tests passed |
| `release.workbench-build` | `passed` | `pnpm workbench:build`, exit `0`, Workbench static bundle built |
| `release.diff-check` | `passed` | `git diff --check`, exit `0`, no output |
| `release.docs-updated` | `passed` | v30 runbook and plan checked, task evidence files present, this release evidence file updated |

## Coordinator handoff

Closeout is still missing release gates before coordinator registration:

- `release.pnpm-check`
- `release.pnpm-test`
- `release.workbench-build`
- `release.diff-check`
- `release.docs-updated`

The coordinator can register the five required release gates with `symphony goal gate` dry-run plus plan-hash confirm if it accepts this current-checkout fallback evidence. Release readiness remains pending coordinator gate registration. Do not declare `release.ready` unless a later closeout reports `releaseReady: true` with `missing: []`, or the coordinator has registered all required gates and then explicitly performs the separate `release.ready` dry-run plus confirm flow required by the runbook.

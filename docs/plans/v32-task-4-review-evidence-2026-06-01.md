# v32 task-4 review evidence

Date: 2026-06-01
Goal id: `v32-release-manager-workspace-v2`
Release: `v32 Release Manager Workspace v2`
Task id: `task-4`
Task title: `Release.ready closeout confirm`
Verdict: approved

## Evidence inspected

- `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`: task-4 requires a visible Workbench path for controlled `release.ready` declaration, using `goal gate --gate release.ready --status declared` dry-run plus plan-hash confirm; release closeout requires all release gates before `release.ready`.
- `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`: v32 spine is clean baseline, release checklist, release/tag evidence, then controlled `release.ready`; non-goals exclude v8 top-level command model, generic shell runner, model invocation, auto merge/tag/push/publish, and readiness inference from names or prose.
- `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`: task-4 acceptance matches the runbook and keeps worker, reviewer, and main verifier evidence separate.
- `docs/plans/v32-task-4-worker-evidence-2026-06-01.md`: worker describes the release-ready path, touched files, validation commands, and boundary claims. I did not rely on this summary alone.
- `frontend/workbench/src/App.jsx`: `CloseoutGapsPanel`, `ReleaseReadyGateRegistration`, `ReleaseVerificationChecklist`, `ReleaseEvidenceDraft`, `TagEvidencePrompt`, and `GoalEventPlanPreview`.
- `frontend/workbench/src/api/contracts.js`: fixed `release.ready` form definition, release baseline projection, release checklist projection, release-ready gate projection, release/tag evidence draft projections, and explicit release-ready state projection.
- `src/symphony/console.js`: event-plan confirm handler, controlled `gate` confirm body, and refreshed closeout response.
- `tests/workbench-shell.test.js`, `tests/workbench-api-client.test.js`, and `tests/v21-goal-plan-preview-api.test.js`: source-level UI boundary checks, projection checks, and controlled release-ready dry-run/confirm API coverage.
- `src/symphony/workbench-static/index.html` and generated assets referenced by the current static build.

## Commands run

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 759 tests, 116 suites, 0 failures. |
| `pnpm workbench:build` | 0 | Vite build succeeded; static output references `assets/index-Br7sQ7ot.js` and `assets/index-BY5UaxlX.css`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Returned `goal-progress-ledger.v1`. At read time, task-1 through task-3 were `main-verified`; task-4 was already `approved` from `goal-event-log.v1:evt_cb15c3eeee25b199` with review evidence `docs/plans/v32-task-4-review-evidence-2026-06-01.md`; task-4 main verification was still missing; task-5 was `planned`; `releaseReady` was `false`; every release gate was `unknown`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Returned `goal-next-action.v1`. Next action was task-4 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-4 but main verification is missing.` |

## Findings

No product-code blocker found. Review status is `approved`.

The Workbench path is visible and testable in `Closeout Gaps`: the page renders the release baseline resolver, release checklist, `release.ready gate registration`, release evidence draft, and tag evidence draft. `ReleaseReadyGateRegistration` shows current blocker state, pending required release gates, closeout missing counts, and either stop/fix guidance or the controlled event form.

The `release.ready` declaration path uses the controlled goal gate flow. The form definition fixes `eventType` to `release.ready-declared`, `commandName` to `symphony goal gate`, `gate` to `release.ready`, and `gateStatus` to `declared`. The projected command strings are `pnpm --silent symphony goal gate --goal <goal> --gate release.ready --status declared --verifier <release-manager-id> --evidence-ref <release-evidence> --dry-run --json` and the matching confirm pattern with `--confirm --plan-hash sha256:<PLAN_HASH>`.

The form is not available just because closeout text, filenames, branch names, tags, commits, prompts, frontend state, test names, or release notes say ready. `projectReleaseReadyGateRegistration` requires an available closeout report, no blocking closeout gaps, all runbook-required release gates passed, an explicit remaining `release.ready-declared` closeout item, no existing release-ready event, and a non-blocked release baseline. Already-declared release readiness disables duplicate registration.

Confirm readiness is not inferred from the UI. `GoalEventPlanPreview` requires a successful dry-run first, then builds confirm with the returned `planHash`. The backend confirm handler accepts only `update`, `review`, or `gate` command bodies with allowlisted fields; for `gate`, `planHash` is required and `confirmGoalGate` performs the append. The confirm response refreshes `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1`, and the UI displays refreshed closeout contract name, missing count, and `releaseReady`.

The browser path does not add arbitrary shell execution, model invocation, local file open, artifact download, merge, push, tag, publish, or self-approval controls. Release evidence and tag evidence remain display-only/copy-only; tag command result fields show `not-run-by-workbench`. The shell test checks the release closeout panel for the release-ready form and rejects `child_process`, `exec(`, `spawn(`, `window.open`, `navigator.clipboard`, `git merge`, and `git tag` in that panel.

The Workbench top-level model stays on the latest goal/runbook/next-action surface. The source keeps v8 `scan/do/review/verify/status/continue/artifacts` out of the top-level navigation, and the shell test asserts those tokens are not used as the main nav source.

Worker scope did not declare `release.ready` in the inspected worker evidence, and the current read-only goal state still reports `releaseReady: false` with all release gates `unknown`. Worker evidence does not claim reviewer approval, main verification, release gate registration, tag creation, push, publish, merge, staging, or commit.

## Boundary notes

- Current checkout is dirty and on `v30-task-3-adoption-inspect-and-recovery-view`. I used the repo-local/current-checkout fallback and did not clean, stash, reset, revert, pull, merge, push, tag, publish, stage, commit, or switch branches.
- I did not run `symphony goal review`, `symphony goal update`, `symphony goal gate`, or `symphony goal closeout`.
- The user handoff said task-4 reviewer verdict was missing. The required read-only goal commands now show an existing task-4 `reviewer.approved` event and next action advanced to main verification. I did not create that event.
- A review evidence file already existed before this pass; I rewrote only this file with the current independent review details.
- `pnpm workbench:build` was required validation and refreshed the existing generated Workbench static output. I did not edit product source files.

## Residual risk

I did not drive a live browser session. The review relies on source inspection, generated static output, the full test suite, and the focused shell/API tests that cover the release closeout path and controlled `release.ready` confirm behavior.

## Required revisions

None.

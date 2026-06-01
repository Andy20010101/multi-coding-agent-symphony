# v32 task-4 main verification evidence

Date: 2026-06-01  
Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-4`  
Task title: `Release.ready closeout confirm`  
mainVerificationStatus: passed

## Scope

Verified task-4 only. I did not implement product code and did not run `symphony goal gate`, `symphony goal update`, `symphony goal review`, or `symphony goal closeout`.

The requested coordinator handoff said task-4 main verification was missing. Fresh read-only goal commands now show task-4 already has a `main.verification-passed` event, `evt_09dac99777fb2b2f`, recorded with this evidence ref. I did not create that event. This file records the independent verification result and the current repo-local evidence basis.

## Evidence refs

- Worker evidence exists: `docs/plans/v32-task-4-worker-evidence-2026-06-01.md`.
- Managed event log has task-4 worker event `evt_57b3ac130d866ca0`, actor `v32-task-4-worker`, evidence ref `docs/plans/v32-task-4-worker-evidence-2026-06-01.md`.
- Review evidence exists: `docs/plans/v32-task-4-review-evidence-2026-06-01.md`, verdict `approved`.
- Managed event log has task-4 review event `evt_cb15c3eeee25b199`, actor `v32-task-4-reviewer`, verdict `APPROVED`, evidence ref `docs/plans/v32-task-4-review-evidence-2026-06-01.md`.
- Reviewer actor differs from worker actor. The reviewer is independent from the worker in the managed event log.
- Managed event log currently has task-4 main-verification event `evt_09dac99777fb2b2f`, actor `v32-task-4-main-verifier`, evidence ref `docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md`.
- `rg -n 'release\.ready-declared|"name":"release\.|"eventType":"release\.gate' .symphony/goals/events/v32-release-manager-workspace-v2.ndjson` returned exit `1`, so no `release.ready-declared` or release gate events are present in the v32 event log.

## Code and test basis

- Runbook task-4 requires controlled `goal gate --gate release.ready --status declared` dry-run plus plan-hash confirm; closeout after confirm must have no gaps.
- `frontend/workbench/src/api/contracts.js:203` to `frontend/workbench/src/api/contracts.js:215` defines the `release.ready-declared` form as `symphony goal gate`, `gate: release.ready`, `gateStatus: declared`, actor role `release-manager`.
- `frontend/workbench/src/api/contracts.js:219` to `frontend/workbench/src/api/contracts.js:247` keeps the top-level Workbench model on `goal-status`, `goal next`, `goal prompt`, and `goal closeout`, not v8 compatibility commands.
- `frontend/workbench/src/api/contracts.js:5413` to `frontend/workbench/src/api/contracts.js:5525` blocks the release-ready form unless the baseline is not blocked, closeout has no blocking gaps, all required release gates are passed, and the only remaining closeout item is the explicit `release.ready-declared` event. It also exposes the fixed dry-run and confirm command patterns with `--plan-hash`.
- `frontend/workbench/src/App.jsx:2789` to `frontend/workbench/src/App.jsx:2846` renders the Closeout Gaps path with `ReleaseReadyGateRegistration`.
- `frontend/workbench/src/App.jsx:3079` to `frontend/workbench/src/App.jsx:3128` renders pending required release gates, stop/fix guidance, or the controlled release-ready form.
- `frontend/workbench/src/App.jsx:5229` to `frontend/workbench/src/App.jsx:5361` requires a successful dry-run preview before confirm and builds confirm from the preview `planHash`.
- `frontend/workbench/src/api/client.js:224` to `frontend/workbench/src/api/client.js:245` fetches event-plan preview with `GET`; `frontend/workbench/src/api/client.js:293` to `frontend/workbench/src/api/client.js:316` posts confirm JSON only to the controlled confirm path.
- `src/symphony/console.js:5924` to `src/symphony/console.js:6032` accepts only `update`, `review`, or `gate` confirm bodies, requires `planHash`, and passes gate confirms through `confirmGoalGate`.
- `src/symphony/console.js:6042` to `src/symphony/console.js:6104` refreshes `goal-progress-ledger.v1`, `goal-event-log.v1`, `goal-next-action.v1`, and `goal-closeout-report.v1` after confirm.
- `tests/v21-goal-plan-preview-api.test.js:677` to `tests/v21-goal-plan-preview-api.test.js:735` covers controlled `release.ready` dry-run plus matching plan-hash confirm and verifies refreshed closeout has `summary.releaseReady: true` and `missing.length: 0`.
- `tests/workbench-api-client.test.js:2654` to `tests/workbench-api-client.test.js:2783` verifies Closeout Gaps uses `goal-closeout-report.v1`, blocks inference from ledger-only release-ready, blocks unknown release gates, and exposes the fixed `release.ready` form only in the ready-to-declare state.
- `tests/workbench-api-client.test.js:2972` to `tests/workbench-api-client.test.js:3009` blocks release-ready registration when the release baseline is dirty or not on `main`.
- `tests/workbench-shell.test.js:645` to `tests/workbench-shell.test.js:689` checks the release closeout UI path and rejects shell, window-open, clipboard, merge, and tag primitives in that panel.
- Built static output contains the task-4 UI path: `src/symphony/workbench-static/assets/index-Br7sQ7ot.js` includes `goal-gate-release-ready-declared`, `release.ready gate registration`, and `goal-closeout-report.v1`.

## Findings

The Workbench path for task-4 is visible and testable in Closeout Gaps. Operators see release baseline state, missing closeout items, release gates, the release verification checklist, `release.ready gate registration`, release evidence draft, and tag evidence draft.

The `release.ready` declaration path is controlled. The form fixes `gateName` to `release.ready` and `gateStatus` to `declared`; the operator supplies verifier and evidence ref, previews a dry-run plan, checks the returned `planHash`, then confirms with the same fields. Confirm appends through the managed event journal and refreshes closeout; the browser does not create a local release-ready state.

Readiness is not inferred from closeout prose, filenames, branch names, tags, commit messages, prompt text, frontend state, test names, release notes text, or copied command strings. Current `goal-status` still reports `releaseReady: false` and all release gates `unknown`.

The browser UI does not execute arbitrary shell commands, invoke models, open local files, download artifacts, merge, push, tag, publish, self-approve, bypass plan-hash confirm, register events directly, or declare release readiness without the explicit gate flow. Release evidence and tag evidence remain display/copy-only.

The top-level Workbench model remains the latest goal/runbook/next-action surface. v8 compatibility commands are not used as the main action list.

## Commands

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check passed for source, scripts, plugins, and tests. |
| `pnpm test` | 0 | Full suite passed: 759 tests, 116 suites, 0 failures. |
| `pnpm workbench:build` | 0 | Vite build succeeded; output paths include `src/symphony/workbench-static/index.html`, `assets/index-Br7sQ7ot.js`, and `assets/index-BY5UaxlX.css`. |
| `git diff --check` | 0 | No whitespace errors. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Returned `goal-progress-ledger.v1`; task-4 is `main-verified` from `goal-event-log.v1:evt_09dac99777fb2b2f`, `releaseReady: false`, release gates all `unknown`, task-5 `planned`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Returned task-5 worker phase, reason `No explicit worker evidence is recorded for task-5.` |

## Boundary and fallback notes

- Current checkout is dirty on `v30-task-3-adoption-inspect-and-recovery-view`. I did not clean, stash, reset, revert, switch branches, pull, merge, push, tag, publish, stage, or commit.
- The runbook ideal path includes checkout to `main`, pull, and ff-only merge. The task instruction required current-checkout fallback when branch/worktree boundaries occur, so this verification used repo-local source, tests, docs, static bundle, prior evidence files, and managed event log reads.
- The evidence file existed as an untracked file before this pass and contained stale goal-state text. I rewrote only this evidence file.
- `pnpm workbench:build` was a required validation command and refreshed generated Workbench static files already present in the dirty checkout.
- I did not run a live browser session. The UI conclusion is based on source inspection, generated static output, Workbench shell tests, API projection tests, the full test suite, and focused event-plan coverage.

## Suggested gate registration command

```bash
pnpm --silent symphony goal gate --goal v32-release-manager-workspace-v2 --task task-4 --gate main-verification --status passed --verifier codex-v32-task-4-main-verifier --evidence-ref docs/plans/v32-task-4-main-verification-evidence-2026-06-01.md --dry-run --json
```

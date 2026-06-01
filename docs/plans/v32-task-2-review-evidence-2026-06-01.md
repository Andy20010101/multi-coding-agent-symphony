# v32 task-2 review evidence

Date: 2026-06-01

Goal id: `v32-release-manager-workspace-v2`  
Release: `v32 Release Manager Workspace v2`  
Task id: `task-2`  
Task title: `Release gate checklist recorder`

Verdict: `approved`

## Evidence inspected

- `docs/plans/workbench-v29-v32-goal-runbooks/v32_release-manager-workspace-v2_goal_runbook_latest.md`, task-2 scope and reviewer prompt.
- `docs/plans/v32-release-manager-workspace-v2-plan-2026-06-01.md`, release gates list and non-goals.
- `fixtures/contracts/goal-runbook.v32-release-manager-workspace-v2.v1.json`, task-2 acceptance and release gate contract list.
- `docs/plans/v32-task-2-worker-evidence-2026-06-01.md`.
- Current event journal read-only check in `.symphony/goals/events/v32-release-manager-workspace-v2.ndjson`.

## Code, tests, and docs inspected

- `frontend/workbench/src/api/contracts.js`: `RELEASE_VERIFICATION_CHECKLIST`, release gate projection, `gate.name` / `gate.id` event lookup, v32 release/tag evidence path helpers, release gate and `release.ready` registration models.
- `frontend/workbench/src/App.jsx`: `Closeout Gaps`, release verification checklist rendering, per-row release gate forms, release-ready section, and controlled dry-run / confirm UI wiring.
- `frontend/workbench/src/api/client.js`: Workbench event preview and confirm client paths.
- `src/symphony/goal-gate.js`: backend `symphony goal gate` dry-run/confirm builder, append event shape, plan hash requirement, and release gate event mapping.
- `src/symphony/console.js`: event-plan preview/confirm route allowlists for `command=gate`, unsupported command rejection, and confirm response safety fields.
- `tests/workbench-api-client.test.js`: closeout-only projection, release gate evidence refs, v32 evidence path, dirty/non-main release-ready block.
- `tests/v23-goal-operation-console-api.test.js`: release gate dry-run and plan-hash confirm without task context.
- `tests/workbench-shell.test.js`: Closeout Gaps UI exposure and absence of browser shell/tag/merge execution paths.
- `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`, and `docs/release-checklist.md`.
- Built static output under `src/symphony/workbench-static/`, including `index.html` and `assets/index-B6N7YEV6.js`.

## Browser UI check

I started the read-only console server with `pnpm symphony console --host 127.0.0.1 --port 8765` and opened `http://127.0.0.1:8765/workbench/` in the in-app browser.

Observed in `#closeout-gaps-panel`:

- `release verification checklist` is visible.
- The checklist has 9 rows.
- Rows are visible for `pnpm check`, `pnpm test`, `pnpm workbench:build`, `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, `git diff --check`, `pnpm mcas doctor`, `release.docs-updated`, and `release.tag-evidence`.
- Each row exposes `Preview dry-run plan` controls and release gate registration text for a fixed `symphony goal gate --gate release.<gate> --status passed ... --dry-run --json` path.
- Checklist row text did not contain `release.ready`, `child_process`, `git merge`, `git push`, or `git tag`.
- The separate `release.ready gate registration` section was visible and blocked by the current dirty/non-main baseline, so it showed stop/fix guidance instead of a confirmable release-ready form.

I did not click preview or confirm in the browser, because this reviewer role must not register events or create extra operation records.

## Validation commands

| Command | Exit code | Outcome |
| --- | ---: | --- |
| `pnpm check` | 0 | Node syntax check completed. |
| `pnpm test` | 0 | Node test runner reported 757 passing tests, 0 failures. |
| `pnpm workbench:build` | 0 | Vite built 17 modules and emitted `src/symphony/workbench-static/index.html`, `assets/index-BY5UaxlX.css`, and `assets/index-B6N7YEV6.js`. |
| `git diff --check` | 0 | No whitespace errors reported. |
| `pnpm --silent symphony goal-status --goal v32-release-manager-workspace-v2 --json` | 0 | Read-only ledger currently reports task-1 `main-verified`, task-2 `approved`, task-2 review evidence `docs/plans/v32-task-2-review-evidence-2026-06-01.md`, task-2 main verification missing, all release gates `unknown`, and `releaseReady: false`. |
| `pnpm --silent symphony goal next --goal v32-release-manager-workspace-v2 --json` | 0 | Read-only next action currently points to task-2 `main-verifier`, phase `main-verification`, reason `Reviewer approved task-2 but main verification is missing.` |

## Findings

- The Workbench user path is visible and testable through `Closeout Gaps -> release verification checklist`.
- The checklist includes the required release gate items: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `pnpm test:mutation:gate`, `pnpm audit --audit-level high`, `git diff --check`, `pnpm mcas doctor`, docs updated, and tag evidence.
- Checklist status is projected from `goal-closeout-report.v1` release gate fields and matching explicit `goal-event-log.v1` release gate events. The implementation accepts both the current backend event shape `gate.name` and older `gate.id`.
- Evidence refs are displayed from explicit gate events when present. The per-row default evidence ref for this goal is `docs/plans/v32-release-evidence-2026-06-01.md`.
- Each release gate row exposes fixed `release.gate-passed` and `release.gate-failed` forms using the existing `goal-update-plan.v1` dry-run and plan-hash confirm flow through `symphony goal gate`.
- `release.ready` is separate from the checklist. In the current dirty/non-main checkout, the release-ready form is blocked by the release baseline resolver.
- I found no release gate pass/fail inference from filenames, branch names, commit messages, prompt text, task titles, frontend state, test names, or closeout prose.
- I found no browser path that executes arbitrary shell commands, invokes models, opens local files, downloads artifacts, merges, pushes, tags, publishes, self-approves, or declares `release.ready` for task-2.
- v8 compatibility commands are not promoted into the top-level Workbench model. The inspected path is anchored to goal-status, goal next, goal prompt, goal update/review/gate, and goal closeout contracts.
- Worker evidence did not approve itself, declare main verification, or declare release readiness.

## Blockers

None.

## Boundary notes

- Current checkout is `v30-task-3-adoption-inspect-and-recovery-view`, not the task-2 branch named in the runbook. The worktree is dirty with unrelated v29-v32 artifacts. I used the repo-local/current-checkout fallback and did not clean, stash, reset, revert, merge, push, tag, publish, stage, or commit.
- The prompt said the current goal next action was task-2 reviewer because reviewer verdict was missing. During this review, read-only goal commands showed task-2 already approved. Read-only journal inspection found pre-existing event `evt_cd61d10b4c8c0286`, `eventType: reviewer.approved`, actor `v32-task-2-reviewer`, evidence ref `docs/plans/v32-task-2-review-evidence-2026-06-01.md`, recorded at `2026-06-01T12:28:12.918Z`. I did not create that event.
- I did not run `symphony goal review`, `symphony goal update`, `symphony goal gate`, or `symphony goal closeout`.
- `pnpm workbench:build` was required for validation and refreshed the generated Workbench static output in place. Product source edits were not made.

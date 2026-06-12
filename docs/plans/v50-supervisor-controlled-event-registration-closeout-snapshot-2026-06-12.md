# v50 Supervisor Controlled Event Registration closeout snapshot

Date: 2026-06-12
Timezone: Asia/Shanghai
Goal: `v50-supervisor-controlled-event-registration`
Baseline tag: `v49`
Pre-closeout main commit: `4df2c8ecd0f2709f5d0e50737033436d65144191`

## Final State

v50 connects the v49 supervisor advisory surface to the existing controlled goal event preview and confirm flow.

The shipped scope is:

- backend-owned `supervisorEventRegistrationEligibility.v1` projected from supervisor contracts, pending result state, task state, and goal event routing rules;
- Workbench supervisor dry-run preview lane that uses `GET /api/goals/<goal-id>/event-plan-preview` and displays the returned `goal-update-plan.v1`;
- Workbench supervisor confirm lane that submits the preview `planHash` to `POST /api/goals/<goal-id>/event-plan-confirm` and displays `goal-event-confirmation.v1`;
- append-only confirm behavior through the existing goal event command path;
- `Refresh Supervisor State` UX that rereads backend contracts after preview or confirm work.

v50 does not ship provider execution, child dispatch, transcript compaction, new thread creation, generic shell or terminal UI, frontend local JSONL or session reads, release/tag automation, GitHub Release creation, or publish automation.

## Reconcile Before PR-5 Edits

| Command | Result |
| --- | --- |
| `git status --short --branch` | `## HEAD (no branch)` before creating `codex/v50-supervisor-controlled-event-registration-closeout`. |
| `git fetch origin main --tags --prune` | Completed from `https://github.com/Andy20010101/multi-coding-agent-symphony`; fetched `main` and tags. |
| `git rev-list --left-right --count main...origin/main` | `0 0` |
| `git log --oneline --decorate -8 origin/main` | `4df2c8e` was `HEAD`, `origin/main`, `origin/HEAD`, and `main`; it merged PR #66. |
| `gh pr list --state open --json number,title,headRefName,baseRefName,url,isDraft` | `[]` |
| `git rev-parse v49^{commit}` | `9dafad52288c9268558da2a4f65df9b4314659d3` |
| `gh release view v49 --json tagName,name,isDraft,isPrerelease,url,targetCommitish,assets,publishedAt` | Release `v49: Context Session Observability and Supervisor Advisory`, URL `https://github.com/Andy20010101/multi-coding-agent-symphony/releases/tag/v49`, not draft, not prerelease, published at `2026-06-12T04:38:28Z`, assets `[]`, targetCommitish `main`. |

## PR Scope Record

| Scope | GitHub PR | Branch | Merge commit | Merged at | Validation evidence |
| --- | --- | --- | --- | --- | --- |
| PR-0 runbook and contract direction | #62 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/62` | `codex/v50-supervisor-controlled-event-registration-runbook` | `ea50f56f8fc51b08b938e3c601dbbafbf013f5d7` | 2026-06-12T05:08:45Z | PR added `docs/plans/v50-supervisor-controlled-event-registration-runbook-2026-06-12.md` and set the event registration boundary. |
| PR-1 supervisor event eligibility projection | #63 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/63` | `codex/v50-supervisor-event-eligibility-projection` | `3b817e5035de064cd7af3e1d67433f176cab072f` | 2026-06-12T05:33:27Z | `tests/v50-supervisor-event-registration-eligibility.test.js` covers eligible worker/blocker events, blocked reviewer/gate events, missing/unsafe evidence refs, raw transcript filtering, and app read-model projection. |
| PR-2 Workbench dry-run preview lane | #64 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/64` | `codex/v50-workbench-supervisor-dry-run-preview-lane` | `07ed0fd23626674389a891c3a185c305e30f53bb` | 2026-06-12T06:29:40Z | Workbench uses `fetchGoalEventPlanPreview`; preview is a controlled GET and dry-run result displays `writesInDryRun: false` without appending. |
| PR-3 confirm append-only event registration | #65 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/65` | `codex/v50-supervisor-event-confirm-append-lane` | `542501d9650213273017ff11ab20deadb494ab16` | 2026-06-12T07:29:33Z | Workbench uses `confirmGoalEventPlan`; tests cover constrained body construction, submitted `planHash`, confirmation display, refreshed contracts, and hash mismatch failure state. |
| PR-4 supervisor UX integration | #66 `https://github.com/Andy20010101/multi-coding-agent-symphony/pull/66` | `codex/v50-supervisor-ux-integration` | `4df2c8ecd0f2709f5d0e50737033436d65144191` | 2026-06-12T07:46:19Z | Workbench source places eligibility, preview, confirm result, blocked reasons, and refresh status inside the supervisor route; tests assert allowed labels and forbidden controls. |

## Generated Workbench Assets

PR #66 refreshed the generated Workbench static output after Workbench source changes.

| Asset change | Evidence |
| --- | --- |
| `src/symphony/workbench-static/assets/index-BtxjPUBj.js` was replaced by `src/symphony/workbench-static/assets/index-CTJ3Hdpv.js`. | `git diff --name-status 542501d..4df2c8e --` shows the generated JS rename. |
| `src/symphony/workbench-static/assets/index-dJIqcKoN.css` was replaced by `src/symphony/workbench-static/assets/index-C476a_Zp.css`. | The same diff shows the generated CSS rename. |
| `src/symphony/workbench-static/index.html` changed to reference the refreshed generated assets. | The same diff shows `src/symphony/workbench-static/index.html` modified. |

PR-5 does not regenerate Workbench assets. It only adds closeout, acceptance, and release-prep documentation.

## PR-5 Validation Evidence

| Command | Result |
| --- | --- |
| `node --test tests/v50-supervisor-event-registration-eligibility.test.js tests/v44-goal-supervisor-app-read-model.test.js` | Passed: 17 tests, 0 failures. |
| `node --test tests/v21-goal-plan-preview-api.test.js tests/v23-goal-operation-console-api.test.js` | Passed: 22 tests, 0 failures. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | First run failed in the independent worktree because `vite` and `react` were not installed. After `pnpm install --frozen-lockfile`, rerun passed: 109 tests, 0 failures. |
| `pnpm install --frozen-lockfile` | Passed; lockfile was already up to date and workspace dependencies were installed locally. |
| `pnpm check` | Passed. |
| `git diff --check` | Passed after final PR-5 docs update. |
| `git diff --cached --check` | Passed after staging the PR-5 docs. |

## Residual Risks

`supervisorEventRegistrationEligibility.v1` depends on the backend projection in `src/symphony/goal-supervisor/event-registration-eligibility.js`. If future pending result shapes change without updating this module, eligible worker/blocker events can be blocked until the projection is adjusted.

Reviewer verdicts and main/release gates are intentionally blocked from the supervisor update lane. Operators still need to use `symphony goal review` and `symphony goal gate` for those event families.

The Workbench lane depends on the existing event preview and confirm routes in `src/symphony/console.js`. A mismatch between preview query construction and confirm body construction will fail before append because confirm requires the returned `planHash`.

Generated Workbench assets are source-derived. Future changes under `frontend/workbench/src/` should run `pnpm workbench:build` and include only the generated asset refresh tied to the source change.

## Rollback Path

If PR #63 eligibility exposes unsafe data or routes the wrong event family, revert `3b817e5035de064cd7af3e1d67433f176cab072f`. The affected files are `src/symphony/goal-supervisor/event-registration-eligibility.js`, `src/symphony/goal-supervisor/app-read-model.js`, and `tests/v50-supervisor-event-registration-eligibility.test.js`.

If PR #64 preview wiring calls the wrong route or makes dry-run look like an append, revert `07ed0fd23626674389a891c3a185c305e30f53bb` and remove the preview lane until `fetchGoalEventPlanPreview` and supervisor UI tests agree with the backend route.

If PR #65 confirm accepts extra fields, skips `planHash`, or appends a stale preview, revert `542501d9650213273017ff11ab20deadb494ab16`. Keep the preview lane read-only until the confirm body and hash checks are fixed.

If PR #66 UX makes event registration look like provider execution, dispatch, compaction, or thread creation, revert `4df2c8ecd0f2709f5d0e50737033436d65144191`. If the revert touches generated Workbench assets, rerun `pnpm workbench:build` from the intended source state and commit only the matching generated output.

If PR-5 text overstates shipped behavior or records wrong validation, revert the PR-5 documentation commit and replace these docs before tagging.

## Follow-Up Boundary

Any provider execution, child dispatch, transcript compaction, new thread creation, generic shell or terminal UI, frontend local session read, git write, tag, publish, GitHub Release creation, or release automation needs a separate runbook and separate authorization. v50 only ships controlled supervisor event registration through preview and `planHash` confirm.

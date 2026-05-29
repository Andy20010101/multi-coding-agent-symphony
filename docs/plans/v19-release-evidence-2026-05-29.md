# v19 release evidence draft

日期：2026-05-29
目标：`v19-goal-runbook-next-action`
分支：`v19-task7-docs-operator-guide`
基线：`v18`
当前 released repository tag：`v18`
状态：draft, not release-ready

## scope checked

v19 adds an implemented/draft Goal Runbook + Next Action Control Center surface:

- `goal-runbook.v1` defines a goal runbook blueprint with tasks, expected evidence, release gates, role policy, and copy-only commands.
- `goal-next-action.v1` reports the next operator action from runbook, event log, and ledger state.
- `goal-prompt-pack.v1` renders copy-only `/goal` prompts for worker, reviewer, main-verifier, and release-manager roles.
- `goal-closeout-report.v1` reports missing task evidence and release gate gaps.
- `symphony goal init`, `symphony goal next`, `symphony goal prompt`, `symphony goal closeout`, and `symphony next` provide the terminal operator surface.
- Workbench Active Goal Control Center displays runbook, next action, prompt preview, and closeout gaps through read-only `GET` routes.

v19 does not include Autopilot, Workbench execution, browser terminal, artifact download, open local file, arbitrary path preview, model invocation, automatic merge, automatic tag, or browser-side confirm. This draft did not create a tag, push, merge, or register release gates.

## task evidence

Task evidence is indexed in `docs/plans/v19-task-evidence-index-2026-05-29.md`.

Current finding from local `goal-status` and the v19 event log:

- planning evidence is registered as `goal-event-log.v1:evt_79a5cb787d2dc1b7`.
- task-1 through task-3 have worker evidence, reviewer approval, and main verification events.
- task-4 has reviewer approval and main verification events, and a worker evidence document exists, but the current event log summary used for this draft has no `worker.evidence-recorded` event for task-4.
- task-5 and task-6 have worker evidence, reviewer approval, and main verification events.
- task-7 is this docs/operator-guide/evidence-index task. Worker evidence should be written to `docs/plans/v19-task7-worker-evidence-2026-05-29.md` after validation; no task-7 event is registered by this draft.
- task-8 release verification and final closure has no registered worker, review, or main verification event yet.

## release gate event state

The release gate command results below are local command evidence when present. They are not release gate events until a release manager runs the `symphony goal gate` dry-run / confirm flow.

| Gate | Event state | Notes |
|---|---|---|
| `release.pnpm-check` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.pnpm-test` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.workbench-build` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.mutation-gate` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.audit-high` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.diff-check` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.mcas-doctor` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.docs-updated` | `unknown` | No `release.gate-passed` event registered in the current v19 event log. |
| `release.tag-evidence` | `unknown` | No tag evidence event is registered. |

## task 7 local command evidence

Commands are run from the repository root. These results verify this Task 7 docs branch only; they do not declare release-ready.

| Command | Result | Notes |
|---|---|---|
| `pnpm check` | Passed. | `node --check` completed for source, scripts, plugins, and tests. |
| `pnpm test` | Passed. | 109 suites, 660 tests, 660 pass, 0 fail, duration `3507.324833ms`. |
| `pnpm workbench:build` | Passed. | Vite `v8.0.14` built `src/symphony/workbench-static/index.html`, `index-D3K9Dk14.css`, and `index-Duy8jdh2.js` in `141ms`; Node printed the existing WASI experimental warning. |
| `git diff --check` | Passed. | No output. |

## current goal status

`pnpm --silent symphony goal-status --goal v19-goal-runbook-next-action --json` currently reports:

- `summary.totalTasks: 9`
- `summary.completedTasks: 7`
- `summary.needsRevisionTasks: 0`
- `summary.releaseReady: false`
- `summary.releaseReadySource: null`
- release gates: `unknown`

`pnpm --silent symphony goal next --goal v19-goal-runbook-next-action --json` currently reports `status: missing-runbook` because the local checkout has event-log and goal-status template state but no managed `goal-runbook.v1` state for this goal. That is an operator setup gap, not release-ready evidence.

## release readiness

Status: `NOT READY`

Required before release-ready can be declared:

- Register or reconcile the managed `goal-runbook.v1` state needed by `symphony goal next`, `symphony goal prompt`, `symphony goal closeout`, and Active Goal Control Center for this goal.
- Resolve the task-4 worker evidence event gap or record the release-manager decision that explains the existing document/event mismatch.
- Finish task-7 worker evidence, independent review, and main verification.
- Finish task-8 release verification and final closure.
- Run and register release gate events for check, test, Workbench build, mutation, audit high, diff check, mcas doctor, docs updated, and tag evidence as applicable.
- Declare release-ready only through explicit `symphony goal gate --gate release.ready --status declared` evidence.

Passing commands alone does not create `release-ready`. This draft does not declare v19 released and does not claim a v19 tag exists.

# v37 Task-3 Main Verification Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-3`
Branch: `v37-task-3-project-active-goal-next-action-view`
Main verifier: `codex-v37-task-3-main-verifier`
HEAD: `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Main Verification Result

PASS.

This file records task-3 main verification only. It does not claim release readiness and did not perform tag, push, publish, or release.

## Baseline

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-3-project-active-goal-next-action-view`
  - result: dirty task worktree with inherited task-1/task-2/task-3 files, generated Workbench assets, and existing evidence files.
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Evidence Reviewed

- Worker evidence: `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v37-task-3-review-evidence-2026-06-02.md`

Reviewer history reviewed:

- Initial independent review verdict: `NEEDS_REVISION`.
- Initial finding: at `1280x720`, concrete `blocked`, `review`, `main verification`, and `release state` fields were below the first viewport.
- Worker revision: added compact first-screen `Task Status` strip below the Desktop top bar.
- Independent reviewer re-check verdict: PASS. The re-check reported the required fields visible at y=194 with no horizontal overflow or overlap.

## Files Reviewed

- `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-review-evidence-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`

## Scope Verification

Task-3 scope is satisfied.

- `/workbench/desktop/` shows the project list through `DesktopProjectListCard`.
- `/workbench/desktop/` shows active goal and next action in first-row cards.
- `/workbench/desktop/` shows active goal/current task/progress state through `DesktopDevelopmentStatusStrip` and the detailed `Review / Verification / Release` card.
- `/workbench/desktop/` shows `blocked`, `review`, `main verification`, and `release state` in the first-screen `Task Status` strip.

## State Source Review

The Desktop Shell status remains contract-backed.

- Project list route: `GET /api/projects`, `project-registry.v1`, `DesktopShellMvpViewModel.projectList`.
- Active goal/status route family: `app-state-snapshot.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1`, projected into `DesktopShellMvpViewModel.activeGoalStatus`.
- Next action route: `GET /api/goals/latest/next`, `goal-next-action.v1`, projected into `DesktopShellMvpViewModel.nextActionDetail`.
- The first-screen status strip renders:
  - `activeGoalStatus.currentTaskBlocked` -> `blocked`
  - `activeGoalStatus.reviewVerdict` -> `review`
  - `activeGoalStatus.mainVerificationStatus` -> `main verification`
  - `activeGoalStatus.releaseReady` -> `release state`
  - `activeGoalStatus.blockerCount` -> `blockers`
  - `activeGoalStatus.sourcePolicy` plus `nextActionDetail.sourcePolicy` -> `status source`
- I did not find status inference from branch name, file name, commit message, prompt text, task title, route text, or frontend-only state for the reviewed Desktop fields.

## Boundary Review

The Desktop route remains display-only and read-only.

- No shell runner, browser terminal, arbitrary command panel, generic command surface, or execution action was added.
- No shell execution, model invocation, arbitrary local file open, git write, merge, push, tag, publish, or release action was added.
- No reviewer approval, main verification declaration UI, release gate UI, release-ready declaration UI, tag, push, publish, or release UI was added to the Desktop route.
- Source scan of the Desktop route body found no `fetch(`, `confirmGoalEventPlan`, `window.open`, `navigator.clipboard`, `<form`, `<textarea`, `onClick=`, `method: 'POST'`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `localStorage`, `indexedDB`, `git push`, `git tag`, `release.ready`, `publish`, `modelInvocation`, `shell runner`, or `browser terminal`.
- ArtifactStore remains canonical. Task-3 reads artifact/evidence readiness through derived contract fields (`artifactRefs`, `evidenceTimeline`, `releaseBundle`) and does not replace artifact storage or promote a derived index to source of truth.

## Commands Run

```text
pnpm check
exit 0
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

```text
pnpm test
exit 0
tests 992
suites 153
pass 992
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4602.565625
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
generated:
src/symphony/workbench-static/index.html
src/symphony/workbench-static/assets/index-BQfwOcFp.css
src/symphony/workbench-static/assets/index-TbN3Dw4Y.js
built in 69ms
```

```text
git diff --check
exit 0
no output
```

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
exit 64
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

This `goal-status` result is the known managed-goal lookup limitation already recorded in task-3 worker and review evidence. It does not change the Desktop route verification because the UI keeps missing state contract-backed instead of inferring it.

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
exit 0
tests 74
suites 3
pass 74
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 640.8785
```

```text
Desktop route forbidden-surface source scan
exit 0
DesktopShellRoute slice length: 13279
fetch(: false
confirmGoalEventPlan: false
window.open: false
navigator.clipboard: false
<form: false
<textarea: false
onClick=: false
method: 'POST': false
XMLHttpRequest: false
WebSocket: false
EventSource: false
sendBeacon: false
localStorage: false
indexedDB: false
git push: false
git tag: false
release.ready: false
publish: false
modelInvocation: false
shell runner: false
browser terminal: false
```

## Visual QA

Console used for QA:

```text
pnpm symphony console --host 127.0.0.1 --port 8877
```

Console output:

```text
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8877/
```

Route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

Viewport `1280x720`:

- screenshot: `tmp/v37-task3-main-verification/desktop-1280x720-main-verification-loaded-2026-06-04.png`
- loading visible: false
- failed visible: false
- card count: 11
- status strip present: true
- status strip rect: top 185, bottom 250
- `blocked`: top 194, bottom 241, value `未暴露`, visible in first viewport true
- `review`: top 194, bottom 241, value `未暴露`, visible in first viewport true
- `main verification`: top 194, bottom 241, value `未暴露`, visible in first viewport true
- `release state`: top 194, bottom 241, value `false`, visible in first viewport true
- required status rows visible in first viewport: true
- horizontal overflow: false
- document scroll width/client width: 1280/1280
- card overlap count: 0
- visible overflow outside viewport: false
- hidden ellipsis-only source labels detected by raw `scrollWidth`: 4; all had `overflow: hidden`, `text-overflow: ellipsis`, and `visibleBeyondViewport: false`

Viewport `390x720`:

- screenshot: `tmp/v37-task3-main-verification/desktop-390x720-main-verification-loaded-2026-06-04.png`
- loading visible: false
- failed visible: false
- card count: 11
- status strip present: true
- horizontal overflow: false
- document scroll width/client width: 390/390
- card overlap count: 0
- visible text overflow count: 0

## Event Registration

Main verification event registration used the current `symphony goal gate` flow. The initial `symphony goal update ... main.verification-passed` flow was not used because the supported documented gate path is `symphony goal gate --gate main-verification --status passed`.

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-3 --gate main-verification --status passed --verifier codex-v37-task-3-main-verifier --evidence-ref docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md --dry-run --json
exit 0
contractName goal-update-plan.v1
planId plan_b92ba55a68ec487c
planHash sha256:0e38c2b959db473479cfb3cd9d25247e60ecf885b995531c2e29a8381a766861
validation.status ok
wouldAppend.appendOnly true
wouldAppend.writesInDryRun false
ledgerPreview task-3: unknown -> main-verified
confirm.available true
```

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-3 --gate main-verification --status passed --verifier codex-v37-task-3-main-verifier --evidence-ref docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md --confirm --plan-hash sha256:0e38c2b959db473479cfb3cd9d25247e60ecf885b995531c2e29a8381a766861
exit 0
mode confirm
status already-appended
written false
appendOnly true
goalId v37-desktop-shell-mvp
taskId task-3
gate main-verification
gateStatus passed
eventType main.verification-passed
eventId evt_b92ba55a68ec487c
eventHash sha256:741015eccbacefc231c228555e030d84f155748004731e725f476d8d66cf64ff
journal.eventCount 2
journal.lastEventId evt_b92ba55a68ec487c
```

No reviewer approval, release readiness, release gate, tag, push, publish, or release event was registered by this main verification run.

## Known Limitations

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` still exits 64 with `goal not found`.
- The task worktree is dirty because task-1/task-2/task-3 implementation files, generated Workbench assets, and evidence files are present as uncommitted worktree changes.
- In this local runtime, the Desktop top bar shows contract-backed `goal: latest` and `missing-runbook` state where the managed goal is not resolved. The UI does not backfill `v37-desktop-shell-mvp` from branch name, prompt text, or filename.
- v37 task-4 still owns deeper job/artifact binding. v37 task-5 still owns native build smoke and packaging boundary evidence.

## No Release Actions

No release readiness, tag, push, publish, or release was performed.

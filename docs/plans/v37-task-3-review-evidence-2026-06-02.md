# v37 Task-3 Independent Review Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-3`
Branch: `v37-task-3-project-active-goal-next-action-view`
Reviewer role: independent reviewer

## Verdict

NEEDS_REVISION

This review does not perform or claim main verification, release readiness, tag, push, publish, or release.

## Baseline

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-3-project-active-goal-next-action-view`; dirty worktree with inherited task-1/task-2 plus task-3 tracked and untracked files.
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Finding

### Major: 1280x720 first screen does not show the concrete review/main verification/release fields

Task-3 scope requires Desktop to show project list, current goal, next action, blocked/review/main verification/release state. The Desktop route renders the `Review / Verification / Release` card in the lower grid after `Goal Tasks`:

- `frontend/workbench/src/App.jsx:548`
- `frontend/workbench/src/App.jsx:692`

At `http://127.0.0.1:8877/workbench/desktop/` with viewport `1280x720`, the page renders 11 cards with no horizontal overflow and no card overlap. The `Review / Verification / Release` card header is only partially visible near the bottom of the viewport, but the required concrete status fields are below the first screen:

- `blocked`: y=852, visible=false
- `review`: y=878, visible=false
- `main verification`: y=903, visible=false
- `release state`: y=928, visible=false

Screenshot:

`tmp/v37-task3-review/desktop-1280-review-loaded.png`

This misses the review focus that the core task-3 status should be visible in the first screen at `1280x720`.

## Contract And Boundary Review

- Project list is consumed from `GET /api/projects` as `project-registry.v1` and projected through `DesktopShellMvpViewModel.projectList`.
  - `frontend/workbench/src/api/contracts.js:1170`
  - `frontend/workbench/src/api/contracts.js:1379`
- Active goal, current task, blocker count, review status, main verification status, and release state are projected from backend contracts, primarily `app-state-snapshot.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1`.
  - `frontend/workbench/src/api/contracts.js:1393`
- Next action detail is projected from `goal-next-action.v1`.
  - `frontend/workbench/src/api/contracts.js:1412`
- The Desktop route displays these fields via `FieldList`; it does not add form controls, shell execution, clipboard copy, or fetch/confirm handlers in the Desktop route body.
  - `frontend/workbench/src/App.jsx:702`
- I did not find a new shell runner, browser terminal, arbitrary command panel, model call path, arbitrary local file open, git write, push, tag, publish, or release action in the task-3 Desktop route.
- ArtifactStore remains canonical. Task-3 reads artifact/evidence readiness through existing derived contracts and does not replace artifact storage or add arbitrary path preview.

Observed local API contract outputs during review:

- `/api/projects`
  - `contractName: project-registry.v1`
  - `readOnly: true`
  - `projects.length: 1`
  - `boundaries.gitWriteAvailable: false`
  - `boundaries.arbitraryCommandExecutionAvailable: false`
- `/api/runtime/snapshot`
  - `contractName: app-state-snapshot.v1`
  - `readOnly: true`
  - `freshness.status: current`
  - `release_status.release_ready: false`
  - blocker: `release-ready-not-declared`

## Visual QA

Route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

Viewport `1280x720`:

- desktop card count: `11`
- horizontal overflow: `false`
- card overlap count: `0`
- loading visible after data load: `false`
- failed visible: `false`
- project list card visible: `true`
- active goal card visible: `true`
- next action card visible: `true`
- `Review / Verification / Release` card header partially visible near the bottom: `true`
- concrete `blocked`, `review`, `main verification`, `release state` rows visible in first viewport: `false`
- screenshot: `tmp/v37-task3-review/desktop-1280-review-loaded.png`

Viewport `599x720`:

- desktop card count after data load: `11`
- horizontal overflow: `false`
- card overlap count: `0`
- text remained readable in single-column layout

## Commands Run

```text
pnpm check
exit 0
node --check completed for source, scripts, plugin, and test files.
```

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
exit 0
tests 74
suites 3
pass 74
fail 0
duration_ms 635.570667
```

```text
pnpm test
exit 0
tests 992
suites 153
pass 992
fail 0
duration_ms 4702.484875
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
generated:
src/symphony/workbench-static/index.html
src/symphony/workbench-static/assets/index-BqcyEVEK.css
src/symphony/workbench-static/assets/index-4J9uF6eo.js
built in 130ms
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

## Open Questions / Assumptions

- The branch is a dirty worktree copied from the verified task-2 dirty state, not a clean commit stacked on task-2. I reviewed task-3 scope against the worker evidence and the key Desktop files.
- `goal-status --goal v37-desktop-shell-mvp` still returns `goal not found`; I treated this as the known lookup/runbook issue from task-1/task-2, not release readiness.

## Suggested Fix

Keep the route read-only and contract-backed, but make the first screen denser at `1280x720`. The concrete blocked/review/main verification/release fields should be visible without scrolling. A direct fix is to move `Review / Verification / Release` into the top row or add a compact top status strip sourced from the same `activeGoalStatus` fields.

## Independent Reviewer Re-check - 2026-06-04

Reviewer role: independent reviewer re-check after worker revision
Scope: only the previous major finding and its boundaries

## Re-check Verdict

PASS

This re-check does not perform or claim main verification, release readiness, tag, push, publish, or release.

## Re-check Baseline

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-3-project-active-goal-next-action-view`; dirty worktree with inherited task-1/task-2/task-3 files plus the worker revision.
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Previous Finding Re-check

The previous major finding is fixed.

`frontend/workbench/src/App.jsx` now renders `DesktopDevelopmentStatusStrip` immediately after `.desktop-topbar` and before `#desktop-overview`. The strip contains:

- `blocked`
- `review`
- `main verification`
- `release state`
- `blockers`
- `status source`

The concrete fields are mapped from existing model fields:

- `activeGoalStatus.currentTaskBlocked`
- `activeGoalStatus.reviewVerdict`
- `activeGoalStatus.mainVerificationStatus`
- `activeGoalStatus.releaseReady`
- `activeGoalStatus.blockerCount`
- `activeGoalStatus.sourcePolicy`
- `nextActionDetail.sourcePolicy`

`frontend/workbench/src/api/contracts.js` still projects these values from existing contracts:

- `activeGoalStatus` from `app-state-snapshot.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1`
- `nextActionDetail` from `goal-next-action.v1`

I did not find frontend inference from branch names, prompt text, filenames, commit messages, task titles, or route text for the reviewed status fields.

## Visual QA

Route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

The console was started for this review with:

```text
pnpm symphony console --host 127.0.0.1 --port 8877
```

The console output reported:

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

Viewport `1280x720`:

- card count: 11
- status strip present: true
- status strip bottom: 250
- `blocked`: y=194, visible in first viewport=true, value=`未暴露`
- `review`: y=194, visible in first viewport=true, value=`未暴露`
- `main verification`: y=194, visible in first viewport=true, value=`未暴露`
- `release state`: y=194, visible in first viewport=true, value=`false`
- horizontal overflow: false
- overflowing element count: 0
- card overlap count: 0
- loading visible: false
- failed visible: false
- screenshot: `tmp/v37-task3-review-recheck/desktop-1280x720-recheck.png`

Viewport `390x720`:

- card count: 11
- horizontal overflow: false
- overflowing element count: 0
- card overlap count: 0
- development status text overflow count: 0
- loading visible: false
- failed visible: false
- screenshot: `tmp/v37-task3-review-recheck/desktop-390x720-recheck.png`

## Boundary Re-check

- Desktop route body slice from `function DesktopShellRoute` through `function GoldenPathPanel` had no matches for:
  - `fetch(`
  - `confirmGoalEventPlan`
  - `window.open`
  - `navigator.clipboard`
  - `<form`
  - `<textarea`
  - `onClick=`
  - `method: 'POST'`
  - `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `localStorage`, `indexedDB`
  - `git push`, `git tag`, `release.ready`, `publish`, `modelInvocation`, `shell runner`, `browser terminal`
- No shell runner, browser terminal, arbitrary command panel, model call, arbitrary local file open, git write, push/tag/publish/release action was added in the Desktop route.
- `DesktopShellMvpViewModel.artifactReadiness` still reads `artifactRefs`, `evidenceTimeline`, and `releaseBundle` state. It does not replace ArtifactStore, read arbitrary artifact paths, or make a derived index canonical.

## Commands Run

```text
pnpm check
exit 0
node --check completed for source, scripts, plugin, and test files.
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
duration_ms 4909.962417
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
built in 71ms
```

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
duration_ms 646.95225
```

```text
git diff --check
exit 0
no output
```

## Re-check Notes

- The original `NEEDS_REVISION` section remains above as the initial review record.
- This re-check only evaluates the worker revision against the previous major finding.
- I did not register reviewer approval, main verification, release readiness, tag, push, publish, or release.

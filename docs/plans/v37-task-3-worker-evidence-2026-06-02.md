# v37 Task-3 Worker Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-3`
Branch: `v37-task-3-project-active-goal-next-action-view`
Worker: `codex-v37-task-3-worker`

## Scope Completed

Implemented the Desktop Shell project list, active goal, next action, and development status view for `/workbench/desktop/`.

This is worker implementation evidence only. It does not claim reviewer approval, main verification, release readiness, tag, push, publish, or release.

## Baseline And Handoff

Task-2 was not clean in its source worktree; the verified task-2 implementation existed as uncommitted worktree changes. I created the task-3 worktree from `v37-task-2-tauri-host-sidecar-bridge`, then copied the task-2 tracked and untracked working tree state into the task-3 worktree before implementing task-3. This kept task-3 on the actual verified task-2 code state instead of a main branch state that lacked task-2 files.

Confirmed task-3 worktree:

- `pwd` -> `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view`
- `git status --short --branch` -> `## v37-task-3-project-active-goal-next-action-view`
- `git rev-parse HEAD` -> `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Files Read

- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md`
- `docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- Workbench frontend/backend entrypoints and relevant tests.

`docs/workbench` does not exist in this worktree; `docs/workbench-operator-guide.md` is the available Workbench operator doc and was read.

## Implementation Summary

- Added `/api/projects` to the Workbench read-only route list as `project-registry.v1`.
- Added a `ProjectRegistry` projection with source, project rows, current project id, resolution, and boundary fields.
- Extended `DesktopShellMvpViewModel` with:
  - `projectList` from `project-registry.v1`
  - `activeGoalStatus` from `app-state-snapshot.v1`, `goal-progress-ledger.v1`, and `goal-event-log.v1`
  - `nextActionDetail` from `goal-next-action.v1`
- Updated `/workbench/desktop/` to render:
  - project list
  - active goal
  - next action
  - blocked state
  - review status
  - main verification status
  - release state
- Updated desktop CSS so the added cards stay readable at desktop and narrow widths without horizontal overflow.
- Updated docs to describe the task-3 Desktop Shell state sources and display-only boundary.

All displayed status remains contract-backed. The renderer does not derive task completion, review approval, main verification, or release readiness from branch names, filenames, commit messages, prompt text, task titles, or frontend state.

## Files Changed For Task-3

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-4J9uF6eo.js`
- `src/symphony/workbench-static/assets/index-BqcyEVEK.css`

The worktree also contains the inherited task-1/task-2 files and generated asset deletions from the verified task-2 baseline.

## Commands Run With Exact Results

- `git status --short --branch` in the task-2 worktree
  - exit 0
  - branch `v37-task-2-tauri-host-sidecar-bridge`
  - result: dirty with expected task-1/task-2 tracked and untracked files.
- `git worktree add ../v37-task-3-project-active-goal-next-action-view -b v37-task-3-project-active-goal-next-action-view v37-task-2-tauri-host-sidecar-bridge`
  - exit 0
  - created branch `v37-task-3-project-active-goal-next-action-view`
  - HEAD `09c926f Align v37 task0 runbook branch names`
- `pnpm install --frozen-lockfile`
  - exit 0
  - lockfile unchanged
  - installed `react`, `react-dom`, Vite, and dev dependencies into the new worktree.
- `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - first run before install: exit 1, `ERR_MODULE_NOT_FOUND: Cannot find package 'react'`
  - final run after implementation: exit 0, tests 74, suites 3, pass 74, fail 0, duration 692.563417 ms.
- `pnpm check`
  - exit 0
  - `node --check` completed for source, scripts, plugin, and test files.
- `pnpm test`
  - exit 0
  - tests 992, suites 153, pass 992, fail 0, cancelled 0, skipped 0, todo 0, duration 4724.906834 ms.
- `pnpm workbench:build`
  - final exit 0
  - Vite built `src/symphony/workbench-static/index.html`, `assets/index-BqcyEVEK.css`, and `assets/index-4J9uF6eo.js`.
- `curl -sS -o /tmp/v37-task3-health.json -w "%{http_code}" http://127.0.0.1:8877/api/health`
  - exit 0
  - HTTP `200`
  - `local-runtime-health.v1`, `sidecarHost.attach.state: attached`, `sidecarHost.launcher.commandId: symphony.console.sidecar.launch`
- `curl -sS -o /tmp/v37-task3-projects.json -w "%{http_code}" http://127.0.0.1:8877/api/projects`
  - exit 0
  - HTTP `200`
  - `project-registry.v1`, `projects.length: 1`, current project `multi-coding-agent-symphony`
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json`
  - exit 64 before worker event registration
  - `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`
- `git diff --check`
  - exit 0 before and after worker event registration
  - no output.

## Worker Event Registration

- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-3 --event worker.evidence-recorded --actor codex-v37-task-3-worker --evidence-ref docs/plans/v37-task-3-worker-evidence-2026-06-02.md --dry-run --json`
  - exit 0
  - contract `goal-update-plan.v1`
  - plan id `plan_18c73e6ce690e9c2`
  - plan hash `sha256:5677cec562d6332e42baa6b06bda11d60c781a4e6cf980e050ef531f958433cf`
  - validation status `ok`
  - dry-run writes `false`
  - ledger preview changed `task-3` from `unknown` to `needs-review`
- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-3 --event worker.evidence-recorded --actor codex-v37-task-3-worker --evidence-ref docs/plans/v37-task-3-worker-evidence-2026-06-02.md --confirm --plan-hash sha256:5677cec562d6332e42baa6b06bda11d60c781a4e6cf980e050ef531f958433cf --json`
  - exit 0
  - status `appended`
  - append-only `true`
  - event id `evt_18c73e6ce690e9c2`
  - event type `worker.evidence-recorded`
  - event hash `sha256:2f5d39aec22b49093519ef216176b7f01e50b1c788898cb23061dbadfcd00fdf`
  - no reviewer approval, main verification, release readiness, tag, push, publish, or release event was recorded.
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` after worker event registration
  - exit 64
  - `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`

## Visual QA

Local console started at:

```text
http://127.0.0.1:8877/
```

Route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

Desktop viewport `1280x720` final result:

- desktop card count: 11
- project registry card visible: true
- active goal card visible: true
- next action card visible: true
- Review / Verification / Release card visible: true
- release state field visible: true
- forbidden `release ready` phrase visible: false
- loading visible: false
- failed visible: false
- horizontal overflow: false
- overflowing element count: 0
- card overlap count: 0
- screenshot: `tmp/v37-task3-qa/desktop-1280-final.png`

Narrow browser-panel width `599px` was also checked after the responsive CSS fix:

- desktop card count: 11
- horizontal overflow: false
- card overlap count: 0

## App / Workbench User Path Changed

User path:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
http://127.0.0.1:8765/workbench/desktop/
```

The Desktop route now shows project list and current development state directly on the desktop shell first screen. It consumes existing local API routes and projections:

```text
GET /api/projects -> project-registry.v1 -> DesktopShellMvpViewModel.projectList
GET /api/runtime/snapshot -> app-state-snapshot.v1 -> DesktopShellMvpViewModel.activeGoalStatus
GET /api/goals/latest/next -> goal-next-action.v1 -> DesktopShellMvpViewModel.nextActionDetail
```

When the local managed runbook is missing, the page displays `missing-runbook`, `latest`, `未暴露`, and blocker counts from backend contracts. It does not backfill the goal or task from the branch name, file name, prompt, task title, or frontend route.

## Boundary Notes

This task did not add:

- shell execution
- generic shell runner
- browser terminal
- arbitrary command surface
- model invocation
- arbitrary local file opening
- git write, merge, push, tag, publish, or release action
- reviewer approval
- main verification
- release-ready declaration

The new `/api/projects` frontend consumption is read-only and already backed by the existing console route. ArtifactStore remains canonical; task-3 does not change artifact storage or promote any derived index to source of truth.

## Known Limitations / Next Task Handoff

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` still returns exit 64 / `goal not found`; this is the known runbook/status lookup limitation from task-1 and task-2 evidence.
- In this local worktree, `project-registry.v1.projects[0].last_goal_id` is `null`, so the Desktop top bar and status cards show contract-backed `latest` / missing-runbook state. The UI intentionally does not infer `v37-desktop-shell-mvp` from the branch name.
- Full native packaging remains out of scope for task-3. v37 task-5 owns native build smoke and packaging boundary evidence.
- v37 task-4 should bind job status and artifact preview more deeply through existing job/artifact APIs while keeping ArtifactStore canonical.

## Worker Revision After Independent Review - 2026-06-04

Revision role: worker revision
Reviewer verdict addressed: `NEEDS_REVISION`

This section records only the worker revision for the independent reviewer major finding. It does not claim reviewer approval, main verification, release readiness, tag, push, publish, or release.

### Reviewer Finding Addressed

At `1280x720`, the concrete `Review / Verification / Release` fields were below the first viewport. I added a compact first-screen `Task Status` strip directly below the Desktop top bar.

The strip uses the existing contract-backed fields:

- `activeGoalStatus.currentTaskBlocked` -> `blocked`
- `activeGoalStatus.reviewVerdict` -> `review`
- `activeGoalStatus.mainVerificationStatus` -> `main verification`
- `activeGoalStatus.releaseReady` -> `release state`
- `activeGoalStatus.blockerCount` -> `blockers`
- `activeGoalStatus.sourcePolicy` plus `nextActionDetail.sourcePolicy` -> `status source`

The existing lower `Review / Verification / Release` card remains in place for the full detail view.

### Files Changed In Revision

- `frontend/workbench/src/App.jsx`
  - Added `DesktopDevelopmentStatusStrip`.
  - Placed the strip between `.desktop-topbar` and `#desktop-overview`.
  - Kept the route display-only with no fetch, confirm, shell, model, local-file, git, release, form, clipboard, or execution handler added in the Desktop route body.
- `frontend/workbench/src/styles/workbench.css`
  - Added compact Desktop status-strip styling.
  - Added responsive rules for desktop, tablet, and narrow widths.
- `tests/workbench-shell.test.js`
  - Added render assertions that the first-screen status strip appears before the first-row cards and contains `blocked`, `review`, `main verification`, `release state`, `blockers`, and `status source`.
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-BQfwOcFp.css`
- `src/symphony/workbench-static/assets/index-TbN3Dw4Y.js`
  - Regenerated by `pnpm workbench:build`.

### Commands Run With Exact Results

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-3-project-active-goal-next-action-view`
  - result: dirty worktree with inherited task-1/task-2/task-3 files plus this revision.
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`
- `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - first revision run exit 0
  - tests 74, suites 3, pass 74, fail 0, cancelled 0, skipped 0, todo 0
  - duration `753.463541 ms`
- `pnpm check`
  - exit 0
  - `node --check` completed for source, scripts, plugin, and test files.
- `pnpm test`
  - exit 0
  - tests 992, suites 153, pass 992, fail 0, cancelled 0, skipped 0, todo 0
  - duration `4670.051167 ms`
- `pnpm workbench:build`
  - exit 0
  - Vite `v8.0.14`
  - transformed 17 modules
  - generated:
    - `src/symphony/workbench-static/index.html`
    - `src/symphony/workbench-static/assets/index-BQfwOcFp.css`
    - `src/symphony/workbench-static/assets/index-TbN3Dw4Y.js`
  - built in `78 ms`
- `git diff --check`
  - exit 0
  - no output
- `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - final revision run exit 0
  - tests 74, suites 3, pass 74, fail 0, cancelled 0, skipped 0, todo 0
  - duration `646.679417 ms`

### Visual QA

Local route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

Desktop viewport `1280x720` loaded result:

- card count: 11
- `blocked`: y=194, visible=true, value=`未暴露`
- `review`: y=194, visible=true, value=`未暴露`
- `main verification`: y=194, visible=true, value=`未暴露`
- `release state`: y=194, visible=true, value=`false`
- status strip visible in first viewport: true
- horizontal overflow: false
- overflowing element count: 0
- card overlap count: 0
- loading visible: false
- failed visible: false
- screenshot: `tmp/v37-task3-revision-qa/desktop-1280x720-revision.png`

Narrow viewport `390x720` loaded result:

- card count: 11
- horizontal overflow: false
- overflowing element count: 0
- card overlap count: 0
- development status text overflow count: 0
- loading visible: false
- failed visible: false
- screenshot: `tmp/v37-task3-revision-qa/desktop-390x720-revision.png`

### Boundary Notes

- The Desktop route remains read-only and contract-backed.
- The revision uses existing `activeGoalStatus` and `nextActionDetail` data from Workbench contracts.
- No generic command panel, execution action, shell runner, model invocation, arbitrary local file access, git write control, release control, tag, push, publish, or release path was added.
- No reviewer approval, main verification, release readiness, tag, push, publish, or release event was registered by this worker revision.

### Worker Event Registration After Revision

- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-3 --event worker.evidence-recorded --actor codex-v37-task-3-worker --evidence-ref docs/plans/v37-task-3-worker-evidence-2026-06-02.md --dry-run --json`
  - exit 0
  - contract `goal-update-plan.v1`
  - plan id `plan_18c73e6ce690e9c2`
  - plan hash `sha256:5677cec562d6332e42baa6b06bda11d60c781a4e6cf980e050ef531f958433cf`
  - validation status `ok`
  - would append `appendOnly: true`, `eventCount: 1`
  - dry-run writes `false`
  - safety `confirmWritesAppendOnly: true`
- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-3 --event worker.evidence-recorded --actor codex-v37-task-3-worker --evidence-ref docs/plans/v37-task-3-worker-evidence-2026-06-02.md --confirm --plan-hash sha256:5677cec562d6332e42baa6b06bda11d60c781a4e6cf980e050ef531f958433cf`
  - exit 0
  - mode `confirm`
  - status `already-appended`
  - written `false`
  - append-only `true`
  - event id `evt_18c73e6ce690e9c2`
  - event type `worker.evidence-recorded`
  - event hash `sha256:2f5d39aec22b49093519ef216176b7f01e50b1c788898cb23061dbadfcd00fdf`
  - no duplicate worker event was written.
  - no reviewer approval, main verification, release readiness, tag, push, publish, or release event was recorded.

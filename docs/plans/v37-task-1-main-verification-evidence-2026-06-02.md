# v37 Task-1 Main Verification Evidence

Evidence file date: 2026-06-02
Verification executed: 2026-06-03 Asia/Shanghai
Goal id: `v37-desktop-shell-mvp`
Task id: `task-1`
Branch: `v37-task-1-desktop-shell-decision-minimal-workspace`
Main verifier: `codex-v37-task-1-main-verifier`

## Scope

This main verification checked v37 task-1 only: Desktop shell technology decision, minimal desktop workspace boundary, `/workbench/desktop/` renderer route, UI-first Desktop Shell MVP information architecture, explicit contract-backed state, and forbidden surface boundaries.

This evidence does not claim release readiness, tag, push, publish, release, reviewer approval, or any release gate.

## Evidence Reviewed

- Worker evidence: `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- UX brief: `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- Desktop workspace boundary: `desktop/shell/README.md`
- Product contracts: `docs/symphony-product-contracts.md`
- Operator guide: `docs/workbench-operator-guide.md`
- Workbench renderer and API files:
  - `frontend/workbench/src/App.jsx`
  - `frontend/workbench/src/api/contracts.js`
  - `frontend/workbench/src/api/client.js`
  - `frontend/workbench/src/styles/workbench.css`
- Tests:
  - `tests/workbench-api-client.test.js`
  - `tests/workbench-shell.test.js`
- Reviewer findings pasted by the controller: no blocking, major, or minor findings. The only reviewer note was an optional unit test suggestion for the new read-only route timeout.

No v37 task-1 review evidence file was present under `docs/plans/`; the reviewer finding source for this verification is the pasted controller summary.

## Main Verification Notes

Task-1 acceptance is satisfied after one verifier CSS fix for narrow width. The route is runnable, buildable through the existing Workbench Vite/React pipeline, and served under the existing Workbench static root. The Desktop Shell is a separate UI-first command-center route, not a generic web wrapper.

Verifier fix made during this pass:

- `frontend/workbench/src/styles/workbench.css`: at `max-width: 480px`, Desktop sidebar changes to one column, nav changes to two columns, sidebar status returns to a top border, and the Desktop topbar changes to one column. This fixed a visual overlap found during narrow-width QA. It did not add capabilities, routes, state sources, or actions.

## Technology Decision

Pass. Tauri-first and Electron-deferred are documented in project-specific terms:

- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md` states Tauri fits the existing local console sidecar, existing Vite/React Workbench assets, and explicit backend contracts.
- `desktop/shell/README.md` records Tauri-first for task-2 sidecar attach/launch work, with Electron deferred because task-1 does not need a Node main process, IPC command execution, or larger packaging surface.
- `docs/workbench-operator-guide.md` records that task-1 adds no Tauri build script and leaves native build smoke to v37 task-5.

## Runnable Workspace

Pass. `/workbench/desktop/` is part of the existing Workbench renderer:

- `package.json` keeps `workbench:build` as `vite build --config frontend/workbench/vite.config.js`.
- `frontend/workbench/vite.config.js` uses `root: frontend/workbench`, `base: /workbench/`, and `outDir: src/symphony/workbench-static`.
- `desktop/shell/README.md` explicitly says the runnable UI entry is `/workbench/desktop/` and the route is served by the local console sidecar.
- `pnpm workbench:build` generated the expected Workbench static files.

## Contract State

Pass. `DesktopShellMvpViewModel` is a projection, not canonical state.

- `frontend/workbench/src/api/contracts.js` builds `desktopShell` from runtime snapshot, active goal, job console, artifact refs, evidence timeline, release bundle, and route states.
- The view model uses explicit source labels: `app-state-snapshot.v1`, `goal-runbook.v1`, `goal-next-action.v1`, `job-model.v1`, `job-timeline-log-stream.v1`, `artifact-index.v1`, `evidence-timeline.v1`, and `release-bundle.v1`.
- The boundary field `statusSource` is `explicit backend contracts only`.
- I did not find branch, filename, commit, prompt, task title, or frontend-only state used to synthesize Desktop Shell status.

## ArtifactStore Boundary

Pass. ArtifactStore remains canonical.

- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md` states ArtifactStore remains canonical and artifact/evidence index is derived.
- `docs/symphony-product-contracts.md` states `DesktopShellMvpViewModel` does not replace ArtifactStore, goal-event-log, job contracts, or runtime snapshot.
- Existing v36 tests in the full suite still pass for artifact index, safe preview search, evidence timeline, and release bundle boundaries.

## Forbidden Surface Check

Pass. I did not find task-1 additions for:

- generic shell runner
- browser terminal
- arbitrary command panel
- shell execution
- model invocation
- arbitrary local file open
- git write, merge, push, tag, publish
- reviewer approval declaration
- release-ready declaration

The Desktop route renders status, cards, and boundary fields. It does not add forms, terminal input, local file open, model calls, `window.open`, clipboard use, shell execution handlers, job execution handlers, or release controls.

## Reviewer Finding Decision

The optional missing timeout unit test does not block task-1.

Reason: the timeout is a defensive read-only fetch bound in `frontend/workbench/src/api/client.js`; it does not add write capability or change task completion semantics. Full tests, Workbench build, diff check, and visual QA passed. It should be tracked as a follow-up because there is no focused test asserting abort/timeout behavior for `fetchReadonlyRoute()`.

## Known State Issue

`pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` returns `goal not found` with exit code `64`.

This does not block task-1 main verification because:

- `.symphony/goals/events/v37-desktop-shell-mvp.ndjson` exists and contains the worker evidence event `evt_0d2b92a6d75888f0`.
- The worker evidence file records that `symphony goal update` dry-run and confirm accepted the worker event.
- Main verification registration succeeded through the current CLI's `symphony goal gate --gate main-verification --status passed` dry-run and plan-hash confirm path.

Treat this as a goal-status lookup or runbook registration follow-up, not as task-1 failure, reviewer approval, main verification, or release readiness.

## Commands Run

```text
pwd
```

Result:

```text
/Users/andy/.codex/worktrees/94f6/multi-coding-agent-symphony
```

```text
git status --short --branch
```

Initial result:

```text
## v37-task-1-desktop-shell-decision-minimal-workspace
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 D src/symphony/workbench-static/assets/index-CpBepO49.js
 D src/symphony/workbench-static/assets/index-ooe-c3KL.css
 M src/symphony/workbench-static/index.html
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? desktop/
?? docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md
?? docs/plans/v37-task-1-worker-evidence-2026-06-02.md
?? src/symphony/workbench-static/assets/index-CeHYkMOD.js
?? src/symphony/workbench-static/assets/index-CfMyvTe-.css
```

Final result before writing this evidence file:

```text
## v37-task-1-desktop-shell-decision-minimal-workspace
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 D src/symphony/workbench-static/assets/index-CpBepO49.js
 D src/symphony/workbench-static/assets/index-ooe-c3KL.css
 M src/symphony/workbench-static/index.html
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? desktop/
?? docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md
?? docs/plans/v37-task-1-worker-evidence-2026-06-02.md
?? src/symphony/workbench-static/assets/index-CIofGqjM.css
?? src/symphony/workbench-static/assets/index-CnfG6TYQ.js
```

```text
git rev-parse HEAD
```

Result:

```text
09c926f703663df9ed4bacaf21939c2d6659dfd1
```

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
```

Result:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

```text
pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-1 --event main.verification-passed --actor codex-v37-task-1-main-verifier --evidence-ref docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md --dry-run --json
```

Result:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal update supports only worker/task-level events: worker.started, worker.evidence-recorded, worker.self-check-passed, worker.self-check-failed, blocker.opened, blocker.resolved."
}
```

This was the dry-run command requested in the task prompt. It is not the current CLI command family for main verification gate events.

```text
pnpm --silent symphony goal gate --help
```

Result:

```text
exit 0
Usage: symphony goal gate --goal <goal-id> --gate <main-verification|release.gate|release.ready> --status <passed|failed|declared> --verifier <verifier-id> --evidence-ref <ref> [--failed-command <cmd>] [--task <task-id>] [--dry-run]
       symphony goal gate --goal <goal-id> --gate <main-verification|release.gate|release.ready> --status <passed|failed|declared> --verifier <verifier-id> --evidence-ref <ref> [--failed-command <cmd>] [--task <task-id>] --confirm --plan-hash <hash>
```

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-1 --gate main-verification --status passed --verifier codex-v37-task-1-main-verifier --evidence-ref docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md --dry-run --json
```

Result:

```text
exit 0
contractName goal-update-plan.v1
mode dry-run
planId plan_2e0e0ccde222bb4d
planHash sha256:f95fdcb25ec43b8473a384a1fd33b0ea05f34d28b2cdf814ee49273159103fbf
command.name symphony goal gate
eventType main.verification-passed
taskId task-1
validation.status ok
wouldAppend.appendOnly true
wouldAppend.eventCount 1
wouldAppend.writesInDryRun false
ledgerPreview task-1 unknown -> main-verified
confirm.available true
```

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-1 --gate main-verification --status passed --verifier codex-v37-task-1-main-verifier --evidence-ref docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md --confirm --plan-hash sha256:f95fdcb25ec43b8473a384a1fd33b0ea05f34d28b2cdf814ee49273159103fbf
```

Result:

```text
exit 0
mode confirm
status appended
written true
appendOnly true
goalId v37-desktop-shell-mvp
taskId task-1
gate main-verification
gateStatus passed
eventType main.verification-passed
eventId evt_2e0e0ccde222bb4d
eventHash sha256:d6e840ad69975b38b8ea0cb7e09a2963314ccfb8372916966fd183346f79a427
journal.eventCount 2
journal.lastEventId evt_2e0e0ccde222bb4d
safety.confirmWritesAppendOnly true
safety.workbenchWriteAvailable false
safety.browserExecutionAvailable false
safety.modelInvocationAvailable false
safety.arbitraryPathReadAvailable false
```

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
```

Post-confirm result:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

```text
tail -n 5 .symphony/goals/events/v37-desktop-shell-mvp.ndjson
```

Result:

```text
exit 0
sequence 1: worker.evidence-recorded, eventId evt_0d2b92a6d75888f0, actor codex-v37-task-1-worker, eventHash sha256:40bc22d15b7fd54d03bc8f1faca21d008e9f672606f25125f7f10f2e072629d0
sequence 2: main.verification-passed, eventId evt_2e0e0ccde222bb4d, actor codex-v37-task-1-main-verifier, gate main-verification passed, eventHash sha256:d6e840ad69975b38b8ea0cb7e09a2963314ccfb8372916966fd183346f79a427
```

```text
pnpm check
```

Final result after verifier CSS fix:

```text
exit 0
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

```text
pnpm test
```

Final result after verifier CSS fix:

```text
exit 0
tests 989
suites 152
pass 989
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4839.340375
```

```text
pnpm workbench:build
```

Final result after verifier CSS fix:

```text
exit 0
vite v8.0.14 building client environment for production...
17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-CIofGqjM.css     32.62 kB | gzip:   5.54 kB
src/symphony/workbench-static/assets/index-CnfG6TYQ.js   1,190.11 kB | gzip: 211.67 kB
built in 74ms
```

```text
git diff --check
```

Final result:

```text
exit 0
no output
```

```text
pnpm symphony console --host 127.0.0.1 --port 8765
```

Result:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 1,
  "message": "listen EADDRINUSE: address already in use 127.0.0.1:8765"
}
```

```text
pnpm symphony console --host 127.0.0.1 --port 8766
```

Result:

```text
Status: listening
Next: http://127.0.0.1:8766/
```

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
```

Final result:

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "goal not found"
}
```

## Visual QA

Route opened:

```text
http://127.0.0.1:8766/workbench/desktop/
```

Default desktop width, `1280x720`:

```json
{
  "cardCount": 9,
  "innerWidth": 1280,
  "innerHeight": 720,
  "overflow": 0,
  "overlapCount": 0,
  "clippedTextCount": 0,
  "hasHeading": true,
  "hasDecision": true,
  "hasBoundary": true,
  "hasWorkbenchNav": false,
  "loadingVisible": false,
  "failedVisible": false
}
```

Narrow width, `480x720`, after verifier CSS fix:

```json
{
  "cardCount": 9,
  "innerWidth": 480,
  "innerHeight": 720,
  "overflow": 0,
  "overlapCount": 0,
  "clippedTextCount": 0,
  "hasHeading": true,
  "hasDecision": true,
  "hasBoundary": true,
  "hasWorkbenchNav": false,
  "loadingVisible": false,
  "failedVisible": false
}
```

Screenshots captured during QA:

```text
/tmp/v37-desktop-shell-1280.png
/tmp/v37-desktop-shell-480.png
```

## Known Limitations / Follow-Up

- `goal-status` still returns `goal not found` for `v37-desktop-shell-mvp`; the append-only event file exists and `goal update` accepts events. Follow up on runbook registration or status lookup.
- Add a focused unit test for the 3000 ms read-only route timeout in `fetchReadonlyRoute()`.
- Task-1 intentionally does not build a native Tauri host. v37 task-2 owns sidecar attach/launch; v37 task-5 owns native desktop build smoke.
- The Desktop route shows partial or missing route state when backend contracts are absent. That is expected; it does not fabricate state.

## Main Verification Decision

Passed for v37 task-1.

The implementation satisfies the task-1 acceptance boundaries: Tauri-first/Electron-deferred decision is documented, `/workbench/desktop/` is runnable and buildable through the existing Workbench pipeline, the Desktop Shell is a UI-first contract-backed surface, ArtifactStore remains canonical, and no forbidden shell/model/file/git/release/reviewer approval surface was added.

Event registration result: appended through `symphony goal gate --gate main-verification --status passed` after dry-run returned plan hash `sha256:f95fdcb25ec43b8473a384a1fd33b0ea05f34d28b2cdf814ee49273159103fbf`. Confirm appended event `evt_2e0e0ccde222bb4d`.

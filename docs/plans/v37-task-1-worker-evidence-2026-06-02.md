# v37 Task-1 Worker Evidence

Date: 2026-06-02
Goal id: `v37-desktop-shell-mvp`
Task id: `task-1`
Branch: `v37-task-1-desktop-shell-decision-minimal-workspace`
Worker: `codex-v37-task-1-worker`

## Scope Completed

Task-1 implemented a runnable Desktop Shell MVP renderer route at `/workbench/desktop/`, documented the desktop UX brief, and created a minimal desktop workspace boundary under `desktop/shell/`.

This is worker implementation evidence only. It does not claim reviewer approval, main verification, release readiness, tag, push, publish, or release.

## Product Design Usage

Product Design was used as a brief gate and visual direction input.

- Read `product-design:index` skill instructions.
- Read `product-design:get-context` skill instructions.
- Confirmed the v37 Desktop Shell MVP brief: local desktop app shell for sidecar health, project/active goal, next action, job/run state, artifact preview, and evidence readiness.
- Read enough of `product-design:image-to-code` guidance to use the supplied warm parchment command-center reference as implementation direction, not as a separate prototype.
- Ran `python3 /Users/andy/.codex/plugins/cache/openai-curated-remote/product-design/0.1.41/scripts/user_context_preflight.py`; result: failed because the script path is not present on disk (`Errno 2`). Work continued from the explicit user brief.

Product Design output was not used as product state. Final repo changes were made directly by Codex.

## Open Design Usage

Open Design was not used. No Open Design screenshots, exports, or generated assets were produced.

## Visual Reference Interpretation

The user-provided warm parchment command-center dashboard reference was interpreted as visual language only. The implementation does not copy its v32 wording or example business data.

Applied:

- ivory/parchment page background
- warm thin borders
- subtle shadows
- compact operational cards
- left navigation on desktop width, compact top navigation on narrower internal-browser widths
- top search/status-bar style area
- first row for sidecar, active goal, next action, and run health
- lower areas for lifecycle, run state, artifact/evidence readiness, Tauri decision, and desktop boundaries
- plum for selected/missing primary status
- olive for healthy/locked states
- amber/copper for partial, unavailable, stale, and warning states
- dark ink typography
- small dense labels
- cards around 8px radius

Avoided:

- marketing hero
- large decorative gradients or orb backgrounds
- generic shell runner
- browser terminal
- command palette
- beige-only monotone treatment

## Desktop Technology Decision

Decision: Tauri first. Electron is deferred.

Reasoning for this repo now:

- The repo already has a local console sidecar and explicit HTTP contracts for runtime health, active goal, next action, action preview, job state, artifact index, evidence timeline, and release bundle.
- The Workbench renderer is already Vite/React and can be reused without adding a second web app.
- Tauri keeps the native host boundary small for v37 task-2 sidecar attach/launch work.
- Task-1 does not need Node IPC, direct filesystem access, shell execution, model invocation, or git writes from a desktop main process.
- Electron would add packaging and main-process test surface before this phase needs it.
- Full native build smoke is deferred to v37 task-5.

## UX Brief

Brief path: `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`

The brief covers:

- first-screen layout
- navigation structure
- top bar status area
- sidecar health
- active goal
- next action
- job/run state
- artifact preview and evidence readiness
- empty/loading/error/blocked states
- Web Workbench reuse
- desktop-only components
- v37 task-2/task-3/task-4/task-5 handoff

## Implementation Summary

Added a Desktop Shell route:

- `/workbench/desktop/`
- route-specific shell header
- desktop shell side navigation
- compact command-center grid
- sidecar health card
- active goal, next action, and run health cards
- lifecycle timeline card
- job/run state card
- artifact/evidence readiness card
- Tauri-first decision card
- no-runner boundary card

Added a contract-backed projection:

- `DesktopShellMvpViewModel`
- projected from existing read-only Workbench contracts
- no branch, filename, commit, prompt, task-title, or frontend-only status inference

Added a minimal desktop workspace boundary:

- `desktop/shell/README.md`

Added read-only route timeout handling:

- `frontend/workbench/src/api/client.js` now applies a 3000 ms timeout per read-only route fetch. This prevents one slow route from keeping the Desktop Shell and Workbench in a permanent loading state.

## Files Changed

- `desktop/shell/README.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CeHYkMOD.js`
- `src/symphony/workbench-static/assets/index-CfMyvTe-.css`
- deleted replaced static build assets:
  - `src/symphony/workbench-static/assets/index-CpBepO49.js`
  - `src/symphony/workbench-static/assets/index-ooe-c3KL.css`

## App / Desktop / Workbench Path Changed

User path:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
http://127.0.0.1:8765/workbench/desktop/
```

The route uses the existing Workbench static pipeline and console serving path. It is not a native Tauri app yet. v37 task-2 should add the native host and sidecar lifecycle bridge.

## Commands Run

Branch and goal preflight:

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
```

Current result after implementation:

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
?? src/symphony/workbench-static/assets/index-CeHYkMOD.js
?? src/symphony/workbench-static/assets/index-CfMyvTe-.css
```

```text
git rev-parse HEAD
```

Result:

```text
09c926f703663df9ed4bacaf21939c2d6659dfd1
```

```text
pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json
```

Result:

```json
{
  "version": "1",
  "status": "missing-runbook",
  "reason": "No active managed goal runbook is registered.",
  "goalId": "v37-desktop-shell-mvp",
  "nextAction": null
}
```

Dependency setup:

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
```

First result before dependency install:

```text
tests/workbench-api-client.test.js passed; tests/workbench-shell.test.js failed with ERR_MODULE_NOT_FOUND: Cannot find package 'react'
```

```text
pnpm install --frozen-lockfile
```

Result:

```text
exit 0; dependencies installed from lockfile; no lockfile change
```

Focused verification:

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
```

Final result:

```text
tests 74
suites 3
pass 74
fail 0
duration_ms 734.416209
```

Static checks:

```text
pnpm check
```

Final result:

```text
exit 0
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Full test suite:

```text
pnpm test
```

Final result:

```text
tests 989
suites 152
pass 989
fail 0
duration_ms 5425.838041
```

Workbench static build:

```text
pnpm workbench:build
```

Final result:

```text
vite v8.0.14 building client environment for production...
✓ 17 modules transformed.
src/symphony/workbench-static/index.html                     0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CfMyvTe-.css     32.30 kB │ gzip:   5.51 kB
src/symphony/workbench-static/assets/index-CeHYkMOD.js   1,190.11 kB │ gzip: 211.67 kB
✓ built in 100ms
```

Whitespace check:

```text
git diff --check
```

Result:

```text
exit 0
```

Goal status:

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

Worker event dry-run:

```text
pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-1 --event worker.evidence-recorded --actor codex-v37-task-1-worker --evidence-ref docs/plans/v37-task-1-worker-evidence-2026-06-02.md --dry-run --json
```

Result:

```text
exit 0
planHash sha256:85f62cf22bad68e29713043e53ac4ec1c2c62437c3833d19442a0a571cb2956a
validation.status ok
wouldAppend.eventCount 1
ledgerPreview task-1 unknown -> needs-review
confirm.available true
```

Worker event confirm:

```text
pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-1 --event worker.evidence-recorded --actor codex-v37-task-1-worker --evidence-ref docs/plans/v37-task-1-worker-evidence-2026-06-02.md --confirm --plan-hash sha256:85f62cf22bad68e29713043e53ac4ec1c2c62437c3833d19442a0a571cb2956a
```

Result:

```text
exit 0
mode confirm
status appended
written true
appendOnly true
eventId evt_0d2b92a6d75888f0
eventHash sha256:40bc22d15b7fd54d03bc8f1faca21d008e9f672606f25125f7f10f2e072629d0
```

Post-confirm goal status:

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

## Visual QA

Started local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
```

Observed server output:

```text
Status listening
Next http://127.0.0.1:8765/
```

Internal browser route:

```text
http://127.0.0.1:8765/workbench/desktop/
```

QA notes:

- Initial Desktop route rendered, but inherited the full Workbench header/nav/context stack and made the page too long. Fixed by omitting global Workbench state/nav/context on the Desktop route.
- User feedback in the internal browser: the page still felt too long and required scrolling.
- Follow-up change reduced the desktop header, shortened card fields, removed the fixed 640 px sidebar height, clamped first-row summary text, and changed the mid-width internal-browser layout from a tall left rail to a compact horizontal command-center nav.
- Browser automation later rejected an automatic reload due the internal browser URL policy. No workaround was attempted. The updated static build is available on the same route; manual browser refresh displays the latest static assets.
- Earlier QA after route implementation confirmed 9 desktop cards rendered, loading state cleared, and no card overlap was detected before the final compacting pass.

Known local runtime route issues during QA:

- `/api/runtime/snapshot` returned a contract validation error because `release_status.release_ready_source` was empty.
- `/api/readiness` could hang long enough to hold the Workbench in loading. The new per-route read-only timeout leaves the route marked unavailable instead of blocking the shell.

## Boundary Notes

The Desktop Shell route is read-only.

It does not:

- execute shell commands
- expose a browser terminal
- expose a generic shell runner
- expose an arbitrary command palette
- call a model
- open arbitrary local files
- write git state
- merge, push, tag, publish, or release
- self-approve
- claim reviewer approval
- claim main verification
- declare release readiness

State comes from explicit backend contracts and projections. ArtifactStore remains canonical; artifact/evidence index views are derived.

## Known Limitations / Handoff

- No native Tauri workspace was built in task-1. `desktop/shell/` records the boundary and decision only.
- No Tauri sidecar launcher or attach bridge exists yet. That is v37 task-2.
- No native desktop build/smoke was run. That is v37 task-5.
- `symphony goal update` accepted and appended the worker evidence event, but `symphony goal-status` still reports `goal not found` for `v37-desktop-shell-mvp`. Treat this as a follow-up state/lookup issue, not as approval, main verification, or release readiness.
- Product Design preflight script path was missing, so no generated Product Design artifact was produced.
- Browser automation could not perform the final automatic reload because the internal browser blocked the URL action. The user can refresh the currently open internal browser page to see the latest static build.

## Suggested Reviewer Focus

- Confirm the Desktop route uses explicit contract projections only.
- Confirm no shell/model/file/git/release action surface was added.
- Review the compact UI behavior at desktop and internal-browser widths.
- Review `DesktopShellMvpViewModel` mapping for future task-2 sidecar attach data.
- Review the 3000 ms read-only route timeout for compatibility with existing Workbench expectations.

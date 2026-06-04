# v37 task-2 worker evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-2`
Branch: `v37-task-2-tauri-host-sidecar-bridge`
Worker: `codex-v37-task-2-worker`

## Task-1 Handoff Reviewed

Reviewed:

- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `desktop/shell/README.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- Workbench route, API projection, style, console, and related tests.

The task-1 handoff established `/workbench/desktop/` as the renderer shell. This task adds the native host boundary and sidecar lifecycle contract without reviewer approval, main verification, release readiness, tag, push, publish, or release activity.

## Tauri Host Workspace Summary

Added a minimal Tauri v2 workspace under `desktop/shell/src-tauri`.

Native host entry points:

- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/src/main.rs`
- `desktop/shell/src-tauri/capabilities/default.json`

The Tauri config reuses the existing renderer route:

- dev URL: `http://127.0.0.1:5173/workbench/desktop/`
- packaged frontend path: `../../../src/symphony/workbench-static`
- window URL: `/workbench/desktop/`

`cargo check` succeeds for the Tauri host. A full packaged native app build was not run in this worker task; task-5 should own platform packaging, installer/bundle checks, and native smoke coverage beyond compile/smoke boundaries.

## Sidecar Attach/Launch Bridge Summary

Added a controlled native boundary in `desktop/shell/src-tauri/src/lib.rs`:

- `attach_sidecar` probes only loopback `127.0.0.1` or `localhost` on a validated port and checks `/api/health`.
- `launch_sidecar` uses the fixed command shape `pnpm symphony console --host <loopback-host> --port <validated-port>`.
- The command id surfaced to the renderer is `symphony.console.sidecar.launch`.
- The renderer does not construct shell commands, arbitrary paths, local file opens, model calls, git writes, merge, push, tag, publish, or release actions.

Added `scripts/desktop-shell-smoke.js` and `pnpm desktop:shell:smoke` to verify the Tauri workspace and bridge guardrails without launching arbitrary commands.

## Sidecar Health Contract / Source

Added `src/symphony/sidecar-host-bridge.js` with the `sidecar-host-lifecycle.v1` contract. The contract is embedded in `local-runtime-health.v1`, which is already carried through `app-state-snapshot.v1`.

Renderer source path:

`app-state-snapshot.v1 -> runtime_health.sidecarHost -> Workbench runtimeSnapshot.runtime.sidecarHost -> DesktopShell.sidecarHealth`

The UI does not infer sidecar state from branch names, file names, task titles, prompt text, commit messages, or frontend-only state.

## Desktop Route User Path

User path remains:

`/workbench/desktop/`

The route now renders sidecar host bridge state from contract-backed runtime health. In the local QA run it displayed:

- sidecar state: `attached`
- status: `ok`
- attach: `attached`
- launcher: `defined`
- bridge: `symphony.console.sidecar.launch`
- decision card workspace: `desktop/shell/src-tauri + /workbench/desktop/`
- native build: `false` for this worker build boundary

## Files Changed

Task-2 implementation files:

- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/Cargo.lock`
- `desktop/shell/src-tauri/build.rs`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/src/main.rs`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/capabilities/default.json`
- `desktop/shell/src-tauri/icons/icon.png`
- `scripts/desktop-shell-smoke.js`
- `src/symphony/sidecar-host-bridge.js`
- `src/symphony/local-runtime-health.js`
- `src/symphony/app-state-snapshot.js`
- `fixtures/contracts/sidecar-host-lifecycle.v1.json`
- `fixtures/contracts/local-runtime-health.v1.json`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/v37-sidecar-host-bridge.test.js`
- `tests/v33-local-runtime-health.test.js`
- `tests/v33-app-state-snapshot.test.js`
- `tests/workbench-api-client.test.js`
- `desktop/shell/README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `README.md`
- `package.json`

Generated Workbench build output changed under `src/symphony/workbench-static/`.

The worktree already included task-1 baseline changes and untracked handoff docs when this worker resumed. Those baseline files were left in place and not reverted.

## Commands Run With Exact Results

Preflight:

- `pwd` -> `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/multi-coding-agent-symphony`
- `git status --short --branch` -> `## v37-task-2-tauri-host-sidecar-bridge` with expected dirty baseline plus task-2 changes
- `git rev-parse HEAD` -> `09c926f703663df9ed4bacaf21939c2d6659dfd1`
- `pnpm --silent symphony goal next --goal v37-desktop-shell-mvp --json` -> exit 0, `status: "missing-runbook"`, `message: "No active managed runbook is registered for goal v37-desktop-shell-mvp."`
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` -> exit 64, `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`

Dependency setup:

- `pnpm install --frozen-lockfile` -> exit 0, lockfile unchanged, packages installed into `node_modules`

Focused tests:

- `pnpm --silent exec node --test tests/v37-sidecar-host-bridge.test.js tests/v33-local-runtime-health.test.js tests/v33-app-state-snapshot.test.js tests/workbench-api-client.test.js` -> exit 0, `tests 60`, `suites 4`, `pass 60`

Acceptance:

- `pnpm check` -> exit 0
- `pnpm test` -> exit 0, `tests 992`, `suites 153`, `pass 992`, `fail 0`
- `pnpm workbench:build` -> exit 0, Vite built `src/symphony/workbench-static` successfully
- `pnpm desktop:shell:smoke` -> exit 0, `desktop-shell-smoke.v1`, `status: "ok"`
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` -> first run exit 101 because `src-tauri/icons/icon.png` was missing; after adding the icon, rerun exit 0
- `git diff --check` -> exit 0
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` -> exit 64, `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`

## Visual QA Result

Console started on `http://127.0.0.1:8876/`.

Chrome checks opened:

`http://127.0.0.1:8876/workbench/desktop/`

1280x720:

- phase: `只读展示`
- card count: 9
- horizontal overflow: false
- card overlap: none
- sidecar text: `Local Runtime attached`, `status ok`, `attach attached`, `launcher defined`, `bridge symphony.console.sidecar.launch`
- screenshot: `tmp/chrome-v37-qa/desktop-1280x720.png`

390x720:

- phase: `只读展示`
- card count: 9
- horizontal overflow: false
- card overlap: none
- sidecar text: `Local Runtime attached`, `status ok`, `attach attached`, `launcher defined`, `bridge symphony.console.sidecar.launch`
- screenshot: `tmp/chrome-v37-qa/desktop-390x720.png`

Browser console/network issues recorded during QA:

- `GET /api/runs/latest` -> 404
- `GET /api/goals/latest/operations` -> 404
- `GET /api/goals/latest/runbook` -> 404
- `GET /api/goals/latest/prompt` -> 404
- `GET /api/goals/latest/closeout` -> 404
- `GET /api/goals/latest/release-baseline` -> 404
- `GET /api/jobs/create` -> 400
- `GET /favicon.ico` -> 404

These are rendered as contract-backed unavailable or missing states. They did not block `/workbench/desktop/` from reaching the ready display.

## Boundary Notes

- No Electron dependency was added.
- No generic shell runner was added.
- No browser terminal was added.
- No arbitrary command panel was added.
- Renderer code does not execute shell commands.
- Renderer code does not open arbitrary local files or paths.
- Renderer code does not call models.
- Renderer code does not expose git write, merge, push, tag, publish, or release actions.
- ArtifactStore remains canonical; no artifact/evidence index was promoted to source of truth.
- This worker evidence is not reviewer approval, main verification, release readiness, tag, push, publish, or release.

## Known Limitations / Handoff

- Full native Tauri packaging was not run. `cargo check` and `pnpm desktop:shell:smoke` are the verified task-2 boundaries; task-5 should own native package/build smoke and platform-specific installer checks.
- The launch bridge is defined and guarded in native code, but the desktop renderer remains display-only for task-2. A future task can connect a native UI affordance if the product wants controlled launch from the Tauri host.
- `goal-status --goal v37-desktop-shell-mvp` still returns `goal not found`; this matches the known lookup/runbook registration follow-up and was not treated as release readiness.
- `/workbench/desktop/` displays `missing-runbook` for the latest goal because no active managed runbook is registered in this local console state.

# v37 Task-2 Review Fix Evidence

Goal id: v37-desktop-shell-mvp
Task id: task-2
Branch: v37-task-2-tauri-host-sidecar-bridge
Worktree: /Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/multi-coding-agent-symphony

## Finding Addressed

Independent review found that `app-state-snapshot.v1` still accepted `runtime_health` objects without `sidecarHost`, and the Desktop projection could display the sidecar as attached when the sidecar lifecycle fields were missing.

## Fix Summary

- Added `runtime_health` validation in `validateAppStateSnapshotContract()` by reusing `validateLocalRuntimeHealthContract()`.
- Updated every `fixtures/contracts/app-state-snapshot*.v1.json` fixture to include `runtime_health.sidecarHost`.
- Changed the Desktop Shell projection so a missing `sidecarHost.attach.state` renders as missing instead of falling back to attached.
- Added focused regression coverage for missing `runtime_health.sidecarHost` in the app-state snapshot validator and Desktop Shell view model projection.

## Files Changed For This Fix

- `src/symphony/app-state-snapshot.js`
- `frontend/workbench/src/api/contracts.js`
- `fixtures/contracts/app-state-snapshot.v1.json`
- `fixtures/contracts/app-state-snapshot.healthy.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-project.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-goal.v1.json`
- `fixtures/contracts/app-state-snapshot.blocked.v1.json`
- `fixtures/contracts/app-state-snapshot.stale.v1.json`
- `tests/v33-app-state-snapshot.test.js`
- `tests/workbench-api-client.test.js`

## Commands Run

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/multi-coding-agent-symphony`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-2-tauri-host-sidecar-bridge`, dirty with expected task-1/task-2 files
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`
- `pnpm --silent exec node --test tests/v33-app-state-snapshot.test.js tests/workbench-api-client.test.js tests/v37-sidecar-host-bridge.test.js`
  - exit 0
  - tests 57, suites 3, pass 57, fail 0
- `pnpm check`
  - exit 0
- `pnpm test`
  - exit 0
  - tests 992, suites 153, pass 992, fail 0
- `pnpm workbench:build`
  - exit 0
  - built `index-BRbEyT7W.js` and `index-CIofGqjM.css`
- `pnpm desktop:shell:smoke`
  - exit 0
  - `desktop-shell-smoke.v1`, status `ok`
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`
  - exit 0
- `git diff --check`
  - exit 0
  - no output
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json`
  - exit 64
  - `goal not found`

## Boundary Notes

This fix does not add shell execution, a generic command runner, a browser terminal, model calls, local file opening, git write actions, release actions, reviewer approval, or release readiness claims.

## Known Follow-Up

`goal-status --goal v37-desktop-shell-mvp` still returns `goal not found`; this remains the previously recorded lookup/runbook registration follow-up.

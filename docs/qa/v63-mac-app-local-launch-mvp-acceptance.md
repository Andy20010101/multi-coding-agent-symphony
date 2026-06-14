# v63 Mac App Local Launch MVP acceptance

Date: 2026-06-15
Timezone: Asia/Shanghai
Goal: `v63-mac-app-local-launch-mvp`

## Accepted Scope

v63 makes the local Tauri shell a practical App Home launch path over the existing Workbench route.

Accepted changes:

- v63 runbook and v62 release-state reconcile are recorded.
- `pnpm desktop:shell:smoke` reports a `desktop-shell-smoke.v1` local launch contract.
- The smoke check verifies the Tauri route, single window, capability file, command allowlist, `bundle.active: false`, `publish = false`, updater absence, forbidden plugin absence, and no Electron migration.
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` compiles the source-level Tauri host.
- App Home shows sidecar `attached`, `launchable`, `launching`, `failed`, `wrong-port`, `port-conflict`, `stale`, and `unavailable` states from read-only contracts.
- Local launch and recovery commands are documented in `docs/desktop-local-launch-guide.md`.
- Browser fallback remains `http://127.0.0.1:8765/workbench/desktop/`.

Out of scope:

- public installer;
- `.dmg` publication;
- app signing;
- notarization;
- auto-update;
- app store release;
- generic terminal;
- renderer command execution;
- provider CLI launch;
- git merge, push, tag, publish, or GitHub Release automation inside product code.

## Evidence

| Check | Result |
| --- | --- |
| `pnpm workbench:build` | Passed. Built `src/symphony/workbench-static/index.html`, CSS asset `index-Ckba2pdB.css`, and JS asset `index-D2bvlUYP.js`. |
| `pnpm desktop:shell:smoke` | Passed. Output `desktop-shell-smoke.v1`, `status: ok`, route `/workbench/desktop/`, fixed commands `attach_sidecar` and `launch_sidecar`, `bundleActive: false`, `autoUpdateAvailable: false`, `publishAvailable: false`, `signingClaimAvailable: false`, `notarizationClaimAvailable: false`. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Passed. Finished `symphony-desktop-shell` dev profile. |
| `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/workbench-route-smoke.test.js` | Passed: 121 tests, 121 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 1370 tests, 1370 passed. A non-failing Vite WebSocket warning reported port `24678` already in use. |
| `git diff --check` | Passed. |

## Acceptance Criteria

| Criterion | Evidence |
| --- | --- |
| Implemented surfaces are backed by contracts, tests, or operator evidence. | `desktop-shell-smoke.v1`, `sidecar-host-lifecycle.v1` projection tests, Workbench SSR tests, route smoke tests, and this acceptance record. |
| Workbench text does not overclaim execution, provider support, release automation, public distribution, notarization, or auto-update. | Smoke check blocks packaging/updater fields; docs explicitly keep those claims out of scope. |
| Mutating transitions stay backend-owned or manual. | App Home shows inert command text and recovery instructions; no renderer shell execution or generic runner is added. |
| Raw transcripts, raw provider output, local session refs, provider payloads, and secret values remain outside Workbench payloads. | Existing Workbench tests and route smoke checks pass; v63 adds only sidecar state projections. |
| Closeout records validation, skipped gates, risks, rollback, and handoff. | `docs/plans/v63-mac-app-local-launch-mvp-closeout-snapshot-2026-06-14.md`. |

## Residual Risk

No interactive native window smoke is recorded in this acceptance file. v63 validates the source-level Tauri host, Workbench route, bridge boundary, and sidecar states. Public packaging and colleague distribution remain later-version work.

## Rollback

If the sidecar state surface regresses, revert the App Home projection PR and keep browser Workbench as the primary path.

If the native host boundary expands beyond fixed sidecar attach/launch, revert the host smoke PR.

If local launch docs overclaim distribution or automation, revert the docs PR.

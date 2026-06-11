# v37 Desktop Shell Workspace

This directory is the v37 Desktop Shell workspace. After v46, it is also the intended starting point for v47 Mac App Shell Activation. The renderer entry remains:

```text
/workbench/desktop/
```

The route is built from the existing Workbench Vite/React asset pipeline and served by the local console sidecar. v37 task-2 added a minimal Tauri host boundary under `desktop/shell/src-tauri/` without adding Electron or changing the workflow kernel.

As of v46, the daily path is still the browser Workbench started by `symphony console`. v47 should activate this existing Tauri shell so local supervision starts from an app home surface instead of a browser URL.

## Decision

Use Tauri first for the native shell.

Reasons for this repo now:

- The current kernel already exposes local sidecar-style HTTP contracts: `/api/health`, `/api/runtime/snapshot`, `/api/actions/*`, `/api/jobs/*`, and artifact/evidence routes.
- The renderer can reuse the existing Workbench React and Vite assets without duplicating a second web app.
- Tauri keeps the native process boundary small for sidecar attach/launch work.
- Electron is deferred because this phase does not need a Node main process, IPC command execution, or a larger packaging surface.
- The current task keeps the renderer buildable through `pnpm workbench:build`.
- v37 task-5 validates native host compile/smoke evidence. It still does not enable distribution packaging.

## Current Workspace Boundary

Renderer and contract files:

- `frontend/workbench/src/App.jsx`: renders the `/workbench/desktop/` route.
- `frontend/workbench/src/api/contracts.js`: projects `DesktopShellMvpViewModel` from existing read-only contracts.
- `frontend/workbench/src/styles/workbench.css`: desktop shell layout and warm parchment visual treatment.
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`: layout, state, and follow-up handoff.

The desktop route may show only data from explicit backend contracts. It must not infer goal state from branch names, filenames, prompts, task titles, or frontend-only state.

## v47 Activation Target

v47 should reuse this workspace rather than start a second desktop shell. The activation target is:

- native window entry for the app home or enhanced `/workbench/desktop/` surface
- current project, sidecar state, backend health, active goal, next action, supervisor summary, route source, and read-only boundary visible on the first screen
- backend unavailable, sidecar missing, project missing, active goal missing, supervisor model unavailable, stale snapshot, and route failure shown as app states
- no browser terminal, generic shell runner, provider CLI invocation, daemon control, child dispatch, goal event registration, git push/tag/publish, GitHub Release, signed distribution, notarization, or auto-update

Implementation guidance lives in `docs/plans/v47-mac-app-shell-activation-runbook-2026-06-11.md`.

Native host files:

- `desktop/shell/src-tauri/tauri.conf.json`: Tauri v2 host config. It points dev mode at `http://127.0.0.1:5173/workbench/desktop/` and build mode at the existing `src/symphony/workbench-static` assets.
- `desktop/shell/src-tauri/src/lib.rs`: exposes only `attach_sidecar` and `launch_sidecar`.
- `desktop/shell/src-tauri/capabilities/default.json`: grants the main window the default core capability only.
- `scripts/desktop-shell-smoke.js`: validates the Tauri host files and sidecar bridge guardrails without requiring a full native build.

## Sidecar Bridge

The native bridge has two fixed commands:

- `attach_sidecar`: probes `GET /api/health` on `127.0.0.1` or `localhost` and a port between `1024` and `65535`.
- `launch_sidecar`: starts only `pnpm symphony console --host <loopback> --port <allowed-port>` from the repo root when the health probe is not already attached.

The bridge does not accept arbitrary command text, arbitrary executable paths, arbitrary file paths, model options, git operations, release operations, or publish/tag inputs. The renderer route does not call these commands in task-2; it displays the backend snapshot state.

Health state is carried through:

```text
sidecar-host-lifecycle.v1
local-runtime-health.v1.sidecarHost
app-state-snapshot.v1.runtime_health.sidecarHost
DesktopShellMvpViewModel.sidecarHealth
```

The Workbench route shows attach state and launcher command id from the snapshot. It does not execute the launcher from the browser.

## Verification Boundary

Task-2 adds this targeted smoke command:

```text
pnpm desktop:shell:smoke
```

This validates the host manifest, Tauri file layout, controlled command names, fixed `pnpm symphony console` launch shape, loopback host guard, port range guard, and no Electron dependency. It is not a native app build.

v47 PR-3 extends the same smoke check to assert:

- the Rust command surface is limited to `attach_sidecar` and `launch_sidecar`
- the invoke handler exposes only those two commands
- the launcher command id remains `symphony.console.sidecar.launch`
- the native launch shape remains `pnpm symphony console --host <loopback> --port <allowed-port>`
- the host allowlist remains `127.0.0.1` and `localhost`
- the port allowlist remains `1024` through `65535`
- the Tauri capability set remains a single `default.json` capability for the `main` window with only `core:default`
- the Tauri config does not add plugins, updater settings, publish URLs, signing/notarization fields, or extra windows
- Cargo runtime dependencies remain limited to `serde` and `tauri`, with `tauri-build` as the only build dependency
- renderer shell execution, arbitrary command access, and arbitrary path access remain unavailable
- `bundle.active` remains `false`
- `Cargo.toml` keeps `publish = false`
- no updater, publish URL, signing, codesigning, or notarization entry is present

The current desktop smoke boundary is:

```text
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

Distribution packaging remains off. The smoke check and `cargo check` validate source-level host boundaries and compileability only; they do not produce or validate a signed app, notarized app, auto-update channel, publish endpoint, or release automation. This workspace does not enable auto-update, publish, signing, notarization, tag, push, release gates, release readiness, a generic shell runner, or arbitrary local file access. Release/distribution work belongs to a later release-manager or native distribution task after independent review and main verification.

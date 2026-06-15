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
- `bundle.active` is allowed only for the local macOS `.app` target
- `Cargo.toml` keeps `publish = false`
- no updater, publish URL, signing, codesigning, or notarization entry is present

The current desktop smoke boundary is:

```text
pnpm workbench:build
pnpm desktop:shell:smoke
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

## v71 Local Personal-Use Package

The local package command is:

```text
pnpm desktop:shell:build:local
```

It runs the fixed Tauri build command from `desktop/shell/src-tauri`:

```text
pnpm --dir ../../.. exec tauri build --bundles app --ci --no-sign
```

The expected local artifact path is:

```text
desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app
```

Prerequisites:

- macOS host;
- Node.js and `pnpm`;
- Rust toolchain with `cargo`;
- repo devDependencies installed, including `@tauri-apps/cli`.

This package path is for local personal use. It does not create a DMG, notarize the app, configure auto-update, upload GitHub Release assets, or prepare a colleague or customer rollout.

### Open Without Installing

After `pnpm desktop:shell:build:local` succeeds, open the local app bundle:

```text
open -n "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app"
```

Check that macOS started the app process:

```text
pgrep -fl "Symphony Desktop Shell|symphony-desktop-shell"
```

Quit the app after smoke testing:

```text
osascript -e 'tell application "Symphony Desktop Shell" to quit'
```

This launch smoke checks that macOS can open the unsigned local `.app`. It is not notarization, signing, a DMG install, or a public release test.

### Sidecar State

The app shell opens `/workbench/desktop/`. It can attach to an already-running local console sidecar at the loopback host and allowed port:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
```

If the sidecar is not running, the shell should show the existing unavailable or stale backend state from the Workbench contracts. The renderer still does not get a terminal, arbitrary shell command, local session folder reader, git writer, or release publisher.

### Install

For a user-local install, copy the app bundle into `~/Applications`:

```text
mkdir -p "$HOME/Applications"
cp -R "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app" "$HOME/Applications/"
open -n "$HOME/Applications/Symphony Desktop Shell.app"
```

Use `/Applications` only when the operator intentionally wants a machine-level copy and has the required macOS permissions.

### Uninstall

Quit the app, then remove the copied bundle:

```text
osascript -e 'tell application "Symphony Desktop Shell" to quit'
rm -rf "$HOME/Applications/Symphony Desktop Shell.app"
```

The current shell does not write operator settings through a product feature. If macOS creates app support or cache folders during local testing, remove them only after checking they belong to this identifier:

```text
rm -rf "$HOME/Library/Application Support/dev.symphony.desktop-shell"
rm -rf "$HOME/Library/Caches/dev.symphony.desktop-shell"
```

### Reinstall

Rebuild and replace the local copy:

```text
pnpm desktop:shell:build:local
osascript -e 'tell application "Symphony Desktop Shell" to quit'
rm -rf "$HOME/Applications/Symphony Desktop Shell.app"
cp -R "desktop/shell/src-tauri/target/release/bundle/macos/Symphony Desktop Shell.app" "$HOME/Applications/"
open -n "$HOME/Applications/Symphony Desktop Shell.app"
```

### Rollback

Rollback uses a known-good repo commit or a previously saved app bundle. From the repo, rebuild the previous commit outside the app, then replace the user-local copy with that bundle. If the native package cannot be opened, return to the browser Workbench path and keep the failed app bundle for inspection until the failure is recorded.

Browser Workbench fallback:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
open "http://127.0.0.1:8765/workbench/desktop/"
```

## v63 Local Launch MVP

v63 keeps this workspace as a local launch MVP. The Tauri window opens `/workbench/desktop/`, dev mode starts the existing Workbench Vite server, and the native bridge remains limited to `attach_sidecar` plus `launch_sidecar`.

The source-level smoke check is:

```text
pnpm desktop:shell:smoke
```

The native host compile check is:

```text
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
```

These checks are enough for v63 host boundary validation. v71 adds a local `.app` bundle path for personal use. That package is not evidence of public distribution.

Operator-facing launch and recovery commands are documented in `docs/desktop-local-launch-guide.md`.

Public distribution packaging remains off. The smoke check, `cargo check`, and local `.app` build do not validate a signed app, notarized app, auto-update channel, publish endpoint, DMG, release asset, or release automation. This workspace does not enable auto-update, publish, signing, notarization, tag, push, release gates, release readiness, a generic shell runner, or arbitrary local file access.

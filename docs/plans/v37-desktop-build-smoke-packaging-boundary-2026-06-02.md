# v37 Desktop Build Smoke And Packaging Boundary

Goal id: `v37-desktop-shell-mvp`
Task id: `task-5`
Branch: `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Date checked: `2026-06-04`

## What This Verifies

The Desktop Shell MVP is build-checkable locally, but it is not configured for distribution.

Verified surface:

- Workbench renderer builds into `src/symphony/workbench-static`.
- Tauri host config points to `/workbench/desktop/` and the static Workbench output.
- Native Rust host compiles with `cargo check`.
- Native host binary compiles with `cargo build`.
- Smoke script validates the controlled bridge and packaging-off boundary.
- `/workbench/desktop/` remains visually usable at `1280x720` and `390x720`.

The native bridge remains limited to:

```text
attach_sidecar
launch_sidecar
```

The fixed launcher command id remains:

```text
symphony.console.sidecar.launch
```

## Smoke Assertions

`pnpm desktop:shell:smoke` validates these files:

```text
desktop/shell/src-tauri/tauri.conf.json
desktop/shell/src-tauri/Cargo.toml
desktop/shell/src-tauri/build.rs
desktop/shell/src-tauri/src/lib.rs
desktop/shell/src-tauri/src/main.rs
desktop/shell/src-tauri/capabilities/default.json
```

The smoke script now checks:

- Tauri config exists and uses `/workbench/desktop/`.
- Build output uses `../../../src/symphony/workbench-static`.
- `withGlobalTauri` is `false`.
- `bundle.active` is `false`.
- No Tauri plugin block is present.
- `Cargo.toml` keeps `publish = false`.
- Rust `#[tauri::command]` names are exactly `attach_sidecar` and `launch_sidecar`.
- The invoke handler exposes exactly `attach_sidecar` and `launch_sidecar`.
- The launcher program is fixed to `pnpm`.
- The launcher args stay fixed to `symphony console --host <loopback> --port <allowed-port>`.
- Host validation allows only `127.0.0.1` and `localhost`.
- Port validation stays in the `1024..=65535` range.
- Renderer shell execution is unavailable.
- Arbitrary command access is unavailable.
- Arbitrary path access is unavailable.
- No Electron dependency is introduced.
- No auto-update, updater plugin, publish URL, signing, codesigning, or notarization entry is present.

Smoke result:

```text
pnpm desktop:shell:smoke
exit 0
contractName desktop-shell-smoke.v1
status ok
rendererRoute /workbench/desktop/
nativeHost desktop/shell/src-tauri
attachCommand attach_sidecar
launchCommand launch_sidecar
launchCommandId symphony.console.sidecar.launch
arbitraryCommandAvailable false
arbitraryPathAvailable false
rendererShellExecutionAvailable false
bundleActive false
cargoPublish false
autoUpdateAvailable false
publishAvailable false
signingClaimAvailable false
notarizationClaimAvailable false
```

## Native Build Result

Local Rust toolchain:

```text
cargo --version
exit 0
cargo 1.96.0 (30a34c682 2026-05-25)
```

```text
rustc --version
exit 0
rustc 1.96.0 (ac68faa20 2026-05-25)
```

Native host compile check:

```text
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 52.93s
```

Native host build smoke:

```text
cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 19.37s
```

This confirms the Rust/Tauri host code compiles locally. It does not create a signed, notarized, auto-updating, or published app package.

## Full Tauri Build Boundary

Full `tauri build` was not run because the local Tauri CLI is not installed in this worktree or the user toolchain:

```text
cargo tauri --version
exit 101
error: no such command: `tauri`
```

```text
pnpm exec tauri --version
exit 254
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tauri" not found
```

The repo does not declare `@tauri-apps/cli` in `package.json`. Adding the CLI, selecting bundle targets, and producing distribution artifacts would expand scope beyond task-5. That work should be owned by a later release-manager or native distribution task after review and main verification.

## Packaging Not Enabled

The current Desktop Shell does not enable:

- auto-update
- publish
- release packaging distribution
- signing
- codesigning
- notarization
- tag
- push
- release
- release readiness declaration
- generic shell runner
- browser terminal
- arbitrary command panel
- arbitrary local file access
- renderer-side model invocation
- git write, merge, push, tag, or publish entry

`ArtifactStore` remains canonical. The Desktop route shows artifact index, evidence timeline, and release bundle fields as read-only contract state.

## Visual QA

Route checked:

```text
http://127.0.0.1:8880/workbench/desktop/
```

Viewport `1280x720`:

- loading visible: false
- failed visible: false
- task-3 status strip visible: true
- task-3 status strip fully in first viewport: true
- required status fields visible in page text: blocked, review, main verification, release state
- job section exists: true
- job section reachable through `#desktop-run-state`: true
- artifact section exists: true
- artifact section reachable through `#desktop-artifacts`: true
- horizontal overflow: false
- card overlap count: 0

Screenshots:

```text
tmp/v37-task5-qa/desktop-1280x720-top.png
tmp/v37-task5-qa/desktop-1280x720-full.png
tmp/v37-task5-qa/desktop-1280x720-run-state.png
tmp/v37-task5-qa/desktop-1280x720-artifacts.png
```

Viewport `390x720`:

- loading visible: false
- failed visible: false
- status strip visible: true
- job section exists: true
- job section reachable through `#desktop-run-state`: true
- artifact section exists: true
- artifact section reachable through `#desktop-artifacts`: true
- horizontal overflow: false
- card overlap count: 0

On the narrow viewport, the status strip stacks vertically and is taller than the first `720px` viewport. The route remains scrollable, with no horizontal clipping or card overlap.

Screenshots:

```text
tmp/v37-task5-qa/desktop-390x720-top.png
tmp/v37-task5-qa/desktop-390x720-full.png
tmp/v37-task5-qa/desktop-390x720-run-state.png
tmp/v37-task5-qa/desktop-390x720-artifacts.png
```

## Handoff

Release/distribution work still needs a separate task with explicit ownership for:

- adding or selecting a Tauri CLI version
- deciding bundle targets
- signing/codesigning
- notarization
- auto-update
- publish destination
- release evidence
- reviewer approval
- main verification
- release readiness gate

This task performed no release readiness, tag, push, publish, or release action.

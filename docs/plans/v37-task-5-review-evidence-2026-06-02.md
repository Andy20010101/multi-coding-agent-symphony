# v37 Task-5 Review Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-5`
Branch: `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Reviewer: `codex-v37-task-5-independent-reviewer`
Date checked: `2026-06-04`

## Verdict

PASS.

No blocking findings. The task-5 smoke/build boundary is supported by the source, tests, native compile checks, packaging notes, and visual QA. This review does not claim main verification, release readiness, tag, push, publish, or release.

## Baseline

```text
pwd
exit 0
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence
```

```text
git status --short --branch
exit 0
## v37-task-5-desktop-build-smoke-packaging-boundary-evidence
 M README.md
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M fixtures/contracts/app-state-snapshot.blocked.v1.json
 M fixtures/contracts/app-state-snapshot.healthy.v1.json
 M fixtures/contracts/app-state-snapshot.missing-goal.v1.json
 M fixtures/contracts/app-state-snapshot.missing-project.v1.json
 M fixtures/contracts/app-state-snapshot.stale.v1.json
 M fixtures/contracts/app-state-snapshot.v1.json
 M fixtures/contracts/local-runtime-health.v1.json
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M package.json
 M src/symphony/app-state-snapshot.js
 M src/symphony/local-runtime-health.js
 D src/symphony/workbench-static/assets/index-CpBepO49.js
 D src/symphony/workbench-static/assets/index-ooe-c3KL.css
 M src/symphony/workbench-static/index.html
 M tests/v33-app-state-snapshot.test.js
 M tests/v33-local-runtime-health.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? desktop/
?? docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md
?? docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md
?? docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-1-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md
?? docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md
?? docs/plans/v37-task-2-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-3-review-evidence-2026-06-02.md
?? docs/plans/v37-task-3-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-4-review-evidence-2026-06-02.md
?? docs/plans/v37-task-4-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-5-worker-evidence-2026-06-02.md
?? fixtures/contracts/sidecar-host-lifecycle.v1.json
?? scripts/desktop-shell-smoke.js
?? src/symphony/sidecar-host-bridge.js
?? src/symphony/workbench-static/assets/index-BO6PK3lD.js
?? src/symphony/workbench-static/assets/index-CILC3208.css
?? tests/v37-sidecar-host-bridge.test.js
```

```text
git rev-parse HEAD
exit 0
09c926f703663df9ed4bacaf21939c2d6659dfd1
```

The dirty worktree is the expected cumulative v37 task state plus task-5 files. I did not change implementation files.

## Files Reviewed

- `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `scripts/desktop-shell-smoke.js`
- `desktop/shell/README.md`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/src/lib.rs`
- `package.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v37-sidecar-host-bridge.test.js`

I also inspected `desktop/shell/src-tauri/build.rs`, `desktop/shell/src-tauri/src/main.rs`, and `desktop/shell/src-tauri/capabilities/default.json` because the smoke script validates them.

## Findings

No blocking findings.

Non-blocking limitation: full `tauri build` was not run. The worker recorded this accurately, and independent checks show neither `cargo tauri` nor `pnpm exec tauri` is available. The repository also does not declare `@tauri-apps/cli`.

## Smoke Script Assessment

`scripts/desktop-shell-smoke.js` is a static source/config smoke check. It reads the Tauri config, Cargo manifest, Rust host files, main entrypoint, build script, and capability file. Missing files would fail the read.

The smoke verifies:

- Tauri window route is `/workbench/desktop/`.
- Static renderer output is `../../../src/symphony/workbench-static`.
- `withGlobalTauri` is `false`.
- `bundle.active` is `false`.
- No top-level Tauri plugin block is present.
- `Cargo.toml` keeps `publish = false`.
- Rust `#[tauri::command]` names are exactly `attach_sidecar` and `launch_sidecar`.
- The invoke handler exposes exactly `attach_sidecar` and `launch_sidecar`.
- Launcher id is fixed to `symphony.console.sidecar.launch`.
- Launcher program is fixed to `pnpm`, with fixed `symphony console --host ... --port ...` args.
- Host and port guards remain present.
- Renderer shell execution, arbitrary command access, and arbitrary path access remain unavailable.
- Auto-update, updater plugin, publish URL, signing, codesigning, notarization, and Electron are not introduced.

The smoke script itself does not execute shell commands or become a generic shell runner. It reads files and exits with structured JSON.

## Native Build / Smoke Assessment

`cargo check` and `cargo build` are legitimate host smoke checks for the current task because they prove the Rust/Tauri native host code compiles locally. They do not prove distribution packaging, signing, notarization, auto-update, or release readiness.

Full `tauri build` was not run. Independent CLI checks:

```text
cargo tauri --version
exit 101
error: no such command: `tauri`
```

```text
pnpm exec tauri --version
exit 254
undefined
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tauri" not found
```

```text
rg -n "@tauri-apps/cli|tauri-cli|\btauri\b" package.json pnpm-lock.yaml desktop/shell/src-tauri/Cargo.toml desktop/shell/src-tauri/tauri.conf.json
exit 0
desktop/shell/src-tauri/tauri.conf.json:2:  "$schema": "https://schema.tauri.app/config/2",
desktop/shell/src-tauri/Cargo.toml:14:tauri-build = { version = "2", features = [] }
desktop/shell/src-tauri/Cargo.toml:18:tauri = { version = "2", features = [] }
```

This supports the packaging limitation as recorded.

## Packaging Boundary Assessment

The task-5 boundary document clearly separates local build smoke from distribution packaging. It does not claim release readiness. It states that auto-update, publish, release packaging distribution, signing, codesigning, notarization, tag, push, release, release readiness declaration, generic shell runner, browser terminal, arbitrary command panel, arbitrary local file access, renderer-side model invocation, and git write/merge/push/tag/publish are not enabled.

Source checks support the boundary:

- `desktop/shell/src-tauri/Cargo.toml` has `publish = false`.
- `desktop/shell/src-tauri/tauri.conf.json` has `bundle.active = false`, `withGlobalTauri = false`, and no `plugins` block.
- `desktop/shell/src-tauri/src/lib.rs` exposes only `attach_sidecar` and `launch_sidecar`.
- The launch path is fixed to `Command::new("pnpm").args(["symphony", "console", "--host", target.host, "--port", port])`.
- Host validation allows only `127.0.0.1` and `localhost`; port validation keeps `1024..=65535`.
- The Desktop route renders read-only contract state and anchor navigation only.
- `ArtifactStore` remains canonical through artifact index/evidence/release bundle projection; artifact index remains a derived view.

## Boundary Review Result

No boundary bypass found in the Desktop route or host bridge.

Confirmed unavailable in the reviewed surface:

- generic shell runner
- browser terminal
- arbitrary command panel
- shell execution / model call / arbitrary local file open from the renderer
- artifact download/open action
- git write, merge, push, tag, publish
- reviewer approval, main verification, release declaration UI in the Desktop route
- release readiness declaration

Corrected source boundary scan:

```text
node --input-type=module -e '<source boundary scan>'
exit 0
{
  "desktopSliceLength": 17384,
  "projectionSliceLength": 10326,
  "rustCommands": ["attach_sidecar", "launch_sidecar"],
  "invokeHandler": true,
  "fixedLaunchCommand": true,
  "forbiddenDesktop": {
    "fetch(": false,
    "confirmGoalEventPlan": false,
    "window.open": false,
    "navigator.clipboard": false,
    "<form": false,
    "<textarea": false,
    "download=": false,
    "method=\"POST\"": false,
    "release.ready": false,
    "reviewer.approved": false,
    "main.verification-passed": false,
    "git push": false,
    "git tag": false,
    "publish": false,
    "dangerouslySetInnerHTML": false
  },
  "forbiddenProjection": {
    "shellCommandExecutionAvailable true": false,
    "modelInvocationAvailable true": false,
    "gitWriteAvailable true": false,
    "releaseReadyDeclared true": false
  },
  "configBoundary": {
    "bundleActive": false,
    "withGlobalTauri": false,
    "hasPlugins": false
  },
  "packageHasTauriCli": false
}
```

One earlier scan command failed because I passed an invalid escaped regex through the shell. That command did not modify files and was rerun with fixed-string checks.

## Visual QA Result

Local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8880
exit: running during QA, then stopped after review
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8880/
```

Route checked:

```text
http://127.0.0.1:8880/workbench/desktop/
```

Viewport `1280x720`:

- loading visible: false
- failed visible: false
- document/client width: `1280 / 1280`
- horizontal overflow: false
- card count: 14
- card overlap count: 0
- task-3 status strip visible: true
- task-3 status strip fully in first viewport: true
- required status text present: blocked, review, main verification, release state
- job section exists: true
- job section reachable/scannable: true
- artifact section exists: true
- artifact section reachable/scannable: true

Viewport `390x720`:

- loading visible: false
- failed visible: false
- document/client width: `390 / 390`
- horizontal overflow: false
- card count: 14
- card overlap count: 0
- status strip visible: true
- job section exists: true
- job section reachable/scannable: true
- artifact section exists: true
- artifact section reachable/scannable: true

The narrow status strip stacks and is taller than the first `720px` viewport. That matches the prior task-4 limitation; the route remains scrollable without horizontal overflow or card overlap.

Screenshots:

```text
tmp/v37-task5-review-qa/desktop-1280x720-top.png
tmp/v37-task5-review-qa/desktop-1280x720-full.png
tmp/v37-task5-review-qa/desktop-1280x720-run-state.png
tmp/v37-task5-review-qa/desktop-1280x720-artifacts.png
tmp/v37-task5-review-qa/desktop-390x720-top.png
tmp/v37-task5-review-qa/desktop-390x720-full.png
tmp/v37-task5-review-qa/desktop-390x720-run-state.png
tmp/v37-task5-review-qa/desktop-390x720-artifacts.png
```

## Commands Run

```text
pnpm check
exit 0
node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
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
duration_ms 4836.614083
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
src/symphony/workbench-static/index.html 0.42 kB
src/symphony/workbench-static/assets/index-CILC3208.css 36.97 kB
src/symphony/workbench-static/assets/index-BO6PK3lD.js 1,219.90 kB
built in 72ms
```

```text
pnpm desktop:shell:smoke
exit 0
{
  "contractName": "desktop-shell-smoke.v1",
  "contractVersion": 1,
  "status": "ok",
  "checkedFiles": [
    "desktop/shell/src-tauri/tauri.conf.json",
    "desktop/shell/src-tauri/Cargo.toml",
    "desktop/shell/src-tauri/build.rs",
    "desktop/shell/src-tauri/src/lib.rs",
    "desktop/shell/src-tauri/src/main.rs",
    "desktop/shell/src-tauri/capabilities/default.json"
  ],
  "rendererRoute": "/workbench/desktop/",
  "nativeHost": "desktop/shell/src-tauri",
  "bridge": {
    "attachCommand": "attach_sidecar",
    "launchCommand": "launch_sidecar",
    "launchCommandId": "symphony.console.sidecar.launch",
    "arbitraryCommandAvailable": false,
    "arbitraryPathAvailable": false,
    "rendererShellExecutionAvailable": false
  },
  "packaging": {
    "bundleActive": false,
    "cargoPublish": false,
    "autoUpdateAvailable": false,
    "publishAvailable": false,
    "signingClaimAvailable": false,
    "notarizationClaimAvailable": false
  }
}
```

```text
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Checking symphony-desktop-shell v0.1.0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.54s
```

```text
cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Compiling symphony-desktop-shell v0.1.0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.20s
```

```text
git diff --check
exit 0
no output
```

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v37-sidecar-host-bridge.test.js
exit 0
tests 77
suites 4
pass 77
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 647.498625
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

- I treated `goal-status` exit 64 / `goal not found` as the known local managed-goal lookup limitation already recorded in worker and predecessor evidence. It does not change this review because the Desktop route displays backend contract state and does not infer status from filenames, branches, task titles, or prompt text.
- I did not run full `tauri build` because the Tauri CLI is unavailable locally and not declared in this repo.
- I did not register a reviewer event, main-verification event, release gate, tag, push, publish, or release.

## Suggested Fixes

None. Verdict is PASS.

Review evidence path: `docs/plans/v37-task-5-review-evidence-2026-06-02.md`

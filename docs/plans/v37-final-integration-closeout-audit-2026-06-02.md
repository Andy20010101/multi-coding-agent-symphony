# v37 Final Integration Closeout Audit

Evidence path: `docs/plans/v37-final-integration-closeout-audit-2026-06-02.md`
Audit executed: 2026-06-04 Asia/Shanghai
Goal id: `v37-desktop-shell-mvp`
Role: main controller / integration auditor
Worktree: `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Expected branch: `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`

## Result

PASS for final integration closeout audit.

The final task-5 worktree contains the cumulative v37 Desktop Shell MVP implementation and evidence from task-1 through task-5. The required main verification gates are recorded as passed in their evidence files. The final worktree can be used as the source input for main adoption or merge preparation, provided the adoption flow captures the dirty tracked changes and untracked files together.

This audit did not perform release readiness, tag, push, publish, release, merge, or main adoption.

## Baseline Commands

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
?? docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-5-review-evidence-2026-06-02.md
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

## Evidence Read

Required evidence files were read:

- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md`
- `docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md`
- `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`

Supporting files and implementation slices reviewed:

- `desktop/shell/README.md`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/capabilities/default.json`
- `scripts/desktop-shell-smoke.js`
- `src/symphony/sidecar-host-bridge.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`

## Task Gate Summary

| Task | Main verification result | Event id | Evidence |
| --- | --- | --- | --- |
| task-1 | PASS | `evt_2e0e0ccde222bb4d` | `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md` |
| task-2 | PASS | `evt_35333fd1f242687d` | `docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md` |
| task-3 | PASS | `evt_b92ba55a68ec487c` | `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md` |
| task-4 | PASS | `evt_4c4e687ebe2820ca` | `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md` |
| task-5 | PASS | `evt_013021689363cd38` | `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md` |

Additional worker event ids observed in the required evidence:

- task-1 worker evidence: `evt_0d2b92a6d75888f0`
- task-3 worker evidence: `evt_18c73e6ce690e9c2`
- task-4 worker evidence: `evt_957669dc23052220`
- task-5 worker evidence: `evt_76baa443e082c100`

The final task-5 `.symphony/goals/events/v37-desktop-shell-mvp.ndjson` journal contains task-5 events only:

```text
sequence 1: worker.evidence-recorded, eventId evt_76baa443e082c100
sequence 2: main.verification-passed, eventId evt_013021689363cd38
```

The prior task event ids are preserved in their evidence docs because v37 task work progressed through dirty worktree handoffs rather than a clean consolidated event journal. I found no required evidence file that records a `main.verification-failed` gate for task-1 through task-5. Task-3 has an initial independent review verdict of `NEEDS_REVISION`, followed by a worker revision, reviewer re-check `PASS`, and main verification `PASS`; this is a resolved review cycle, not contradictory main gate evidence. Repeated mentions of the same event id inside an evidence file are command/result references, not duplicate appended gate events.

## Implementation Presence

Present in the final task-5 worktree:

- Desktop/Tauri workspace: `desktop/shell/src-tauri/` with `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `src/lib.rs`, `src/main.rs`, `capabilities/default.json`, generated Tauri schemas, and icon asset.
- Sidecar host bridge:
  - native bridge in `desktop/shell/src-tauri/src/lib.rs`
  - backend contract in `src/symphony/sidecar-host-bridge.js`
  - fixture `fixtures/contracts/sidecar-host-lifecycle.v1.json`
  - runtime propagation through `src/symphony/local-runtime-health.js` and `src/symphony/app-state-snapshot.js`
- Desktop route `/workbench/desktop/` in `frontend/workbench/src/App.jsx`, `frontend/workbench/src/api/contracts.js`, and Workbench static output.
- Project list, active goal, next action, and status strip:
  - `DesktopProjectListCard`
  - `DesktopDevelopmentStatusStrip`
  - `DesktopDevelopmentStatusCard`
  - `projectDesktopShell().projectList`
  - `projectDesktopShell().activeGoalStatus`
  - `projectDesktopShell().nextActionDetail`
- Job, artifact, evidence, and release bundle read-only binding:
  - `DesktopRunStateCard`
  - `DesktopArtifactReadinessCard`
  - `DesktopArtifactPreviewList`
  - `projectDesktopJobRun()`
  - `projectDesktopArtifactReadiness()`
  - binding to `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, `job-run-control.v1`, `artifact-index.v1`, `safe-artifact-preview.v1`, `evidence-timeline.v1`, and `release-bundle.v1`
- Desktop build smoke and packaging boundary evidence:
  - `scripts/desktop-shell-smoke.js`
  - `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
  - `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`
  - `docs/plans/v37-task-5-review-evidence-2026-06-02.md`
  - `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`

## Boundary Result

PASS for the integration boundary audit.

Native host boundary:

- Tauri config route is `/workbench/desktop/`.
- Tauri frontend dist is `../../../src/symphony/workbench-static`.
- `withGlobalTauri` is `false`.
- `bundle.active` is `false`.
- No Tauri `plugins` block is present.
- `Cargo.toml` has `publish = false`.
- `package.json` has no `@tauri-apps/cli` dependency and no release, publish, or tag script.
- Rust command surface is exactly `attach_sidecar` and `launch_sidecar`.
- Rust invoke handler exposes exactly `attach_sidecar` and `launch_sidecar`.
- The only native `Command::new(...)` call is `Command::new("pnpm")`.
- The launch args are fixed to `symphony console --host <loopback> --port <allowed-port>`.
- Host validation allows only `127.0.0.1` and `localhost`.
- Port validation keeps `1024..=65535`.
- No local file open/read path was found in the native bridge. The only `read_to_string` usage is the TCP health response read for `/api/health`.

Desktop route source scan:

```json
{
  "desktopRouteLength": 17384,
  "desktopProjectionLength": 10326,
  "desktopJobLength": 3145,
  "desktopArtifactLength": 3506,
  "forbiddenDesktop": {
    "fetch(": false,
    "invoke": false,
    "window.open": false,
    "navigator.clipboard": false,
    "<form": false,
    "<textarea": false,
    "onClick=": false,
    "method POST": false,
    "XMLHttpRequest": false,
    "WebSocket": false,
    "EventSource": false,
    "sendBeacon": false,
    "localStorage": false,
    "indexedDB": false,
    "href={": false,
    "download=": false,
    "dangerouslySetInnerHTML": false,
    "release.ready": false,
    "reviewer.approved": false,
    "main.verification-passed": false,
    "git push": false,
    "git tag": false,
    "publish": false,
    "modelInvocation": false,
    "shell runner": false,
    "browser terminal": false,
    "arbitrary command panel": false
  }
}
```

Confirmed absent from the reviewed Desktop/Tauri surface:

- generic shell runner
- browser terminal
- arbitrary command panel
- renderer shell execution
- renderer model invocation
- renderer arbitrary local file open
- artifact arbitrary file open or download action
- git write, merge, push, tag, or publish UI
- release-ready declaration UI
- release packaging, signing, notarization, auto-update, publish, tag, push, or release path

ArtifactStore remains canonical. The Desktop route displays `artifact-index.v1`, safe preview, evidence timeline, and release bundle readiness as read-only contract state. `artifact-index.v1` remains a derived cache/search view over ArtifactStore. The projection carries `localFileOpenAvailable: false`, `artifactDownloadAvailable: false`, and `arbitraryPathReadAvailable: false`.

## Verification Commands

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
duration_ms 4974.394916
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
src/symphony/workbench-static/index.html                     0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-CILC3208.css     36.97 kB | gzip:   6.00 kB
src/symphony/workbench-static/assets/index-BO6PK3lD.js   1,219.90 kB | gzip: 216.48 kB
built in 73ms
```

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

```text
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.34s
```

```text
cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.16s
```

```text
git diff --check
exit 0
no output
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

The `goal-status` result matches the known local managed-goal lookup limitation recorded in task evidence. The Desktop route keeps that missing state contract-backed instead of inferring the goal from branch names, filenames, prompt text, task titles, or frontend state.

## Optional Visual QA

Local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8881
exit: running during QA, then stopped with Ctrl-C
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8881/
```

Route checked:

```text
http://127.0.0.1:8881/workbench/desktop/
```

Explicit `1280x720` viewport result:

```json
{
  "topQa1280": {
    "innerWidth": 1280,
    "innerHeight": 720,
    "documentWidth": 1280,
    "clientWidth": 1280,
    "horizontalOverflow": false,
    "statusStripFullyVisible": true,
    "cardCount": 11,
    "requiredTopTextPresent": true,
    "routeFailureVisible": false,
    "loadingShellVisible": false
  },
  "runQa1280": {
    "runSectionVisible": true,
    "horizontalOverflow": false
  },
  "artifactQa1280": {
    "artifactSectionVisible": true,
    "horizontalOverflow": false,
    "visibleOverlapCount": 0
  }
}
```

Screenshots saved:

- `tmp/v37-final-closeout-qa/desktop-explicit-1280x720-top.png`
- `tmp/v37-final-closeout-qa/desktop-explicit-1280x720-run-state.png`
- `tmp/v37-final-closeout-qa/desktop-explicit-1280x720-artifacts.png`

The screenshots are ignored local QA artifacts and are not required adoption inputs.

## Changed Files

Tracked modified files:

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `fixtures/contracts/app-state-snapshot.blocked.v1.json`
- `fixtures/contracts/app-state-snapshot.healthy.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-goal.v1.json`
- `fixtures/contracts/app-state-snapshot.missing-project.v1.json`
- `fixtures/contracts/app-state-snapshot.stale.v1.json`
- `fixtures/contracts/app-state-snapshot.v1.json`
- `fixtures/contracts/local-runtime-health.v1.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `package.json`
- `src/symphony/app-state-snapshot.js`
- `src/symphony/local-runtime-health.js`
- `src/symphony/workbench-static/index.html`
- `tests/v33-app-state-snapshot.test.js`
- `tests/v33-local-runtime-health.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`

Tracked deleted generated assets:

- `src/symphony/workbench-static/assets/index-CpBepO49.js`
- `src/symphony/workbench-static/assets/index-ooe-c3KL.css`

Untracked implementation, evidence, and generated files:

- `desktop/shell/README.md`
- `desktop/shell/src-tauri/Cargo.lock`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/build.rs`
- `desktop/shell/src-tauri/capabilities/default.json`
- `desktop/shell/src-tauri/gen/schemas/acl-manifests.json`
- `desktop/shell/src-tauri/gen/schemas/capabilities.json`
- `desktop/shell/src-tauri/gen/schemas/desktop-schema.json`
- `desktop/shell/src-tauri/gen/schemas/macOS-schema.json`
- `desktop/shell/src-tauri/icons/icon.png`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/src/main.rs`
- `desktop/shell/src-tauri/tauri.conf.json`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md`
- `docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md`
- `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`
- `fixtures/contracts/sidecar-host-lifecycle.v1.json`
- `scripts/desktop-shell-smoke.js`
- `src/symphony/sidecar-host-bridge.js`
- `src/symphony/workbench-static/assets/index-BO6PK3lD.js`
- `src/symphony/workbench-static/assets/index-CILC3208.css`
- `tests/v37-sidecar-host-bridge.test.js`
- `docs/plans/v37-final-integration-closeout-audit-2026-06-02.md`

Generated static assets identified:

- Current Workbench generated static files:
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-CILC3208.css`
  - `src/symphony/workbench-static/assets/index-BO6PK3lD.js`
- Replaced Workbench generated static files:
  - `src/symphony/workbench-static/assets/index-CpBepO49.js`
  - `src/symphony/workbench-static/assets/index-ooe-c3KL.css`
- Tauri generated schema files:
  - `desktop/shell/src-tauri/gen/schemas/acl-manifests.json`
  - `desktop/shell/src-tauri/gen/schemas/capabilities.json`
  - `desktop/shell/src-tauri/gen/schemas/desktop-schema.json`
  - `desktop/shell/src-tauri/gen/schemas/macOS-schema.json`

Ignored local QA/build artifacts observed but not adoption inputs:

- `tmp/tauri-target/`
- `tmp/v37-final-closeout-qa/`
- earlier ignored `tmp/v37-task5-*` QA folders
- existing ignored `tmp/symphony-work/` and `tmp/symphony-scan/`

## Dirty Worktree Inheritance

The final task-5 worktree intentionally contains cumulative uncommitted v37 work:

- task-1 created the `/workbench/desktop/` route, Desktop Shell UX brief, and minimal `desktop/shell/` boundary.
- task-2 added the Tauri host workspace, sidecar lifecycle bridge, runtime/app-state propagation, smoke script, fixtures, and tests.
- task-2 review fix added required `runtime_health.sidecarHost` validation and fixture coverage.
- task-3 copied the verified dirty task-2 state, then added project list, active goal, next action, and first-screen status strip after review revision.
- task-4 copied the verified dirty task-3 state, then added job/run state and artifact/evidence/release bundle readiness binding.
- task-5 copied the verified dirty task-4 state, then strengthened smoke/build and packaging boundary evidence.

All v37 task branches share the same base HEAD `09c926f703663df9ed4bacaf21939c2d6659dfd1`; the cumulative implementation lives in the dirty worktree state and untracked files. Any main adoption process must preserve untracked files as well as tracked diffs.

## Known Limitations

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` returns exit 64 with `goal not found`.
- The final task-5 `.symphony` journal contains task-5 events only. Cross-task gate evidence is in the required evidence documents, not in one consolidated final journal.
- Full `tauri build` was not run. The local toolchain lacks `cargo tauri`, `pnpm exec tauri`, and a declared `@tauri-apps/cli`.
- Distribution packaging is not enabled. `bundle.active` is `false`; signing, codesigning, notarization, auto-update, publish, tag, push, and release remain out of scope.
- The local Desktop route can show `goal: latest` and `missing-runbook` when the managed goal lookup is absent. The UI displays that backend state and does not infer from branch names, prompts, filenames, task titles, or frontend text.
- At narrow widths, prior task evidence records that the status strip stacks vertically and may be taller than the first viewport. The route remains scrollable without horizontal overflow.

## Recommendation

Use this task-5 worktree as the source for main adoption or merge preparation. The adoption plan should include the dirty tracked diffs, untracked implementation files, untracked evidence files, generated Workbench static assets, and deleted old generated assets.

Do not start a v38 task-0 baseline from this worktree until v37 code and evidence adoption is accepted. After adoption is accepted, v38 task-0 can use the adopted v37 state as its baseline.

No release readiness, tag, push, publish, or release action should be inferred from this audit.

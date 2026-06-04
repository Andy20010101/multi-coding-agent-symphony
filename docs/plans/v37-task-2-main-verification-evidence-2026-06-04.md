# v37 Task-2 Main Verification Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-2`
Branch: `v37-task-2-tauri-host-sidecar-bridge`
Worktree: `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/multi-coding-agent-symphony`
HEAD: `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Files Reviewed

- `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md`
- `desktop/shell/README.md`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/capabilities/default.json`
- `scripts/desktop-shell-smoke.js`
- `src/symphony/sidecar-host-bridge.js`
- `src/symphony/local-runtime-health.js`
- `src/symphony/app-state-snapshot.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/v37-sidecar-host-bridge.test.js`
- `tests/v33-local-runtime-health.test.js`
- `tests/v33-app-state-snapshot.test.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `fixtures/contracts/app-state-snapshot*.v1.json`
- `fixtures/contracts/local-runtime-health.v1.json`
- `fixtures/contracts/sidecar-host-lifecycle.v1.json`

## Evidence Reviewed

Worker evidence reviewed: `docs/plans/v37-task-2-worker-evidence-2026-06-02.md`

Review-fix evidence reviewed: `docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md`

Reviewer PASS considered: the independent reviewer PASS covered the High finding fix for required `runtime_health.sidecarHost`, fixture updates, missing attach-state projection, and forbidden surface review. I rechecked those points against code and tests during this main verification.

## Implementation Review

The Tauri host workspace stays scoped to `desktop/shell/src-tauri`. `tauri.conf.json` points dev mode to `http://127.0.0.1:5173/workbench/desktop/`, packaged renderer assets to `../../../src/symphony/workbench-static`, and the window route to `/workbench/desktop/`. `bundle.active` is `false`.

The Rust bridge exposes only two Tauri commands: `attach_sidecar` and `launch_sidecar`. `attach_sidecar` probes `/api/health` on a normalized loopback target. `launch_sidecar` first probes health, then starts only:

```text
pnpm symphony console --host <127.0.0.1|localhost> --port <1024-65535>
```

Host validation rejects anything other than `127.0.0.1` or `localhost`; port validation requires `1024..=65535`. The native bridge has one `Command::new("pnpm")` call and no dynamic executable/path input. Native boundary fields for renderer shell execution, generic shell runner, arbitrary command/path, model invocation, git write, and release write remain `false`.

The state chain is explicit:

```text
sidecar-host-lifecycle.v1
-> local-runtime-health.v1.sidecarHost
-> app-state-snapshot.v1.runtime_health.sidecarHost
-> Workbench runtimeSnapshot.runtime.sidecarHost
-> DesktopShellMvpViewModel.sidecarHealth
```

`validateAppStateSnapshotContract()` now validates `runtime_health` through `validateLocalRuntimeHealthContract()`, and the local runtime health validator requires a valid sidecar lifecycle contract. All app-state snapshot fixtures include `runtime_health.sidecarHost`.

The renderer route `/workbench/desktop/` renders a Desktop Shell view from existing Workbench projections. The desktop component slice has no `fetch()`, `invoke()`, Tauri JavaScript API call, form, textarea, `window.open`, clipboard call, browser terminal, local file open, model call, git write, release action, push, tag, publish, or release-ready declaration path. The boundary card displays `shell exec false`, `git write false`, and `release declared false`.

ArtifactStore remains canonical. Task-2 did not change the artifact store implementation or promote the artifact/evidence index to a source of truth. The Desktop Shell only displays artifact readiness from already projected `artifactRefs`, evidence timeline, and release bundle state.

## Commands Run

- `pwd`
  - exit 0
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/multi-coding-agent-symphony`
- `git status --short --branch`
  - exit 0
  - branch `v37-task-2-tauri-host-sidecar-bridge`; worktree contains expected task-1/task-2 changes and untracked task files.
- `git rev-parse HEAD`
  - exit 0
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`
- `pnpm check`
  - exit 0
  - `node --check` completed for source, scripts, plugin, and test files.
- `pnpm test`
  - exit 0
  - tests 992, suites 153, pass 992, fail 0, cancelled 0, skipped 0, todo 0.
- `pnpm workbench:build`
  - exit 0
  - Vite built `src/symphony/workbench-static/index.html`, `assets/index-CIofGqjM.css`, and `assets/index-BRbEyT7W.js`.
- `pnpm desktop:shell:smoke`
  - exit 0
  - returned `desktop-shell-smoke.v1`, `status: "ok"`, `attachCommand: "attach_sidecar"`, `launchCommand: "launch_sidecar"`, `launchCommandId: "symphony.console.sidecar.launch"`, `arbitraryCommandAvailable: false`, `arbitraryPathAvailable: false`, `rendererShellExecutionAvailable: false`.
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`
  - exit 0
  - `Finished dev profile [unoptimized + debuginfo] target(s) in 0.35s`.
- `git diff --check`
  - exit 0
  - no output.
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json`
  - exit 64
  - `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`
- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-2 --event main.verification-passed --actor codex-v37-task-2-main-verifier --evidence-ref docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md --dry-run --json`
  - exit 64
  - `goal update supports only worker/task-level events: worker.started, worker.evidence-recorded, worker.self-check-passed, worker.self-check-failed, blocker.opened, blocker.resolved.`

## Visual QA

Local console started at `http://127.0.0.1:8876/`.

Health check:

- `GET http://127.0.0.1:8876/api/health`
  - HTTP 200
  - returned `local-runtime-health.v1`
  - `sidecarHost.contractName: "sidecar-host-lifecycle.v1"`
  - `sidecarHost.attach.state: "attached"`

Browser QA for `http://127.0.0.1:8876/workbench/desktop/`:

- viewport: `1280x720`
- route: `/workbench/desktop/`
- title: `Symphony Desktop Shell`
- desktop card count: 9
- horizontal overflow: false
- detected desktop card/sidebar/topbar overlap count: 0
- sidecar card text: `SIDECAR HEALTH Local Runtime attached status ok attach attached launcher defined bridge symphony.console.sidecar.launch`
- boundary card text: `DESKTOP-ONLY BOUNDARY No Runner Surface locked readOnly true shell exec false git write false release declared false`
- screenshot: `tmp/v37-main-verification/desktop-qa.png`

## Main Verification Decision

PASS for v37 task-2 main verification.

This decision covers only task-2 main verification. It does not declare release readiness, create or push a tag, push a branch, publish anything, or perform a release.

## Known Limitations

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` still returns exit 64 / `goal not found`. This matches the worker and review-fix evidence known limitation and was not treated as a release signal.
- Full native Tauri packaging was not run. The verified native scope here is `cargo check` plus `pnpm desktop:shell:smoke`.
- The renderer is display-only for task-2. It shows sidecar attach/launcher state but does not call the native launch command from the browser.
- `/workbench/desktop/` shows the current local console state, including missing-runbook/partial route states where the local managed goal data is absent.

## Event Registration

Main verification event registration used `symphony goal gate --gate main-verification --status passed` because `goal update main.verification-passed` is not supported by the current CLI.

Dry-run command:

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --gate main-verification --status passed --verifier codex-v37-task-2-main-verifier --evidence-ref docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md --task task-2 --dry-run --json
```

Dry-run result:

- exit 0
- `contractName: "goal-update-plan.v1"`
- `planId: "plan_35333fd1f242687d"`
- `planHash: "sha256:4498b2c3e7a2782f062832a5947c74d15fdc6eeb066b7cdb9a4ffbfe13af3545"`
- proposed event: `main.verification-passed`
- proposed task: `task-2`
- validation status: `ok`
- `wouldAppend.writesInDryRun: false`
- `confirm.available: true`

Confirm command:

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --gate main-verification --status passed --verifier codex-v37-task-2-main-verifier --evidence-ref docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md --task task-2 --confirm --plan-hash sha256:4498b2c3e7a2782f062832a5947c74d15fdc6eeb066b7cdb9a4ffbfe13af3545 --json
```

Confirm result:

- exit 0
- `mode: "confirm"`
- `status: "appended"`
- `written: true`
- `appendOnly: true`
- `eventType: "main.verification-passed"`
- `event.eventId: "evt_35333fd1f242687d"`
- `event.gate.name: "main-verification"`
- `event.gate.status: "passed"`
- `event.evidenceRefs[0].ref: "docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md"`

Post-confirm goal-status check:

```text
pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json
```

- exit 64
- `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`

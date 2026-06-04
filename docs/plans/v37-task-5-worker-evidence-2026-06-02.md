# v37 Task-5 Worker Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-5`
Branch: `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Worker: `codex-v37-task-5-worker`

## Scope Completed

Implemented Desktop build smoke and packaging boundary evidence for the Desktop Shell MVP.

This is worker implementation evidence only. It does not claim reviewer approval, main verification, release readiness, tag, push, publish, or release.

## Baseline And Worktree

Task-4 had reviewer PASS and main verification PASS. Task-4 was still a dirty verified worktree, so task-5 was created from the task-4 branch head and the task-4 tracked and untracked implementation state was copied into the task-5 worktree before task-5 edits.

Task-4 worktree:

```text
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding
```

Task-4 branch:

```text
v37-task-4-job-status-artifact-preview-binding
```

Task-5 worktree:

```text
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence
```

Confirmed task-5 worktree:

```text
pwd
exit 0
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence
```

```text
git branch --show-current
exit 0
v37-task-5-desktop-build-smoke-packaging-boundary-evidence
```

```text
git rev-parse HEAD
exit 0
09c926f703663df9ed4bacaf21939c2d6659dfd1
```

Task-4 evidence considered:

- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`

Task-4 review evidence recorded `PASS`. Task-4 main verification evidence recorded `PASS` and event `evt_4c4e687ebe2820ca`. I used those as the predecessor state only; this task does not claim task-5 review approval or main verification.

## Files Read

- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`
- `desktop/shell/README.md`
- `desktop/shell/src-tauri/Cargo.toml`
- `desktop/shell/src-tauri/tauri.conf.json`
- `desktop/shell/src-tauri/src/lib.rs`
- `desktop/shell/src-tauri/build.rs`
- `desktop/shell/src-tauri/src/main.rs`
- `desktop/shell/src-tauri/capabilities/default.json`
- `scripts/desktop-shell-smoke.js`
- `package.json`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v37-sidecar-host-bridge.test.js`

## Implementation Summary

- Strengthened `pnpm desktop:shell:smoke` so it checks the Desktop shell boundary directly:
  - Tauri config and required host files exist.
  - Rust command surface is exactly `attach_sidecar` and `launch_sidecar`.
  - Tauri invoke handler exposes only `attach_sidecar` and `launch_sidecar`.
  - Launcher command id is fixed to `symphony.console.sidecar.launch`.
  - Renderer shell execution, arbitrary command access, and arbitrary path access remain unavailable.
  - `bundle.active` remains `false`.
  - `Cargo.toml` keeps `publish = false`.
  - No auto-update, updater plugin, publish URL, signing, codesigning, or notarization entry is present.
- Updated `desktop/shell/README.md` with the task-5 smoke/build boundary and distribution handoff.
- Added `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md` with build smoke, packaging boundary, visual QA, and release handoff notes.
- Wrote this worker evidence document.

## Files Changed For Task-5

- `scripts/desktop-shell-smoke.js`
- `desktop/shell/README.md`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`

The worktree also contains inherited task-1 through task-4 implementation files from the verified dirty task-4 baseline.

## Commands Run With Exact Results

Worktree preparation:

```text
git worktree add -b v37-task-5-desktop-build-smoke-packaging-boundary-evidence /Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence v37-task-4-job-status-artifact-preview-binding
exit 0
Preparing worktree (new branch 'v37-task-5-desktop-build-smoke-packaging-boundary-evidence')
HEAD is now at 09c926f Align v37 task0 runbook branch names
```

```text
git diff --binary --no-ext-diff > /tmp/v37-task4-dirty.patch
exit 0
```

```text
git apply --whitespace=nowarn /tmp/v37-task4-dirty.patch
exit 0
```

```text
git ls-files --others --exclude-standard -z | rsync -a --from0 --files-from=- ./ /Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/
exit 0
```

Environment preparation:

```text
pnpm install --frozen-lockfile
exit 0
lockfile unchanged
added 192 packages
react 19.2.6
react-dom 19.2.6
vite 8.0.14
```

Rust toolchain:

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

Tauri CLI availability:

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

Acceptance checks:

```text
pnpm check
exit 0
node --check completed for source, scripts, plugins, and tests
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
duration_ms 5492.375834
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
generated src/symphony/workbench-static/index.html
generated src/symphony/workbench-static/assets/index-CILC3208.css
generated src/symphony/workbench-static/assets/index-BO6PK3lD.js
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
Finished `dev` profile [unoptimized + debuginfo] target(s) in 52.93s
```

Additional native host build smoke:

```text
cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 19.37s
```

Focused checks:

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
duration_ms 709.698292
```

Final checks after evidence updates:

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

After worker event confirm, the same `goal-status` command was run again:

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

## Native Build / Smoke Result

The Desktop Shell MVP passed:

- Workbench renderer production build.
- Desktop shell static smoke with fixed bridge and packaging-off assertions.
- Tauri host Rust compile check.
- Tauri host Rust build.

The current local validation can prove the renderer assets and Rust native host compile and that the bridge surface remains fixed. It does not prove signed distribution packaging, notarization, auto-update, publishing, or release readiness.

Full `tauri build` was not run because neither `cargo tauri` nor `pnpm exec tauri` is available in this worktree/toolchain.

## Packaging Boundary

Intentionally not enabled:

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

Verified as unavailable by smoke or source-backed checks:

- renderer shell execution
- arbitrary native command access
- arbitrary native path access
- Tauri bundle activation
- Cargo publish
- updater/publish/signing/notarization configuration

`ArtifactStore` remains canonical. The Desktop route displays job, artifact, evidence timeline, and release bundle state as read-only contract state.

## Visual QA

Local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8880
exit: running during QA, then stopped after registration
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
- status strip visible: true
- status strip fully in first viewport: true
- job section exists: true
- job section reachable through `#desktop-run-state`: true
- artifact section exists: true
- artifact section reachable through `#desktop-artifacts`: true
- horizontal overflow: false
- card overlap count: 0
- required text present: blocked, review, main verification, release state, Job / Run State, Evidence Readiness

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
- required text present: blocked, review, main verification, release state, Job / Run State, Evidence Readiness

The narrow status strip is visible but taller than the first `720px` viewport after stacking. The route remains scrollable and the job/artifact sections are reachable without horizontal overflow.

Screenshots:

```text
tmp/v37-task5-qa/desktop-390x720-top.png
tmp/v37-task5-qa/desktop-390x720-full.png
tmp/v37-task5-qa/desktop-390x720-run-state.png
tmp/v37-task5-qa/desktop-390x720-artifacts.png
```

## App / Desktop / Workbench User Path

User path:

```text
pnpm symphony console --host 127.0.0.1 --port 8880
http://127.0.0.1:8880/workbench/desktop/
```

The Desktop route remains read-only. It displays sidecar, project, active goal, next action, job/run, artifact readiness, evidence timeline, release bundle, and boundary state from backend contracts. It does not launch shell commands from the renderer, open files, create jobs, invoke models, write git state, or register review/main/release events.

## Worker Event Registration

Dry-run:

```text
pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-5 --event worker.evidence-recorded --actor codex-v37-task-5-worker --evidence-ref docs/plans/v37-task-5-worker-evidence-2026-06-02.md --dry-run --json
exit 0
contractName goal-update-plan.v1
mode dry-run
planId plan_76baa443e082c100
planHash sha256:8f862285c5456181d8bcd2199c27ebed03beabc1eb1d580da600f1978fe7a3e8
validation status ok
dryRunWrites false
ledger preview task-5: unknown -> needs-review
confirm available true
```

Confirm:

```text
pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-5 --event worker.evidence-recorded --actor codex-v37-task-5-worker --evidence-ref docs/plans/v37-task-5-worker-evidence-2026-06-02.md --confirm --plan-hash sha256:8f862285c5456181d8bcd2199c27ebed03beabc1eb1d580da600f1978fe7a3e8
exit 0
mode confirm
status appended
written true
appendOnly true
goalId v37-desktop-shell-mvp
taskId task-5
eventType worker.evidence-recorded
eventId evt_76baa443e082c100
eventHash sha256:1c06315cb6c45369760dfbf158969be0c5dff58db548ca6210296105b0926ab5
journal eventCount 1
lastEventId evt_76baa443e082c100
```

## Known Limitations / Release-Manager Handoff

- `cargo tauri` is not installed.
- `pnpm exec tauri` is not available because the repo does not declare a Tauri CLI package.
- Full `tauri build` and distribution packaging were not run.
- `bundle.active` is intentionally `false`.
- Auto-update, publish, signing, codesigning, notarization, release readiness, tag, push, publish, and release remain out of scope.
- The local Desktop route still shows goal `latest` / `missing-runbook` when the managed goal lookup is absent in local runtime state. The route displays that backend state instead of inferring status from branch names, prompts, filenames, or task titles.
- A later release-manager or native distribution task should own CLI selection, bundle targets, signing/notarization, auto-update, publish destination, release evidence, reviewer approval, main verification, and release readiness gates.

No reviewer approval, main verification, release readiness, tag, push, publish, or release was performed.

# v37 Task 5 Main Verification Evidence - Desktop Build Smoke + Packaging Boundary

Date: 2026-06-04
Role: main verifier
Task: v37 task-5, Desktop build smoke + packaging boundary evidence
Worktree: `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Branch: `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
HEAD: `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Verdict

PASS.

No blocking findings were found in the task-5 smoke script, native compile smoke, packaging boundary evidence, desktop regression surface, or safety boundary review.

This is task-5 main verification only. It is not release readiness, tag evidence, publishing evidence, signing evidence, notarization evidence, release packaging evidence, or release approval.

## Context Checked

- `pwd` confirmed the requested task-5 worktree.
- `git status --short --branch` confirmed branch `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`. The worktree already contains the v37 task implementation/evidence changes and untracked v37 evidence files. I did not modify implementation files.
- `git rev-parse HEAD` returned `09c926f703663df9ed4bacaf21939c2d6659dfd1`.
- Reviewer evidence reports `PASS` with no blocking findings.

## Evidence Read

Read and checked the required task and boundary evidence:

- `docs/plans/v37-task-5-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-5-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
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

## Commands Run

| Command | Result |
| --- | --- |
| `pwd` | exit 0; `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence` |
| `git status --short --branch` | exit 0; branch `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`; existing v37 task changes present |
| `git rev-parse HEAD` | exit 0; `09c926f703663df9ed4bacaf21939c2d6659dfd1` |
| `pnpm check` | exit 0 |
| `pnpm test` | exit 0; `tests 992`, `pass 992`, `fail 0` |
| `pnpm workbench:build` | exit 0; Vite built `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, `assets/index-BO6PK3lD.js` |
| `pnpm desktop:shell:smoke` | exit 0; `desktop-shell-smoke.v1`, `status: ok` |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | exit 0; `Finished dev profile` |
| `cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | exit 0; `Finished dev profile` |
| `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v37-sidecar-host-bridge.test.js` | exit 0; `tests 77`, `pass 77`, `fail 0` |
| `git diff --check` | exit 0; no output |
| `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` | exit 64; `{ "status": "error", "exitCode": 64, "message": "goal not found" }` |
| `cargo tauri --version` | exit 101; `error: no such command: tauri` |
| `pnpm exec tauri --version` | exit 254; `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "tauri" not found` |
| `rg -n "@tauri-apps/cli|\btauri\b" package.json pnpm-lock.yaml desktop/shell/src-tauri/Cargo.toml desktop/shell/src-tauri/tauri.conf.json` | exit 0; no `@tauri-apps/cli` declaration found; only Tauri config schema and Rust `tauri`/`tauri-build` dependencies matched |
| `pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-5 --gate main-verification --status passed --verifier codex-v37-task-5-main-verifier --evidence-ref docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md --dry-run --json` | exit 0; `planId: plan_013021689363cd38`; `planHash: sha256:dc71f32cfbac9affe3f1f981a0de6c36d4bfcff3253d683f868a6526ec64f2d7`; validation `ok`; dry-run writes `false` |
| `pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-5 --gate main-verification --status passed --verifier codex-v37-task-5-main-verifier --evidence-ref docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md --confirm --plan-hash sha256:dc71f32cfbac9affe3f1f981a0de6c36d4bfcff3253d683f868a6526ec64f2d7` | exit 0; status `appended`; event `evt_013021689363cd38`; event type `main.verification-passed`; append-only `true` |
| post-evidence `git diff --check` | exit 0; no output |
| post-event `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` | exit 64; `{ "status": "error", "exitCode": 64, "message": "goal not found" }` |

Local visual QA server:

- Started `pnpm symphony console --host 127.0.0.1 --port 8880`; output showed `Safety: read-only`, `Status: listening`, `Next: http://127.0.0.1:8880/`.
- Stopped the long-running server with `Ctrl-C`; pnpm reported lifecycle exit 1 from manual termination.

## Main Verification Event

Registered task-5 main verification only after local evidence and checks passed.

- Event id: `evt_013021689363cd38`
- Event type: `main.verification-passed`
- Gate: `main-verification`
- Gate status: `passed`
- Actor: `codex-v37-task-5-main-verifier`
- Evidence ref: `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`
- Event hash: `sha256:ecfe371140c820187211fddc0723d1ed560e3d27ad4138e61055146f3572cb24`
- Journal event count after append: `2`

No release gate, release-ready gate, tag, push, publish, release distribution, signing, or notarization action was run.

## Native Build And Smoke Assessment

`cargo check` and `cargo build` are valid compile-level native host smoke checks for this task. They prove the current Rust/Tauri host code compiles locally with the declared manifest.

`pnpm desktop:shell:smoke` independently checks the Tauri config and Rust host files, verifies the fixed bridge commands, and checks packaging boundary fields. The smoke output reported:

- checked Tauri config, Cargo manifest, `build.rs`, `src/lib.rs`, `src/main.rs`, and default capability file
- renderer route `/workbench/desktop/`
- native host `desktop/shell/src-tauri`
- bridge commands `attach_sidecar` and `launch_sidecar`
- launcher command id `symphony.console.sidecar.launch`
- `arbitraryCommandAvailable: false`
- `arbitraryPathAvailable: false`
- `rendererShellExecutionAvailable: false`
- `bundleActive: false`
- `cargoPublish: false`
- `autoUpdateAvailable: false`
- `publishAvailable: false`
- `signingClaimAvailable: false`
- `notarizationClaimAvailable: false`

Full `tauri build` was not run. The recorded rationale is accurate: this workspace does not have `cargo tauri`, `pnpm exec tauri`, or an `@tauri-apps/cli` declaration. That is a packaging limitation, not a release or distribution proof.

## Packaging Boundary Assessment

The task-5 packaging boundary evidence is accurate and scoped:

- verified local Workbench renderer build
- verified Rust native host compile smoke
- verified Tauri shell config and host bridge boundary
- explicitly did not verify or enable distribution packaging

No evidence file or source diff claims release readiness, signed distribution, notarization, auto-update, publishing, tag creation, push, release distribution, or release approval.

The Tauri config keeps `bundle.active` false. `Cargo.toml` keeps `publish = false`. `package.json` declares `desktop:shell:smoke` but does not declare a Tauri CLI package or a release/package/publish script.

## Desktop Regression QA

Opened `http://127.0.0.1:8880/workbench/desktop/` in the in-app browser.

Saved screenshots:

- `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/tmp/v37-task5-main-verification-qa/desktop-1280x720-top.png`
- `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/tmp/v37-task5-main-verification-qa/desktop-1280x720-run-state.png`
- `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/tmp/v37-task5-main-verification-qa/desktop-1280x720-artifacts.png`
- `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/tmp/v37-task5-main-verification-qa/desktop-390x720-top.png`
- `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence/tmp/v37-task5-main-verification-qa/desktop-390x720-artifacts.png`

1280x720 result:

- task-3 first-screen status strip is visible and fully in viewport; rect top `185`, bottom `250`
- status labels present: `blocked`, `review`, `main verification`, `release state`, `blockers`, `status source`
- `Job / Run State` and `Evidence Readiness` text present
- job/run section reachable via `#desktop-run-state`
- artifact section reachable via `#desktop-artifacts`
- `scrollWidth` equals `clientWidth` at `1280`; no horizontal overflow
- card/layout overlap count `0`

390x720 result:

- desktop route renders in a single-column narrow layout
- status strip remains visible; narrow viewport naturally requires vertical scrolling
- `Evidence Readiness` and `No Runner Surface` are reachable/scannable
- `scrollWidth` equals `clientWidth` at `390`; no horizontal overflow
- card/layout overlap count `0`

## Boundary Review Result

Task-5 boundary passes.

Confirmed no task-5 implementation path enables:

- generic shell runner
- browser terminal
- arbitrary command panel
- renderer shell execution
- arbitrary command text input
- arbitrary executable path input
- arbitrary local file open/path read
- model invocation from Desktop Shell
- artifact download/open action
- git write/merge/push/tag/publish
- release readiness declaration
- release packaging distribution
- signing or notarization
- auto-update
- reviewer approval UI, main verification declaration UI, or release declaration UI in the Desktop Shell route

Existing non-desktop Workbench controlled form text and tests for earlier release/main verification workflows were treated as pre-existing surfaces outside the task-5 Desktop Shell route. They do not change the task-5 packaging boundary and do not create a desktop release path.

ArtifactStore canonical boundary remains unchanged. The desktop artifact readiness projection displays `artifact-index.v1`, `safe-artifact-preview.v1`, `evidence-timeline.v1`, and `release-bundle.v1` readiness only. The artifact index remains a derived cache/search view over ArtifactStore, with `localFileOpenAvailable: false`, `artifactDownloadAvailable: false`, and `arbitraryPathReadAvailable: false`.

## Findings

No blocking findings.

## Open Questions And Assumptions

- Full Tauri distribution packaging remains a later native distribution or release-manager task because the Tauri CLI is not installed or declared here.
- The known `goal-status` exit 64 `goal not found` result remains a local state limitation and was recorded exactly.

## Actions Not Performed

I did not:

- modify implementation files
- perform release readiness
- create a tag
- push
- publish
- create release packaging
- sign or notarize
- declare release-ready state
- act as worker, independent reviewer, or release manager

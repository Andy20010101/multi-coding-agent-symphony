# v37 release evidence

Date: 2026-06-04

Goal id: `v37-desktop-shell-mvp`
Release name: `v37 Desktop Shell MVP`
Baseline: `v36 Artifact/Evidence Index Workspace`
Evidence path: `docs/plans/v37-release-evidence-2026-06-04.md`
Release-manager scope: closeout validation, release evidence, tag handoff, and pushed repository tag.

## Release Scope

v37 adds the Desktop Shell MVP for App surfaces:

- Tauri desktop shell workspace under `desktop/shell/src-tauri/`.
- Fixed sidecar host bridge commands: `attach_sidecar` and `launch_sidecar`.
- `sidecar-host-lifecycle.v1` carried through `local-runtime-health.v1` and `app-state-snapshot.v1`.
- Workbench `/workbench/desktop/` command-center surface.
- Contract-backed project list, active goal, next action, blocked/review/main-verification/release state.
- Contract-backed job/run state, artifact readiness, safe preview availability, evidence timeline readiness, and release bundle state.
- Desktop shell smoke check covering native host boundary and packaging-disabled state.
- Worker, reviewer, main-verification, and final integration evidence for all five v37 tasks.

The release keeps Desktop Shell as a read-only/display-first app surface. It does not add a generic shell runner, browser terminal, arbitrary command panel, renderer shell execution, model invocation, arbitrary local file open, artifact open/download action, git write/merge/push/tag UI, release declaration UI, or release-ready inference. ArtifactStore remains canonical; artifact/evidence indexes are derived display/search surfaces.

## Baseline

Release validation ran after PR #8 was merged into `main`.

| Command or check | Result |
| --- | --- |
| `git fetch origin main --tags` | Exit 0. `origin/main` fetched successfully. |
| `git log -1 --oneline origin/main` | Exit 0. `2346b64 Merge pull request #8 from Andy20010101/codex/v37-desktop-shell-mvp-main-adoption`. |
| GitHub PR #8 | Merged into `main` at `2026-06-04T07:35:47Z`; merge commit `2346b6482b8caf15f07b2a48b062df7222485653`. |
| GitHub Actions `CI` on merge commit | Success for run `26937776215`. `pnpm check`, `pnpm test`, `pnpm test:mutation:gate`, `git diff --check`, and `pnpm mcas doctor` all completed successfully. |

## Task Event Coverage

All v37 tasks are main-verified in their evidence documents:

| Task | Title | Main verification evidence |
| --- | --- | --- |
| `task-1` | Desktop shell decision, minimal workspace, UX brief | `docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md` |
| `task-2` | Tauri host sidecar bridge | `docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md` |
| `task-3` | Project list, active goal, next action view | `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md` |
| `task-4` | Job status and artifact preview binding | `docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md` |
| `task-5` | Desktop build smoke and packaging boundary evidence | `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md` |

Final integration evidence is recorded in `docs/plans/v37-final-integration-closeout-audit-2026-06-02.md`.

## Release Validation

Local validation was run on the adoption branch before PR merge and rerun for the CI stabilizing fix:

| Command | Result |
| --- | --- |
| `pnpm --silent exec node --test tests/process-runner.test.js` | Exit 0. 3 tests passed. |
| `pnpm check` | Exit 0. |
| `pnpm test` | Exit 0. 992 tests, 153 suites, 992 pass, 0 fail. |
| `pnpm workbench:build` | Exit 0. Vite `v8.0.14` built 17 modules and generated `index-CILC3208.css` plus `index-BO6PK3lD.js`. |
| `pnpm desktop:shell:smoke` | Exit 0. `desktop-shell-smoke.v1`, `status: ok`; fixed attach/launch bridge and packaging-disabled boundaries verified. |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Exit 0. |
| `cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | Exit 0. |
| `git diff --check` | Exit 0. |

Mainline GitHub Actions validation on merge commit `2346b6482b8caf15f07b2a48b062df7222485653` passed:

| CI step | Result |
| --- | --- |
| `pnpm check` | Success. |
| `pnpm test` | Success. |
| `pnpm test:mutation:gate` | Success. Step ran from `2026-06-04T07:36:14Z` to `2026-06-04T08:14:42Z`. |
| `git diff --check` | Success. |
| `pnpm mcas doctor` | Success. |

Known managed-goal lookup limitation:

| Command | Result |
| --- | --- |
| `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` | Exit 64, `goal not found`. This matches task-1 through task-5 evidence and final integration evidence. The v37 task event ids are preserved in evidence documents, but the local `goal-status` lookup remains unavailable. |

## Docs Updated Evidence

Docs and evidence are present for the release:

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-desktop-build-smoke-packaging-boundary-2026-06-02.md`
- `docs/plans/v37-task-1-worker-evidence-2026-06-02.md` through `docs/plans/v37-task-5-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-final-integration-closeout-audit-2026-06-02.md`
- `docs/plans/v37-release-evidence-2026-06-04.md`
- `docs/plans/v37-tag-evidence-2026-06-04.md`

## Release Gate Basis

The release tag is based on:

- successful worker, independent review, and main-verification evidence for all five v37 tasks,
- final integration closeout audit PASS,
- PR #8 review and merge into `main`,
- successful mainline CI on merge commit `2346b6482b8caf15f07b2a48b062df7222485653`,
- local desktop shell smoke and Rust compile smoke,
- this release evidence and tag evidence committed on top of `main`.

No managed `release.ready` event was registered because the local v37 managed-goal lookup still returns exit 64 / `goal not found`. This evidence does not infer release readiness from branch names, filenames, prompt text, frontend state, or task titles.

## Boundaries

This release evidence does not publish a GitHub Release, create v38 state, start jobs, execute actions, invoke models, bypass CI, or bypass existing Workbench and ArtifactStore boundaries. The tag operation is a repository release marker only.

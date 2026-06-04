# v37 Main Adoption Branch Application Evidence

Goal id: `v37-desktop-shell-mvp`
Adoption branch: `codex/v37-desktop-shell-mvp-main-adoption`
Adoption worktree: `/Users/andy/.codex/worktrees/v37-desktop-shell-mvp-main-adoption`
Source worktree: `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
Target repo checked: `/Users/andy/Documents/project/multi-coding-agent-symphony`

## Result

PASS for clean adoption branch preparation.

The current dirty target worktree was not modified. A clean adoption worktree was created from `main`, and the complete v37 cumulative source state was applied there using a tracked patch plus an untracked-file archive.

No release readiness, tag, push, publish, signing, notarization, distribution packaging, or release action was performed.

## Source And Target Confirmation

Source:

- `pwd` -> `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
- branch -> `v37-task-5-desktop-build-smoke-packaging-boundary-evidence`
- `git rev-parse HEAD` -> `09c926f703663df9ed4bacaf21939c2d6659dfd1`
- source is the expected dirty cumulative v37 worktree.

Target checked:

- `pwd` -> `/Users/andy/Documents/project/multi-coding-agent-symphony`
- branch -> `codex/backup-v37-task-1-legacy-v33-20260603`
- `git rev-parse HEAD` -> `dc4db2b54684b2b70f899681de6378986b8a6a8a`
- target was dirty and not on `main`, so it was not modified.

Adoption branch:

- command: `git worktree add -b codex/v37-desktop-shell-mvp-main-adoption /Users/andy/.codex/worktrees/v37-desktop-shell-mvp-main-adoption main`
- exit 0
- result: new worktree at `HEAD b2d5ad5 Add v36 release evidence`

## Bundle And Apply

Bundle directory:

`/tmp/v37-desktop-shell-mvp-adoption-2026-06-04`

Because source `HEAD` differs from target `main`, the tracked patch was generated as the complete source working tree relative to `main`, not only source working-tree changes relative to source `HEAD`.

Commands:

- `git -C "$SOURCE" diff --binary main > "$BUNDLE/tracked-from-main.patch"`
- `git -C "$SOURCE" diff --name-status main > "$BUNDLE/tracked-from-main-name-status.txt"`
- `git -C "$SOURCE" ls-files --others --exclude-standard > "$BUNDLE/untracked-files.txt"`
- `tar -czf "$BUNDLE/untracked-files.tgz" -C "$SOURCE" -T "$BUNDLE/untracked-files.txt"`

Bundle results:

- tracked path count: 27
- untracked file count: 36
- tracked patch size: 1.3 MB
- untracked archive size: 326 KB

Apply:

- `git apply --check /tmp/v37-desktop-shell-mvp-adoption-2026-06-04/tracked-from-main.patch`
  - exit 0
- `git apply /tmp/v37-desktop-shell-mvp-adoption-2026-06-04/tracked-from-main.patch`
  - exit 0
- `tar -xzf /tmp/v37-desktop-shell-mvp-adoption-2026-06-04/untracked-files.tgz -C /Users/andy/.codex/worktrees/v37-desktop-shell-mvp-main-adoption`
  - exit 0

## Verification Commands

- `pnpm check`
  - exit 0
- first focused Workbench test run before dependency install
  - exit 1
  - cause: `ERR_MODULE_NOT_FOUND: Cannot find package 'react'`
- `pnpm install --frozen-lockfile`
  - exit 0
  - lockfile unchanged
  - installed 192 packages in this new worktree
- `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js tests/v37-sidecar-host-bridge.test.js`
  - exit 0 after install
  - tests 77
  - suites 4
  - pass 77
  - fail 0
- `pnpm test`
  - exit 0
  - tests 992
  - suites 153
  - pass 992
  - fail 0
  - duration_ms 5089.49175
- `pnpm workbench:build`
  - exit 0
  - Vite 8.0.14
  - 17 modules transformed
  - generated `src/symphony/workbench-static/assets/index-CILC3208.css`
  - generated `src/symphony/workbench-static/assets/index-BO6PK3lD.js`
  - built in 94 ms
- `pnpm desktop:shell:smoke`
  - exit 0
  - `desktop-shell-smoke.v1`
  - status `ok`
  - fixed bridge commands: `attach_sidecar`, `launch_sidecar`
  - arbitrary command/path and renderer shell execution unavailable
  - packaging bundle/publish/signing/notarization flags false
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`
  - exit 0
  - finished dev profile
- `cargo build --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`
  - exit 0
  - finished dev profile in 58.06 s
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json`
  - exit 64
  - message: `goal not found`
- `git diff --check`
  - exit 0
  - no output

## Included State

The adoption branch includes the cumulative v37 Desktop Shell MVP implementation:

- Tauri desktop shell workspace under `desktop/shell/`
- sidecar host bridge
- `sidecar-host-lifecycle.v1` fixture and local runtime/app-state validation chain
- Desktop route `/workbench/desktop/`
- project list, active goal, next action, first-screen task status strip
- job/artifact/evidence/release bundle read-only bindings
- smoke script and packaging boundary documentation
- v37 worker/review/main verification/final integration evidence docs
- regenerated Workbench static assets

Generated static asset state:

- added `src/symphony/workbench-static/assets/index-CILC3208.css`
- added `src/symphony/workbench-static/assets/index-BO6PK3lD.js`
- updated `src/symphony/workbench-static/index.html`
- deleted old generated assets:
  - `src/symphony/workbench-static/assets/index-CpBepO49.js`
  - `src/symphony/workbench-static/assets/index-ooe-c3KL.css`

## Excluded State

Ignored runtime state was not bundled or adopted:

- `.symphony/`
- `tmp/`
- local screenshots
- dependency folders
- Rust target outputs

Screenshots remain QA artifacts referenced by evidence paths, not source-controlled adoption files.

## Boundary Notes

The adoption preparation did not add or perform:

- generic shell runner
- browser terminal
- arbitrary command panel
- renderer shell execution
- model invocation
- arbitrary local file open
- artifact open/download action
- git write/merge/push/tag/publish UI
- release-ready declaration
- signing, notarization, auto-update, publish, distribution packaging, or release

ArtifactStore remains canonical.

## Next Step

The adoption branch is ready for human review/staging/commit on:

`/Users/andy/.codex/worktrees/v37-desktop-shell-mvp-main-adoption`

Recommended next step is to inspect the branch diff, then stage and commit intentionally if accepted. Do not release, tag, push, publish, or declare release readiness from this adoption preparation alone.

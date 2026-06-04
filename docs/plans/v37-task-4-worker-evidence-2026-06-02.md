# v37 Task-4 Worker Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-4`
Branch: `v37-task-4-job-status-artifact-preview-binding`
Worker: `codex-v37-task-4-worker`

## Scope Completed

Implemented the Desktop Shell job status and artifact preview binding for `/workbench/desktop/`.

This is worker implementation evidence only. It does not claim reviewer approval, main verification, release readiness, tag, push, publish, or release.

## Baseline And Handoff

Task-3 had independent reviewer re-check PASS and main verification PASS. Task-3 was not merged into a clean main branch state, so I created the task-4 worktree from the verified task-3 dirty worktree state and copied task-3 tracked and untracked changes before implementing task-4.

Source task-3 worktree:

```text
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-3-project-active-goal-next-action-view
```

Task-4 worktree:

```text
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding
```

Confirmed task-4 worktree:

- `pwd` -> `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding`
- `git status --short --branch` -> `## v37-task-4-job-status-artifact-preview-binding`
- `git rev-parse HEAD` -> `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Files Read

- `docs/plans/v34-v40-final-app-core-implementation-plan-2026-06-02.md`
- `docs/plans/v34-v40-final-app-core-execution-prompts-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/00_GLOBAL_RULES_AND_FLOW_APP_CORE.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-3-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-review-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`
- `README.md`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- Workbench frontend API, renderer, CSS, static output, and tests.

## Implementation Summary

- Extended `DesktopShellMvpViewModel` with `jobRun` and `artifactReadiness`.
- Bound `jobRun` to existing read-only contracts:
  - `job-model.v1`
  - `job-creation.v1`
  - `job-timeline-log-stream.v1`
  - `job-run-control.v1`
- Bound `artifactReadiness` to existing read-only contracts:
  - latest run artifact refs
  - `safe-artifact-preview.v1`
  - `artifact-index.v1`
  - `evidence-timeline.v1`
  - `release-bundle.v1`
- Added artifact index projection support for runtime entries and fixture `indexEntry` shape.
- Updated `/workbench/desktop/` to render:
  - job id, status, queue state, action id, timestamps, blocker and failure text
  - timeline/log counts and run-control state
  - read-only run-control transition rows
  - artifact ref counts, missing fields, preview route counts, safe inline counts
  - artifact index, evidence timeline, release bundle, release state, and local file open fields
  - safe artifact preview rows when the backend exposes preview results
- Updated focused Workbench tests for the projection and renderer.
- Updated docs and regenerated the Workbench static bundle.

All task-4 display remains contract-backed. The Desktop route does not infer job status, artifact readiness, release state, or file-open availability from branch names, filenames, prompts, task titles, frontend-only state, or generated text.

## Files Changed For Task-4

- `README.md`
- `docs/symphony-product-contracts.md`
- `docs/workbench-operator-guide.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CILC3208.css`
- `src/symphony/workbench-static/assets/index-BO6PK3lD.js`

The worktree also contains inherited task-1, task-2, and task-3 files from the verified dirty baseline.

## Commands Run With Exact Results

- `git worktree add -b v37-task-4-job-status-artifact-preview-binding /Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding 09c926f703663df9ed4bacaf21939c2d6659dfd1`
  - exit 0
  - created branch `v37-task-4-job-status-artifact-preview-binding`
- Task-3 dirty state copy:
  - `git diff --binary --full-index > /tmp/v37-task3-dirty.patch`
  - `git apply --index /tmp/v37-task3-dirty.patch`
  - `git ls-files --others --exclude-standard -z | tar --null -T - -cf /tmp/v37-task3-untracked.tar`
  - `tar -xf /tmp/v37-task3-untracked.tar`
  - `git reset`
  - result: task-4 worktree matched verified task-3 dirty state before task-4 edits.
- `pnpm install --frozen-lockfile`
  - exit 0
  - lockfile unchanged
  - installed 192 packages, including React and Vite, into the new worktree.
- `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`
  - first run before install: exit 1
  - failure reason: `ERR_MODULE_NOT_FOUND: Cannot find package 'react'`
  - final run after install and implementation: exit 0, tests 74, suites 3, pass 74, fail 0, duration 678.708583 ms.
- `pnpm check`
  - exit 0
  - `node --check` completed for source, scripts, plugins, and tests.
- `pnpm test`
  - exit 0
  - tests 992, suites 153, pass 992, fail 0, cancelled 0, skipped 0, todo 0, duration 4500.55675 ms.
- `pnpm workbench:build`
  - exit 0
  - Vite v8.0.14
  - 17 modules transformed
  - generated `src/symphony/workbench-static/index.html`
  - generated `src/symphony/workbench-static/assets/index-CILC3208.css`
  - generated `src/symphony/workbench-static/assets/index-BO6PK3lD.js`
  - built in 72 ms.
- `pnpm desktop:shell:smoke`
  - exit 0
  - status `ok`
  - renderer route `/workbench/desktop/`
  - bridge attach command `attach_sidecar`
  - launch command `launch_sidecar`
  - launch command id `symphony.console.sidecar.launch`
  - arbitrary command available `false`
  - arbitrary path available `false`
  - renderer shell execution available `false`
- `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target`
  - exit 0
  - `Finished dev profile` in 45.32s.
- `git diff --check`
  - exit 0
  - no output.
- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json`
  - exit 64
  - `{ "version": "1", "status": "error", "exitCode": 64, "message": "goal not found" }`

The `goal-status` result is the known managed-goal lookup limitation already recorded in task-3 evidence. The Desktop route keeps the missing status contract-backed instead of inferring it.

## Visual QA

Local console started with:

```text
pnpm symphony console --host 127.0.0.1 --port 8877
```

Console output:

```text
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8877/
```

Route checked:

```text
http://127.0.0.1:8877/workbench/desktop/
```

The page initially shows loading while read-only contracts resolve. `/api/readiness` took about 5.1s in this worktree, so visual QA waited 6.5s before assertions.

Viewport `1280x720`:

- status strip visible at top: true
- job section exists: true
- job section visible after `#desktop-run-state` anchor scroll: true
- job section scannable: true
- artifact section exists: true
- artifact section visible after `#desktop-artifacts` anchor scroll: true
- artifact section scannable: true
- horizontal overflow: false
- card overlap count: 0
- top screenshot: `tmp/v37-task4-qa/desktop-1280x720.png`
- full-page screenshot: `tmp/v37-task4-qa/desktop-1280x720-full.png`
- job/artifact anchor screenshot: `tmp/v37-task4-qa/desktop-1280x720-run-state.png`

Viewport `390x720`:

- status strip visible at top: true
- job section exists: true
- job section visible after `#desktop-run-state` anchor scroll: true
- job section scannable: true
- artifact section exists: true
- artifact section visible after `#desktop-artifacts` anchor scroll: true
- artifact section scannable: true
- horizontal overflow: false
- card overlap count: 0
- top screenshot: `tmp/v37-task4-qa/desktop-390x720.png`
- full-page screenshot: `tmp/v37-task4-qa/desktop-390x720-full.png`
- artifact anchor screenshot: `tmp/v37-task4-qa/desktop-390x720-artifacts.png`

## App / Desktop / Workbench User Path Changed

User path:

```text
pnpm symphony console --host 127.0.0.1 --port 8765
http://127.0.0.1:8765/workbench/desktop/
```

The Desktop route now shows job and artifact readiness in the local app shell. It consumes existing local API contracts and projects them into `DesktopShellMvpViewModel`:

```text
GET /api/jobs -> job-model.v1 -> DesktopShellMvpViewModel.jobRun
GET /api/jobs/create -> job-creation.v1 -> DesktopShellMvpViewModel.jobRun
GET /api/jobs/timeline -> job-timeline-log-stream.v1 -> DesktopShellMvpViewModel.jobRun
GET /api/jobs/control -> job-run-control.v1 -> DesktopShellMvpViewModel.jobRun
GET /api/runs/latest -> artifactRefs -> DesktopShellMvpViewModel.artifactReadiness
GET /api/artifacts -> artifact-index.v1 -> DesktopShellMvpViewModel.artifactReadiness
GET /api/evidence/timeline -> evidence-timeline.v1 -> DesktopShellMvpViewModel.artifactReadiness
GET /api/release/bundle -> release-bundle.v1 -> DesktopShellMvpViewModel.artifactReadiness
GET /api/artifacts/preview/... -> safe-artifact-preview.v1 -> DesktopShellMvpViewModel.artifactReadiness.previewItems
```

When artifact refs or preview routes are missing, the page renders contract-backed `未暴露`, `empty`, `partial`, and zero counts. It does not open local files, add download buttons, execute commands, or promote the artifact index to source of truth.

## Boundary Notes

This task did not add:

- shell execution
- generic shell runner
- browser terminal
- arbitrary command surface
- model invocation
- arbitrary local file opening
- artifact download or file-open action
- git write, merge, push, tag, publish, or release action
- reviewer approval
- main verification
- release-ready declaration

ArtifactStore remains canonical. Task-4 reads artifact refs, safe previews, evidence timeline, release bundle, and artifact index as display contracts only. The artifact index is shown as derived readiness context, not as a replacement for stored artifacts.

## Worker Event Registration

- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-4 --event worker.evidence-recorded --actor codex-v37-task-4-worker --evidence-ref docs/plans/v37-task-4-worker-evidence-2026-06-02.md --dry-run --json`
  - exit 0
  - contract `goal-update-plan.v1`
  - plan id `plan_957669dc23052220`
  - plan hash `sha256:2566c2f42314efffdc14224ca71c8ee45d5177f001f7c1808af0efc0316aa2b2`
  - validation status `ok`
  - dry-run writes `false`
  - ledger preview changed `task-4` from `unknown` to `needs-review`
- `pnpm --silent symphony goal update --goal v37-desktop-shell-mvp --task task-4 --event worker.evidence-recorded --actor codex-v37-task-4-worker --evidence-ref docs/plans/v37-task-4-worker-evidence-2026-06-02.md --confirm --plan-hash sha256:2566c2f42314efffdc14224ca71c8ee45d5177f001f7c1808af0efc0316aa2b2`
  - exit 0
  - mode `confirm`
  - status `appended`
  - written `true`
  - append-only `true`
  - event id `evt_957669dc23052220`
  - event type `worker.evidence-recorded`
  - event hash `sha256:b0052e7990263e637754a60ebe28e74867cb13d719d60522e8f9bb184ab38832`
  - no reviewer approval, main verification, release readiness, tag, push, publish, or release event was recorded.

## Known Limitations / Next Handoff

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` still returns exit 64 / `goal not found`.
- In this local worktree, the current Desktop route shows `latest` and `missing-runbook` because the managed active goal is not registered in the local lookup state.
- The current local latest run has no artifact refs, so safe artifact preview route count is `0` and the UI shows `Safe artifact preview routes 未暴露。`
- `/api/jobs/create` returns an error envelope for a plain GET without create parameters. The projection treats that as route state context and keeps the Desktop route display-only.
- Full native packaging remains out of scope for task-4. v37 task-5 owns native build smoke and packaging boundary evidence.

# v37 Task-4 Independent Review Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-4`
Branch reviewed: `v37-task-4-job-status-artifact-preview-binding`
Reviewer: `codex-v37-task-4-independent-reviewer`
Review date: `2026-06-04`

## Verdict

PASS.

No blocking findings. The reviewed diff binds `/workbench/desktop/` to existing job, artifact, evidence, and release-bundle contracts as display state. I did not find a shell runner, browser terminal, arbitrary command panel, local file open action, artifact download/open action, model call, git write, reviewer approval, main-verification declaration, release-ready declaration, tag, push, publish, or release action in the Desktop route.

## Baseline

- `pwd`
  - exit `0`
  - `/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding`
- `git status --short --branch`
  - exit `0`
  - branch `v37-task-4-job-status-artifact-preview-binding`
  - dirty task worktree with inherited v37 task-1/task-2/task-3 files, task-4 implementation files, generated Workbench assets, and evidence files.
- `git rev-parse HEAD`
  - exit `0`
  - `09c926f703663df9ed4bacaf21939c2d6659dfd1`

Worker event noted but not used as proof of correctness: `evt_957669dc23052220`.

## Files Reviewed

- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`
- `docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md`
- `docs/plans/app-core-v34-v40-goal-runbooks/v37_desktop-shell-mvp_goal_runbook_latest.md`
- `fixtures/contracts/goal-runbook.v37-desktop-shell-mvp.v1.json`
- `fixtures/contracts/job-model.v1.json`
- `fixtures/contracts/job-creation.v1.json`
- `fixtures/contracts/job-timeline-log-stream.v1.json`
- `fixtures/contracts/job-run-control.v1.json`
- `fixtures/contracts/artifact-index.v1.json`
- `fixtures/contracts/safe-artifact-preview.safe-text.v1.json`
- `fixtures/contracts/safe-artifact-preview.oversize-truncated.v1.json`
- `fixtures/contracts/safe-artifact-preview.unsafe-binary.v1.json`
- `fixtures/contracts/safe-artifact-preview.unknown-mime.v1.json`
- `fixtures/contracts/evidence-bundle.v1.json`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v35-job-model-contract.test.js`
- `tests/v35-job-creation-contract.test.js`
- `tests/v35-job-timeline-contract.test.js`
- `tests/v35-job-run-control-contract.test.js`
- `tests/v36-artifact-index-contract.test.js`
- `tests/safe-artifact-preview-contract.test.js`
- `tests/v36-task-4-evidence-timeline-release-bundle.test.js`
- `tests/v36-task-5-evidence-bundle.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- inherited sidecar host boundary files under `desktop/shell/`, `src/symphony/sidecar-host-bridge.js`, and `scripts/desktop-shell-smoke.js`

## Findings

No findings.

## Source Review

Job status binding:

- `projectDesktopJobRun` in `frontend/workbench/src/api/contracts.js` projects `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, and `job-run-control.v1` into job id, status, queue state, action id, timestamps, blocker/failure, timeline/log counts, route state, and run-control transition fields.
- `DesktopRunStateCard` and `DesktopJobTransitionList` in `frontend/workbench/src/App.jsx` render those fields as text/list rows. The transition rows show `available` or `read-only`; there is no click handler, form, POST call, or run-control execution path in the Desktop route.

Artifact preview binding:

- `projectDesktopArtifactReadiness` projects artifact refs plus `artifact-index.v1`, backend `safe-artifact-preview.v1` results, `evidence-timeline.v1`, and `release-bundle.v1` into ref counts, missing counts, preview counts, safe inline counts, index readiness, evidence timeline readiness, release bundle state, and local file/download boundary fields.
- `createSafeArtifactPreviewRoutes` uses only backend-exposed artifact `uri` values that match the safe preview route shape. It does not synthesize preview paths from kind, filename, extension, MIME, frontend state, or local paths.
- `projectSafeArtifactPreview` displays inline text only when the backend `safe-artifact-preview.v1` payload has `safeToRenderInline === true` and provides `contentText` or `previewText`. It carries `downloadAvailable` as a displayed backend field, not as an action.
- `DesktopArtifactReadinessCard` and `DesktopArtifactPreviewList` render status fields only. I found no artifact download, open, copy path, arbitrary path input, `window.open`, or dynamic `href` action in the Desktop route.

Boundary scan:

```text
DesktopShellRoute slice length: 17384
projectDesktopShell slice length: 18057
fetch(: false
confirmGoalEventPlan: false
window.open: false
navigator.clipboard: false
<form: false
<textarea: false
onClick=: false
method: 'POST': false
XMLHttpRequest: false
WebSocket: false
EventSource: false
sendBeacon: false
localStorage: false
indexedDB: false
download action: false
href dynamic: false
release.ready event: false
reviewer.approved event: false
main.verification event: false
git push: false
git tag: false
publish: false
model invocation true: false
shell runner text: false
```

The broader source scan still finds existing non-desktop controlled Workbench event forms and the inherited fixed Tauri `launch_sidecar` implementation. Those are outside this task's Desktop renderer slice. The sidecar bridge remains limited to `pnpm symphony console --host <loopback> --port <allowed-port>` and reports `arbitraryCommandAvailable: false`, `arbitraryPathAvailable: false`, and `rendererShellExecutionAvailable: false`.

ArtifactStore boundary:

- `artifact-index.v1` fixture and projection keep `canonicalSource: ArtifactStore` and `indexRole: derived-cache-and-search-only`.
- Desktop shows artifact index and evidence timeline readiness as derived display state. I did not find a second ArtifactStore, direct repo file reads, local path opens, or frontend safety inference.

## Commands Run

| Command | Result |
| --- | --- |
| `git diff --check` | exit `0`; no output |
| `pnpm check` | exit `0`; `node --check` completed for source, scripts, plugins, and tests |
| `pnpm test` | exit `0`; tests `992`, suites `153`, pass `992`, fail `0`, duration `4570.132125 ms` |
| `pnpm workbench:build` | exit `0`; Vite `8.0.14`, `17` modules transformed, generated `src/symphony/workbench-static/index.html`, `assets/index-CILC3208.css`, and `assets/index-BO6PK3lD.js`, built in `70 ms` |
| `pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js` | exit `0`; tests `74`, suites `3`, pass `74`, fail `0`, duration `638.997 ms` |
| `pnpm desktop:shell:smoke` | exit `0`; status `ok`; renderer route `/workbench/desktop/`; bridge commands `attach_sidecar` and `launch_sidecar`; arbitrary command/path and renderer shell execution all `false` |
| `cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target` | exit `0`; `Finished dev profile` for `symphony-desktop-shell` in `0.75s` |

## Visual QA

Local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8878
```

Console result:

```text
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8878/
```

Route checked:

```text
http://127.0.0.1:8878/workbench/desktop/
```

Viewport `1280x720`:

- loading visible: `false`
- failed visible: `false`
- document/client width: `1280 / 1280`
- horizontal overflow: `false`
- card overlap count: `0`
- task-3 status strip fully visible: `true`
- status strip rect: top `184.71875`, bottom `249.8359375`
- required fields visible in first viewport: `blocked`, `review`, `main verification`, `release state`
- job section exists and is visible via `#desktop-run-state` anchor: `true`
- artifact section exists and is visible via `#desktop-artifacts` anchor: `true`
- screenshots:
  - `tmp/v37-task4-review-qa/desktop-1280x720-top.png`
  - `tmp/v37-task4-review-qa/desktop-1280x720-full.png`
  - `tmp/v37-task4-review-qa/desktop-1280x720-run-state.png`
  - `tmp/v37-task4-review-qa/desktop-1280x720-artifacts.png`

Viewport `390x720`:

- loading visible: `false`
- failed visible: `false`
- document/client width: `390 / 390`
- horizontal overflow: `false`
- card overlap count: `0`
- job section exists and is visible via `#desktop-run-state` anchor: `true`
- artifact section exists and is visible via `#desktop-artifacts` anchor: `true`
- screenshot inspection showed stacked cards without horizontal clipping or overlap.
- screenshots:
  - `tmp/v37-task4-review-qa/desktop-390x720-top.png`
  - `tmp/v37-task4-review-qa/desktop-390x720-full.png`
  - `tmp/v37-task4-review-qa/desktop-390x720-run-state.png`
  - `tmp/v37-task4-review-qa/desktop-390x720-artifacts.png`

## Open Questions / Assumptions

- The local runtime still shows `goal: latest` and `missing-runbook` because the managed goal lookup limitation from task-3 remains present in this worktree. I treated that as a known local state limitation, not a task-4 blocker, because the UI renders the missing state from backend contracts instead of filling it from branch names, prompts, or filenames.
- I treated latest run artifact refs as an allowed input to artifact readiness because the v37 UX brief and product contracts explicitly include latest run artifact refs beside `artifact-index.v1`, `safe-artifact-preview.v1`, `evidence-timeline.v1`, and `release-bundle.v1`. Safe preview display itself is still controlled by backend `safe-artifact-preview.v1` payloads.
- I did not register a reviewer event, main-verification event, release gate, tag, push, publish, or release action.

## Suggested Fixes

None.

Review evidence path: `docs/plans/v37-task-4-review-evidence-2026-06-02.md`

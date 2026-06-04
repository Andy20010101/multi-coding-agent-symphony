# v37 Task-4 Main Verification Evidence

Goal id: `v37-desktop-shell-mvp`
Task id: `task-4`
Branch: `v37-task-4-job-status-artifact-preview-binding`
Main verifier: `codex-v37-task-4-main-verifier`
HEAD: `09c926f703663df9ed4bacaf21939c2d6659dfd1`

## Main Verification Result

PASS.

Task-4 scope is satisfied. `/workbench/desktop/` shows job/run state and artifact/evidence readiness from existing job, artifact, safe preview, evidence timeline, and release bundle contracts. The Desktop route remains display-only and does not bypass the app kernel.

This evidence records task-4 main verification only. It does not claim release readiness and did not perform a tag, push, publish, or release.

## Baseline

```text
pwd
exit 0
/Users/andy/.codex/worktrees/v37-task-2-tauri-host-sidecar-bridge/v37-task-4-job-status-artifact-preview-binding
```

```text
git status --short --branch
exit 0
## v37-task-4-job-status-artifact-preview-binding
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
?? docs/plans/v37-desktop-shell-ux-brief-2026-06-02.md
?? docs/plans/v37-task-1-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-1-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-2-main-verification-evidence-2026-06-04.md
?? docs/plans/v37-task-2-review-fix-evidence-2026-06-04.md
?? docs/plans/v37-task-2-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md
?? docs/plans/v37-task-3-review-evidence-2026-06-02.md
?? docs/plans/v37-task-3-worker-evidence-2026-06-02.md
?? docs/plans/v37-task-4-review-evidence-2026-06-02.md
?? docs/plans/v37-task-4-worker-evidence-2026-06-02.md
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

The dirty worktree is the expected inherited v37 task baseline plus task-4 implementation files. I did not create or switch branches.

## Evidence Reviewed

- Worker evidence: `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- Review evidence: `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
- Reviewer verdict: PASS
- Task-3 main verification guard: `docs/plans/v37-task-3-main-verification-evidence-2026-06-02.md`

## Files Reviewed

- `docs/plans/v37-task-4-worker-evidence-2026-06-02.md`
- `docs/plans/v37-task-4-review-evidence-2026-06-02.md`
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
- `src/symphony/evidence-timeline-contract.js`
- `tests/v36-task-4-evidence-timeline-release-bundle.test.js`
- `tests/v35-job-model-contract.test.js`
- `tests/v35-job-creation-contract.test.js`
- `tests/v35-job-timeline-contract.test.js`
- `tests/v35-job-run-control-contract.test.js`
- `tests/v36-artifact-index-contract.test.js`
- `tests/safe-artifact-preview-contract.test.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `scripts/desktop-shell-smoke.js`
- inherited desktop boundary files under `desktop/shell/`

## Scope Verification

Task-4 scope is satisfied.

- Desktop shows job id, status, queue state, action id, timestamps, blocker/failure fields, timeline/log counts, route state, and run-control transition state through `DesktopRunStateCard` and `DesktopJobTransitionList`.
- Desktop shows artifact refs/status/missing counts, safe preview route count, backend preview availability, safe inline count, artifact index state, evidence timeline state, release bundle state, release state, and local file-open boundary through `DesktopArtifactReadinessCard` and `DesktopArtifactPreviewList`.
- Job state is projected from `job-model.v1`, `job-creation.v1`, `job-timeline-log-stream.v1`, and `job-run-control.v1`.
- Artifact readiness is projected from latest run artifact refs, `artifact-index.v1`, backend `safe-artifact-preview.v1` route results, `evidence-timeline.v1`, and `release-bundle.v1`.
- Safe preview route creation accepts only backend-exposed artifact `uri` values that match `/api/runs/<run-id>/artifacts/<artifact-kind>/preview` and rejects query strings, fragments, path traversal, backslashes, or non-preview routes.
- Safe inline text is displayed only when backend `safe-artifact-preview.v1` reports `safeToRenderInline === true` and provides `contentText` or `previewText`.
- Artifact index remains a derived cache/search view. `ArtifactStore` remains canonical.

## Boundary Review

No kernel bypass found.

- No direct shell execution.
- No generic shell runner, browser terminal, arbitrary command panel, or arbitrary command input.
- No direct job create/run/pause/cancel/resume/recover controls in the Desktop route.
- Run-control transitions render as read-only rows only.
- No artifact download/open action, arbitrary local file open, local path input, or frontend file safety inference.
- No model call or model invocation path.
- No git write, merge, push, tag, publish, or release action.
- No reviewer approval UI, main verification declaration UI, release-ready declaration UI, release gate UI, tag UI, push UI, publish UI, or release UI in the Desktop route.
- Release bundle state is displayed as read-only readiness context, not as release authorization.

Focused source boundary scan:

```text
node --input-type=module -e "<Desktop route boundary scan>"
exit 0
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
download=: false
href={: false
release.ready: false
reviewer.approved: false
main.verification: false
git push: false
git tag: false
publish: false
modelInvocationAvailable: valueState(true): false
generic shell runner: false
browser terminal: false
dangerouslySetInnerHTML: false
```

The broader Workbench still contains older controlled event forms and release closeout surfaces outside the Desktop route. Those are out of task-4 scope and remain bound to existing dry-run/plan-hash confirm contracts.

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
duration_ms 3441.112125
```

```text
pnpm workbench:build
exit 0
vite v8.0.14
17 modules transformed
generated:
src/symphony/workbench-static/index.html
src/symphony/workbench-static/assets/index-CILC3208.css
src/symphony/workbench-static/assets/index-BO6PK3lD.js
built in 70ms
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
```

```text
cargo check --manifest-path desktop/shell/src-tauri/Cargo.toml --target-dir tmp/tauri-target
exit 0
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.33s
```

```text
git diff --check
exit 0
no output
```

After writing this evidence file and registering the gate, I ran `git diff --check` again:

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

This `goal-status` result matches the managed-goal lookup limitation already recorded in task-3 and task-4 worker/review evidence. It did not change the main verification result because the Desktop route renders the missing/empty state from backend contracts instead of inferring it.

```text
pnpm --silent exec node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js
exit 0
tests 74
suites 3
pass 74
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 655.21125
```

## Visual QA

Local console:

```text
pnpm symphony console --host 127.0.0.1 --port 8879
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
Next: http://127.0.0.1:8879/
```

Route checked:

```text
http://127.0.0.1:8879/workbench/desktop/
```

Viewport `1280x720`:

- loading visible: false
- failed visible: false
- document/client width: `1280 / 1280`
- horizontal overflow: false
- card count: 11
- card overlap count: 0
- task-3 status strip fully visible in first viewport: true
- required first-screen labels visible: `blocked`, `review`, `main verification`, `release state`
- job section exists: true
- job section visible through `#desktop-run-state`: true
- job section has expected fields: `Job / Run State`, `jobId`, `status`, `queueState`, `run-control state`
- artifact section exists: true
- artifact section visible through `#desktop-artifacts`: true
- artifact section has expected fields: `Evidence Readiness`, `preview routes`, `safe inline`, `artifact index`, `evidence timeline`, `release state`
- screenshots:
  - `tmp/v37-task4-main-verification-qa/desktop-1280x720-top.png`
  - `tmp/v37-task4-main-verification-qa/desktop-1280x720-full.png`
  - `tmp/v37-task4-main-verification-qa/desktop-1280x720-run-state.png`
  - `tmp/v37-task4-main-verification-qa/desktop-1280x720-artifacts.png`

Viewport `390x720`:

- loading visible: false
- failed visible: false
- document/client width: `390 / 390`
- horizontal overflow: false
- card count: 11
- card overlap count: 0
- job section exists: true
- job section visible through `#desktop-run-state`: true
- job section has expected fields: `Job / Run State`, `jobId`, `status`, `queueState`, `run-control state`
- artifact section exists: true
- artifact section visible through `#desktop-artifacts`: true
- artifact section has expected fields: `Evidence Readiness`, `preview routes`, `safe inline`, `artifact index`, `evidence timeline`, `release state`
- top status strip is present and scrollable. On this narrow viewport, the `release state` label bottom is just below the first 720px viewport; the task-3 first-screen regression guard was verified at `1280x720`.
- screenshots:
  - `tmp/v37-task4-main-verification-qa/desktop-390x720-top.png`
  - `tmp/v37-task4-main-verification-qa/desktop-390x720-full.png`
  - `tmp/v37-task4-main-verification-qa/desktop-390x720-run-state.png`
  - `tmp/v37-task4-main-verification-qa/desktop-390x720-artifacts.png`

The console server was stopped after QA with Ctrl-C. The stop command returned the expected pnpm lifecycle interrupt after terminating the local server.

## Event Registration

Used the current documented gate flow. I did not use `symphony goal update ... main.verification-passed`.

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-4 --gate main-verification --status passed --verifier codex-v37-task-4-main-verifier --evidence-ref docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md --dry-run --json
exit 0
contractName goal-update-plan.v1
mode dry-run
planId plan_4c4e687ebe2820ca
planHash sha256:898441c39d6ce03f7956a2bd443bb2f5afdc450700cdc41d68ead2bb422e0bfc
validation status ok
dryRunWrites false
confirm available true
ledger preview task-4: unknown -> main-verified
proposed event main.verification-passed
```

```text
pnpm --silent symphony goal gate --goal v37-desktop-shell-mvp --task task-4 --gate main-verification --status passed --verifier codex-v37-task-4-main-verifier --evidence-ref docs/plans/v37-task-4-main-verification-evidence-2026-06-02.md --confirm --plan-hash sha256:898441c39d6ce03f7956a2bd443bb2f5afdc450700cdc41d68ead2bb422e0bfc
exit 0
mode confirm
status appended
written true
appendOnly true
goalId v37-desktop-shell-mvp
taskId task-4
gate main-verification
gateStatus passed
eventType main.verification-passed
eventId evt_4c4e687ebe2820ca
eventHash sha256:6b916191676395f45d1dbb6975f76dbda1151ff546c3c66c3f3dfb29ae8dca90
previousEventHash sha256:b0052e7990263e637754a60ebe28e74867cb13d719d60522e8f9bb184ab38832
journal eventCount 2
lastEventId evt_4c4e687ebe2820ca
```

No release readiness, tag, push, publish, or release event was registered.

## Known Limitations

- `pnpm --silent symphony goal-status --goal v37-desktop-shell-mvp --json` returns exit 64 / `goal not found` in this worktree. The Desktop route treats that as missing backend state.
- I re-ran `goal-status` after confirming the main-verification gate; it still returned exit 64 / `goal not found`.
- The current local latest run does not expose artifact refs, so live visual QA shows safe preview route count `0` and `Safe artifact preview routes 未暴露。` The binding itself is covered by focused tests and source review using backend `safe-artifact-preview.v1` payloads.
- At `390x720`, the top status strip is present but taller than the first viewport; job and artifact sections remain reachable and scannable through route anchors.
- Full native packaging, publishing, auto-update, release readiness, tag, push, publish, and release are out of scope for task-4.

## Actions Not Performed

- No release readiness declared.
- No release gate registered other than the task-4 main-verification gate after this file is written.
- No tag created.
- No push performed.
- No publish performed.
- No release performed.
- No branch created or switched.
- No merge performed.

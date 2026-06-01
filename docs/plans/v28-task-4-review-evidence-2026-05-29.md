# v28 task-4 independent review evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-4`
Task title: Release closeout workspace
Reviewer role: independent reviewer
Review date: 2026-06-01

## Verdict

APPROVED

Approval scope: task-4 Workbench release closeout workspace only. This approval covers the Closeout Gaps projection/UI, release checklist display, controlled `release.ready` gate registration surface, copy-only tag evidence prompt, related operator docs, rebuilt Workbench static assets, and focused tests. It does not approve release readiness, tag creation, task-5, main verification, merge, or any release event registration.

## Reviewed inputs

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v28_workbench-v1-release_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v28-task-4-worker-evidence-2026-05-29.md`
- Workbench UI: `frontend/workbench/src/App.jsx`
- Workbench projection/client: `frontend/workbench/src/api/contracts.js`, `frontend/workbench/src/api/client.js`
- Tests: `tests/workbench-api-client.test.js`, `tests/workbench-shell.test.js`, `tests/workbench-route-smoke.test.js`
- Docs: `docs/workbench-operator-guide.md`, `docs/symphony-product-contracts.md`
- Built assets: `src/symphony/workbench-static/index.html`, `src/symphony/workbench-static/assets/index-B9IfCFVY.css`, `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

## Independent checks

Current branch:

```text
v27-task-5-review-revision-tests-docs
```

This matches the worker's recorded current-checkout fallback, not the task branch named in the runbook. I treated this as a boundary note, not as a task-4 blocker, because the user explicitly asked for review in the current workspace and the worker evidence recorded the fallback.

`pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json` exited 0 and reported:

```text
summary.releaseReady: false
summary.releaseReadySource: null
task-4 status: in-progress
task-4 workerEvidenceRef: docs/plans/v28-task-4-worker-evidence-2026-05-29.md
task-4 reviewEvidenceRef: null
task-4 mainVerificationRef: null
releaseGates.*: unknown
```

`pnpm --silent symphony goal closeout --goal v28-workbench-v1-release --json` exited 0 and reported current gaps in one closeout report:

```text
task-4 reviewer.approved missing
task-4 main.verification-passed missing
task-5 worker.evidence-recorded missing
task-5 reviewer.approved missing
task-5 main.verification-passed missing
release.pnpm-check unknown
release.pnpm-test unknown
release.workbench-build unknown
release.mutation-gate unknown
release.audit-high unknown
release.diff-check unknown
release.mcas-doctor unknown
release.docs-updated unknown
release.tag-evidence missing
summary.releaseReady: false
releaseReadySource: null
```

## Acceptance assessment

Workbench Closeout shows gaps and release checklist in one place: PASS. `CloseoutGapsPanel` renders closeout summary, missing evidence/gates, release gates, `ReleaseVerificationChecklist`, `ReleaseReadyGateRegistration`, and `TagEvidencePrompt` in the same panel. The projection builds `ReleaseCloseoutWorkspaceModel` from `goal-closeout-report.v1` plus existing runbook/ledger/event context.

`release.ready` gate is controlled dry-run plus confirm, not worker-declared: PASS. The release-ready form is `goal-gate-release-ready-declared` with `gate: release.ready`, `status: declared`, `requiresTask: false`, dry-run command text, confirm command pattern with `--plan-hash`, and the existing Workbench event preview/confirm flow. Current goal status still has `releaseReady: false` and no `releaseReadySource`.

Tag evidence prompt is copy-only and does not auto-tag: PASS. `TagEvidencePrompt` renders the prompt in `<pre><code>`, has safety flags `copyOnly: true`, `createsTag: false`, `declaresReleaseReady: false`, `runsShell: false`, and the prompt text explicitly says not to create a tag, merge, declare release.ready, or treat filenames/branches/commits/prompts/command text as proof.

Release readiness is not inferred from frontend/test/filename/branch/commit heuristics: PASS. The closeout panel displays `summary.releaseReady` and `releaseReadySource` from `goal-closeout-report.v1`. Tests include a ledger with `releaseReady: true`, while closeout remains false, and assert the Workbench model keeps release readiness false from closeout.

No generic shell runner, safety layer, permission system, goal framework, or artifact framework was added: PASS. The implementation uses existing event preview/confirm APIs and static Workbench projection. I found no `child_process`, `exec`, `spawn`, terminal runner, tag creation, merge action, model invocation, or new permission framework in the task-4 UI slice.

v8 command button list is not the top-level model: PASS. Workbench nav remains `Active Goal`, `Prompt Handoff`, `Operations`, `Implementation`, `Adoption`, `Review`, `Verification`, `Closeout`. Tests assert the nav source does not expose old `scan/do/review/verify/status/continue/artifacts` as top-level Workbench actions.

Tests cover the user-visible closeout/release path: PASS. `tests/workbench-api-client.test.js` covers the closeout projection, release checklist rows, `release.ready` form, and copy-only tag evidence prompt. `tests/workbench-shell.test.js` covers rendering the v28 Release Closeout Workspace without tagging or shell execution.

Boundary fallback is recorded: PASS. Worker evidence records the branch mismatch/current-checkout fallback. This review evidence also records the current branch.

## Required command results

### `pnpm check`

Exit code: 0

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: 0

```text
tests 734
suites 115
pass 734
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6786.035
```

### `pnpm workbench:build`

Exit code: 0

```text
vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB
✓ built in 51ms
```

### `git diff --check`

Exit code: 0

```text
<no output>
```

## Boundary notes

- I did not modify implementation code.
- I did not register a goal review event, main verification event, release gate, or `release.ready` event.
- I did not create a tag, merge, push, or run release publication steps.
- The only file written by this reviewer is `docs/plans/v28-task-4-review-evidence-2026-05-29.md`.
- The checkout was already dirty with many v23-v28 files before this review; I did not revert unrelated changes.

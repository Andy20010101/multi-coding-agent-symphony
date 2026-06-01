# v28 task-4 worker evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-4`
Branch/fallback checkout: current-checkout fallback on `v27-task-5-review-revision-tests-docs`
User-visible value: release 前能在 Workbench 里看到明确缺口和收口动作。

## Implementation summary

- Added `ReleaseCloseoutWorkspaceModel` projection on top of existing closeout/runbook/ledger/event contracts.
- Closeout Gaps now shows release verification checklist rows with gate status, command text, and copy-only release gate registration commands.
- Added a controlled `release.ready` gate registration form that uses the existing `symphony goal gate` dry-run preview and plan-hash confirm path. It does not mark release-ready unless confirm appends the explicit event.
- Added a copy-only tag evidence prompt with release evidence and tag evidence paths. It tells the operator to stop on closeout gaps and not create a tag from the prompt.
- Updated Workbench shell/client tests and documentation for the v28 closeout surface.
- Rebuilt static Workbench assets with `pnpm workbench:build`.

## Files changed

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-B9IfCFVY.css`
- `src/symphony/workbench-static/assets/index-NKKg_tJp.js`

## Commands run

### `pnpm check`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

tests 734
suites 115
pass 734
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6936.140375
```

### `pnpm workbench:build`

Exit code: `0`

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-B9IfCFVY.css   19.66 kB │ gzip:   3.58 kB
src/symphony/workbench-static/assets/index-NKKg_tJp.js   862.88 kB │ gzip: 160.11 kB

✓ built in 54ms
```

### `git diff --check`

Exit code: `0`

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json`

Exit code: `0`

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v28-workbench-v1-release",
  "goalTitle": "v28 Workbench v1 Release",
  "generatedAt": "2026-05-31T22:21:12.791Z",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 3,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    { "taskId": "task-1", "status": "main-verified" },
    { "taskId": "task-2", "status": "main-verified" },
    { "taskId": "task-3", "status": "main-verified" },
    { "taskId": "task-4", "status": "planned" },
    { "taskId": "task-5", "status": "planned" }
  ],
  "releaseGates": {
    "pnpmCheck": "unknown",
    "pnpmTest": "unknown",
    "workbenchBuild": "unknown",
    "mutationGate": "unknown",
    "auditHigh": "unknown",
    "diffCheck": "unknown",
    "mcasDoctor": "unknown",
    "docsUpdated": "unknown",
    "tagEvidence": "unknown"
  },
  "blockers": [],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-4",
      "command": "pnpm check"
    }
  ],
  "safety": {
    "readOnly": true,
    "copyOnly": true,
    "browserExecutionAvailable": false,
    "modelInvocationAvailable": false
  }
}
```

## Boundary notes

- Expected branch `v28-task-4-release-closeout-workspace` was not the current checkout. Work continued on the dirty checkout as requested and recorded this as current-checkout fallback.
- The checkout already contained many v23-v28 modified and untracked files before this task. I did not revert or reset them.
- This worker did not register worker, reviewer, main verification, or release events.
- This worker did not declare `release.ready`, did not create a tag, did not merge, and did not infer readiness from filenames, branch names, commits, prompt text, command text, or frontend state.
- The Workbench additions use the latest goal/runbook/next-action closeout flow, not the old v8 action list.

## Browser verification

- Started `pnpm --silent symphony console --host 127.0.0.1 --port 8765 --json`.
- Opened `http://127.0.0.1:8765/workbench/` in the in-app Browser.
- Verified the DOM contains `Closeout Gaps`, `release verification checklist`, `release.ready gate registration`, `tag evidence prompt`, `ReleaseCloseoutWorkspaceModel`, and `goal-gate-release-ready-declared`.
- Captured screenshots:
  - `/tmp/v28-task-4-workbench-closeout.png`
  - `/tmp/v28-task-4-release-checklist.png`

## Reviewer handoff checklist

- Open Workbench and inspect Active Goal -> Closeout.
- Confirm Closeout Gaps shows `ReleaseCloseoutWorkspaceModel`, release verification checklist rows, `release.ready` gate registration, and tag evidence prompt.
- Confirm `release.ready` registration uses `symphony goal gate --gate release.ready --status declared` dry-run preview plus plan-hash confirm.
- Confirm the closeout panel does not add shell execution, tag creation, merge, auto-approval, or release-ready inference.
- Re-run `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and goal-status before review verdict.

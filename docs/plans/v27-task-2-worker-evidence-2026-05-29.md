# v27 task-2 worker evidence

Goal id: `v27-review-revision-loop`
Task id: `task-2`
Runbook branch: `v27-task-2-independent-reviewer-handoff`
Actual branch/path: `v27-task-2-independent-reviewer-handoff` in `/Users/andy/Documents/project/multi-coding-agent-symphony`
User-visible value: 独立 reviewer/subagent 可以直接接手。

## Implementation summary

Task-2 extends the v27 Review Workspace handoff path.

- Workbench now fetches the explicit reviewer prompt pack for the active task through the existing controlled goal prompt route: `/api/goals/<goal-id>/prompt?task=<task-id>&role=reviewer`.
- Review Workspace uses that `goal-prompt-pack.v1` response to display the reviewer prompt even while `goal next` still points at the worker phase.
- Review Workspace now shows a reviewer handoff section with the prompt route, copy-only prompt command, review evidence path, latest worker actor when available, and explicit reviewer/worker separation fields.
- The generated reviewer prompt now states that the reviewer id used with `symphony goal review` must differ from the latest worker actor id.
- Docs and tests cover the Workbench-visible path, prompt-pack text, route fetch, evidence path, and separation requirement.

No reviewer verdict, main verification gate, or release gate was registered.

## Files changed for task-2

- `frontend/workbench/src/api/client.js`
- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `src/symphony/goal-prompt-pack.js`
- `tests/workbench-api-client.test.js`
- `tests/workbench-shell.test.js`
- `tests/v19-goal-prompt-pack.test.js`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-CVyMhr1m.css`
- `src/symphony/workbench-static/assets/index-CW0hq1tZ.js`
- `docs/plans/v27-task-2-worker-evidence-2026-05-29.md`

The checkout also contains pre-existing task-1/prior-version dirty and untracked files. I did not revert them.

## Commands run with exact results

### `pnpm check`

Result: passed, exit `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit `0`.

```text
ℹ tests 721
ℹ suites 114
ℹ pass 721
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6716.9145
```

### `pnpm workbench:build`

Result: passed, exit `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CVyMhr1m.css   16.31 kB │ gzip:   3.11 kB
src/symphony/workbench-static/assets/index-CW0hq1tZ.js   809.49 kB │ gzip: 150.41 kB

✓ built in 52ms
```

### `git diff --check`

Result: passed, exit `0`. Command produced no output.

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit `0`.

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v27-review-revision-loop",
  "goalTitle": "v27 Review Revision Loop",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task-1": {
    "status": "main-verified",
    "workerEvidenceRef": "docs/plans/v27-task-1-worker-evidence-2026-05-29.md",
    "reviewEvidenceRef": "docs/plans/v27-task-1-review-evidence-2026-05-29.md",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": "docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md"
  },
  "task-2": {
    "status": "planned",
    "statusSource": "goal-runbook.v1",
    "branch": "v27-task-2-independent-reviewer-handoff",
    "workerEvidenceRef": null,
    "reviewEvidenceRef": null,
    "reviewVerdict": null,
    "mainVerificationRef": null
  },
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-2",
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

## Additional check

I started the local console with:

```text
pnpm --silent symphony console --host 127.0.0.1 --port 9876 --json
```

The built Workbench page at `http://127.0.0.1:9876/workbench/` rendered `#review-workspace-panel`. The panel showed:

- `reviewer handoff`
- `promptCommand`: `pnpm --silent symphony goal prompt --goal v27-review-revision-loop --task task-2 --role reviewer --markdown`
- `reviewer evidence path`: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`
- `reviewerActorMustDifferFromLatestWorker`: `true`
- reviewer prompt text for `v27-review-revision-loop task-2`

## Boundary notes

- Branch setup succeeded with `git checkout -b v27-task-2-independent-reviewer-handoff` from the current dirty checkout. No current-checkout fallback was needed.
- Starting checkout was `v27-task-1-review-workspace-for-active-task` with uncommitted task-1 changes and prior-version untracked artifacts. I did not reset, checkout away from, or delete those files.
- Workbench primary path stays on latest/v19 goal/runbook/next-action/prompt flow. This task did not make v8 `scan/do/review/verify/status/continue/artifacts` the main Workbench action list.
- The implementation does not add a generic safety layer, shell runner, permission system, goal framework, or artifact framework.
- The implementation does not infer task approval or release readiness from file names, branch names, commit messages, prompt text, or frontend state.
- The implementation does not let a worker self-approve. It exposes the reviewer/worker separation requirement and relies on the existing `symphony goal review` reviewer-is-not-worker precondition for event registration.
- No reviewer approval, needs-revision verdict, main verification, release gate, merge, tag, or release-ready event was registered by this worker.

## Reviewer handoff checklist

- Reviewer prompt is generated from `goal-prompt-pack.v1` for `role=reviewer`.
- Reviewer prompt is visible in Review Workspace for task-2.
- Reviewer evidence path is visible: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`.
- Review Workspace marks that reviewer and latest worker actor must differ.
- Review Workspace stays display-only: no shell execution, agent launch, workspace open, or verdict append is available from the handoff block.
- Tests cover the prompt route fetch, reviewer prompt projection, reviewer evidence path, and separation fields.

Worker evidence is ready for independent review.

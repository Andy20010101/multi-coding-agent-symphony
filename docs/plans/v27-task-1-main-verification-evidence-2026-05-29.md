# v27 task-1 main verification evidence

Goal id: `v27-review-revision-loop`
Task id: `task-1`
Runbook branch: `v27-task-1-review-workspace-for-active-task`
Main verification evidence: `docs/plans/v27-task-1-main-verification-evidence-2026-05-29.md`

## Verification result

Main verification passed: `yes`

Gate recommendation: register `main-verification` for task-1 as `passed`.

This evidence does not declare release readiness.

## Inputs checked

- Runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v27_review-revision-loop_goal_runbook_latest.md`
- Worker evidence: `docs/plans/v27-task-1-worker-evidence-2026-05-29.md`
- Review evidence: `docs/plans/v27-task-1-review-evidence-2026-05-29.md`

The review evidence records verdict `APPROVED`. The reviewer evidence also records a live Workbench check for changed files, source run, worker evidence, review prompt, review checklist, and expected verdict event.

## Branch and commit basis

- Workspace path: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Actual branch used: `v27-task-1-review-workspace-for-active-task`
- Current commit used: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Main commit observed: `ab714716e85d13c71c5643036292ede0594c48a6`
- `origin/main` observed during setup: `d12f428078e4ebcf3c1d68e982f940f53e9941dc`
- Merge mode: current-checkout fallback verification

The task-1 product changes are present in the current checkout as unstaged tracked changes and untracked files. The branch ref itself points at `7bc15cf4a303e2f81f85db21ee4f899921c89a92`, which is already an ancestor of local `main`; a fast-forward merge from `main` to the branch ref would not carry the current uncommitted task changes. I verified the current checkout because that is the boundary-equivalent state containing the worker and reviewer-approved task-1 implementation.

## Boundary notes

Original blocked runbook operation: `git checkout main`.

I did not move branches. `git status --short --branch` showed dirty tracked files, deleted generated assets, and untracked prior-version evidence/fixture/test files before verification. Moving to `main` would move or strand the active task work and unrelated prior-version files across branch boundaries. Under the boundary-first rule, I used the current checkout fallback and did not revert unrelated changes.

The fallback supersedes the checkout, pull, and fast-forward merge blocker for product verification. It does not supersede event registration; I did not register the main-verification gate.

Diff basis:

- Tracked task changes were checked against `HEAD` with `git diff --name-status HEAD --`.
- Relevant product files were also compared against `main` with `git diff --name-status main -- <task files>`.
- Untracked files were inspected with `git ls-files --others --exclude-standard`.

Tracked task files in the current checkout:

```text
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
M	frontend/workbench/src/App.jsx
M	frontend/workbench/src/api/client.js
M	frontend/workbench/src/api/contracts.js
M	frontend/workbench/src/styles/workbench.css
M	src/symphony/console.js
M	src/symphony/contract.js
D	src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
D	src/symphony/workbench-static/assets/index-wQbBCopW.js
M	src/symphony/workbench-static/index.html
M	tests/symphony-cli.test.js
M	tests/v21-goal-plan-preview-api.test.js
M	tests/workbench-api-client.test.js
M	tests/workbench-shell.test.js
```

Task-relevant untracked files present during verification:

```text
docs/plans/v27-task-1-review-evidence-2026-05-29.md
docs/plans/v27-task-1-worker-evidence-2026-05-29.md
fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json
src/symphony/workbench-static/assets/index-CVyMhr1m.css
src/symphony/workbench-static/assets/index-DG1Wr-LV.js
```

Additional prior-version untracked evidence, fixtures, and tests were present. I left them in place.

## Commands run

### `pnpm check`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: exit code `0`.

The output included the full Node test listing. Terminal summary:

```text
ℹ tests 720
ℹ suites 114
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6812.639792
```

### `pnpm workbench:build`

Result: exit code `0`.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-CVyMhr1m.css   16.31 kB │ gzip:   3.11 kB
src/symphony/workbench-static/assets/index-DG1Wr-LV.js   803.76 kB │ gzip: 149.47 kB

✓ built in 50ms
```

### `git diff --check`

Result: exit code `0`.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: exit code `0`.

Key result:

```json
{
  "goalId": "v27-review-revision-loop",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 1,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-1",
      "status": "approved",
      "workerEvidenceRef": "docs/plans/v27-task-1-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v27-task-1-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-2",
      "command": "pnpm check"
    }
  ]
}
```

Full command output was valid `goal-progress-ledger.v1` JSON.

## Workbench UI smoke check

Started local console:

```text
pnpm --silent symphony console --host 127.0.0.1 --port 9876 --json
```

Result: server reported `status: "listening"` and `url: "http://127.0.0.1:9876/"`.

Opened `http://127.0.0.1:9876/workbench/` in the in-app browser and checked `#review-workspace-panel`.

Result:

```json
{
  "url": "http://127.0.0.1:9876/workbench/",
  "title": "v20 Workbench",
  "panelPresent": true,
  "panelTextLength": 3645,
  "labelsVisible": {
    "changedFiles": true,
    "sourceRun": true,
    "workerEvidence": true,
    "reviewPrompt": true,
    "reviewChecklist": true,
    "expectedVerdictEvent": true
  },
  "hasWorkerEvidenceRef": true,
  "hasReviewEvidenceRef": true,
  "hasReviewerApproved": true,
  "hasReviewerNeedsRevision": true,
  "hasDryRunReviewCommand": true,
  "hasNoInferenceText": true
}
```

I stopped the local console process after the smoke check.

## Blockers

No product or test blocker found for v27 task-1 on the current-checkout fallback verification path.

Open boundary: the runbook `main` checkout and fast-forward merge path was not executed because the current worktree contains uncommitted task changes and unrelated prior-version files. The fallback verification covers the active task implementation but does not make a release-ready claim and does not register the goal gate.

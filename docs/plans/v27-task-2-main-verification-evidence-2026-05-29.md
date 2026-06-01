# v27 task-2 main verification evidence

Goal id: `v27-review-revision-loop`
Task id: `task-2`
Runbook branch: `v27-task-2-independent-reviewer-handoff`
Actual branch/path: `v27-task-2-independent-reviewer-handoff` in `/Users/andy/Documents/project/multi-coding-agent-symphony`
User-visible value: 独立 reviewer/subagent 可以直接接手。

## Evidence refs used

- Worker evidence: `docs/plans/v27-task-2-worker-evidence-2026-05-29.md`
- Reviewer evidence: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`
- Main verification evidence: `docs/plans/v27-task-2-main-verification-evidence-2026-05-29.md`

The reviewer evidence records `APPROVED` for task-2. This file records main verification only. I did not register the goal gate, merge, tag, or declare release ready.

## Branch and commit basis

- Runbook main path requested: `git checkout main`, `git pull --ff-only`, `git merge --ff-only v27-task-2-independent-reviewer-handoff`.
- Original blocked operation: `git checkout main`.
- Blocking condition: `git status --short --branch` showed the checkout already on `v27-task-2-independent-reviewer-handoff` with modified task files and untracked prior-version/task evidence. Moving to `main` would cross the worktree boundary and risk carrying or overwriting unrelated local work.
- Follow-on runbook operations not attempted because of the same boundary: `git pull --ff-only`, `git merge --ff-only v27-task-2-independent-reviewer-handoff`.
- Fallback mode used: current-checkout verification on `v27-task-2-independent-reviewer-handoff`.
- Main commit recorded before fallback verification: `ab714716e85d13c71c5643036292ede0594c48a6`.
- Current commit recorded before fallback verification: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- Runbook branch commit recorded before fallback verification: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- `git merge-base main HEAD`: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- `git log main..HEAD`: no branch-only commits.
- `git log HEAD..main`: `main` is ahead of the current branch ref.
- Diff basis for this verification: dirty worktree contents on `v27-task-2-independent-reviewer-handoff`, not a clean fast-forward merge to `main`.
- `git diff --name-status main...HEAD`: no output because `HEAD` is the merge base.
- `git diff --name-status` showed modified tracked product/test/docs files and deleted old Workbench static assets.
- The fallback supersedes the checkout blocker for verification evidence only. It does not supersede merge readiness or release readiness.

## Required command results

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
ℹ duration_ms 6811.380208
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

✓ built in 50ms
```

### `git diff --check`

Result: passed, exit `0`. Command produced no output.

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit `0`.

Relevant output:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v27-review-revision-loop",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 2,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "tasks": [
    {
      "taskId": "task-2",
      "title": "Independent reviewer handoff",
      "status": "approved",
      "workerEvidenceRef": "docs/plans/v27-task-2-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v27-task-2-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-3",
      "command": "pnpm check"
    }
  ]
}
```

## Additional scope check

### `pnpm --silent symphony goal prompt --goal v27-review-revision-loop --task task-2 --role reviewer --json`

Result: passed, exit `0`.

The generated `goal-prompt-pack.v1` reviewer prompt for task-2 includes:

- reviewer role: `reviewer`
- evidence file: `docs/plans/v27-task-2-review-evidence-2026-05-29.md`
- reviewer boundary: the reviewer id used with `symphony goal review` must differ from the task's latest worker actor id
- no main verification or release-ready instruction for the reviewer role

## Main verification result

Main verification passed on the current-checkout fallback path.

This is not a release-ready claim. The goal-status output reports `releaseReady: false`, release gates remain unknown, and `mainVerificationRef` for task-2 was still `null` before this evidence file was written. I did not register the main verification gate.

## Blockers

No product or test blocker was found.

The only blocker was the runbook branch/worktree boundary for `git checkout main` and the follow-on pull/merge path. The fallback verification path supersedes that blocker for this main verification evidence.

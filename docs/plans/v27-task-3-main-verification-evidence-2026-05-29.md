# v27 task-3 main verification evidence

## Run context

- Goal id: `v27-review-revision-loop`
- Task id: `task-3`
- Task title: `Review verdict registration`
- Runbook branch: `v27-task-3-review-verdict-registration`
- Evidence path: `docs/plans/v27-task-3-main-verification-evidence-2026-05-29.md`
- Repository path: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- User-visible value checked: review results can move the ledger.

## Source evidence used

- Worker evidence: `docs/plans/v27-task-3-worker-evidence-2026-05-29.md`
- Reviewer evidence: `docs/plans/v27-task-3-review-evidence-2026-05-29.md`
- Goal status command showed task-3 `status: approved`, `reviewVerdict: APPROVED`, and `reviewEvidenceRef: docs/plans/v27-task-3-review-evidence-2026-05-29.md`.

## Branch and boundary

- Runbook main verification path requested:
  - `git checkout main`
  - `git pull --ff-only`
  - `git merge --ff-only v27-task-3-review-verdict-registration`
  - verification commands
- Actual branch/path: `v27-task-3-review-verdict-registration` at `/Users/andy/Documents/project/multi-coding-agent-symphony`.
- Current branch commit used: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- Current `main` commit observed: `ab714716e85d13c71c5643036292ede0594c48a6`.
- Merge base of `HEAD` and `main`: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`.
- `git merge-base --is-ancestor main HEAD` exited `1`; `main` is not an ancestor of the current task branch.
- `git log --oneline main..HEAD` returned no commits.
- `git diff --name-only main...HEAD` returned no files.
- Diff basis for this verification: current dirty checkout on `v27-task-3-review-verdict-registration`, with tracked worktree changes relative to `HEAD` and untracked evidence/fixture files already present in the workspace.
- Original runbook checkout/merge operation was treated as blocked by the boundary rule. The worktree had uncommitted task changes and unrelated prior-version artifacts before verification, so I did not move those changes across branches or try to fast-forward `main`.
- Fallback mode superseded the checkout/pull/merge blocker for verification only. No branch merge, staging, commit, gate registration, or release readiness declaration was performed.

## Worktree state

`git status --short --branch` reported the current branch with modified task files, deleted old static bundle assets, new static bundle assets, task evidence files, and unrelated prior-version artifacts. I did not revert unrelated changes.

Tracked files changed relative to `HEAD`:

```text
docs/symphony-product-contracts.md
docs/workbench-operator-guide.md
frontend/workbench/src/App.jsx
frontend/workbench/src/api/client.js
frontend/workbench/src/api/contracts.js
frontend/workbench/src/styles/workbench.css
src/symphony/console.js
src/symphony/contract.js
src/symphony/goal-prompt-pack.js
src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
src/symphony/workbench-static/assets/index-wQbBCopW.js
src/symphony/workbench-static/index.html
tests/symphony-cli.test.js
tests/v19-goal-prompt-pack.test.js
tests/v21-goal-plan-preview-api.test.js
tests/workbench-api-client.test.js
tests/workbench-shell.test.js
```

## Verification commands

### `pnpm check`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 test /Users/andy/Documents/project/multi-coding-agent-symphony
> node --test --test-concurrency=8

...
✔ v23 Workbench goal operation console API (119.348792ms)
✔ v23 goal operation run registry (13.298042ms)
✔ v25 controlled implementation lane fixtures (327.989084ms)
✔ v15 Workbench read-only API client (82.527292ms)
✔ v15 Workbench React/Vite shell (32.015166ms)
✔ v15 Workbench static serving (28.835167ms)

ℹ tests 722
ℹ suites 114
ℹ pass 722
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4528.220583
```

### `pnpm workbench:build`

Result: passed, exit code 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB │ gzip:   3.13 kB
src/symphony/workbench-static/assets/index-DPQlSPKW.js   815.86 kB │ gzip: 151.54 kB

✓ built in 51ms
```

### `git diff --check`

Result: passed, exit code 0.

```text
<no output>
```

### `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: passed, exit code 0.

Relevant output:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "contractVersion": 1,
  "goalId": "v27-review-revision-loop",
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
    {
      "taskId": "task-3",
      "title": "Review verdict registration",
      "status": "approved",
      "statusSource": "goal-event-log.v1:evt_4a911cb2e8fda497",
      "branch": "v27-task-3-review-verdict-registration",
      "workerEvidenceRef": "docs/plans/v27-task-3-worker-evidence-2026-05-29.md",
      "reviewEvidenceRef": "docs/plans/v27-task-3-review-evidence-2026-05-29.md",
      "reviewVerdict": "APPROVED",
      "mainVerificationRef": null,
      "blockers": []
    }
  ],
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-4",
      "command": "pnpm check"
    }
  ]
}
```

## Result

- Main verification passed on the boundary-equivalent current checkout.
- The ledger reflected the registered review result for task-3: `approved` with `reviewVerdict: APPROVED`.
- Required checks passed: `pnpm check`, `pnpm test`, `pnpm workbench:build`, `git diff --check`, and `pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`.
- This evidence does not register the goal gate and does not declare release readiness.

## Blockers

None for product verification. The only blocker was the runbook branch boundary for checkout/pull/fast-forward merge, superseded by the fallback verification path above.

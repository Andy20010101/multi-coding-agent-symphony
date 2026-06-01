# v27 task-5 worker evidence

Goal id: `v27-review-revision-loop`
Task id: `task-5`
Runbook branch: `v27-task-5-review-revision-tests-docs`
Actual branch/path: `v27-task-5-review-revision-tests-docs` at `/Users/andy/Documents/project/multi-coding-agent-symphony`
User-visible value: 实现完整 review -> revision -> verify loop。

## Implementation summary

Added a v27 integration test for the task-5 review/revision loop. The test registers the real `v27-review-revision-loop` runbook fixture in temporary state, seeds task-1 through task-4 as main-verified, and drives task-5 through controlled dry-run plus plan-hash confirm flows.

Covered paths:

- `reviewer.approved` moves task-5 to `main-verifier` / `main-verification`.
- `reviewer.needs-revision` moves task-5 to worker revision and `goal prompt --next` includes failed commands, latest run changed files, and acceptance delta.
- `main.verification-failed` moves task-5 to worker revision and `goal prompt --next` includes gate failure command evidence.
- A later revision `worker.evidence-recorded` sends task-5 back to `reviewer` instead of skipping the second independent review.

Corrected the v27 runbook fixture so task-5 revision prompts do not inherit release-ready commands. Release-ready remains outside this task.

Updated operator/product docs to state the explicit event-backed loop and the non-inference boundaries.

## Files changed

- `tests/v27-review-revision-loop.test.js`
- `fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json`
- `docs/workbench-operator-guide.md`
- `docs/symphony-product-contracts.md`
- `docs/plans/v27-task-5-worker-evidence-2026-05-29.md`

The worktree already contained uncommitted task-1/task-4 and prior-version files before this task started. Those files were not reverted.

## Command results

`node --test tests/v27-review-revision-loop.test.js`

Result: exit 0. Summary: 3 tests, 1 suite, 3 passed, 0 failed, duration 96.94825 ms.

`pnpm check`

Result: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

Result: exit 0. Final summary:

```text
tests 730
suites 115
pass 730
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6710.11975
```

`pnpm workbench:build`

Result: exit 0.

```text
vite v8.0.14 building client environment for production...
transforming... 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.28 kB
src/symphony/workbench-static/assets/index-Cij6QcGP.css   16.38 kB | gzip:   3.13 kB
src/symphony/workbench-static/assets/index-BGag3HMW.js   818.42 kB | gzip: 152.07 kB
built in 51ms
```

`git diff --check`

Result: exit 0. No output.

`pnpm --silent symphony goal-status --goal v27-review-revision-loop --json`

Result: exit 0. Key fields:

```json
{
  "contractName": "goal-progress-ledger.v1",
  "goalId": "v27-review-revision-loop",
  "summary": {
    "totalTasks": 5,
    "completedTasks": 4,
    "blockedTasks": 0,
    "needsReviewTasks": 0,
    "needsRevisionTasks": 0,
    "releaseReady": false,
    "releaseReadySource": null
  },
  "task-5": {
    "status": "planned",
    "statusSource": "goal-runbook.v1",
    "workerEvidenceRef": null,
    "reviewEvidenceRef": null,
    "reviewVerdict": null,
    "mainVerificationRef": null
  }
}
```

## Boundary notes

- Branch setup was attempted from the dirty starting checkout. Starting branch was `v27-task-4-revision-prompt-generator`; `git switch -c v27-task-5-review-revision-tests-docs` succeeded, so no current-checkout fallback was needed.
- Existing uncommitted task-1/task-4 and prior-version artifacts remained in the worktree and were not reverted.
- Workbench primary path remains the latest/v19 goal/runbook/next-action flow: `goal-status -> goal next -> goal prompt -> goal update/review/gate`.
- No v8 `scan/do/review/verify/status/continue/artifacts` button path was added or made primary.
- No generic safety layer, shell runner, permission system, goal framework, or artifact framework was added.
- No task approval, main verification, or release readiness is inferred from file names, branch names, commit messages, prompt text, or frontend state.
- This worker did not self-approve and did not register reviewer, main-verification, or release events.

## Reviewer handoff checklist

- Review `tests/v27-review-revision-loop.test.js` for coverage of approved, needs-revision, failed verification, revision prompt, and second worker handoff.
- Check that `fixtures/contracts/goal-runbook.v27-review-revision-loop.v1.json` keeps task-5 validation scoped to task acceptance commands and does not pull release-ready into worker revision prompts.
- Check the docs updates in `docs/workbench-operator-guide.md` and `docs/symphony-product-contracts.md` for the event-backed loop and non-inference boundaries.
- Run `pnpm check`, `pnpm test`, `pnpm workbench:build`, and `git diff --check`.
- If approved, the next actor should register reviewer evidence separately. This worker evidence does not claim reviewer approval or main verification.

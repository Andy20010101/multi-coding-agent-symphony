# v25 task-3 main verification evidence

- Goal id: `v25-controlled-implementation-lane`
- Task id: `task-3`
- Branch: `v25-task-3-confirm-isolated-workspace-execution`
- Verification path: repo-local verification in `/private/tmp/v25-task-3-confirm-isolated-workspace-execution`
- Recovery reason: linked-worktree merge metadata/ref lock was blocked in `/private/tmp/v25-main-verification`; verification was rerun from the task checkout instead of retrying the blocked linked-worktree metadata path.
- Main commit before attempted merge: `22db2edd73e880765e00f464634691ed8b801836`
- Verified task branch commit: `ad95939b5ee935e14ec42a16eb86f2bdc4b0f550`
- Merge-base with `main`: `22db2edd73e880765e00f464634691ed8b801836`
- Main verification passed: yes
- Prior blocker status: superseded by repo-local verification evidence. The prior blocker was a linked-worktree Git metadata/ref lock permission boundary, not a product implementation failure.

## Git context

- `pwd`: exit 0, `/private/tmp/v25-task-3-confirm-isolated-workspace-execution`
- `git rev-parse --abbrev-ref HEAD`: exit 0, `v25-task-3-confirm-isolated-workspace-execution`
- `git rev-parse HEAD`: exit 0, `ad95939b5ee935e14ec42a16eb86f2bdc4b0f550`
- `git merge-base main HEAD`: exit 0, `22db2edd73e880765e00f464634691ed8b801836`
- `git status --short`: exit 0, no output.
- `git diff --name-status main...HEAD`: exit 0.

```text
A	docs/plans/v25-task-3-review-evidence-2026-05-29.md
A	docs/plans/v25-task-3-worker-evidence-2026-05-29.md
M	docs/symphony-product-contracts.md
M	docs/workbench-operator-guide.md
M	frontend/workbench/src/App.jsx
M	frontend/workbench/src/api/client.js
M	frontend/workbench/src/api/contracts.js
M	frontend/workbench/src/styles/workbench.css
M	src/symphony/console.js
M	src/symphony/goal-implementation-plan.js
R098	src/symphony/workbench-static/assets/index-BMfhB4hU.js	src/symphony/workbench-static/assets/index-B0jZ15b9.js
R099	src/symphony/workbench-static/assets/index-C7VQDHRF.css	src/symphony/workbench-static/assets/index-DGomgiUb.css
M	src/symphony/workbench-static/index.html
M	tests/v25-controlled-implementation-plan-api.test.js
M	tests/workbench-api-client.test.js
M	tests/workbench-route-smoke.test.js
M	tests/workbench-shell.test.js
```

## Main verification command results

- `pnpm check`: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 check /private/tmp/v25-task-3-confirm-isolated-workspace-execution
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

- `pnpm test`: exit 0.

```text
ℹ tests 728
ℹ suites 115
ℹ pass 728
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4295.148625
```

- `pnpm workbench:build`: exit 0.

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /private/tmp/v25-task-3-confirm-isolated-workspace-execution
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-DGomgiUb.css   15.79 kB │ gzip:   3.06 kB
src/symphony/workbench-static/assets/index-B0jZ15b9.js   787.80 kB │ gzip: 145.63 kB

✓ built in 51ms
```

- `git diff --check`: exit 0, no output.
- `pnpm --silent symphony goal-status --goal v25-controlled-implementation-lane --json`: exit 0.

```text
contractName: goal-progress-ledger.v1
contractVersion: 1
goalId: v25-controlled-implementation-lane
generatedAt: 2026-05-31T12:56:43.071Z
summary.totalTasks: 5
summary.completedTasks: 2
summary.blockedTasks: 1
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-3.status: blocked
task-3.statusSource: goal-event-log.v1:evt_c30793bdd2f9536e
task-3.reviewVerdict: APPROVED
task-3.mainVerificationRef: docs/plans/v25-task-3-main-verification-evidence-2026-05-29.md
task-3.blocker: Task-3 main verification is blocked by linked-worktree Git metadata/ref lock permissions; no product implementation failure was found.
releaseGates: all unknown
safety.readOnly: true
safety.copyOnly: true
safety.browserExecutionAvailable: false
safety.modelInvocationAvailable: false
```

## Verification outcome

The repo-local/current checkout verification path passed all requested commands at commit `ad95939b5ee935e14ec42a16eb86f2bdc4b0f550`.

The previous linked-worktree blocker is resolved for verification purposes by this recovery path. The goal ledger still reports the earlier blocked event because this recovery path did not register a gate or mutate managed goal state.

No actual main merge was performed in this recovery path. No linked-worktree checkout, merge, staging, commit, push, or release readiness declaration was performed. This evidence does not infer approval from filenames, branches, or commits.

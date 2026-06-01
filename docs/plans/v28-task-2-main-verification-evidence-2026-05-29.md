# v28 task-2 main verification evidence

Goal id: `v28-workbench-v1-release`

Task id: `task-2`

Task: Unified goal/task/run/evidence routes

## Branch and fallback path

Runbook branch: `v28-task-2-unified-goal-task-run-evidence-routes`

Main branch ref: `main` at `ab714716e85d13c71c5643036292ede0594c48a6`

Current checkout: `v27-task-5-review-revision-tests-docs`

Current commit: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`

Fallback mode: current-checkout repo-local verification.

The runbook ideal checkout, pull, and fast-forward merge path was not used because the current checkout had existing modified and untracked files. The boundary-first recovery rule applies: do not switch branches, pull, or merge over a dirty checkout. The task branch name from the runbook did not resolve as a local ref during this verification.

Evidence and diff basis: current working tree on `v27-task-5-review-revision-tests-docs`, including modified tracked files, deleted old Workbench static assets, generated new Workbench static assets, and untracked v28 task evidence files already present in the repo. No gate/event was registered by this verification.

## Precondition

Command:

```sh
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
```

Result: exit 0.

Relevant result:

```text
task-2 status: approved
task-2 statusSource: goal-event-log.v1:evt_8335b312e4097fb0
task-2 reviewVerdict: APPROVED
task-2 workerEvidenceRef: docs/plans/v28-task-2-worker-evidence-2026-05-29.md
task-2 reviewEvidenceRef: docs/plans/v28-task-2-review-evidence-2026-05-29.md
task-2 mainVerificationRef: null
releaseReady: false
```

Precondition passed: reviewer approval exists for `task-2`.

## Boundary checks

Command:

```sh
git status --short --branch
```

Result: exit 0.

Relevant result:

```text
## v27-task-5-review-revision-tests-docs
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M scripts/symphony.js
 M src/symphony/console.js
 M src/symphony/contract.js
 M src/symphony/goal-gate.js
 M src/symphony/goal-next-action-resolver.js
 M src/symphony/goal-prompt-pack.js
 M src/symphony/goal-review.js
 D src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
 D src/symphony/workbench-static/assets/index-wQbBCopW.js
 M src/symphony/workbench-static/index.html
 M tests/symphony-cli.test.js
 M tests/v19-goal-next-action-resolver.test.js
 M tests/v19-goal-prompt-pack.test.js
 M tests/v21-goal-plan-preview-api.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v28-task-2-review-evidence-2026-05-29.md
?? docs/plans/v28-task-2-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v28-workbench-v1-release.v1.json
?? src/symphony/workbench-static/assets/index-B-SzyFhZ.css
?? src/symphony/workbench-static/assets/index-CDondlJL.js
```

The actual status output also contained earlier v23-v27 evidence files and fixtures. Those files were already present before this verification and were not used as release readiness evidence.

Command:

```sh
git rev-parse main
```

Result: exit 0.

Output:

```text
ab714716e85d13c71c5643036292ede0594c48a6
```

Command:

```sh
git rev-parse v28-task-2-unified-goal-task-run-evidence-routes
```

Result: exit 128.

Output:

```text
fatal: ambiguous argument 'v28-task-2-unified-goal-task-run-evidence-routes': unknown revision or path not in the working tree.
```

Command:

```sh
git branch --all --list '*v28-task-2*'
```

Result: exit 0.

Output: no matching branch refs.

Blocked runbook operations:

```text
git checkout main
git pull --ff-only
git merge --ff-only v28-task-2-unified-goal-task-run-evidence-routes
```

Reason: these operations would cross branch/worktree boundaries while the current checkout contains existing dirty changes. The task branch ref also was not available locally.

## Verification commands

Command:

```sh
pnpm check
```

Result: exit 0.

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Command:

```sh
pnpm test
```

Result: exit 0.

Relevant output:

```text
tests 732
suites 115
pass 732
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 6807.537416
```

Command:

```sh
pnpm workbench:build
```

Result: exit 0.

Output:

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...
17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB | gzip:   0.27 kB
src/symphony/workbench-static/assets/index-B-SzyFhZ.css   19.48 kB | gzip:   3.54 kB
src/symphony/workbench-static/assets/index-CDondlJL.js   836.17 kB | gzip: 155.33 kB

built in 50ms
```

Command:

```sh
git diff --check
```

Result: exit 0.

Output: no whitespace errors reported.

Command:

```sh
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
```

Result: exit 0.

Relevant result:

```text
task-2 status: approved
task-2 reviewVerdict: APPROVED
task-2 mainVerificationRef: null
releaseReady: false
nextActions[0]: Start task-3 / pnpm check
```

## Main verification result

Main verification passed for the current-checkout fallback basis.

This evidence does not claim that the runbook branch was fast-forward merged into `main`. It does not claim release readiness. Parent orchestration should decide whether to register the main-verification gate using this fallback evidence and the blocked boundary notes above.

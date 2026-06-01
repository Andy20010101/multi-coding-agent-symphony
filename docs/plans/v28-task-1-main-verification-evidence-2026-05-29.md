# v28 task-1 main verification evidence

Goal id: `v28-workbench-v1-release`
Task id: `task-1`
Task title: `Workbench app navigation and state header`

## Verification scope

Role: `main-verifier`
Evidence path: `docs/plans/v28-task-1-main-verification-evidence-2026-05-29.md`

This evidence covers main-verification gate evidence only. No gate/event was registered by this verifier.

## Branch or fallback checkout/path

Fallback mode was used.

- Actual checkout: `/Users/andy/Documents/project/multi-coding-agent-symphony`
- Actual branch: `v27-task-5-review-revision-tests-docs`
- Current commit: `7bc15cf4a303e2f81f85db21ee4f899921c89a92`
- Main commit available locally: `ab714716e85d13c71c5643036292ede0594c48a6`
- Task branch from runbook: `v28-task-1-workbench-app-navigation-and-state-header`
- Task branch local ref status: not present as a local head in `git show-ref --heads`

## Main commit / merge mode

No main merge happened.

Original blocked operations:

- `git checkout main`
- `git pull --ff-only`
- `git merge --ff-only v28-task-1-workbench-app-navigation-and-state-header`

Reason: the repository was already on a dirty checkout with broader v23-v28 work. Switching/pulling/merging would cross checkout boundaries with uncommitted files. The task branch also was not available as a local head. Per the boundary-first recovery rule, verification used the current checkout/repo-local fallback instead of forcing branch movement or overwrite.

Evidence/diff basis:

- Worker evidence: `docs/plans/v28-task-1-worker-evidence-2026-05-29.md`
- Review evidence: `docs/plans/v28-task-1-review-evidence-2026-05-29.md`
- Current dirty checkout diff for task-1 files:
  - `frontend/workbench/src/App.jsx`
  - `frontend/workbench/src/styles/workbench.css`
  - `tests/workbench-shell.test.js`
  - `tests/workbench-route-smoke.test.js`
  - `src/symphony/workbench-static/index.html`
  - `src/symphony/workbench-static/assets/index-CKTfjAD4.js`
  - `src/symphony/workbench-static/assets/index-SlXwZMej.css`
  - deleted generated bundle files: `src/symphony/workbench-static/assets/index-DfZ2uJ6P.css`, `src/symphony/workbench-static/assets/index-wQbBCopW.js`

This fallback supersedes the boundary blocker for verification evidence generation because all reasonable repo-local verification commands completed successfully without checkout mutation. It does not supersede the parent orchestrator's responsibility to dry-run and confirm the gate.

## Reviewer approval precondition

Command:

```sh
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
```

Result: exit code `0`.

Relevant exact fields:

```json
{
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
    "status": "approved",
    "statusSource": "goal-event-log.v1:evt_3405a4b0648f65e5",
    "branch": "v28-task-1-workbench-app-navigation-and-state-header",
    "commit": null,
    "workerEvidenceRef": "docs/plans/v28-task-1-worker-evidence-2026-05-29.md",
    "reviewEvidenceRef": "docs/plans/v28-task-1-review-evidence-2026-05-29.md",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": null,
    "blockers": []
  }
}
```

Precondition status: satisfied. The ledger shows explicit reviewer approval for task-1 from `goal-event-log.v1:evt_3405a4b0648f65e5`.

## Boundary and ref checks

Command:

```sh
git status --short --branch
```

Result: exit code `0`.

Relevant output:

```text
## v27-task-5-review-revision-tests-docs
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/styles/workbench.css
 D src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
 D src/symphony/workbench-static/assets/index-wQbBCopW.js
 M src/symphony/workbench-static/index.html
 M tests/workbench-route-smoke.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v28-task-1-review-evidence-2026-05-29.md
?? docs/plans/v28-task-1-worker-evidence-2026-05-29.md
?? src/symphony/workbench-static/assets/index-CKTfjAD4.js
?? src/symphony/workbench-static/assets/index-SlXwZMej.css
```

The full status also included unrelated broader v23-v28 dirty files, so checkout/pull/merge/stage/commit operations were not attempted.

Command:

```sh
git rev-parse --abbrev-ref HEAD && git rev-parse HEAD
```

Result: exit code `0`.

Output:

```text
v27-task-5-review-revision-tests-docs
7bc15cf4a303e2f81f85db21ee4f899921c89a92
```

Command:

```sh
git show-ref --heads main v28-task-1-workbench-app-navigation-and-state-header || true
```

Result: exit code `0`.

Output:

```text
ab714716e85d13c71c5643036292ede0594c48a6 refs/heads/main
```

Command:

```sh
git diff --name-status -- frontend/workbench/src/App.jsx frontend/workbench/src/styles/workbench.css tests/workbench-shell.test.js tests/workbench-route-smoke.test.js src/symphony/workbench-static/index.html src/symphony/workbench-static/assets
```

Result: exit code `0`.

Output:

```text
M	frontend/workbench/src/App.jsx
M	frontend/workbench/src/styles/workbench.css
D	src/symphony/workbench-static/assets/index-DfZ2uJ6P.css
D	src/symphony/workbench-static/assets/index-wQbBCopW.js
M	src/symphony/workbench-static/index.html
M	tests/workbench-route-smoke.test.js
M	tests/workbench-shell.test.js
```

Command:

```sh
git ls-files --others --exclude-standard -- frontend/workbench/src/App.jsx frontend/workbench/src/styles/workbench.css tests/workbench-shell.test.js tests/workbench-route-smoke.test.js src/symphony/workbench-static/index.html src/symphony/workbench-static/assets docs/plans/v28-task-1-worker-evidence-2026-05-29.md docs/plans/v28-task-1-review-evidence-2026-05-29.md
```

Result: exit code `0`.

Output:

```text
docs/plans/v28-task-1-review-evidence-2026-05-29.md
docs/plans/v28-task-1-worker-evidence-2026-05-29.md
src/symphony/workbench-static/assets/index-CKTfjAD4.js
src/symphony/workbench-static/assets/index-SlXwZMej.css
```

## Verification commands

Command:

```sh
pnpm check
```

Result: exit code `0`.

Output:

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

Command:

```sh
pnpm test
```

Result: exit code `0`.

Relevant exact output:

```text
✔ v16 Workbench route smoke and server parity (192.342583ms)
✔ v15 Workbench React/Vite shell (188.327125ms)
✔ renders the v28 Workbench state header and navigates first-screen user paths (162.276917ms)
ℹ tests 731
ℹ suites 115
ℹ pass 731
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6283.859792
```

Command:

```sh
pnpm workbench:build
```

Result: exit code `0`.

Output:

```text
> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.28 kB
src/symphony/workbench-static/assets/index-SlXwZMej.css   18.74 kB │ gzip:   3.47 kB
src/symphony/workbench-static/assets/index-CKTfjAD4.js   824.44 kB │ gzip: 153.29 kB

✓ built in 51ms
```

Command:

```sh
git diff --check
```

Result: exit code `0`.

Output:

```text
```

Command:

```sh
pnpm --silent symphony goal-status --goal v28-workbench-v1-release --json
```

Result: exit code `0`.

Relevant exact fields:

```json
{
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
    "status": "approved",
    "statusSource": "goal-event-log.v1:evt_3405a4b0648f65e5",
    "reviewVerdict": "APPROVED",
    "mainVerificationRef": null,
    "blockers": []
  },
  "nextActions": [
    {
      "kind": "copy-only-command",
      "label": "Start task-2",
      "command": "pnpm check"
    }
  ]
}
```

## Main verification result

Main verification evidence result: `PASSED`.

Basis:

- Reviewer approval precondition exists for task-1.
- `pnpm check` passed.
- `pnpm test` passed with 731 tests and 0 failures.
- `pnpm workbench:build` passed and produced the expected Workbench static bundle names.
- `git diff --check` passed.
- Goal status remains event-backed approved for task-1 and does not claim release readiness.

Parent orchestrator should register the main-verification gate as `passed` if it accepts the current-checkout fallback evidence. This verifier did not register the gate.

## Boundary notes

- The runbook ideal main merge flow was not performed because the current checkout is dirty and contains broader v23-v28 work.
- No checkout, pull, merge, stage, commit, reset, or force operation was performed.
- The local `main` ref exists at `ab714716e85d13c71c5643036292ede0594c48a6`.
- The task branch name from the runbook was not available as a local head.
- Verification used the current checkout at `7bc15cf4a303e2f81f85db21ee4f899921c89a92` plus the task-1 current diff and evidence docs.
- This evidence does not claim release readiness.

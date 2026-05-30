# v21 task-1 review evidence

Date: 2026-05-31

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-1`  
Review verdict: `approved`

## Scope checked

- Reviewed task-1 scope from `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Checked fixture `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`.
- Read worker evidence `docs/plans/v21-task-1-worker-evidence-2026-05-29.md`.
- Reviewed the Workbench source diff against `main`, including the generated Workbench static asset references.
- Checked the current `goal next` state for `v21-goal-event-registration-workbench`.
- Opened the local Workbench in the in-app browser and verified the current Next Action path exposes reviewer verdict event forms.

## Diff/files checked

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DQwHi8dj.css`
- `src/symphony/workbench-static/assets/index-THFje-ok.js`
- Deleted generated assets:
  - `src/symphony/workbench-static/assets/index-DGOQN4eH.css`
  - `src/symphony/workbench-static/assets/index-7IvGgo-R.js`

## Commands run

### `git status --short --branch`

Exit code: `0`.

```text
## v21-task-1-goal-event-form-model
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 D src/symphony/workbench-static/assets/index-7IvGgo-R.js
 D src/symphony/workbench-static/assets/index-DGOQN4eH.css
 M src/symphony/workbench-static/index.html
 M tests/workbench-api-client.test.js
?? docs/plans/v21-task-1-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json
?? src/symphony/workbench-static/assets/index-DQwHi8dj.css
?? src/symphony/workbench-static/assets/index-THFje-ok.js
```

### `git diff --stat main -- src/symphony/workbench-static/index.html frontend/workbench/src/App.jsx frontend/workbench/src/api/contracts.js frontend/workbench/src/styles/workbench.css tests/workbench-api-client.test.js`

Exit code: `0`.

```text
 frontend/workbench/src/App.jsx              | 115 ++++++++
 frontend/workbench/src/api/contracts.js     | 439 ++++++++++++++++++++++++++++
 frontend/workbench/src/styles/workbench.css |  42 +++
 src/symphony/workbench-static/index.html    |   4 +-
 tests/workbench-api-client.test.js          |  75 +++++
 5 files changed, 673 insertions(+), 2 deletions(-)
```

### `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: `0`.

Relevant result:

```text
contractName: goal-next-action.v1
goalId: v21-goal-event-registration-workbench
status: action-required
next.taskId: task-1
next.role: reviewer
next.phase: review
next.reason: Worker evidence exists for task-1 but reviewer verdict is missing.
evidenceState.workerEvidenceRef: docs/plans/v21-task-1-worker-evidence-2026-05-29.md
evidenceState.reviewEvidenceRef: null
afterCompletion.registerWith: symphony goal review
afterCompletion.allowedEvents: reviewer.approved, reviewer.needs-revision
safety.workbenchWriteAvailable: false
```

### Browser check: `http://127.0.0.1:8765/workbench/`

Local console server command:

```text
pnpm --silent symphony console --host 127.0.0.1 --port 8765
```

Server output:

```text
Intent: console
Pipeline: console
Safety: read-only
Project writes: no
Runtime writes: no
External calls: no
Status: listening
Next: http://127.0.0.1:8765/
```

Browser DOM check result:

```json
{
  "hasEventRegistrationSection": true,
  "hasModel": true,
  "hasReviewerApproved": true,
  "hasReviewerNeedsRevision": true,
  "hasGoalReview": true,
  "hasTask1": true,
  "hasRoleReviewer": true,
  "hasWorkerSelfApprovalPolicy": true,
  "hasWorkbenchWriteFalse": true,
  "hasButton": false,
  "hasForm": false
}
```

### `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`

Exit code: `0`.

```text
tests 25
suites 3
pass 25
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 103.521875
```

### `pnpm check`

Exit code: `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`.

```text
tests 671
suites 109
pass 671
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4951.327292
```

### `pnpm workbench:build`

Exit code: `0`.

```text
vite v8.0.14 building client environment for production...
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DQwHi8dj.css    9.11 kB │ gzip:   2.27 kB
src/symphony/workbench-static/assets/index-THFje-ok.js   662.91 kB │ gzip: 123.50 kB

✓ built in 141ms
```

### `git diff --check`

Exit code: `0`; no output.

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: `0`.

Relevant result:

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 0
summary.releaseReady: false
task-1.status: in-progress
task-1.statusSource: goal-event-log.v1:evt_e870491873677a2d
task-1.workerEvidenceRef: docs/plans/v21-task-1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: null
task-1.reviewVerdict: null
task-1.mainVerificationRef: null
```

## Findings

No blocking findings.

The implementation matches task-1 scope:

- `frontend/workbench/src/api/contracts.js:22` defines a fixed form catalog covering `worker.started`, `worker.evidence-recorded`, `worker.self-check-passed`, `worker.self-check-failed`, `blocker.opened`, `blocker.resolved`, `reviewer.approved`, `reviewer.needs-revision`, `main.verification-passed`, and `main.verification-failed`.
- `frontend/workbench/src/api/contracts.js:1381` builds recommended forms from `goal-next-action.v1.afterCompletion.allowedEvents`, not from filenames, branches, commit messages, prompt text, or frontend heuristics.
- `frontend/workbench/src/api/contracts.js:1427` records the policy/source boundary: worker self-approval is not treated as allowed, approval readiness is explicit goal events only, and unsupported inference sources are listed as file name, branch, commit message, and frontend heuristic.
- `frontend/workbench/src/api/contracts.js:1433` keeps task-1 read-only/copy-only: no Workbench confirm path, write path, browser execution path, or model invocation path is exposed.
- `frontend/workbench/src/App.jsx:421` places the event registration form model on the Next Action Card. Browser verification showed the current task-1 reviewer next action exposes `reviewer.approved` and `reviewer.needs-revision`.
- `tests/workbench-api-client.test.js:576` checks the reviewer next-action path and `tests/workbench-api-client.test.js:618` checks worker, blocker, reviewer, and main-verification form specs.

## Boundary notes

- This review did not register `reviewer.approved` or `reviewer.needs-revision`; total control should run dry-run and confirm separately.
- The review approves task-1 form/view model scope only. It does not approve task-2 dry-run preview endpoint, task-3 confirm append flow, task-4 evidence helper, main verification, or release readiness.
- The Workbench remains based on the v19/latest goal/runbook/next-action surface. I did not find a v8 top-level `scan/do/review/verify/status/continue/artifacts` action list in the reviewed Workbench source.
- I did not find a new generic safety layer, shell runner, permission system, goal framework, or artifact framework in the reviewed diff.
- The working tree still has unstaged and untracked files. The review covered the current workspace contents, including the generated static assets, but a later commit step must include the new asset files and evidence files intentionally.

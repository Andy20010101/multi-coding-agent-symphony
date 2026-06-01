# v21 task-1 main verification evidence

Date: 2026-05-31

Goal id: `v21-goal-event-registration-workbench`  
Task id: `task-1`  
Task title: `Goal event form model`  
Verification role: `main-verifier`  
Gate recommendation: `passed`

## Reviewer approval prerequisite

Reviewer approval is explicitly recorded before this verification.

- Review evidence file: `docs/plans/v21-task-1-review-evidence-2026-05-29.md`.
- Review evidence states `Review verdict: approved`.
- Goal ledger states `task-1.reviewVerdict: APPROVED`.
- Goal ledger states `task-1.statusSource: goal-event-log.v1:evt_0b234d220c3cc15e`.
- Event journal `.symphony/goals/events/v21-goal-event-registration-workbench.ndjson` sequence 2 is `reviewer.approved`, actor `codex-v21-task-1-reviewer`, evidence ref `docs/plans/v21-task-1-review-evidence-2026-05-29.md`, verdict `APPROVED`.

## Scope checked

- Read v21 runbook: `docs/plans/workbench-v20-v28-goal-runbooks/v21_workbench-goal-event-registration_goal_runbook_latest.md`.
- Read v21 fixture: `fixtures/contracts/goal-runbook.v21-goal-event-registration-workbench.v1.json`.
- Read worker evidence: `docs/plans/v21-task-1-worker-evidence-2026-05-29.md`.
- Read review evidence: `docs/plans/v21-task-1-review-evidence-2026-05-29.md`.
- Checked Workbench source, static build output references, and Workbench tests on the current integrated working tree.
- Checked current goal ledger and next action for `v21-goal-event-registration-workbench`.

## Files checked

- `frontend/workbench/src/api/contracts.js`
- `frontend/workbench/src/App.jsx`
- `frontend/workbench/src/styles/workbench.css`
- `tests/workbench-api-client.test.js`
- `src/symphony/workbench-static/index.html`
- `src/symphony/workbench-static/assets/index-DQwHi8dj.css`
- `src/symphony/workbench-static/assets/index-THFje-ok.js`
- Deleted generated assets replaced by the build:
  - `src/symphony/workbench-static/assets/index-DGOQN4eH.css`
  - `src/symphony/workbench-static/assets/index-7IvGgo-R.js`

## Acceptance result

Task-1 acceptance is met on the current integrated working tree.

- `frontend/workbench/src/api/contracts.js:22` defines a fixed `GoalEventRegistrationFormModel` catalog covering `worker.started`, `worker.evidence-recorded`, `worker.self-check-passed`, `worker.self-check-failed`, `blocker.opened`, `blocker.resolved`, `reviewer.approved`, `reviewer.needs-revision`, `main.verification-passed`, and `main.verification-failed`.
- `frontend/workbench/src/api/contracts.js:1381` derives recommended forms from `goal-next-action.v1.afterCompletion.allowedEvents`.
- `frontend/workbench/src/App.jsx:421` renders the form model inside the Next Action Card path.
- `tests/workbench-api-client.test.js:576` checks the reviewer next-action path and reviewer verdict forms.
- `tests/workbench-api-client.test.js:618` checks worker, blocker, reviewer, and main-verification form specs and the no-heuristic boundary.
- Current `goal next` is `task-1`, role `main-verifier`, phase `main-verification`, with allowed events `main.verification-passed` and `main.verification-failed`.
- Current next-action projection exposes `GoalEventRegistrationFormModel`, default form `goal-gate-main-verification-passed`, recommended main verification passed/failed forms, and the full supported form catalog required by task-1.

## Boundary result

No boundary failure found.

- Workbench active goal command inventory remains the latest goal surface: `goal-status`, `goal next`, `goal prompt`, and `goal closeout`.
- I did not find a v8 top-level `scan/do/review/verify/status/continue/artifacts` action list in the checked Workbench source.
- I did not find a new generic shell runner, generic safety layer, permission system, goal framework, or artifact framework in the task-1 diff.
- The form model records `approvalReadinessSource: explicit goal events only`.
- The form model records unsupported inference sources as `file-name`, `branch`, `commit-message`, and `frontend-heuristic`.
- The form model keeps `workerCannotApproveOwnTask: true`.
- Task-1 Workbench model is read-only/copy-only: `confirmAvailableInTask1: false`, `workbenchWriteAvailable: false`, `browserExecutionAvailable: false`, and `modelInvocationAvailable: false`.
- This verification did not register `main.verification-passed`, did not approve reviewer work, and did not declare release ready.

## Commands run

### `sed -n '1,2p' .symphony/goals/events/v21-goal-event-registration-workbench.ndjson`

Exit code: `0`.

Relevant output:

```text
sequence 1: eventType worker.evidence-recorded, actor codex-v21-task-1-worker, evidence ref docs/plans/v21-task-1-worker-evidence-2026-05-29.md
sequence 2: eventType reviewer.approved, actor codex-v21-task-1-reviewer, evidence ref docs/plans/v21-task-1-review-evidence-2026-05-29.md, review.verdict APPROVED
```

### `pnpm --silent symphony goal next --goal v21-goal-event-registration-workbench --json`

Exit code: `0`.

Relevant output:

```text
contractName: goal-next-action.v1
goalId: v21-goal-event-registration-workbench
status: action-required
next.taskId: task-1
next.role: main-verifier
next.phase: main-verification
next.reason: Reviewer approved task-1 but main verification is missing.
evidenceState.workerEvidenceRef: docs/plans/v21-task-1-worker-evidence-2026-05-29.md
evidenceState.reviewEvidenceRef: docs/plans/v21-task-1-review-evidence-2026-05-29.md
evidenceState.mainVerificationRef: null
afterCompletion.registerWith: symphony goal gate --gate main-verification
afterCompletion.allowedEvents: main.verification-passed, main.verification-failed
safety.workbenchWriteAvailable: false
```

### `pnpm --silent symphony goal-status --goal v21-goal-event-registration-workbench --json`

Exit code: `0`.

Relevant output:

```text
contractName: goal-progress-ledger.v1
goalId: v21-goal-event-registration-workbench
summary.totalTasks: 5
summary.completedTasks: 1
summary.releaseReady: false
task-1.status: approved
task-1.statusSource: goal-event-log.v1:evt_0b234d220c3cc15e
task-1.workerEvidenceRef: docs/plans/v21-task-1-worker-evidence-2026-05-29.md
task-1.reviewEvidenceRef: docs/plans/v21-task-1-review-evidence-2026-05-29.md
task-1.reviewVerdict: APPROVED
task-1.mainVerificationRef: null
```

### `node --input-type=module -e "...project current goal next into Workbench contracts..."`

Exit code: `0`.

Relevant output:

```json
{
  "next": {
    "taskId": "task-1",
    "role": "main-verifier",
    "phase": "main-verification",
    "reason": "Reviewer approved task-1 but main verification is missing."
  },
  "formModel": {
    "state": "available",
    "modelName": "GoalEventRegistrationFormModel",
    "sourceContract": "goal-next-action.v1",
    "registerWith": "symphony goal gate --gate main-verification",
    "allowedEvents": "main.verification-passed、main.verification-failed",
    "defaultFormId": "goal-gate-main-verification-passed",
    "recommended": [
      {
        "eventType": "main.verification-passed",
        "formId": "goal-gate-main-verification-passed",
        "commandName": "symphony goal gate",
        "actorRole": "main-verifier",
        "gateStatus": "passed",
        "gateName": "main-verification",
        "evidenceRequired": true
      },
      {
        "eventType": "main.verification-failed",
        "formId": "goal-gate-main-verification-failed",
        "commandName": "symphony goal gate",
        "actorRole": "main-verifier",
        "gateStatus": "failed",
        "gateName": "main-verification",
        "evidenceRequired": true
      }
    ],
    "supportedEventTypes": [
      "worker.started",
      "worker.evidence-recorded",
      "worker.self-check-passed",
      "worker.self-check-failed",
      "blocker.opened",
      "blocker.resolved",
      "reviewer.approved",
      "reviewer.needs-revision",
      "main.verification-passed",
      "main.verification-failed"
    ],
    "policy": {
      "workerCannotApproveOwnTask": true,
      "approvalReadinessSource": "explicit goal events only",
      "unsupportedInferenceSources": "file-name、branch、commit-message、frontend-heuristic"
    },
    "safety": {
      "dryRunOnly": true,
      "confirmAvailableInTask1": false,
      "workbenchWriteAvailable": false,
      "browserExecutionAvailable": false,
      "modelInvocationAvailable": false
    }
  }
}
```

### `pnpm check`

Exit code: `0`.

```text
> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

### `pnpm test`

Exit code: `0`.

Summary output:

```text
tests 671
suites 109
pass 671
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 3539.041
```

### `node --test tests/workbench-api-client.test.js tests/workbench-shell.test.js`

Exit code: `0`.

Summary output:

```text
tests 25
suites 3
pass 25
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 102.454
```

### `pnpm workbench:build`

Exit code: `0`.

Relevant output:

```text
vite v8.0.14 building client environment for production...
transforming...
✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DQwHi8dj.css    9.11 kB │ gzip:   2.27 kB
src/symphony/workbench-static/assets/index-THFje-ok.js   662.91 kB │ gzip: 123.50 kB

✓ built in 139ms
```

### `git diff --check`

Exit code: `0`; no output.

### `pnpm --silent symphony goal events --goal v21-goal-event-registration-workbench --json`

Exit code: `64`.

```json
{
  "version": "1",
  "status": "error",
  "exitCode": 64,
  "message": "unknown goal subcommand: events"
}
```

This was an exploratory command only. The reviewer approval check used the event journal file and `goal-status`.

## Git state

Current branch: `v21-task-1-goal-event-form-model`  
Current HEAD: `d12f428078e4ebcf3c1d68e982f940f53e9941dc` (`Record v20 release ready evidence`)

Working tree contains task-1 implementation files, generated Workbench static assets, worker/review evidence files, the v21 fixture, and this main verification evidence file. This verifier changed only:

- `docs/plans/v21-task-1-main-verification-evidence-2026-05-29.md`

## Gaps

No blocking gaps found for task-1 main verification.

This evidence does not register the main-verification gate. Total control should run the dry-run and confirm flow separately using this evidence ref.

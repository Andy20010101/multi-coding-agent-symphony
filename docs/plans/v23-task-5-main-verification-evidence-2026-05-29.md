# v23 Task 5 Main Verification Evidence

Goal id: `v23-goal-operation-run-console`
Task id: `task-5`
Task scope: 覆盖成功 dry-run、confirm、missing plan hash、goal not found、unsupported subcommand 等路径；确保 console 服务最新 goal workflow。
Runbook branch: `v23-task-5-goal-operation-console-tests-docs`
Checkout verified: `v23-task-4-failure-recovery-shortcuts`
Checked HEAD: `33d52949aeaba51b7b53ec07a39498fa141441df`

## Reviewer Approval Checked

- Worker evidence reviewed: `docs/plans/v23-task-5-worker-evidence-2026-05-29.md`.
- Review evidence reviewed: `docs/plans/v23-task-5-review-evidence-2026-05-29.md`.
- Review evidence verdict: `APPROVED`.
- Event journal check: `.symphony/goals/events/v23-goal-operation-run-console.ndjson:14` contains `evt_8c36281c6ff891ef` with `eventType: "reviewer.approved"`, `taskId: "task-5"`, actor `codex-v23-task-5-reviewer`, evidence ref `docs/plans/v23-task-5-review-evidence-2026-05-29.md`, and review verdict `APPROVED`.
- `goal-status` before verification showed task-5 `status: "approved"`, `statusSource: "goal-event-log.v1:evt_8c36281c6ff891ef"`, `reviewEvidenceRef: "docs/plans/v23-task-5-review-evidence-2026-05-29.md"`, and `reviewVerdict: "APPROVED"`.
- Main verification was not started from filename, branch name, commit message, or frontend state inference.

## Worktree State Checked

`git status --short --branch`

```text
## v23-task-4-failure-recovery-shortcuts
 M docs/symphony-product-contracts.md
 M docs/workbench-operator-guide.md
 M frontend/workbench/src/App.jsx
 M frontend/workbench/src/api/client.js
 M frontend/workbench/src/api/contracts.js
 M frontend/workbench/src/styles/workbench.css
 M src/symphony/console.js
 D src/symphony/workbench-static/assets/index-BRTPIdb3.js
 D src/symphony/workbench-static/assets/index-D6WeclLN.css
 M src/symphony/workbench-static/index.html
 M tests/v21-goal-plan-preview-api.test.js
 M tests/workbench-api-client.test.js
 M tests/workbench-shell.test.js
?? docs/plans/v23-task-1-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-1-review-evidence-2026-05-29.md
?? docs/plans/v23-task-1-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-2-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-2-review-evidence-2026-05-29.md
?? docs/plans/v23-task-2-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-3-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-3-review-evidence-2026-05-29.md
?? docs/plans/v23-task-3-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-4-main-verification-evidence-2026-05-29.md
?? docs/plans/v23-task-4-review-evidence-2026-05-29.md
?? docs/plans/v23-task-4-worker-evidence-2026-05-29.md
?? docs/plans/v23-task-5-review-evidence-2026-05-29.md
?? docs/plans/v23-task-5-worker-evidence-2026-05-29.md
?? fixtures/contracts/goal-runbook.v23-goal-operation-run-console.v1.json
?? src/symphony/goal-operation-run-registry.js
?? src/symphony/workbench-static/assets/index-BCmw_mw4.js
?? src/symphony/workbench-static/assets/index-DhfUBgwe.css
?? tests/v23-goal-operation-console-api.test.js
?? tests/v23-goal-operation-run-registry.test.js
```

No existing edits were reverted. This verification added only this evidence file before gate registration. No checkout, merge, push, tag, or release-manager action was performed in this verifier turn.

## Commands Run

`pnpm check`

```text
Exit code: 0

> multi-coding-agent-symphony@0.1.0 check /Users/andy/Documents/project/multi-coding-agent-symphony
> node --check src/*.js src/adapters/*.js src/ensemble/*.js src/integrations/*.js src/intake/*.js src/symphony/*.js src/trackers/*.js scripts/*.js plugins/eval-replay/*.js tests/*.test.js
```

`pnpm test`

```text
Exit code: 0
Tests: 709
Suites: 113
Pass: 709
Fail: 0
Cancelled: 0
Skipped: 0
Todo: 0
Duration: 3774.108542 ms
```

Task-5 suite lines from the same run:

```text
✔ v23 Workbench goal operation console API (89.116542ms)
✔ v23 goal operation run registry (10.041833ms)
```

`pnpm workbench:build`

```text
Exit code: 0

> multi-coding-agent-symphony@0.1.0 workbench:build /Users/andy/Documents/project/multi-coding-agent-symphony
> vite build --config frontend/workbench/vite.config.js

vite v8.0.14 building client environment for production...
transforming...✓ 17 modules transformed.
rendering chunks...
computing gzip size...
src/symphony/workbench-static/index.html                   0.42 kB │ gzip:   0.27 kB
src/symphony/workbench-static/assets/index-DhfUBgwe.css   15.18 kB │ gzip:   2.98 kB
src/symphony/workbench-static/assets/index-BCmw_mw4.js   755.37 kB │ gzip: 140.84 kB

✓ built in 149ms
```

Node printed the existing WASI ExperimentalWarning during the build.

`git diff --check`

```text
Exit code: 0
Output: no output.
```

`pnpm --silent symphony goal-status --goal v23-goal-operation-run-console --json`

```text
Exit code: 0
generatedAt: 2026-05-31T04:59:47.729Z
summary.totalTasks: 5
summary.completedTasks: 5
summary.blockedTasks: 0
summary.needsReviewTasks: 0
summary.needsRevisionTasks: 0
summary.releaseReady: false
task-5.status: approved
task-5.statusSource: goal-event-log.v1:evt_8c36281c6ff891ef
task-5.branch: v23-task-5-goal-operation-console-tests-docs
task-5.workerEvidenceRef: docs/plans/v23-task-5-worker-evidence-2026-05-29.md
task-5.reviewEvidenceRef: docs/plans/v23-task-5-review-evidence-2026-05-29.md
task-5.reviewVerdict: APPROVED
task-5.mainVerificationRef: null
task-5.blockers: []
nextActions: []
```

## Relevant Files Checked

- `docs/plans/workbench-v20-v28-goal-runbooks/v23_goal-operation-run-console_goal_runbook_latest.md`: task-5 requires tests/docs coverage for successful dry-run, confirm, missing plan hash, goal not found, and unsupported subcommand paths.
- `tests/v23-goal-operation-console-api.test.js:19`: dry-run preview through `/api/goals/latest/event-plan-preview` returns `goal-update-plan.v1`, records `operationRun.status: "dry-run-planned"`, and does not write the goal event journal.
- `tests/v23-goal-operation-console-api.test.js:70`: confirm uses the returned `planHash`, appends one controlled goal event, updates the operation to `confirmed`, and refreshes events, progress, and next action.
- `tests/v23-goal-operation-console-api.test.js:127`: missing `planHash` returns `error-envelope.v1` before appending goal events.
- `tests/v23-goal-operation-console-api.test.js:164`: unknown goal refs on preview, confirm, and operations routes return safe `goal-not-found` envelopes without local path or stack details.
- `tests/v23-goal-operation-console-api.test.js:217`: unsupported `scan` preview and confirm commands return error envelopes and do not create operation runs or goal events.
- `docs/workbench-operator-guide.md:182`: documents operation run fields, plan-hash confirm, controlled goal update/review/gate calls, and no shell runner.
- `docs/workbench-operator-guide.md:198`: names the v23 regression paths and rejected-request no-write boundary.
- `docs/symphony-product-contracts.md:88`: documents `goal-operation-runs.v1` as run-control state, not approval or release evidence.
- `docs/symphony-product-contracts.md:206`: documents the v23 console API regression paths and rejected-request boundaries.

## Boundary Notes

- Scope stayed on task-5 verification only.
- No feature implementation, reviewer work, release-manager work, merge, push, tag, or release readiness declaration was performed.
- The latest goal workflow remains `goal-status -> goal next -> goal prompt -> goal update/review/gate -> goal closeout -> symphony next --goal latest`.
- The verified task-5 coverage does not make v8 `scan/do/review/verify/status/continue/artifacts` the Workbench main button model.
- Operation registry writes are run-control data only. They are not worker evidence, reviewer approval, main verification, release gates, or release-ready evidence.

## Gate Registration

Dry-run command:

```text
pnpm --silent symphony goal gate --goal v23-goal-operation-run-console --gate main-verification --task task-5 --status passed --verifier codex-v23-task-5-main-verifier --evidence-ref docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md --dry-run --json
```

Dry-run result:

```text
Exit code: 0
contractName: goal-update-plan.v1
planId: plan_b7f302c454ce1035
planHash: sha256:9e35b290a9d1d41be9054e6394e511575bec5b0ffc7266fdeb653dd8aaf530bf
validation.status: ok
wouldAppend.writesInDryRun: false
proposedEvents[0].eventType: main.verification-passed
proposedEvents[0].taskId: task-5
ledgerPreview.changes[0].toStatus: main-verified
```

Confirm command:

```text
pnpm --silent symphony goal gate --goal v23-goal-operation-run-console --gate main-verification --task task-5 --status passed --verifier codex-v23-task-5-main-verifier --evidence-ref docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md --confirm --plan-hash sha256:9e35b290a9d1d41be9054e6394e511575bec5b0ffc7266fdeb653dd8aaf530bf --json
```

Confirm result:

```text
Exit code: 0
mode: confirm
status: appended
written: true
appendOnly: true
eventId: evt_b7f302c454ce1035
eventType: main.verification-passed
taskId: task-5
gate: main-verification
gateStatus: passed
actor.id: codex-v23-task-5-main-verifier
sequence: 15
eventHash: sha256:6bdd4e305175e646527136ee186c48cbd76bf75a2f6bbf8da94c1ec48fb0addd
```

Post-gate `goal-status` check:

```text
Exit code: 0
generatedAt: 2026-05-31T05:01:52.853Z
task-5.status: main-verified
task-5.statusSource: goal-event-log.v1:evt_b7f302c454ce1035
task-5.mainVerificationRef: docs/plans/v23-task-5-main-verification-evidence-2026-05-29.md
summary.releaseReady: false
```

## Result

Main verification status: passed.

Remaining blockers for task-5 main verification: none.

Release readiness: not claimed.
